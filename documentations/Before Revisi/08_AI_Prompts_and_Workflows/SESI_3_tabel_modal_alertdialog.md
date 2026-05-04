Tanggal: 2026-04-18

> Jalankan setelah Sesi 2 selesai dan diverifikasi
> Fokus: Konsistenkan halaman tabel, refactor modal, ganti window.confirm

---

## KONTEKS

Project: Helpdesk System — React 18 + Vite + shadcn/ui.
Sesi 1 & 2 sudah selesai. Layout dan dashboard sudah bersih.

---

## YANG TIDAK BOLEH DIUBAH

```
❌ Semua api.get/post/patch/delete calls
❌ Semua state, useEffect, handler functions (fetchTechnicians, handleSave, handleDelete, dll)
❌ src/lib/api.js, socket.js, AuthContext.jsx
❌ src/components/ui/
```

**Hanya ubah bagian JSX/UI saja.**

---

## TUGAS SESI INI

### TUGAS 1 — Ganti semua `window.confirm` dengan `AlertDialog`

Cari seluruh project untuk `window.confirm(` dan ganti dengan shadcn `AlertDialog`.

Import yang dibutuhkan:
```jsx
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
```

**Pola penggantian — dari state-based confirm:**

```jsx
// SEBELUM (contoh di ManageTechniciansPage):
const handlePermanentDelete = async (tech) => {
  if (!window.confirm(`Yakin ingin menghapus "${tech.name}"?`)) return;
  // ... logic delete
};

// SESUDAH:
// 1. Tambahkan state:
const [deleteTarget, setDeleteTarget] = useState(null);

// 2. Ganti tombol hapus menjadi trigger:
<Button
  variant="ghost"
  size="icon"
  onClick={() => setDeleteTarget(tech)}
>
  <Trash2 className="h-4 w-4 text-destructive" />
</Button>

// 3. Tambahkan AlertDialog di luar tabel (satu untuk semua baris):
<AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Hapus Teknisi</AlertDialogTitle>
      <AlertDialogDescription>
        Yakin ingin menghapus permanen akun <strong>{deleteTarget?.name}</strong>?
        Tindakan ini tidak dapat dibatalkan.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel onClick={() => setDeleteTarget(null)}>Batal</AlertDialogCancel>
      <AlertDialogAction
        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
        onClick={() => {
          handlePermanentDelete(deleteTarget);
          setDeleteTarget(null);
        }}
      >
        Hapus Permanen
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

**File yang perlu dicek untuk `window.confirm`:**
- `src/pages/admin/ManageTechniciansPage.jsx`
- `src/pages/admin/ManageUsersPage.jsx`
- `src/pages/admin/AllTicketsPage.jsx`
- `src/pages/admin/AdminTicketDetailPage.jsx`
- `src/pages/admin/TicketHistoryPage.jsx`
- `src/pages/admin/ChatMonitoringPage.jsx`
- `src/pages/technician/TechnicianTicketDetailPage.jsx`

---

### TUGAS 2 — Refactor `src/components/AddEditTechnicianModal.jsx`

Tambahkan `DialogDescription` yang wajib ada untuk accessibility:

```jsx
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog.jsx';

// Di dalam Dialog:
<DialogHeader>
  <DialogTitle>{isEditing ? 'Edit Teknisi' : 'Tambah Teknisi Baru'}</DialogTitle>
  <DialogDescription>
    {isEditing
      ? 'Perbarui informasi teknisi. Kosongkan password jika tidak ingin mengubahnya.'
      : 'Isi data untuk menambahkan teknisi baru ke sistem.'}
  </DialogDescription>
</DialogHeader>
```

Wrap semua form field dengan `FormField` pattern yang lebih rapi menggunakan `Label` + `div` wrapper:
```jsx
<div className="grid gap-4 py-4">
  <div className="grid grid-cols-4 items-center gap-4">
    <Label htmlFor="name" className="text-right text-sm">Nama</Label>
    <Input
      id="name"
      className="col-span-3"
      value={formData.name}
      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
    />
  </div>
  {/* field lainnya dengan pola sama */}
</div>
```

Pertahankan semua `formData` state, `useEffect`, dan `onSave` call.

---

### TUGAS 3 — Refactor `src/components/UserEditModal.jsx`

Pola sama dengan AddEditTechnicianModal:
- Tambahkan `DialogDescription`
- Rapikan layout form fields
- Pertahankan semua logic dan api calls

---

### TUGAS 4 — Tambahkan action `DropdownMenu` per baris tabel

Untuk semua halaman tabel (ManageTechnicians, ManageUsers, AllTickets), ganti deretan tombol aksi per baris menjadi `DropdownMenu`:

```jsx
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';

// Ganti tombol-tombol aksi per baris:
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="icon" className="h-8 w-8">
      <MoreHorizontal className="h-4 w-4" />
      <span className="sr-only">Buka menu</span>
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    <DropdownMenuItem onClick={() => setModalState({ isOpen: true, tech: row })}>
      <Edit className="mr-2 h-4 w-4" />
      Edit
    </DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem
      className="text-destructive focus:text-destructive"
      onClick={() => setDeleteTarget(row)}
    >
      <Trash2 className="mr-2 h-4 w-4" />
      Hapus
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

---

### TUGAS 5 — Konsistenkan page header di semua halaman tabel

Setiap halaman tabel harus punya header yang konsisten:

```jsx
<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
  <div>
    <h1 className="text-2xl font-bold tracking-tight">Kelola Teknisi</h1>
    <p className="text-sm text-muted-foreground mt-1">
      Kelola akun dan pengaturan teknisi
    </p>
  </div>
  <Button onClick={() => setModalState({ isOpen: true, tech: null })}>
    <PlusCircle className="mr-2 h-4 w-4" />
    Tambah Teknisi
  </Button>
</div>
```

---

## VERIFIKASI SETELAH SELESAI

- [ ] Tidak ada `window.confirm` tersisa di seluruh project
- [ ] AlertDialog muncul saat tombol hapus diklik
- [ ] Modal AddEditTechnician punya DialogDescription (tidak ada warning accessibility)
- [ ] Action per baris tabel menggunakan DropdownMenu
- [ ] Semua CRUD (create, edit, delete) masih berfungsi normal
- [ ] Tidak ada perubahan pada hasil fetch data

