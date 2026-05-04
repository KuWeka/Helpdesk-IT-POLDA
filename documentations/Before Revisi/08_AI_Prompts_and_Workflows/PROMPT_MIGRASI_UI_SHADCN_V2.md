Tanggal: 2026-04-18

> Untuk: GitHub Copilot Agent / Cursor AI / Windsurf / AI Agent lainnya
> Stack: React 18 + Vite + TailwindCSS v3 + shadcn/ui + Axios + Socket.io
> Tujuan: Selesaikan dan konsistenkan UI layer menggunakan shadcn/ui ecosystem sepenuhnya

---

## 📌 KONDISI PROJECT SAAT INI

Project ini sudah dalam kondisi **migrasi sebagian**. Beberapa hal sudah selesai, beberapa belum.

### ✅ Yang SUDAH selesai (JANGAN diubah):
- **API layer**: `src/lib/api.js` — axios client ke Express backend, sudah lengkap dengan interceptor 401 & CSRF
- **Socket**: `src/lib/socket.js` — Socket.io client, sudah terhubung
- **Auth**: `src/contexts/AuthContext.jsx` — sudah pakai `api.js`, tidak ada PocketBase
- **Semua halaman**: sudah pakai `api.js` untuk semua data fetching
- **shadcn/ui components**: `src/components/ui/` — sudah lengkap, jangan diubah
- **Layout baru**: `src/components/layout/` — `AppSidebar`, `MainLayout`, `Header`, `NavGroup`, `NavUser`, `sidebar-data.js` sudah dibuat dengan shadcn Sidebar primitives
- **Theme CSS**: `src/styles/theme.css` — sudah ada OKLCH variables termasuk sidebar variables

### ❌ Yang BELUM selesai (ini yang harus dikerjakan):

**MASALAH UTAMA**: Ada **dua sistem layout yang hidup berdampingan** dan bertabrakan:

| File | Status | Keterangan |
|---|---|---|
| `src/components/MainLayout.jsx` | ⚠️ Wrapper lama | Hanya meneruskan ke `layout/main-layout.jsx` via Outlet — belum bersih |
| `src/components/Sidebar.jsx` | ❌ Tidak dipakai | Sudah ada `layout/app-sidebar.jsx` tapi `Sidebar.jsx` lama masih ada |
| `src/components/Header.jsx` | ❌ Tidak dipakai | Sudah ada `layout/header.jsx` tapi `Header.jsx` lama masih ada |
| `src/App.jsx` | ⚠️ Import lama | Masih import `MainLayout` dari `components/MainLayout.jsx` (bukan dari `layout/`) |
| `src/index.css` | ⚠️ Duplikat | Ada theme di `index.css` DAN `styles/theme.css` — perlu dikonsolidasi |
| Semua halaman (pages) | ❌ UI belum direfactor | Masih menggunakan UI ad-hoc, belum konsisten dengan shadcn pattern |
| Charts di dashboard | ❌ Belum dimigrasikan | Masih pakai recharts telanjang tanpa `ChartContainer` |

---

## 🎯 TEMPLATE ACUAN VISUAL

Gunakan sebagai panduan visual dan pola komponen:
- `https://ui.shadcn.com/create?preset=b5x0oi6GA&template=vite`
- `https://ui.shadcn.com/create?preset=b5x0oi6GA&template=vite&item=preview`

**Preset**: Mira + Theme Purple + Base Zinc — sidebar collapsible modern, dark/light mode.

---

## 🚫 LARANGAN KERAS — JANGAN SENTUH

```
❌ src/lib/api.js                  — API client sudah sempurna
❌ src/lib/socket.js               — Socket client sudah sempurna
❌ src/contexts/AuthContext.jsx    — Auth sudah beres, tidak ada PocketBase
❌ src/App.jsx (routing logic)     — Hanya boleh update import MainLayout
❌ src/components/ui/             — Semua shadcn primitives jangan diubah
❌ src/i18n/                      — i18n jangan disentuh
❌ src/lib/utils.js, constants.js  — Jangan diubah
❌ Semua api.get/post/patch/delete — Jangan ubah logic fetching data
❌ Semua state, useEffect, handler — Hanya ubah JSX/UI, bukan logic
```

