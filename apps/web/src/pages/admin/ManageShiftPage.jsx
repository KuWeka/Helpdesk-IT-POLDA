import React, { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api.js';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent } from '@/components/ui/card.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Textarea } from '@/components/ui/textarea.jsx';
import { Skeleton } from '@/components/ui/skeleton.jsx';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table.jsx';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog.jsx';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu.jsx';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.jsx';
import { Calendar, Edit, Loader2, CheckCircle2, XCircle, MoreHorizontal, Users, UserPlus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import SectionHeader from '@/components/common/SectionHeader.jsx';
import { format, parseISO } from 'date-fns';

const formatDate = (val) => {
  if (!val) return '-';
  try { return format(parseISO(val.slice(0, 10)), 'dd MMM yyyy'); } catch { return val; }
};

export default function ManageShiftPage() {
  const [padalList, setPadalList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState({ shift_start: '', shift_end: '', notes: '' });
  const [isSaving, setIsSaving] = useState(false);

  // Detail / members state
  const [detailTarget, setDetailTarget] = useState(null); // { id, name }
  const [members, setMembers] = useState([]);
  const [teknisiList, setTeknisiList] = useState([]);
  const [selectedTeknisi, setSelectedTeknisi] = useState('');
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [isAddingMember, setIsAddingMember] = useState(false);

  const fetchPadalList = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get('/padal-shifts');
      setPadalList(data?.data?.padal_list || []);
    } catch {
      toast.error('Gagal memuat daftar Padal');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchPadalList(); }, [fetchPadalList]);

  const openDetail = async (padal) => {
    setDetailTarget(padal);
    setSelectedTeknisi('');
    setIsLoadingMembers(true);
    try {
      const [membersRes, teknisiRes] = await Promise.all([
        api.get(`/padal-shifts/${padal.id}/members`),
        api.get('/users', { params: { role: 'Teknisi', perPage: 100 } }),
      ]);
      setMembers(membersRes.data?.data?.members || []);
      const allTeknisi = teknisiRes.data?.data?.users || teknisiRes.data?.users || [];
      setTeknisiList(allTeknisi);
    } catch {
      toast.error('Gagal memuat data anggota');
    } finally {
      setIsLoadingMembers(false);
    }
  };

  const handleAddMember = async () => {
    if (!selectedTeknisi) return;
    setIsAddingMember(true);
    try {
      await api.post(`/padal-shifts/${detailTarget.id}/members`, { teknisi_id: selectedTeknisi });
      toast.success('Anggota berhasil ditambahkan');
      setSelectedTeknisi('');
      const res = await api.get(`/padal-shifts/${detailTarget.id}/members`);
      setMembers(res.data?.data?.members || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menambahkan anggota');
    } finally {
      setIsAddingMember(false);
    }
  };

  const handleRemoveMember = async (teknisiId, teknisiName) => {
    try {
      await api.delete(`/padal-shifts/${detailTarget.id}/members/${teknisiId}`);
      toast.success(`${teknisiName} dihapus dari Padal`);
      setMembers((prev) => prev.filter((m) => m.id !== teknisiId));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menghapus anggota');
    }
  };

  const openEdit = (padal) => {
    setEditTarget(padal);
    setForm({
      shift_start: padal.shift_start ? padal.shift_start.slice(0, 10) : '',
      shift_end: padal.shift_end ? padal.shift_end.slice(0, 10) : '',
      notes: padal.shift_notes || '',
    });
  };

  const handleSave = async () => {
    if (!form.shift_start || !form.shift_end) {
      toast.error('Tanggal mulai dan akhir shift wajib diisi');
      return;
    }
    if (form.shift_end < form.shift_start) {
      toast.error('Tanggal akhir tidak boleh lebih awal dari tanggal mulai');
      return;
    }
    setIsSaving(true);
    try {
      await api.put(`/padal-shifts/${editTarget.id}`, form);
      toast.success(`Shift ${editTarget.name} berhasil diperbarui`);
      setEditTarget(null);
      fetchPadalList();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan shift');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 flex flex-col gap-6 duration-500">
      <SectionHeader
        title="Manajemen Shift Padal"
        subtitle="Atur jadwal shift aktif untuk setiap Padal. Status aktif dihitung otomatis berdasarkan tanggal hari ini."
        actions={null}
      />

      <Card className="border-border shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Padal</TableHead>
                <TableHead>Shift Mulai</TableHead>
                <TableHead>Shift Selesai</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Catatan</TableHead>
                <TableHead className="w-24 text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((__, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : padalList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                    Belum ada Padal terdaftar.
                  </TableCell>
                </TableRow>
              ) : (
                padalList.map((padal) => (
                  <TableRow key={padal.id}>
                    <TableCell className="font-medium">{padal.name}</TableCell>
                    <TableCell>{formatDate(padal.shift_start)}</TableCell>
                    <TableCell>{formatDate(padal.shift_end)}</TableCell>
                    <TableCell>
                      {padal.is_shift_active ? (
                        <Badge className="bg-green-100 text-green-700 border-green-300 gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Aktif
                        </Badge>
                      ) : padal.shift_start ? (
                        <Badge variant="secondary" className="gap-1">
                          <XCircle className="h-3 w-3" />
                          Tidak Aktif
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                          Belum Diatur
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                      {padal.shift_notes || '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openDetail(padal)}>
                            <Users className="h-4 w-4 mr-2" /> Detail Anggota
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => openEdit(padal)}>
                            <Edit className="h-4 w-4 mr-2" /> Edit Shift
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!detailTarget} onOpenChange={(open) => !open && setDetailTarget(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Anggota Padal — {detailTarget?.name}
            </DialogTitle>
            <DialogDescription>
              Kelola anggota Teknisi yang tergabung dalam Padal ini. Tambahkan secara manual sesuai kebutuhan.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Tambah anggota */}
            <div className="flex gap-2">
              <Select value={selectedTeknisi} onValueChange={setSelectedTeknisi} disabled={isLoadingMembers}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Pilih Teknisi..." />
                </SelectTrigger>
                <SelectContent>
                  {teknisiList
                    .filter((t) => !members.some((m) => m.id === t.id))
                    .map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name} <span className="text-muted-foreground text-xs ml-1">({t.email})</span>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Button onClick={handleAddMember} disabled={!selectedTeknisi || isAddingMember} className="gap-1">
                {isAddingMember ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                Tambah
              </Button>
            </div>

            {/* Daftar anggota */}
            <div className="border rounded-lg overflow-hidden">
              {isLoadingMembers ? (
                <div className="p-4 space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
                </div>
              ) : members.length === 0 ? (
                <div className="text-center text-muted-foreground py-8 text-sm">
                  Belum ada anggota. Tambahkan Teknisi di atas.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell className="font-medium text-sm">{m.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{m.email}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleRemoveMember(m.id, m.name)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailTarget(null)}>Tutup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Edit Shift */}
      <Dialog open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Edit Shift — {editTarget?.name}
            </DialogTitle>
            <DialogDescription>
              Atur tanggal mulai dan akhir shift. Status aktif dihitung otomatis berdasarkan tanggal hari ini.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="shift_start">Tanggal Mulai</Label>
                <Input
                  id="shift_start"
                  type="date"
                  value={form.shift_start}
                  onChange={(e) => setForm((f) => ({ ...f, shift_start: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="shift_end">Tanggal Selesai</Label>
                <Input
                  id="shift_end"
                  type="date"
                  value={form.shift_end}
                  min={form.shift_start || undefined}
                  onChange={(e) => setForm((f) => ({ ...f, shift_end: e.target.value }))}
                />
              </div>
            </div>

            {form.shift_start && form.shift_end && (
              <p className="text-xs text-muted-foreground">
                Status akan otomatis <span className="font-semibold text-green-600">Aktif</span> jika hari ini berada di antara{' '}
                {formatDate(form.shift_start)} – {formatDate(form.shift_end)}.
              </p>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="notes">Catatan <span className="text-muted-foreground">(opsional)</span></Label>
              <Textarea
                id="notes"
                placeholder="Contoh: Shift pagi, pengganti shift malam..."
                rows={3}
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTarget(null)} disabled={isSaving}>
              Batal
            </Button>
            <Button onClick={handleSave} disabled={isSaving || !form.shift_start || !form.shift_end}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Simpan Shift
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
