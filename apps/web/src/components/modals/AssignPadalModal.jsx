import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '@/lib/api.js';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const extractItems = (payload) => {
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload)) return payload;
  return [];
};

export default function AssignPadalModal({ open, onOpenChange, ticket, onSuccess }) {
  const { t } = useTranslation();
  const [padalList, setPadalList] = useState([]);
  const [selectedPadal, setSelectedPadal] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSelectedPadal('');
    setIsFetching(true);
    api.get('/users', { params: { role: 'Padal', sort: 'name', order: 'asc', perPage: 100 } })
      .then(({ data }) => {
        const items = extractItems(data);
        const sorted = [...items].sort((a, b) => {
          if (Boolean(a.is_shift_active) !== Boolean(b.is_shift_active)) {
            return a.is_shift_active ? -1 : 1;
          }
          return String(a.name || '').localeCompare(String(b.name || ''));
        });
        setPadalList(sorted);
      })
      .catch(() => toast.error('Gagal memuat daftar Padal'))
      .finally(() => setIsFetching(false));
  }, [open]);

  const handleSubmit = async () => {
    if (!selectedPadal) return;
    setIsLoading(true);
    try {
      await api.post(`/tickets/${ticket.id}/assign`, { padal_id: selectedPadal });
      toast.success('Tiket berhasil di-assign ke Padal');
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mengassign tiket');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Padal ke Tiket</DialogTitle>
          <DialogDescription>
            Pilih Padal yang akan menangani tiket{' '}
            <span className="font-mono font-semibold">{ticket?.ticket_number || ticket?.id}</span>.
            Padal akan menerima notifikasi dan dapat menerima atau menolak assignment.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {isFetching ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="h-4 w-4 animate-spin" />
              Memuat daftar Padal...
            </div>
          ) : (
            <Select value={selectedPadal} onValueChange={setSelectedPadal}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih Padal..." />
              </SelectTrigger>
              <SelectContent>
                {padalList.length === 0 ? (
                  <SelectItem value="__none__" disabled>Tidak ada Padal tersedia</SelectItem>
                ) : (
                  padalList.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      <div className="flex w-full items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium truncate">{p.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{p.email}</p>
                        </div>
                        {p.is_shift_active ? (
                          <Badge className="bg-green-100 text-green-700 border-green-200">Aktif</Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">Off Shift</Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Batal
          </Button>
          <Button onClick={handleSubmit} disabled={!selectedPadal || isLoading || isFetching}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Assign
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
