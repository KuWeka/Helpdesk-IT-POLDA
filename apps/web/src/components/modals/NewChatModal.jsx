
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '@/lib/api.js';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Skeleton } from '@/components/ui/skeleton.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';
import { Label } from '@/components/ui/label.jsx';
import TechnicianCard from '../tickets/TechnicianCard.jsx';
import { toast } from 'sonner';
import { Loader2, Shuffle } from 'lucide-react';
import { ROLES } from '@/lib/constants.js';

const extractItems = (payload) => {
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload)) return payload;
  return [];
};

const extractTechnicians = (payload) => {
  if (Array.isArray(payload?.data?.technicians)) return payload.data.technicians;
  if (Array.isArray(payload?.technicians)) return payload.technicians;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload)) return payload;
  return [];
};

export default function NewChatModal({ isOpen, onClose }) {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [technicians, setTechnicians] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [selectedTech, setSelectedTech] = useState(null);
  const [selectedTicketId, setSelectedTicketId] = useState('');
  
  const [isCreating, setIsCreating] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchData();
      setSelectedTech(null);
      setSelectedTicketId('');
      setShowConfirm(false);
    }
  }, [isOpen]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [techRes, ticketRes] = await Promise.allSettled([
        api.get('/technicians'),
        api.get('/tickets', { params: { page: 1, perPage: 100 } }),
      ]);

      if (techRes.status === 'fulfilled') {
        const techs = extractTechnicians(techRes.value.data).filter((tech) => tech.is_active !== false);
        setTechnicians(techs);
      } else {
        setTechnicians([]);
      }

      if (ticketRes.status === 'fulfilled') {
        const ticketData = extractItems(ticketRes.value.data);
        setTickets(ticketData);
        if (ticketData.length === 1) {
          setSelectedTicketId(ticketData[0].id);
        }
      } else {
        setTickets([]);
      }

      if (techRes.status === 'rejected' || ticketRes.status === 'rejected') {
        toast.error('Sebagian data gagal dimuat. Coba lagi.');
      }
    } catch (error) {
      console.error('Error fetching data for new chat:', error);
      toast.error('Gagal memuat data teknisi dan tiket');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRandomSelect = () => {
    if (technicians.length > 0) {
      const randomIndex = Math.floor(Math.random() * technicians.length);
      setSelectedTech(technicians[randomIndex]);
    }
  };

  const handleCreateChat = async () => {
    if (!selectedTech || !selectedTicketId) {
      toast.error('Pilih tiket dan teknisi terlebih dahulu');
      return;
    }
    
    setIsCreating(true);
    try {
      const res = await api.post('/chats', {
        ticket_id: selectedTicketId,
        technician_id: selectedTech.id
      });
      
      toast.success('Chat berhasil dibuat');
      onClose();
      navigate(`/user/chats/${res.data.id}`);
    } catch (error) {
      console.error('Error creating chat details:', error.response || error);
      toast.error('Gagal membuat chat baru: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsCreating(false);
    }
  };

  if (showConfirm && selectedTech) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Konfirmasi Chat</DialogTitle>
            <DialogDescription>
              Mulai percakapan baru dengan teknisi ini?
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <TechnicianCard technician={selectedTech} isSelected={true} />
          </div>
          
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowConfirm(false)} disabled={isCreating}>
              {t('buttons.cancel', 'Batal')}
            </Button>
            <Button onClick={handleCreateChat} disabled={isCreating}>
              {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('buttons.continue', 'Lanjutkan')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{t('chat.new_chat', 'Chat Baru')}</DialogTitle>
          <DialogDescription>
            Pilih tiket terkait dan teknisi untuk memulai percakapan.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto py-4 pr-2 space-y-6">
          <div className="space-y-3">
            <Label className="text-sm font-semibold">1. Pilih Tiket Terkait <span className="text-destructive">*</span></Label>
            {isLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : tickets.length > 0 ? (
              <Select value={selectedTicketId} onValueChange={setSelectedTicketId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih tiket yang ingin didiskusikan..." />
                </SelectTrigger>
                <SelectContent>
                  {tickets.map(ticket => (
                    <SelectItem key={ticket.id} value={ticket.id}>
                      {ticket.ticket_number} - {ticket.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md border border-destructive/20">
                Anda belum memiliki tiket. Silakan buat tiket terlebih dahulu sebelum memulai chat.
              </div>
            )}
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-semibold">2. Pilih Teknisi <span className="text-destructive">*</span></Label>
            {isLoading ? (
              <div className="grid sm:grid-cols-2 gap-3">
                {Array(2).fill(0).map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full rounded-xl" />
                ))}
              </div>
            ) : technicians.length > 0 ? (
              <div className="grid sm:grid-cols-2 gap-3">
                {technicians.map((tech) => (
                  <TechnicianCard 
                    key={tech.id} 
                    technician={tech}
                    isSelected={selectedTech?.id === tech.id}
                    onClick={() => setSelectedTech(tech)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground border rounded-xl bg-muted/30">
                <p>{t('chat.no_tech_available', 'Tidak ada teknisi yang tersedia saat ini.')}</p>
              </div>
            )}
          </div>
        </div>
        
        <DialogFooter className="flex-col sm:flex-row gap-3 sm:justify-between border-t pt-4 mt-2">
          <Button 
            variant="secondary" 
            onClick={handleRandomSelect}
            disabled={isLoading || technicians.length === 0}
            className="w-full sm:w-auto gap-2"
          >
            <Shuffle className="h-4 w-4" />
            {t('buttons.random_select', 'Pilih Acak')}
          </Button>
          
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={onClose} className="flex-1 sm:flex-none">
              {t('buttons.cancel', 'Batal')}
            </Button>
            <Button 
              onClick={() => setShowConfirm(true)} 
              disabled={!selectedTech || !selectedTicketId}
              className="flex-1 sm:flex-none"
            >
              {t('buttons.continue', 'Lanjutkan')}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
