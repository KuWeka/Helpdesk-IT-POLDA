
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext.jsx';
import api from '@/lib/api.js';
import socket from '@/lib/socket.js';
import { Card } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Avatar, AvatarFallback } from '@/components/ui/avatar.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Skeleton } from '@/components/ui/skeleton.jsx';
import { ScrollArea } from '@/components/ui/scroll-area.jsx';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import ChatMessage from '@/components/ChatMessage.jsx';
import MessageInput from '@/components/MessageInput.jsx';

export default function ChatDetailPage() {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [chat, setChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    fetchChatAndMessages();
    socket.connect();
    socket.emit('join_chat', chatId);

    const handleNewMessage = (payload) => {
      if (payload?.chat_id !== chatId) return;
      fetchChatAndMessages();
    };

    const handleMessagesRead = (payload) => {
      if (payload?.chat_id !== chatId) return;
      if (payload?.reader_id === currentUser?.id) return;

      setMessages((prev) => prev.map((msg) => (
        msg.sender_id === currentUser?.id
          ? { ...msg, is_read: true }
          : msg
      )));
    };

    const handleReconnect = () => {
      socket.emit('join_chat', chatId);
      fetchChatAndMessages();
    };

    const handleDisconnect = (reason) => {
      console.warn('Socket disconnected on ChatDetailPage:', reason);
    };

    socket.on('new_message', handleNewMessage);
    socket.on('messages_read', handleMessagesRead);
    socket.on('reconnect', handleReconnect);
    socket.on('disconnect', handleDisconnect);

    return () => {
      socket.emit('leave_chat', chatId);
      socket.off('new_message', handleNewMessage);
      socket.off('messages_read', handleMessagesRead);
      socket.off('reconnect', handleReconnect);
      socket.off('disconnect', handleDisconnect);
      socket.disconnect();
    };
  }, [chatId]);

  const fetchChatAndMessages = async () => {
    setIsLoading(true);
    try {
      const { data: chatRecord } = await api.get(`/chats/${chatId}`);
      setChat(chatRecord?.chat || chatRecord?.data?.chat || chatRecord);

      const { data: messagesRecords } = await api.get('/messages', {
        params: {
          chat_id: chatId,
          sort: 'asc',
          page: 1,
          perPage: 200,
        }
      });
      setMessages(messagesRecords?.items || messagesRecords?.data || messagesRecords || []);
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error('Error fetching chat details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (content) => {
    try {
      await api.post('/messages', {
        chat_id: chatId,
        sender_id: currentUser.id,
        sender_role: currentUser.role,
        message_content: content
      });
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
        <Skeleton className="h-16 w-full mb-4" />
        <Skeleton className="flex-1 w-full" />
      </div>
    );
  }

  if (!chat) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <h2 className="text-2xl font-bold">Chat tidak ditemukan</h2>
        <Button onClick={() => navigate('/user/chats')}>Kembali ke Daftar Chat</Button>
      </div>
    );
  }

  const initials = chat.tech_name?.substring(0, 2).toUpperCase() || 'TK';
  const isClosed = chat.status === 'Closed';

  return (
    <div className="w-full h-[calc(100vh-8rem)] flex flex-col animate-in fade-in duration-300">
      <Card className="flex-1 flex flex-col border-border shadow-sm overflow-hidden">
        {/* Chat Header */}
        <div className="p-4 border-b bg-card flex items-center gap-4 shrink-0">
          <Button variant="ghost" size="icon" onClick={() => navigate('/user/chats')} className="shrink-0 hover:bg-background">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          <Avatar className="h-10 w-10 border border-border">
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">{initials}</AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-foreground truncate">{chat.tech_name || 'Teknisi'}</h2>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-primary/10 text-primary">
                Teknisi
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {chat.ticket_number ? `Tiket: ${chat.ticket_number}` : 'Konsultasi Umum'}
            </p>
          </div>
          
          <Badge variant={isClosed ? "outline" : "default"} className={isClosed ? "text-muted-foreground" : "bg-green-500 hover:bg-green-600"}>
            {isClosed ? 'Closed' : 'Open'}
          </Badge>
        </div>

        {/* Messages Area */}
        <ScrollArea className="flex-1 bg-muted/10">
          <div className="p-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
              <p className="bg-card px-4 py-2 rounded-full text-sm border shadow-sm">
                Mulai percakapan dengan {chat.tech_name || 'teknisi'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {messages.map((msg) => (
                <ChatMessage 
                  key={msg.id} 
                  message={msg} 
                  isOwnMessage={msg.sender_id === currentUser.id} 
                />
              ))}
              {isTyping && (
                <div className="flex items-center gap-2 px-1 text-sm text-muted-foreground">
                  <Avatar className="size-6">
                    <AvatarFallback>{(currentUser?.name || 'A').charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex gap-1">
                    <span className="size-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="size-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="size-2 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span>Anda sedang mengetik...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <MessageInput 
          onSend={handleSendMessage} 
          isClosed={isClosed} 
          onTypingChange={setIsTyping}
        />
      </Card>
    </div>
  );
}
