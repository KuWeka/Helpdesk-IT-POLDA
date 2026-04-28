
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';
import { Switch } from '@/components/ui/switch.jsx';
import { Loader2 } from 'lucide-react';
import api from '@/lib/api.js';
import { ROLES } from '@/lib/constants.js';

const extractItems = (payload) => {
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload)) return payload;
  return [];
};

export default function UserEditModal({ isOpen, onClose, user, onSave, isLoading }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: ROLES.USER,
    division_id: '',
    is_active: true,
    password: '',
    passwordConfirm: ''
  });
  const [divisions, setDivisions] = useState([]);

  useEffect(() => {
    const fetchDivisions = async () => {
      try {
        const { data } = await api.get('/divisions', { params: { sort: 'name' } });
        setDivisions(extractItems(data));
      } catch (error) {
        console.error('Error fetching divisions:', error);
      }
    };
    if (isOpen) fetchDivisions();
  }, [isOpen]);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        role: user.role || ROLES.USER,
        division_id: user.division_id || '',
        is_active: user.is_active !== false,
        password: '',
        passwordConfirm: ''
      });
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        role: ROLES.USER,
        division_id: '',
        is_active: true,
        password: '',
        passwordConfirm: ''
      });
    }
  }, [user, isOpen]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Prepare payload
    const payload = {
      name: formData.name,
      phone: formData.phone,
      role: formData.role,
      division_id: formData.division_id === 'none' ? null : (formData.division_id || null),
      is_active: formData.is_active
    };

    // Only include email and passwords if creating new or explicitly changing password
    if (!user) {
      payload.email = formData.email;
      payload.password = formData.password;
      payload.passwordConfirm = formData.passwordConfirm;
    } else if (formData.password) {
      payload.password = formData.password;
      payload.passwordConfirm = formData.passwordConfirm;
    }

    onSave(payload);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{user ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}</DialogTitle>
          <DialogDescription>
            {user
              ? 'Perbarui profil, role, dan status akun pengguna.'
              : 'Isi data berikut untuk membuat akun pengguna baru.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nama Lengkap</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              required
              className="bg-background text-foreground"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              required={!user}
              disabled={!!user}
              className="bg-background text-foreground disabled:opacity-50"
            />
            {user && <p className="text-xs text-muted-foreground">Email tidak dapat diubah setelah dibuat.</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">No. HP / WhatsApp</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              className="bg-background text-foreground"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={formData.role} onValueChange={(val) => handleChange('role', val)}>
                <SelectTrigger className="bg-background text-foreground">
                  <SelectValue placeholder="Pilih Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ROLES.USER}>User</SelectItem>
                  <SelectItem value={ROLES.TECHNICIAN}>Teknisi</SelectItem>
                  <SelectItem value={ROLES.ADMIN}>Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="division">Divisi</Label>
              <Select value={formData.division_id || 'none'} onValueChange={(val) => handleChange('division_id', val)}>
                <SelectTrigger className="bg-background text-foreground">
                  <SelectValue placeholder="Pilih Divisi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Tidak Ada</SelectItem>
                  {divisions.map((div) => (
                    <SelectItem key={div.id} value={div.id}>{div.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2 border-t">
            <div className="space-y-2">
              <Label htmlFor="password">{user ? 'Password Baru (Opsional)' : 'Password'}</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                required={!user}
                className="bg-background text-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="passwordConfirm">Konfirmasi Password</Label>
              <Input
                id="passwordConfirm"
                type="password"
                value={formData.passwordConfirm}
                onChange={(e) => handleChange('passwordConfirm', e.target.value)}
                required={!user || !!formData.password}
                className="bg-background text-foreground"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <div className="space-y-0.5">
              <Label>Status Akun</Label>
              <p className="text-xs text-muted-foreground">
                {formData.is_active ? 'Akun aktif dan dapat login' : 'Akun dinonaktifkan'}
              </p>
            </div>
            <Switch
              checked={formData.is_active}
              onCheckedChange={(checked) => handleChange('is_active', checked)}
            />
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Batal
            </Button>
            <Button type="submit" disabled={isLoading} className="gap-2">
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              Simpan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
