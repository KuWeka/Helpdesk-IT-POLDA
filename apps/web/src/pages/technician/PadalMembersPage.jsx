import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext.jsx';
import api from '@/lib/api.js';
import { Card, CardContent } from '@/components/ui/card.jsx';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Skeleton } from '@/components/ui/skeleton.jsx';
import { Empty, EMPTY_STATE_VARIANTS } from '@/components/ui/empty.jsx';
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog.jsx';
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select.jsx';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog.jsx';
import { UserPlus, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import SectionHeader from '@/components/common/SectionHeader.jsx';

export default function PadalMembersPage() {
  const { currentUser } = useAuth();

  const [members, setMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [teknisiList, setTeknisiList] = useState([]);
  const [isLoadingTeknisi, setIsLoadingTeknisi] = useState(false);
  const [selectedTeknisi, setSelectedTeknisi] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const [removeTarget, setRemoveTarget] = useState(null);
  const [isRemoving, setIsRemoving] = useState(false);

  const fetchMembers = async () => {
    if (!currentUser?.id) return;
    setIsLoading(true);
    try {
      const { data } = await api.get(`/padal-shifts/${currentUser.id}/members`);
      const result = data?.data?.members || [];
      setMembers(result);
    } catch {
      toast.error('Gagal memuat daftar anggota');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const openAddModal = async () => {
    if (!currentUser?.id) return;
    setIsLoadingTeknisi(true);
    setTeknisiList([]);
    setSelectedTeknisi('');
    setIsAddOpen(true);

    try {
      const { data } = await api.get('/users', {
        params: { role: 'Teknisi', is_active: true, perPage: 100, sort: 'name', order: 'asc' },
      });

      const candidates = data?.data?.users || data?.data || data?.users || [];
      const memberIds = new Set(members.map((m) => m.id));
      const filtered = candidates.filter((t) => !memberIds.has(t.id));
      setTeknisiList(filtered);
    } catch {
      toast.error('Gagal memuat daftar Teknisi');
    } finally {
      setIsLoadingTeknisi(false);
    }
  };

  const handleAddMember = async () => {
    if (!selectedTeknisi || !currentUser?.id) return;
    setIsAdding(true);
    try {
      const response = await api.post(`/padal-shifts/${currentUser.id}/members`, {
        teknisi_id: selectedTeknisi,
      });
      toast.success(response.data?.message || 'Teknisi berhasil ditambahkan');
      setIsAddOpen(false);
      setSelectedTeknisi('');
      fetchMembers();
    } catch (err) {
      const message = err.response?.data?.message || 'Gagal menambahkan Teknisi';
      toast.error(message);
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveMember = async () => {
    if (!removeTarget || !currentUser?.id) return;
    setIsRemoving(true);
    try {
      await api.delete(`/padal-shifts/${currentUser.id}/members/${removeTarget.id}`);
      toast.success(`${removeTarget.name} berhasil dikeluarkan dari kelompok`);
      setMembers((prev) => prev.filter((m) => m.id !== removeTarget.id));
      setRemoveTarget(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menghapus anggota');
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <SectionHeader
        title="Anggota Teknisi"
        subtitle={`${members.length} anggota terdaftar`}
        actions={(
          <Button onClick={openAddModal}>
            <UserPlus className="h-4 w-4 mr-2" />
            Tambah Teknisi
          </Button>
        )}
      />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>No. HP</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Bergabung</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-8 ml-auto" /></TableCell>
                </TableRow>
              ))}

              {!isLoading && members.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6}>
                    <Empty
                      variant={EMPTY_STATE_VARIANTS.NO_RESULTS}
                      title="Belum ada anggota"
                      description="Tambahkan Teknisi ke kelompok Anda menggunakan tombol di atas."
                    />
                  </TableCell>
                </TableRow>
              )}

              {!isLoading && members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">{member.name}</TableCell>
                  <TableCell className="text-muted-foreground">{member.email}</TableCell>
                  <TableCell>{member.phone || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={member.is_active ? 'success' : 'secondary'}>
                      {member.is_active ? 'Aktif' : 'Nonaktif'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {member.joined_at
                      ? new Date(member.joined_at).toLocaleDateString('id-ID', {
                        day: '2-digit', month: 'short', year: 'numeric',
                      })
                      : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => setRemoveTarget({ id: member.id, name: member.name })}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Anggota Teknisi</DialogTitle>
            <DialogDescription>
              Pilih Teknisi yang belum terdaftar di Padal manapun.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2">
            {isLoadingTeknisi && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Memuat daftar Teknisi...
              </div>
            )}

            {!isLoadingTeknisi && teknisiList.length > 0 && (
              <Select value={selectedTeknisi} onValueChange={setSelectedTeknisi}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Teknisi..." />
                </SelectTrigger>
                <SelectContent>
                  {teknisiList.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name} - {t.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {!isLoadingTeknisi && teknisiList.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Tidak ada Teknisi yang tersedia. Semua Teknisi sudah terdaftar di Padal lain.
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)} disabled={isAdding}>
              Batal
            </Button>
            <Button
              onClick={handleAddMember}
              disabled={!selectedTeknisi || isAdding || isLoadingTeknisi}
            >
              {isAdding
                ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Menambahkan...</>
                : <><UserPlus className="h-4 w-4 mr-2" /> Tambah</>
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!removeTarget}
        onOpenChange={(open) => { if (!open) setRemoveTarget(null); }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Keluarkan Anggota?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{removeTarget?.name}</strong> akan dikeluarkan dari kelompok Anda.
              Teknisi ini bisa ditambahkan ke Padal lain setelah dikeluarkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemoving}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveMember}
              disabled={isRemoving}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isRemoving
                ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Mengeluarkan...</>
                : 'Ya, Keluarkan'
              }
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}