---

## ✅ SCOPE PEKERJAAN — URUTAN PENGERJAAN

### LANGKAH 1 — Bersihkan duplikasi layout

**File**: `src/App.jsx`

Update satu baris import saja:
```jsx
// SEBELUM:
import MainLayout from '@/components/MainLayout.jsx';

// SESUDAH:
import { MainLayout } from '@/components/layout';
```

Kemudian **hapus file-file lama** yang sudah digantikan:
- `src/components/MainLayout.jsx` — sudah digantikan `layout/main-layout.jsx`
- `src/components/Sidebar.jsx` — sudah digantikan `layout/app-sidebar.jsx`
- `src/components/Header.jsx` — sudah digantikan `layout/header.jsx`
- `src/components/Footer.jsx` — tidak diperlukan di layout baru

**File**: `src/index.css`

Hapus semua CSS variable definitions dari `index.css` (karena sudah ada di `src/styles/theme.css`). Pastikan `src/styles/theme.css` di-import di `src/main.jsx`:
```jsx
// src/main.jsx — pastikan ada:
import '@/styles/theme.css';
import '@/index.css';
```

`index.css` hanya boleh berisi `@tailwind base/components/utilities` dan override global minimal.

---

### LANGKAH 2 — Selesaikan komponen `layout/` yang masih belum sempurna

**File**: `src/components/layout/header.jsx`

Saat ini `changeLanguage` hanya reload halaman. Sambungkan ke `i18n`:
```jsx
import { useTranslation } from 'react-i18next';

const { i18n } = useTranslation();
const changeLanguage = (lang) => {
  i18n.changeLanguage(lang.toLowerCase());
  localStorage.setItem('app_language', lang);
};
// Hapus window.location.reload()
```

**File**: `src/components/layout/nav-user.jsx`

Tambahkan link ke halaman settings yang benar per role — sudah ada tapi pastikan `rolePath` sesuai dengan routing di `App.jsx`.

---

### LANGKAH 3 — Refactor halaman per halaman

Untuk setiap file halaman: **ubah hanya JSX/UI-nya, jangan sentuh state, useEffect, dan api calls**.

#### A. `src/pages/LoginPage.jsx` & `src/pages/SignupPage.jsx`

Sudah cukup baik strukturnya. Yang perlu diperbaiki:
- Ganti `<form onSubmit={...}>` dengan pola shadcn `Form` (react-hook-form sudah terinstall)
- Gunakan `FormField`, `FormItem`, `FormControl`, `FormMessage` untuk validasi error yang konsisten
- Tambahkan animasi masuk yang smooth (`animate-in fade-in`)
- Pastikan layout centered dengan `bg-muted/30` atau gradient subtle

#### B. `src/pages/admin/AdminDashboard.jsx`

**Chart migration** — ini prioritas:
```jsx
// SEBELUM:
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

<ResponsiveContainer width="100%" height={300}>
  <BarChart data={chartData}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="name" />
    <YAxis />
    <Tooltip />
    <Bar dataKey="value" fill="#8b5cf6" />
  </BarChart>
</ResponsiveContainer>

// SESUDAH:
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const chartConfig = {
  value: { label: 'Tiket', color: 'hsl(var(--primary))' },
};

<ChartContainer config={chartConfig} className="h-[300px] w-full">
  <BarChart data={chartData}>
    <CartesianGrid strokeDasharray="3 3" vertical={false} />
    <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} />
    <YAxis tickLine={false} axisLine={false} />
    <ChartTooltip content={<ChartTooltipContent />} />
    <Bar dataKey="value" fill="var(--color-value)" radius={[4, 4, 0, 0]} />
  </BarChart>
</ChartContainer>
```

**Stats cards** — gunakan pola konsisten:
```jsx
<Card>
  <CardHeader className="flex flex-row items-center justify-between pb-2">
    <CardTitle className="text-sm font-medium text-muted-foreground">Total Tiket</CardTitle>
    <Ticket className="h-4 w-4 text-muted-foreground" />
  </CardHeader>
  <CardContent>
    <div className="text-2xl font-bold">{stats.total}</div>
    <p className="text-xs text-muted-foreground mt-1">Semua tiket terdaftar</p>
  </CardContent>
</Card>
```

