import React, { useEffect, useState } from 'react';
import api from '@/lib/api.js';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent } from '@/components/ui/card.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Switch } from '@/components/ui/switch.jsx';
import { Skeleton } from '@/components/ui/skeleton.jsx';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table.jsx';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog.jsx';
import { Empty, EMPTY_STATE_VARIANTS } from '@/components/ui/empty.jsx';
import SectionHeader from '@/components/common/SectionHeader.jsx';
import { Edit, PlusCircle, Save } from 'lucide-react';
import { toast } from 'sonner';

const ROLES = {
  TEKNISI: 'Teknisi',
};

const initialForm = {
  name: '',
  email: '',
  phone: '',
  password: '',
  is_active: true,
};

const extractUsers = (payload) => {
  if (Array.isArray(payload?.data?.users)) return payload.data.users;
  if (Array.isArray(payload?.users)) return payload.users;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload)) return payload;
  return [];
};

export default function ManageFieldTechniciansPage() {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState({ open: false, item: null });
  const [form, setForm] = useState(initialForm);

  const fetchItems = async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get('/users', {
        params: {
          role: ROLES.TEKNISI,
          search: search || undefined,
          sort: 'name',
          order: 'asc',
          perPage: 100,
        },
      });
      setItems(extractUsers(data));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal memuat data Teknisi');
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [search]);

  const openCreate = () => {
    setForm(initialForm);
    setModal({ open: true, item: null });
  };

  const openEdit = (item) => {
    setForm({
      name: item.name || '',
      email: item.email || '',
      phone: item.phone || '',
      password: '',
      is_active: item.is_active !== false,
    });
    setModal({ open: true, item });
  };

  const save = async () => {
    if (!form.name || !form.phone) {
      toast.error('Nama dan nomor HP wajib diisi');
      return;
    }

    setIsSaving(true);
    try {
      if (modal.item?.id) {
        const payload = {
          name: form.name,
          phone: form.phone,
          role: ROLES.TEKNISI,
          is_active: form.is_active,
        };
        if (form.password) {
          payload.password = form.password;
          payload.passwordConfirm = form.password;
        }
        await api.patch(`/users/${modal.item.id}`, payload);
        toast.success('Data Teknisi diperbarui');
      } else {
        if (!form.email || !form.password) {
          toast.error('Email dan password wajib untuk tambah Teknisi');
          setIsSaving(false);
          return;
        }
        await api.post('/users', {
          name: form.name,
          email: form.email,
          phone: form.phone,
          password: form.password,
          passwordConfirm: form.password,
          role: ROLES.TEKNISI,
          is_active: form.is_active,
        });
        toast.success('Teknisi berhasil ditambahkan');
      }
      setModal({ open: false, item: null });
      setForm(initialForm);
      fetchItems();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal menyimpan data Teknisi');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleActive = async (item) => {
    try {
      await api.patch(`/users/${item.id}`, {
        is_active: !item.is_active,
        role: ROLES.TEKNISI,
      });
      toast.success(!item.is_active ? 'Akun Teknisi diaktifkan' : 'Akun Teknisi dinonaktifkan');
      fetchItems();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal mengubah status akun');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <SectionHeader
        title="Kelola Teknisi"
        subtitle="Tambah, ubah, dan aktif/nonaktif akun Teknisi."
      />

      <div className="flex flex-wrap items-center gap-3">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama/email Teknisi..."
          className="max-w-sm"
        />
        <Button onClick={openCreate} className="gap-2">
          <PlusCircle className="h-4 w-4" />
          Tambah Teknisi
        </Button>
      </div>

      <Card className="border-border shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>No. HP</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 5 }).map((__, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : items.length > 0 ? (
                items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.email}</TableCell>
                    <TableCell>{item.phone || '-'}</TableCell>
                    <TableCell>{item.is_active ? 'Aktif' : 'Nonaktif'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEdit(item)} className="gap-1">
                          <Edit className="h-3.5 w-3.5" /> Edit
                        </Button>
                        <Button
                          variant={item.is_active ? 'destructive' : 'secondary'}
                          size="sm"
                          onClick={() => toggleActive(item)}
                        >
                          {item.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-56">
                    <Empty
                      className="border-0 shadow-none"
                      variant={EMPTY_STATE_VARIANTS.NO_RESULTS}
                      title="Belum ada akun Teknisi"
                      description="Tambahkan akun Teknisi dari tombol di atas."
                    />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={modal.open} onOpenChange={(open) => !open && setModal({ open: false, item: null })}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{modal.item ? 'Edit Teknisi' : 'Tambah Teknisi'}</DialogTitle>
            <DialogDescription>
              {modal.item ? 'Perbarui data akun Teknisi.' : 'Buat akun Teknisi baru.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label>Nama</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email}
                disabled={!!modal.item}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label>No. HP</Label>
              <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>{modal.item ? 'Password Baru (opsional)' : 'Password'}</Label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              />
            </div>
            <div className="flex items-center justify-between pt-2">
              <Label>Status Aktif</Label>
              <Switch checked={form.is_active} onCheckedChange={(val) => setForm((f) => ({ ...f, is_active: val }))} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModal({ open: false, item: null })}>Batal</Button>
            <Button onClick={save} disabled={isSaving} className="gap-2">
              <Save className="h-4 w-4" />
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
