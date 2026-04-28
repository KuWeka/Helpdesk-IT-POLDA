
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '@/lib/api.js';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card.jsx';
import { Skeleton } from '@/components/ui/skeleton.jsx';
import StatusBadge from '@/components/tickets/StatusBadge.jsx';
import UrgencyBadge from '@/components/tickets/UrgencyBadge.jsx';
import SectionHeader from '@/components/common/SectionHeader.jsx';
import { ArrowLeft, MessageSquare, Calendar, User, MapPin, Download, AlertCircle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

const extractItems = (payload) => {
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload)) return payload;
  return [];
};

const safeFormatDate = (value, pattern = 'dd MMM yyyy, HH:mm') => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return format(date, pattern);
};

const buildAttachmentUrl = (filePath = '') => {
  const apiBase = (api.defaults.baseURL || '').replace(/\/api\/?$/, '');
  return `${apiBase}/uploads${filePath}`;
};

export default function TicketDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [ticket, setTicket] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [notes, setNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [reporterName, setReporterName] = useState('');

  useEffect(() => {
    const fetchTicketData = async () => {
      try {
        const { data: ticketData } = await api.get(`/tickets/${id}`);
        setTicket(ticketData);

        setReporterName(ticketData.reporter_name || t('tickets.unknown_user'));

        const { data: attachData } = await api.get(`/uploads/ticket/${id}`);
        setAttachments(Array.isArray(attachData?.attachments) ? attachData.attachments : []);

        const { data: notesData } = await api.get(`/tickets/${id}/notes`);
        setNotes(notesData || []);

      } catch (err) {
        console.error('Error fetching ticket details:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTicketData();
  }, [id, t]);

  const handleChatTechnician = async () => {
    if (!ticket) return;
    
    setIsChatLoading(true);
    try {
      // Check if chat already exists for this ticket and user
      const { data: existingChats } = await api.get('/chats', {
        params: {
          page: 1,
          perPage: 1,
          ticket_id: ticket.id
        }
      });
      const existingChatItems = extractItems(existingChats);
      
      if (existingChatItems.length > 0) {
        navigate(`/user/chats/${existingChatItems[0].id}`);
        return;
      }
      
      // If no technician assigned, show error
      if (!ticket.assigned_technician_id) {
        toast.error('Belum ada teknisi yang ditugaskan untuk tiket ini. Silakan tunggu penugasan teknisi.');
        setIsChatLoading(false);
        return;
      }
      
      // Create new chat
      const { data: newChat } = await api.post('/chats', {
        ticket_id: ticket.id,
        technician_id: ticket.assigned_technician_id
      });
      
      toast.success('Chat berhasil dibuat');
      navigate(`/user/chats/${newChat.id}`);
    } catch (error) {
      console.error('Error creating chat:', error.response || error);
      toast.error('Gagal membuat chat: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsChatLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <h2 className="text-2xl font-bold">Tiket tidak ditemukan</h2>
        <Button onClick={() => navigate(-1)}>{t('buttons.back')}</Button>
      </div>
    );
  }

  const isTechnicianAssigned = !!ticket.assigned_technician_id;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
      <Button variant="ghost" onClick={() => navigate(-1)} className="pl-0 hover:bg-transparent hover:underline text-muted-foreground">
        <ArrowLeft className="mr-2 h-4 w-4" />
        {t('buttons.back')}
      </Button>

      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="font-mono text-sm font-semibold bg-muted px-2 py-1 rounded text-muted-foreground border">
              {ticket.ticket_number}
            </span>
            <StatusBadge status={ticket.status} />
            <UrgencyBadge urgency={ticket.urgency} />
          </div>
          <SectionHeader title={ticket.title} />
        </div>
        <Button 
          disabled={isChatLoading} 
          onClick={handleChatTechnician}
          className="gap-2 shrink-0"
        >
          {isChatLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
          {isTechnicianAssigned ? t('buttons.chat_tech', 'Chat Teknisi') : 'Buat Chat'}
        </Button>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Deskripsi Kendala</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                {ticket.description}
              </p>

              {attachments.length > 0 && (
                <div className="mt-8 pt-6 border-t">
                  <h3 className="text-sm font-semibold mb-3">Lampiran ({attachments.length})</h3>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {attachments.map((file) => (
                      <div key={file.id} className="flex items-center justify-between p-3 bg-muted rounded-lg border border-border">
                        <span className="text-sm font-medium truncate pr-4">{file.file_name}</span>
                        <Button variant="secondary" size="icon" className="h-8 w-8 shrink-0 hover:bg-primary/20 hover:text-primary" asChild>
                          <a href={buildAttachmentUrl(file.file_path)} target="_blank" rel="noopener noreferrer" download={file.file_name}>
                            <Download className="h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {notes.length > 0 && (
            <Card className="border-border shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Catatan Teknisi</CardTitle>
                <CardDescription>Catatan internal proses pengerjaan (Read-only)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {notes.map(note => (
                  <div key={note.id} className="p-4 bg-muted/50 rounded-xl border border-border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-sm">{note.technician_name || t('roles.technician')}</span>
                      <span className="text-xs text-muted-foreground">{safeFormatDate(note.created_at || note.created, 'dd MMM yyyy HH:mm')}</span>
                    </div>
                    <p className="text-sm text-foreground">{note.note_content}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className="border-border shadow-sm bg-muted/30">
            <CardContent className="p-5 space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center text-muted-foreground text-sm">
                  <User className="mr-2 h-4 w-4" /> {t('tickets.reporter')}
                </div>
                <div className="font-medium">{reporterName}</div>
              </div>
              
              <div className="space-y-1.5">
                <div className="flex items-center text-muted-foreground text-sm">
                  <MapPin className="mr-2 h-4 w-4" /> Lokasi
                </div>
                <div className="font-medium">{ticket.location}</div>
              </div>

              <div className="pt-4 border-t space-y-1.5">
                <div className="flex items-center text-muted-foreground text-sm">
                  <User className="mr-2 h-4 w-4" /> Teknisi Ditugaskan
                </div>
                <div className="font-medium">
                  {ticket.technician_name ? (
                    ticket.technician_name
                  ) : (
                    <span className="text-muted-foreground italic font-normal">Menunggu penugasan</span>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t space-y-3">
                <div>
                  <div className="flex items-center text-muted-foreground text-xs uppercase tracking-wider mb-1">
                    <Calendar className="mr-1.5 h-3 w-3" /> Dibuat pada
                  </div>
                  <div className="text-sm font-medium">{safeFormatDate(ticket.created_at || ticket.created)}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