#### C. `src/pages/technician/TechnicianDashboard.jsx` & `src/pages/UserDashboard.jsx`

Pola sama dengan AdminDashboard — konsistenkan stats cards dan chart.

#### D. Semua halaman tabel (AllTickets, ManageUsers, ManageTechnicians, dll)

- Tambahkan search bar menggunakan `Input` dengan icon `Search` dari lucide di atas tabel
- Gunakan `DropdownMenu` untuk action per baris (edit, hapus, dll) — ganti `window.confirm` dengan `AlertDialog`
- Gunakan `Badge` dari shadcn untuk status, role, dan urgency (StatusBadge dan UrgencyBadge sudah ada, tinggal pastikan konsisten)
- Tambahkan `Skeleton` saat loading (pattern yang sudah ada di AdminDashboard, replikasikan ke semua halaman)

#### E. `src/components/AddEditTechnicianModal.jsx` & `src/components/UserEditModal.jsx`

- Wrap form fields dengan shadcn `Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage`
- Ganti `window.confirm` → `AlertDialog` dari shadcn
- Pastikan `DialogDescription` ada (accessibility requirement shadcn)
- Pertahankan semua state dan api call

#### F. `src/pages/ChatDetailPage.jsx` & `src/pages/technician/TechnicianChatsPage.jsx`

- Gunakan `ScrollArea` dari shadcn untuk container daftar pesan
- `src/components/ChatMessage.jsx` — perbaiki bubble chat UI, pisahkan style sent vs received
- `src/components/MessageInput.jsx` — gunakan `Textarea` shadcn + `Button` dengan icon `Send`
- Pertahankan semua socket event handler dan api calls

#### G. `src/pages/UserSettingsPage.jsx` & `src/pages/technician/TechnicianSettingsPage.jsx`

- Gunakan `Tabs` shadcn untuk memisahkan section: Profil, Password, Preferensi
- Setiap section dalam `Card` dengan `CardHeader` + `CardContent`
- Gunakan `Form` shadcn untuk semua form di settings

#### H. `src/pages/admin/SystemSettingsPage.jsx`

- Layout settings dalam `Card` yang terstruktur
- Gunakan `Switch` shadcn untuk toggle settings
- Pertahankan semua api calls

#### I. `src/pages/admin/ActivityLogsPage.jsx`

- Gunakan `Badge` untuk tipe action log
- Tambahkan filter/search di atas tabel
- Pertahankan semua data fetching

---

### LANGKAH 4 — Migrasi Charts di semua dashboard

Berlaku untuk semua penggunaan recharts di:
- `src/pages/admin/AdminDashboard.jsx`
- `src/pages/technician/TechnicianDashboard.jsx`
- `src/pages/UserDashboard.jsx`

Pola: selalu bungkus dengan `ChartContainer` dari `@/components/ui/chart`, gunakan `ChartTooltip` + `ChartTooltipContent`, hapus `ResponsiveContainer` (sudah dihandle `ChartContainer`).

---

### LANGKAH 5 — Ganti semua `window.confirm` dengan `AlertDialog`

Cari semua `window.confirm(` di seluruh project dan ganti dengan shadcn `AlertDialog`. Ini penting untuk konsistensi UX dan tampilan yang profesional.

