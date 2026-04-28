
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext.jsx';
import api from '@/lib/api.js';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent } from '@/components/ui/card.jsx';
import UrgencyBadge from '@/components/tickets/UrgencyBadge.jsx';
import StatusBadge from '@/components/tickets/StatusBadge.jsx';
import { toast } from 'sonner';
import { Loader2, MapPin, User, FileText, Calendar } from 'lucide-react';
import { format } from 'date-fns';

export default function ConfirmTakeTicketDialog({ isOpen, onClose, ticket, onConfirm }) {
  const { currentUser } = useAuth();
  const [isTaking, setIsTaking] = useState(false);

  const handleConfirm = async () => {
    if (!ticket || !currentUser) return;
    
    setIsTaking(true);
    try {
      console.log('Taking ticket ID:', ticket.id, 'for technician:', currentUser.id);
      
      await api.patch(`/tickets/${ticket.id}`, {
        assigned_technician_id: currentUser.id,
        status: 'Proses'
      });
      
      toast.success('Tiket berhasil diambil');
      onConfirm();
      onClose();
    } catch (error) {
      console.error('Error taking ticket:', error.response || error);
      
      // Handle 404 specifically
      if (error.status === 404) {
        toast.error('Gagal: Tiket tidak ditemukan (404). Mungkin tiket sudah diambil teknisi lain atau dihapus.');
      } else {
        toast.error('Gagal mengambil tiket: ' + (error.response?.message || error.message));
      }
    } finally {
      setIsTaking(false);
    }
  };

  if (!ticket) return null;

  const reporterName = ticket.reporter_name || ticket.reporter_email || 'Pengguna Tidak Diketahui';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Konfirmasi Ambil Tiket</DialogTitle>
          <DialogDescription>
            Apakah Anda yakin ingin mengambil tiket ini? Tiket akan dipindahkan ke daftar Proses Anda.
          </DialogDescription>
        </DialogHeader>

        <Card className="mt-4 border-border bg-muted/30 shadow-none">
          <CardContent className="p-4 space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <span className="font-mono text-xs font-semibold bg-background px-2 py-1 rounded-md text-muted-foreground border mb-2 inline-block">
                  {ticket.ticket_number}
                </span>
                <h4 className="font-bold text-foreground line-clamp-2">{ticket.title}</h4>
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <UrgencyBadge urgency={ticket.urgency} />
                <StatusBadge status={ticket.status} />
              </div>
            </div>

            <div className="space-y-3 pt-3 border-t">
              <div className="flex items-start gap-2.5">
                <FileText className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <p className="text-sm text-foreground line-clamp-3">{ticket.description}</p>
              </div>

              <div className="grid sm:grid-cols-2 gap-3 pt-2">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm font-medium text-foreground truncate" title={ticket.location}>
                    {ticket.location}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm font-medium text-foreground truncate" title={reporterName}>
                    {reporterName}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <DialogFooter className="gap-2 sm:gap-0 mt-4">
          <Button variant="outline" onClick={onClose} disabled={isTaking}>
            Batal
          </Button>
          <Button onClick={handleConfirm} disabled={isTaking} className="bg-primary text-primary-foreground">
            {isTaking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Ya, Ambil Tiket
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
