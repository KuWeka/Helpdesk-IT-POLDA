
import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext.jsx';
import api from '@/lib/api.js';
import socket from '@/lib/socket.js';
import { Card } from '@/components/ui/card.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Skeleton } from '@/components/ui/skeleton.jsx';
import { ScrollArea } from '@/components/ui/scroll-area.jsx';
import { Empty, EMPTY_STATE_VARIANTS } from '@/components/ui/empty.jsx';
import { Search, MessageSquarePlus, MessageSquare, ArrowLeft } from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import NewChatModal from '@/components/modals/NewChatModal.jsx';
import ChatMessage from '@/components/chat/ChatMessage.jsx';
import MessageInput from '@/components/chat/MessageInput.jsx';
import { toast } from 'sonner';

const extractItems = (payload) => {
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload)) return payload;
  return [];
};

export default function ChatListPage() {
  const { t } = useTranslation();
  const { currentUser } = useAuth();

  const [chats, setChats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [activeChatId, setActiveChatId] = useState(null);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showListOnMobile, setShowListOnMobile] = useState(true);
  const messagesEndRef = useRef(null);
  const activeChatIdRef = useRef(null);

  useEffect(() => {
    activeChatIdRef.current = activeChatId;
  }, [activeChatId]);

  useEffect(() => {
    fetchChats();
    socket.connect();
    
    const handleNewMessage = () => {
      fetchChats();
      if (activeChatIdRef.current) {
        fetchMessages(activeChatIdRef.current);
      }
    };

    const handleMessagesRead = (payload) => {
      if (payload?.chat_id !== activeChatIdRef.current) return;
      if (payload?.reader_id === currentUser?.id) return;

      setMessages((prev) => prev.map((msg) => (
        msg.sender_id === currentUser?.id
          ? { ...msg, is_read: true }
          : msg
      )));
    };

    const handleReconnect = () => {
      fetchChats();
      if (activeChatIdRef.current) {
        socket.emit('join_chat', activeChatIdRef.current);
        fetchMessages(activeChatIdRef.current);
      }
    };

    const handleDisconnect = (reason) => {
      console.warn('Socket disconnected on ChatListPage:', reason);
    };

    socket.on('new_message', handleNewMessage);
    socket.on('messages_read', handleMessagesRead);
    socket.on('reconnect', handleReconnect);
    socket.on('disconnect', handleDisconnect);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('messages_read', handleMessagesRead);
      socket.off('reconnect', handleReconnect);
      socket.off('disconnect', handleDisconnect);
      socket.disconnect();
    };
  }, [currentUser]);

  useEffect(() => {
    if (!activeChatId) return;

    fetchMessages(activeChatId);
    socket.emit('join_chat', activeChatId);

    const selected = chats.find((c) => c.id === activeChatId);
    setActiveChat(selected || null);
    setShowListOnMobile(false);

    return () => {
      socket.emit('leave_chat', activeChatId);
    };
  }, [activeChatId, chats]);

  const fetchChats = async () => {
    try {
      const { data } = await api.get('/chats', {
        params: {
          page: 1,
          perPage: 50
        }
      });
      const items = extractItems(data);
      setChats(items);

      if (!activeChatId && items.length > 0) {
        setActiveChatId(items[0].id);
      }
    } catch (error) {
      console.error('Error fetching chats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async (chatId) => {
    setIsLoadingMessages(true);
    try {
      const { data } = await api.get('/messages', {
        params: {
          chat_id: chatId,
          sort: 'asc',
          page: 1,
          perPage: 200,
        }
      });

      setMessages(extractItems(data));
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 80);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleSendMessage = async (content) => {
    if (!activeChatId) return;

    try {
      await api.post('/messages', {
        chat_id: activeChatId,
        message_content: content,
      });
    } catch (error) {
      toast.error('Gagal mengirim pesan');
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
    const techName = chat.tech_name?.toLowerCase() || '';
    const ticketNum = chat.ticket_number?.toLowerCase() || '';
    const search = searchTerm.toLowerCase();
    return techName.includes(search) || ticketNum.includes(search);
  });

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4 animate-in fade-in duration-500">
      <Card className={`w-full md:w-1/3 flex flex-col border-border shadow-sm overflow-hidden ${!showListOnMobile ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b bg-card space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-xl font-bold">Pesan Masuk</h2>
            <Button onClick={() => setIsModalOpen(true)} className="gap-2" size="sm">
              <MessageSquarePlus className="h-4 w-4" />
              {t('chat.new_chat')}
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Cari nama teknisi atau tiket..." 
              className="pl-9 bg-background text-foreground"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2">
          {isLoading ? (
            <div className="space-y-2 p-2">
              {Array(4).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-xl" />
              ))}
            </div>
          ) : filteredChats.length > 0 ? (
            <div className="space-y-1">
              {filteredChats.map((chat) => {
                const initials = chat.tech_name?.substring(0, 2).toUpperCase() || 'TK';
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
                      <AvatarImage src="" />
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">{initials}</AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <div className="flex items-center gap-2 truncate pr-2">
                          <h3 className={`font-semibold text-sm truncate ${isActive ? 'text-primary' : 'text-foreground'}`}>{chat.tech_name || 'Teknisi'}</h3>
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-primary/10 text-primary hover:bg-primary/20">
                            {t('roles.technician')}
                          </Badge>
                        </div>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">
                          {formatChatTime(chat.updated)}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground truncate pr-2">
                          {chat.ticket_number ? `Terkait tiket: ${chat.ticket_number}` : 'Konsultasi Umum'}
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
              title="Belum ada percakapan"
              description="Mulai chat baru untuk berkonsultasi dengan teknisi kami."
              action={(
                <Button onClick={() => setIsModalOpen(true)} variant="outline">
                  {t('chat.new_chat')}
                </Button>
              )}
            />
          )}
          </div>
        </ScrollArea>
      </Card>

      <Card className={`flex-1 flex flex-col border-border shadow-sm overflow-hidden ${showListOnMobile && activeChatId ? 'hidden md:flex' : ''} ${!activeChatId && !showListOnMobile ? 'hidden md:flex' : 'flex'}`}>
        {!activeChatId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground bg-muted/10">
            <MessageSquare className="h-12 w-12 mb-4 opacity-20" />
            <h2 className="text-xl font-medium text-foreground">Pilih percakapan</h2>
            <p className="text-sm">Klik salah satu chat di daftar untuk melihat pesan.</p>
          </div>
        ) : (
          <>
            <div className="p-4 border-b bg-card flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => setShowListOnMobile(true)} className="md:hidden shrink-0 hover:bg-background mr-1">
                  <ArrowLeft className="h-5 w-5" />
                </Button>

                <Avatar className="h-10 w-10 border border-border">
                  <AvatarFallback className="bg-secondary text-secondary-foreground font-semibold">
                    {activeChat?.tech_name?.substring(0, 2).toUpperCase() || 'TK'}
                  </AvatarFallback>
                </Avatar>

                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-bold text-foreground">{activeChat?.tech_name || 'Teknisi'}</h2>
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-muted text-muted-foreground">
                      Teknisi
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {activeChat?.ticket_number ? `Terkait: ${activeChat.ticket_number}` : 'Konsultasi Umum'}
                  </p>
                </div>
              </div>

              {activeChat?.status === 'Closed' ? (
                <Badge variant="outline" className="text-muted-foreground bg-background">Closed</Badge>
              ) : (
                <Badge className="bg-green-500 hover:bg-green-600">Open</Badge>
              )}
            </div>

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
                  description="Kirim pesan pertama untuk memulai percakapan ini."
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

            <MessageInput
              onSend={handleSendMessage}
              isClosed={activeChat?.status === 'Closed'}
              onTypingChange={setIsTyping}
            />
          </>
        )}
      </Card>

      <NewChatModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
