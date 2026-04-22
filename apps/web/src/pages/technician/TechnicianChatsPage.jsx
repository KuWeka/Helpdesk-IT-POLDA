
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext.jsx';
import api from '@/lib/api.js';
import socket from '@/lib/socket.js';
import { Card } from '@/components/ui/card.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Avatar, AvatarFallback } from '@/components/ui/avatar.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Skeleton } from '@/components/ui/skeleton.jsx';
import { ScrollArea } from '@/components/ui/scroll-area.jsx';
import { Empty, EMPTY_STATE_VARIANTS } from '@/components/ui/empty.jsx';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog.jsx';
import { Search, MessageSquare, AlertCircle, ArrowLeft, Lock } from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import ChatMessage from '@/components/ChatMessage.jsx';
import MessageInput from '@/components/MessageInput.jsx';
import { toast } from 'sonner';

const extractItems = (payload) => {
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload)) return payload;
  return [];
};

export default function TechnicianChatsPage() {
  const { currentUser } = useAuth();
  
  const [chats, setChats] = useState([]);
  const [isLoadingChats, setIsLoadingChats] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [activeChatId, setActiveChatId] = useState(null);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const activeChatIdRef = useRef(null);

  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // Layout state for mobile
  const [showListOnMobile, setShowListOnMobile] = useState(true);

  useEffect(() => {
    activeChatIdRef.current = activeChatId;
  }, [activeChatId]);

  // Fetch List
  useEffect(() => {
    fetchChats();
    socket.connect();
    
    const handleNewMessage = () => {
      fetchChats();
    };

    const handleReconnect = () => {
      fetchChats();
      if (activeChatIdRef.current) {
        socket.emit('join_chat', activeChatIdRef.current);
        fetchMessages(activeChatIdRef.current);
      }
    };

    const handleDisconnect = (reason) => {
      console.warn('Socket disconnected on TechnicianChatsPage:', reason);
    };

    socket.on('new_message', handleNewMessage);
    socket.on('reconnect', handleReconnect);
    socket.on('disconnect', handleDisconnect);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('reconnect', handleReconnect);
      socket.off('disconnect', handleDisconnect);
      socket.disconnect();
    };
  }, [currentUser]);

  const fetchChats = async () => {
    try {
      const { data } = await api.get('/chats', {
        params: {
          page: 1,
          perPage: 50
        }
      });
      setChats(extractItems(data));
    } catch (error) {
      console.error('Error fetching chats:', error);
    } finally {
      setIsLoadingChats(false);
    }
  };

  // Fetch Messages when active chat changes
  useEffect(() => {
    if (activeChatId) {
      fetchMessages(activeChatId);
      socket.emit('join_chat', activeChatId);
      const chatRecord = chats.find(c => c.id === activeChatId);
      if (chatRecord) setActiveChat(chatRecord);
      setShowListOnMobile(false);
      
      const handleNewMessage = (payload) => {
        if (payload?.chat_id === activeChatId) {
          fetchMessages(activeChatId);
        }
      };

      const handleMessagesRead = (payload) => {
        if (payload?.chat_id !== activeChatId) return;
        if (payload?.reader_id === currentUser?.id) return;

        setMessages((prev) => prev.map((msg) => (
          msg.sender_id === currentUser?.id
            ? { ...msg, is_read: true }
            : msg
        )));
      };

      socket.on('new_message', handleNewMessage);
      socket.on('messages_read', handleMessagesRead);

      return () => {
        socket.emit('leave_chat', activeChatId);
        socket.off('new_message', handleNewMessage);
        socket.off('messages_read', handleMessagesRead);
      };
    }

    return undefined;
  }, [activeChatId, chats]);

  const fetchMessages = async (chatId) => {
    setIsLoadingMessages(true);
    try {
      const { data: messagesRecords } = await api.get('/messages', {
        params: {
          chat_id: chatId,
          sort: 'asc',
          page: 1,
          perPage: 200,
        }
      });
      setMessages(extractItems(messagesRecords));
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleSendMessage = async (content) => {
    try {
      await api.post('/messages', {
        chat_id: activeChatId,
        sender_id: currentUser.id,
        sender_role: currentUser.role,
        message_content: content
      });

    } catch (error) {
      toast.error('Gagal mengirim pesan');
    }
  };

  const handleCloseChat = async () => {
    setIsClosing(true);
    try {
      await api.patch(`/chats/${activeChatId}`, {
        status: 'Closed'
      });
      
      toast.success('Chat berhasil ditutup');
      setIsCloseModalOpen(false);
      // Let the subscription update the list and activeChat
    } catch (error) {
      toast.error('Gagal menutup chat');
    } finally {
      setIsClosing(false);
    }
  };

  const formatChatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isToday(date)) return `Hari ini ${format(date, 'HH:mm')}`;
    if (isYesterday(date)) return `Kemarin ${format(date, 'HH:mm')}`;
    return format(date, 'dd MMM yyyy');
  };

  const filteredChats = chats.filter(chat => {
    const userName = chat.user_name?.toLowerCase() || '';
    const ticketNum = chat.ticket_number?.toLowerCase() || '';
    const search = searchTerm.toLowerCase();
    return userName.includes(search) || ticketNum.includes(search);
  });

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4 animate-in fade-in duration-500">
      {/* Sidebar List */}
      <Card className={`w-full md:w-1/3 flex flex-col border-border shadow-sm overflow-hidden ${!showListOnMobile ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b bg-card space-y-4">
          <h2 className="text-xl font-bold">Pesan Masuk</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Cari nama pelapor atau tiket..." 
              className="pl-9 bg-background"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2">
          {isLoadingChats ? (
             <div className="space-y-2">
               {Array(4).fill(0).map((_, i) => (
                 <Skeleton key={i} className="h-20 w-full rounded-xl" />
               ))}
             </div>
          ) : filteredChats.length > 0 ? (
            <div className="space-y-1">
              {filteredChats.map((chat) => {
                const isActive = activeChatId === chat.id;
                
                return (
                  <div 
                    key={chat.id}
                    onClick={() => setActiveChatId(chat.id)}
                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${
                      isActive ? 'bg-primary/10 border-primary/30' : 'hover:bg-muted border-transparent hover:border-border'
                    }`}
                  >
                    <Avatar className="h-10 w-10 border border-border">
                      <AvatarFallback className="bg-secondary text-secondary-foreground font-semibold">
                        {chat.user_name?.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <h3 className={`font-semibold text-sm truncate ${isActive ? 'text-primary' : 'text-foreground'}`}>
                          {chat.user_name || 'User'}
                        </h3>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">
                          {formatChatTime(chat.updated)}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground truncate pr-2">
                          {chat.ticket_number ? `Tiket: ${chat.ticket_number}` : 'Umum'}
                        </p>
                        {chat.status === 'Closed' && (
                          <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5 text-muted-foreground">Closed</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <Empty
              variant={EMPTY_STATE_VARIANTS.NO_RESULTS}
              title="Tidak ada pesan"
              description="Belum ada percakapan yang tersedia saat ini."
            />
          )}
          </div>
        </ScrollArea>
      </Card>

      {/* Detail Area */}
      <Card className={`flex-1 flex flex-col border-border shadow-sm overflow-hidden ${showListOnMobile && activeChatId ? 'hidden md:flex' : ''} ${!activeChatId && !showListOnMobile ? 'hidden md:flex' : 'flex'}`}>
        {!activeChatId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground bg-muted/10">
            <MessageSquare className="h-12 w-12 mb-4 opacity-20" />
            <h2 className="text-xl font-medium text-foreground">Pilih percakapan</h2>
            <p className="text-sm">Klik salah satu chat di daftar untuk melihat pesan.</p>
          </div>
        ) : (
          <>
            {/* Detail Header */}
            <div className="p-4 border-b bg-card flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => setShowListOnMobile(true)} className="md:hidden shrink-0 hover:bg-background mr-1">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                
                <Avatar className="h-10 w-10 border border-border">
                  <AvatarFallback className="bg-secondary text-secondary-foreground font-semibold">
                    {activeChat?.user_name?.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-bold text-foreground">{activeChat?.user_name || 'User'}</h2>
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-muted text-muted-foreground">
                      Pelapor
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {activeChat?.ticket_number ? `Terkait: ${activeChat.ticket_number}` : ''}
                  </p>
                </div>
              </div>
              
              {activeChat?.status === 'Open' ? (
                <Button variant="destructive" size="sm" onClick={() => setIsCloseModalOpen(true)} className="gap-2">
                  <Lock className="h-4 w-4" /> <span className="hidden sm:inline">Tutup Chat</span>
                </Button>
              ) : (
                <Badge variant="outline" className="text-muted-foreground bg-background">Closed</Badge>
              )}
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 bg-background">
              <div className="p-4">
              {isLoadingMessages ? (
                <div className="space-y-4">
                  <Skeleton className="h-12 w-2/3 rounded-2xl rounded-tl-sm" />
                  <Skeleton className="h-12 w-1/2 rounded-2xl rounded-tr-sm ml-auto" />
                </div>
              ) : messages.length === 0 ? (
                <Empty
                  variant={EMPTY_STATE_VARIANTS.NO_RESULTS}
                  title="Belum ada pesan"
                  description="Percakapan belum memiliki pesan."
                />
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

            {/* Input */}
            <MessageInput 
              onSend={handleSendMessage} 
              isClosed={activeChat?.status === 'Closed'} 
              onTypingChange={setIsTyping}
            />
          </>
        )}
      </Card>

      {/* Close Confirm Modal */}
      <Dialog open={isCloseModalOpen} onOpenChange={setIsCloseModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tutup Percakapan</DialogTitle>
            <DialogDescription>
              Anda yakin ingin menutup chat ini? Setelah ditutup, percakapan ini menjadi read-only dan tidak dapat dibalas lagi.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2">
            <Button variant="outline" onClick={() => setIsCloseModalOpen(false)} disabled={isClosing}>Batal</Button>
            <Button variant="destructive" onClick={handleCloseChat} disabled={isClosing}>
              {isClosing ? 'Memproses...' : 'Ya, Tutup Chat'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
