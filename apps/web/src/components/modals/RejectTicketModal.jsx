import React, { useState } from 'react';
import api from '@/lib/api.js';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Textarea } from '@/components/ui/textarea.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function RejectTicketModal({ open, onOpenChange, ticket, onSuccess }) {
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleClose = () => {
    setReason('');
    onOpenChange(false);
  };

  const handleSubmit = async () => {
    if (!reason.trim()) return;
    setIsLoading(true);
    try {
      await api.post(`/tickets/${ticket.id}/reject`, { reason: reason.trim() });
      toast.success(`Tiket ${ticket.ticket_number || ticket.id} berhasil ditolak`);
      setReason('');
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menolak tiket');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Tolak Tiket</DialogTitle>
          <DialogDescription>
            Masukkan alasan penolakan untuk tiket{' '}
            <span className="font-mono font-semibold">{ticket?.ticket_number || ticket?.id}</span>.
            Alasan ini akan ditampilkan kepada pelapor.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-2">
          <Label htmlFor="reject-reason">
            Alasan Penolakan <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="reject-reason"
            placeholder="Masukkan alasan penolakan tiket..."
            rows={4}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground">
            {reason.trim().length === 0 ? 'Alasan wajib diisi.' : `${reason.trim().length} karakter`}
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Batal
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={!reason.trim() || isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Tolak Tiket
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
