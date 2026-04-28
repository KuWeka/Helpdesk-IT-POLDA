
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '@/lib/api.js';
import { Card, CardContent } from '@/components/ui/card.jsx';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Skeleton } from '@/components/ui/skeleton.jsx';
import {
  Empty,
  EMPTY_STATE_VARIANTS,
} from '@/components/ui/empty.jsx';
import { Search, RefreshCcw, Eye, Trash2, Loader2, Inbox } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog.jsx';
import { format } from 'date-fns';
import { toast } from 'sonner';
import ChatDetailReadOnly from '@/components/chat/ChatDetailReadOnly.jsx';
import SectionHeader from '@/components/common/SectionHeader.jsx';

const extractItems = (payload) => {
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload)) return payload;
  return [];
};

const safeFormatDate = (value, pattern = 'dd MMM HH:mm') => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return format(date, pattern);
};

export default function ChatMonitoringPage() {
  const { t } = useTranslation();
  const [chats, setChats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  const fetchChats = async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get('/chats', {
        params: {
          page: 1,
          perPage: 50
        }
      });
      
      let items = extractItems(data);
      if (statusFilter !== 'all') {
        items = items.filter((c) => c.status === statusFilter);
      }

      if (searchTerm) {
        const lowerSearch = searchTerm.toLowerCase();
        items = items.filter(c => 
          c.user_name?.toLowerCase().includes(lowerSearch) ||
          c.tech_name?.toLowerCase().includes(lowerSearch) ||
          c.ticket_number?.toLowerCase().includes(lowerSearch)
        );
      }
      setChats(items);
    } catch (err) {
      console.error(err);
      const status = err?.response?.status;
      const message = err?.response?.data?.message;

      // For transient auth/network issues, keep UI usable and avoid noisy persistent toast.
      setChats([]);
      if (status && status >= 500) {
        toast.error(`${t('chatMonitoring.loadFailed', 'Failed to load chat data')}${message ? `: ${message}` : ''}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchChats(); }, [statusFilter, searchTerm]);

  const handleSelectChat = async (chat) => {
    setSelectedChat(chat);
    try {
      const { data } = await api.get('/messages', {
        params: {
          chat_id: chat.id,
          sort: 'asc',
          perPage: 200
        }
      });
      setMessages(extractItems(data));
    } catch (e) {
      console.error(e);
      toast.error(t('chatMonitoring.loadMessagesFailed', 'Failed to load messages'));
    }
  };

  const handleDeleteChat = async (chatId) => {
    setIsDeleting(true);
    try {
      const { data: chatMessagesRes } = await api.get('/messages', {
        params: {
          chat_id: chatId,
          perPage: 500
        }
      });
      
      for (const msg of extractItems(chatMessagesRes)) {
        await api.delete(`/messages/${msg.id}`);
      }

      await api.delete(`/chats/${chatId}`);
      
      toast.success(t('chatMonitoring.deleteSuccess', 'Chat deleted successfully'));
      if (selectedChat && selectedChat.id === chatId) {
        setSelectedChat(null);
      }
      setDeleteTargetId(null);
      fetchChats();
    } catch (error) {
      console.error('Error deleting chat:', error);
      toast.error(error.response?.message || t('chatMonitoring.deleteFailed', 'Failed to delete chat'));
    } finally {
      setIsDeleting(false);
    }
  };

  const deleteTarget = (selectedChat?.id === deleteTargetId
    ? selectedChat
    : chats.find((chat) => chat.id === deleteTargetId)) || null;

  if (selectedChat) {
    return (
      <>
        <ChatDetailReadOnly
          chat={selectedChat}
          messages={messages}
          onBack={() => setSelectedChat(null)}
          onDelete={(chatId) => setDeleteTargetId(chatId)}
        />
        <AlertDialog open={!!deleteTargetId} onOpenChange={(open) => !open && setDeleteTargetId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('chatMonitoring.deleteTitle', 'Delete Chat')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('chatMonitoring.deleteDesc', 'Delete this chat? All messages inside will also be deleted. This action cannot be undone.')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDeleteTargetId(null)}>{t('buttons.cancel', 'Cancel')}</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => {
                  if (deleteTargetId) {
                    handleDeleteChat(deleteTargetId);
                  }
                }}
                disabled={isDeleting}
              >
                {isDeleting ? t('chatMonitoring.deleting', 'Deleting...') : t('chatMonitoring.delete', 'Delete')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 h-full flex flex-col">
      <SectionHeader
        title={t('nav.item.Monitoring Chat', 'Chat Monitoring')}
        subtitle={t('chatMonitoring.subtitle', 'Monitor conversations between reporters and technicians.')}
      />

      <div className="space-y-4 flex-1 flex flex-col">
        <div className="flex flex-wrap gap-4 shrink-0">
          <div className="relative w-full sm:w-[250px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder={t('chatMonitoring.searchPlaceholder', 'Search name or ticket...')} className="pl-9 bg-background" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px] bg-background"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="all">{t('userTickets.allStatus', 'All Status')}</SelectItem><SelectItem value="Open">Open</SelectItem><SelectItem value="Closed">Closed</SelectItem></SelectContent>
          </Select>
          <Button variant="ghost" onClick={() => {setSearchTerm(''); setStatusFilter('all');}}><RefreshCcw className="h-4 w-4 mr-2" /> {t('common.reset', 'Reset')}</Button>
        </div>
        
        <div className="flex-1 overflow-auto overflow-x-auto rounded-lg border border-border">
          <Table className="min-w-full">
            <TableHeader className="bg-muted/30 sticky top-0 z-10">
              <TableRow>
                <TableHead className="px-6">{t('tickets.reporter', 'Reporter')}</TableHead>
                <TableHead>{t('roles.technician', 'Technician')}</TableHead>
                <TableHead>{t('common.ticketId', 'Ticket ID')}</TableHead>
                <TableHead>{t('common.status', 'Status')}</TableHead>
                <TableHead>{t('chatMonitoring.lastMessage', 'Last Message')}</TableHead>
                <TableHead className="text-right px-6">{t('common.actions', 'Actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="px-6"><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell className="text-right px-6"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : chats.length > 0 ? (
                chats.map((c) => (
                  <TableRow key={c.id} className="hover:bg-muted/30">
                    <TableCell className="px-6 font-medium">{c.user_name || t('tickets.unknown_user', 'User not found')}</TableCell>
                    <TableCell className="text-muted-foreground">{c.tech_name || t('userTickets.unassigned', 'Not assigned')}</TableCell>
                    <TableCell className="font-mono text-sm">{c.ticket_number || '-'}</TableCell>
                    <TableCell><Badge variant={c.status === 'Open' ? 'default' : 'secondary'}>{c.status}</Badge></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{safeFormatDate(c.updated_at || c.updated)}</TableCell>
                    <TableCell className="text-right px-6">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="secondary" size="sm" onClick={() => handleSelectChat(c)}>
                          <Eye className="h-4 w-4 mr-1" /> {t('common.viewDetail', 'View Detail')}
                        </Button>
                        <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => setDeleteTargetId(c.id)} disabled={isDeleting}>
                          {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-56">
                    <Empty
                      className="border-0 shadow-none"
                      variant={EMPTY_STATE_VARIANTS.NO_RESULTS}
                      title={t('chatMonitoring.emptyTitle', 'No chat data')}
                      description={t('chatMonitoring.emptyDesc', 'No conversations match current filters.')}
                    />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          </div>
      </div>

      <AlertDialog open={!!deleteTargetId} onOpenChange={(open) => !open && setDeleteTargetId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('chatMonitoring.deleteTitle', 'Delete Chat')}</AlertDialogTitle>
            <AlertDialogDescription>
              Hapus chat {deleteTarget?.ticket_number ? `untuk tiket "${deleteTarget.ticket_number}"` : 'ini'}?
              Semua pesan di dalamnya akan ikut terhapus dan tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteTargetId(null)}>{t('buttons.cancel', 'Cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteTargetId) {
                  handleDeleteChat(deleteTargetId);
                }
              }}
              disabled={isDeleting}
            >
              {isDeleting ? t('chatMonitoring.deleting', 'Deleting...') : t('chatMonitoring.delete', 'Delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
