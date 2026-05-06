import React, { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api.js';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Skeleton } from '@/components/ui/skeleton.jsx';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Empty, EMPTY_STATE_VARIANTS } from '@/components/ui/empty.jsx';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu.jsx';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog.jsx';
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog.jsx';
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select.jsx';
import {
  PlusCircle, Trash2, MoreHorizontal, Users,
  UserPlus, Loader2, Star, Phone, Mail, Calendar,
  CheckCircle2, XCircle, ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { ROLES } from '@/lib/constants.js';
import SectionHeader from '@/components/common/SectionHeader.jsx';

// ── helpers ──────────────────────────────────────────────────────────────────
const extractUsers = (payload) => {
  if (Array.isArray(payload?.data?.users)) return payload.data.users;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload)) return payload;
  return [];
};

const extractTechnicians = (payload) => {
  if (Array.isArray(payload?.data?.technicians)) return payload.data.technicians;
  if (Array.isArray(payload?.technicians)) return payload.technicians;
  return extractUsers(payload);
};

const syncMemberCount = (list, padalId, members) =>
  list.map((p) => (p.id === padalId ? { ...p, member_count: members.length } : p));

// ── sub-components ────────────────────────────────────────────────────────────

/** Dialog Detail Padal: info + anggota + tambah anggota */
function DetailPadalDialog({ padal, onClose, onMemberChange }) {
  const [members, setMembers] = useState([]);
  const [teknisiPool, setTeknisiPool] = useState([]);
  const [selectedTeknisi, setSelectedTeknisi] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  const fetchData = useCallback(async () => {
    if (!padal) return;
    setIsLoading(true);
    try {
      const [membRes, tekRes] = await Promise.allSettled([
        api.get(`/padal-shifts/${padal.id}/members`),
        api.get('/users', { params: { role: 'Teknisi', perPage: 100 } }),
      ]);
      setMembers(membRes.status === 'fulfilled' ? (membRes.value.data?.data?.members || []) : []);
      setTeknisiPool(tekRes.status === 'fulfilled' ? extractUsers(tekRes.value.data).filter(u => u.role === ROLES.TEKNISI) : []);
    } catch {
      toast.error('Gagal memuat data anggota');
    } finally {
      setIsLoading(false);
    }
  }, [padal]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAdd = async () => {
    if (!selectedTeknisi) return;
    setIsAdding(true);
    try {
      await api.post(`/padal-shifts/${padal.id}/members`, { teknisi_id: selectedTeknisi });
      toast.success('Anggota berhasil ditambahkan');
      setSelectedTeknisi('');
      fetchData();
      onMemberChange?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menambahkan anggota');
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemove = async (teknisiId, name) => {
    try {
      await api.delete(`/padal-shifts/${padal.id}/members/${teknisiId}`);
      toast.success(`${name} dihapus dari Padal`);
      setMembers(prev => prev.filter(m => m.id !== teknisiId));
      onMemberChange?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menghapus anggota');
    }
  };

  const available = teknisiPool.filter(t => !members.some(m => m.id === t.id));

  return (
    <Dialog open={!!padal} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Detail Padal — {padal?.name}
          </DialogTitle>
          <DialogDescription>Informasi padal dan daftar anggota teknisi.</DialogDescription>
        </DialogHeader>

        {/* Info Padal */}
        <div className="grid grid-cols-2 gap-3 p-4 rounded-lg border bg-muted/20 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Mail className="h-3.5 w-3.5" />{padal?.email || '-'}
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="h-3.5 w-3.5" />{padal?.phone || '-'}
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            {padal?.shift_start
              ? `${padal.shift_start?.slice(0,10)} s/d ${padal.shift_end?.slice(0,10)}`
              : <span className="text-muted-foreground">Shift belum diatur</span>}
          </div>
          <div className="flex items-center gap-2">
            {padal?.is_shift_active
              ? <Badge className="bg-green-100 text-green-700 border-green-300 gap-1 text-xs"><CheckCircle2 className="h-3 w-3" />Shift Aktif</Badge>
              : <Badge variant="secondary" className="gap-1 text-xs"><XCircle className="h-3 w-3" />Shift Tidak Aktif</Badge>}
          </div>
          {padal?.avg_rating && (
            <div className="flex items-center gap-1 col-span-2">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span className="font-medium">{padal.avg_rating}</span>
              <span className="text-xs text-muted-foreground">({padal.total_ratings || 0} rating)</span>
            </div>
          )}
        </div>

        {/* Tambah Anggota */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm">Anggota Teknisi</h4>
          <div className="flex gap-2">
            <Select value={selectedTeknisi} onValueChange={setSelectedTeknisi} disabled={isLoading}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder={available.length ? 'Pilih Teknisi...' : 'Tidak ada teknisi tersedia'} />
              </SelectTrigger>
              <SelectContent>
                {available.map(t => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name} <span className="text-xs text-muted-foreground ml-1">({t.email})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleAdd} disabled={!selectedTeknisi || isAdding} className="gap-1 shrink-0">
              {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              Tambah
            </Button>
          </div>

          <div className="border rounded-lg overflow-hidden">
            {isLoading ? (
              <div className="p-4 space-y-2">
                {[1,2,3].map(i => <Skeleton key={i} className="h-8 w-full" />)}
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
                    <TableHead>No HP</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map(m => (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium text-sm">{m.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{m.email}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{m.phone || '-'}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost" size="icon"
                          className="h-7 w-7 text-destructive hover:bg-destructive/10"
                          onClick={() => handleRemove(m.id, m.name)}
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
          <Button variant="outline" onClick={onClose}>Tutup</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Dialog Tambah Padal Baru */
function AddPadalDialog({ open, onClose, onSuccess }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) setForm({ name: '', email: '', phone: '', password: '' });
  }, [open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      toast.error('Nama, email, dan password wajib diisi');
      return;
    }
    setIsSaving(true);
    try {
      await api.post('/technicians', {
        name: form.name,
        email: form.email,
        phone: form.phone || undefined,
        password: form.password,
      });
      toast.success('Padal berhasil ditambahkan');
      onClose();
      onSuccess();
    } catch (err) {
      const msgs = err.response?.data?.errors;
      toast.error(Array.isArray(msgs) ? msgs.join(', ') : (err.response?.data?.message || 'Gagal menambahkan Padal'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Tambah Padal Baru</DialogTitle>
          <DialogDescription>Buat akun Padal baru. Padal dapat mengelola anggota Teknisi dan mengerjakan tiket.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label htmlFor="padal-name">Nama Lengkap *</Label>
            <Input id="padal-name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required placeholder="Nama Padal" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="padal-email">Email *</Label>
            <Input id="padal-email" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required placeholder="email@polda.go.id" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="padal-phone">No HP / WhatsApp</Label>
            <Input id="padal-phone" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="08xxxxxxxxxx" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="padal-password">Password *</Label>
            <Input id="padal-password" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required placeholder="Min. 8 karakter" />
          </div>
          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>Batal</Button>
            <Button type="submit" disabled={isSaving} className="gap-2">
              {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
              Simpan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── main page ─────────────────────────────────────────────────────────────────
export default function ManageTechniciansPage() {
  const [activeTab, setActiveTab] = useState('Padal');
  const [padalList, setPadalList] = useState([]);
  const [teknisiList, setTeknisiList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [detailTarget, setDetailTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // ── fetch Padal (from /technicians which has aggregated counts) ──
  const fetchPadal = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get('/technicians');
      const list = extractTechnicians(data);

      // Enrich with shift data from padal-shifts endpoint
      let shiftMap = {};
      try {
        const { data: shiftData } = await api.get('/padal-shifts');
        const shiftList = shiftData?.data?.padal_list || [];
        shiftList.forEach(s => {
          shiftMap[s.id] = {
            is_shift_active: !!s.is_shift_active,
            shift_start: s.shift_start,
            shift_end: s.shift_end,
            shift_notes: s.notes,
          };
        });
      } catch { /* shift data optional */ }

      setPadalList(list.map(p => ({ ...p, ...(shiftMap[p.id] || {}) })));
    } catch {
      // fallback
      try {
        const { data } = await api.get('/users', { params: { role: 'Padal', perPage: 100 } });
        setPadalList(extractUsers(data).map(u => ({
          ...u, member_count: 0, total_tickets_selesai: 0, avg_rating: null, total_ratings: 0,
        })));
      } catch {
        toast.error('Gagal memuat data Padal');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── fetch Teknisi ──
  const fetchTeknisi = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get('/users', { params: { role: 'Teknisi', perPage: 100 } });
      const list = extractUsers(data)
        .filter(u => u.role === ROLES.TEKNISI)
        .sort((a, b) => (b.padal_name ? 1 : 0) - (a.padal_name ? 1 : 0));
      setTeknisiList(list);
    } catch {
      toast.error('Gagal memuat data Teknisi');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'Padal') fetchPadal();
    else fetchTeknisi();
  }, [activeTab, fetchPadal, fetchTeknisi]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await api.delete(`/users/${deleteTarget.id}`);
      toast.success(`Akun ${deleteTarget.name} dihapus`);
      setDeleteTarget(null);
      fetchPadal();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menghapus akun');
    } finally {
      setIsDeleting(false);
    }
  };

  const total = activeTab === 'Padal' ? padalList.length : teknisiList.length;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <SectionHeader
          title="Kelola Staff"
          subtitle={`Total: ${total} ${activeTab === 'Padal' ? 'padal' : 'teknisi'}`}
        />
        {activeTab === 'Padal' && (
          <Button onClick={() => setShowAddDialog(true)} className="gap-2 shrink-0">
            <PlusCircle className="h-4 w-4" /> Tambah Padal
          </Button>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="Padal">Padal</TabsTrigger>
          <TabsTrigger value="Teknisi">Teknisi</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <Table className="min-w-full">
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead className="px-6">Nama</TableHead>
              <TableHead>Kontak (No HP)</TableHead>
              {activeTab === 'Padal' ? (
                <>
                  <TableHead>Status Shift</TableHead>
                  <TableHead>Rata-rata Rating</TableHead>
                  <TableHead>Tiket Dikerjakan</TableHead>
                  <TableHead>Jumlah Anggota</TableHead>
                  <TableHead className="text-right px-6">Aksi</TableHead>
                </>
              ) : (
                <>
                  <TableHead>Padal</TableHead>
                </>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell className="px-6"><Skeleton className="h-10 w-44" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                  {activeTab === 'Padal' ? (
                    <>
                      <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-10" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-10" /></TableCell>
                      <TableCell className="text-right px-6"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                    </>
                  ) : (
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  )}
                </TableRow>
              ))
            ) : activeTab === 'Padal' ? (
              padalList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-56">
                    <Empty variant={EMPTY_STATE_VARIANTS.NO_RESULTS} title="Belum ada Padal" description="Tambah Padal dengan tombol di atas." />
                  </TableCell>
                </TableRow>
              ) : padalList.map(padal => (
                <TableRow key={padal.id} className="hover:bg-muted/30">
                  <TableCell className="px-6 py-3">
                    <div className="font-medium text-foreground">{padal.name}</div>
                    <div className="text-xs text-muted-foreground">{padal.email}</div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{padal.phone || '-'}</TableCell>
                  <TableCell>
                    {padal.is_shift_active ? (
                      <Badge className="bg-green-100 text-green-700 border-green-300 gap-1 text-xs">
                        <CheckCircle2 className="h-3 w-3" /> Aktif
                      </Badge>
                    ) : padal.shift_start ? (
                      <Badge variant="secondary" className="gap-1 text-xs">
                        <XCircle className="h-3 w-3" /> Tidak Aktif
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">Belum diatur</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {padal.avg_rating ? (
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                        <span className="font-medium text-sm">{padal.avg_rating}</span>
                        <span className="text-xs text-muted-foreground">({padal.total_ratings || 0})</span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">Belum ada</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">{padal.total_tickets_selesai || 0}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                      <Users className="h-3.5 w-3.5" />{padal.member_count ?? 0}
                    </span>
                  </TableCell>
                  <TableCell className="text-right px-6">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setDetailTarget(padal)}>
                          <Users className="mr-2 h-4 w-4" /> Detail Padal
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setDeleteTarget(padal)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Hapus Padal
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              teknisiList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-56">
                    <Empty variant={EMPTY_STATE_VARIANTS.NO_RESULTS} title="Belum ada Teknisi" description="Teknisi ditambahkan melalui tab Padal > Detail Padal > Tambah Anggota." />
                  </TableCell>
                </TableRow>
              ) : teknisiList.map(tek => (
                <TableRow key={tek.id} className="hover:bg-muted/30">
                  <TableCell className="px-6 py-3">
                    <div className="font-medium text-foreground">{tek.name}</div>
                    <div className="text-xs text-muted-foreground">{tek.email}</div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{tek.phone || '-'}</TableCell>
                  <TableCell>
                    {tek.padal_name
                      ? <span className="text-sm font-medium">{tek.padal_name}</span>
                      : <span className="text-sm text-muted-foreground">-</span>}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialogs */}
      <AddPadalDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onSuccess={fetchPadal}
      />

      <DetailPadalDialog
        padal={detailTarget}
        onClose={() => setDetailTarget(null)}
        onMemberChange={fetchPadal}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Akun Padal</AlertDialogTitle>
            <AlertDialogDescription>
              PERINGATAN: Yakin ingin menghapus permanen akun &quot;{deleteTarget?.name}&quot;?
              Semua data tiket dan anggota terkait akan terpengaruh.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Ya, Hapus Permanen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