Pola:
```jsx
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="destructive">Hapus</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Konfirmasi Hapus</AlertDialogTitle>
      <AlertDialogDescription>
        Tindakan ini tidak dapat dibatalkan.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Batal</AlertDialogCancel>
      <AlertDialogAction onClick={handleDelete}>Hapus</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

---

## 📁 RINGKASAN FILE YANG HARUS DIUBAH

```
apps/web/src/
├── App.jsx                          ← Update 1 baris import saja
├── main.jsx                         ← Pastikan import theme.css
├── index.css                        ← Bersihkan, hapus CSS vars (ada di theme.css)
├── components/
│   ├── MainLayout.jsx               ← HAPUS (sudah ada layout/main-layout.jsx)
│   ├── Sidebar.jsx                  ← HAPUS (sudah ada layout/app-sidebar.jsx)
│   ├── Header.jsx                   ← HAPUS (sudah ada layout/header.jsx)
│   ├── Footer.jsx                   ← HAPUS
│   ├── layout/
│   │   └── header.jsx               ← Fix i18n changeLanguage
│   ├── AddEditTechnicianModal.jsx   ← Refactor UI + ganti confirm → AlertDialog
│   ├── UserEditModal.jsx            ← Refactor UI + ganti confirm → AlertDialog
│   ├── ChatMessage.jsx              ← Refactor bubble UI
│   └── MessageInput.jsx             ← Refactor UI
├── pages/
│   ├── LoginPage.jsx                ← Refactor ke shadcn Form
│   ├── SignupPage.jsx               ← Refactor ke shadcn Form
│   ├── UserDashboard.jsx            ← Konsistenkan stats cards
│   ├── UserSettingsPage.jsx         ← Refactor ke Tabs + shadcn Form
│   ├── CreateTicketPage.jsx         ← Refactor ke shadcn Form
│   ├── ChatDetailPage.jsx           ← ScrollArea + UI chat
│   ├── admin/
│   │   ├── AdminDashboard.jsx       ← Chart migration + stats cards
│   │   ├── AllTicketsPage.jsx       ← Search bar + AlertDialog
│   │   ├── AdminTicketDetailPage.jsx← AlertDialog
│   │   ├── ManageUsersPage.jsx      ← Search bar + AlertDialog
│   │   ├── ManageTechniciansPage.jsx← Search bar + AlertDialog
│   │   ├── ActivityLogsPage.jsx     ← Badge + search bar
│   │   ├── TicketHistoryPage.jsx    ← AlertDialog
│   │   └── SystemSettingsPage.jsx   ← Card layout
│   └── technician/
│       ├── TechnicianDashboard.jsx  ← Chart migration + stats cards
│       ├── TechnicianChatsPage.jsx  ← ScrollArea + UI chat
│       └── TechnicianSettingsPage.jsx← Tabs + shadcn Form
└── styles/
    └── theme.css                    ← Jangan diubah, sudah benar
```

---

## ✅ CHECKLIST HASIL AKHIR

- [ ] Tidak ada file layout lama (`MainLayout`, `Sidebar`, `Header` di `components/`) 
- [ ] `App.jsx` import `MainLayout` dari `components/layout`
- [ ] `index.css` bersih, tidak ada duplikasi CSS variables
- [ ] i18n language switcher di header berfungsi tanpa reload
- [ ] Semua `window.confirm` diganti `AlertDialog`
- [ ] Semua chart menggunakan `ChartContainer` + `ChartTooltip`
- [ ] Stats cards konsisten di semua dashboard
- [ ] Semua form menggunakan shadcn `Form` primitives
- [ ] Chat UI menggunakan `ScrollArea`
- [ ] Semua tabel punya search bar
- [ ] Dark mode berfungsi konsisten di semua halaman
- [ ] Tidak ada perubahan pada `api.js`, `socket.js`, `AuthContext.jsx`
- [ ] Tidak ada perubahan pada logic fetching data di semua halaman
- [ ] Semua fitur tetap berfungsi setelah refactor

---

## ⚠️ CATATAN PENTING

1. `@tanstack/react-table` sudah terinstall — bisa digunakan untuk tabel yang lebih powerful jika diperlukan
2. `react-hook-form` + `@hookform/resolvers` + `zod` sudah terinstall — gunakan untuk semua form
3. Semua shadcn components sudah ada di `src/components/ui/` — tidak perlu install baru
4. Gunakan `cn()` dari `@/lib/utils.js` untuk semua conditional className
5. Icon: gunakan `lucide-react` yang sudah terinstall
6. **Kerjakan Langkah 1 dulu** sebelum yang lain — ini yang paling berisiko merusak routing

---

*Prompt ini dibuat berdasarkan analisis mendalam project Helpdesk Polda versi terbaru.*
*Migrasi API PocketBase → Express+MySQL sudah selesai 100%.*
*Template acuan: `ui.shadcn.com/create?preset=b5x0oi6GA` (Mira + Purple + Zinc)*

