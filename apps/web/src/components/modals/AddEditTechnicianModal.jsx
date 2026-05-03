
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';
import { Switch } from '@/components/ui/switch.jsx';
import { Checkbox } from '@/components/ui/checkbox.jsx';
import { Loader2 } from 'lucide-react';

export default function AddEditTechnicianModal({ isOpen, onClose, technician, onSave, isLoading, candidateUsers = [] }) {
  const isEditing = !!technician;
  const specOptions = ['Printer', 'WiFi', 'PC', 'Monitor', 'Telepon', 'Lainnya'];
  
  const [formData, setFormData] = useState({
    user_id: '',
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'Teknisi',
    is_active: true,
    specializations: [],
    shift_date: new Date().toISOString().split('T')[0],
    max_active_tickets: 5
  });

  const selectedCandidate = !isEditing
    ? candidateUsers.find((u) => u.id === formData.user_id)
    : null;

  useEffect(() => {
    if (technician && isOpen) {
      setFormData({
        user_id: technician.id || '',
        name: technician.name || '',
        email: technician.email || '',
        password: '',
        phone: technician.phone || '',
        role: 'Teknisi',
        is_active: technician.is_active !== false,
        specializations: technician.specializations || [],
        shift_date: technician.shift_date || new Date().toISOString().split('T')[0],
        max_active_tickets: technician.max_active_tickets || 5
      });
    } else if (!technician && isOpen) {
      setFormData({
        user_id: '',
        name: '',
        email: '',
        password: '',
        phone: '',
        division_id_text: '',
        role: 'Teknisi', // Explicitly set to case-sensitive 'Teknisi'
        is_active: true,
        specializations: [],
        shift_start: '09:00',
        shift_end: '17:00',
        max_active_tickets: 5
      });
    }
  }, [technician, isOpen]);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleCandidateChange = (userId) => {
    const selected = candidateUsers.find((u) => u.id === userId);
    setFormData((prev) => ({
      ...prev,
      user_id: userId,
      name: selected?.name || '',
      email: selected?.email || '',
      phone: selected?.phone || '',
      division_id_text: selected?.division_name || '',
      password: '',
    }));
  };

  const handleSpecChange = (spec, checked) => {
    setFormData(prev => {
      if (checked) return { ...prev, specializations: [...prev.specializations, spec] };
      return { ...prev, specializations: prev.specializations.filter(s => s !== spec) };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!isEditing && !formData.user_id) {
      return;
    }

    onSave(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Padal' : 'Tambah Padal'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Perbarui informasi teknisi. Kosongkan password bila tidak ingin mengubahnya.'
              : 'Pilih user existing untuk dipromosikan menjadi teknisi.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <h3 className="font-semibold text-sm border-b pb-2">Informasi Akun</h3>
              {!isEditing && (
                <div className="space-y-2">
                  <Label>Pilih User Existing</Label>
                  <Select value={formData.user_id} onValueChange={handleCandidateChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih user untuk dipromosikan" />
                    </SelectTrigger>
                    <SelectContent>
                      {candidateUsers.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name} ({user.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="name">Nama Lengkap</Label>
                <Input id="name" required value={formData.name} onChange={handleChange} placeholder="Nama Teknisi" disabled={!isEditing} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" required value={formData.email} onChange={handleChange} placeholder="Email" disabled={!isEditing} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">No. HP</Label>
                <Input id="phone" type="tel" value={formData.phone} onChange={handleChange} placeholder="Nomor Handphone" disabled={!isEditing} />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value="Teknisi" disabled>
                  <SelectTrigger><SelectValue placeholder="Teknisi" /></SelectTrigger>
                  <SelectContent><SelectItem value="Teknisi">Teknisi</SelectItem></SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-sm border-b pb-2">Pengaturan Teknisi</h3>
              <div className="space-y-2">
                <Label>Status Teknisi</Label>
                <div className="flex items-center gap-2 pt-1">
                  <Switch id="is_active" checked={formData.is_active} onCheckedChange={(val) => setFormData(prev => ({ ...prev, is_active: val }))} />
                  <Label htmlFor="is_active">{formData.is_active ? 'Aktif Bekerja' : 'Tidak Aktif'}</Label>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="shift_date">Tanggal Shift</Label>
                  <Input id="shift_date" type="date" required value={formData.shift_date} onChange={handleChange} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_active_tickets">Batas Tiket Aktif</Label>
                <Input id="max_active_tickets" type="number" min="1" required value={formData.max_active_tickets} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label>Spesialisasi</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {specOptions.map(spec => (
                    <div key={spec} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`spec-${spec}`} 
                        checked={formData.specializations.includes(spec)}
                        onCheckedChange={(c) => handleSpecChange(spec, c)}
                      />
                      <Label htmlFor={`spec-${spec}`} className="text-sm font-normal cursor-pointer">{spec}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter className="pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>Batal</Button>
            <Button type="submit" disabled={isLoading || (!isEditing && !formData.user_id)}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Simpan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
