# TASK: Tambahkan 2 Item Menu yang Kurang di Sidebar

Tanggal dibuat: 2026-05-04

## File yang Diubah
Hanya **1 file**: `apps/web/src/components/layout/sidebar-data.js`

Tidak ada file lain yang perlu diubah.

---

## Perubahan 1 — Tambahkan "Antrian Permohonan" di Sidebar Padal

Temukan `technicianSidebarData` yang saat ini terlihat seperti ini:

```js
export const technicianSidebarData = {
  navGroups: [
    {
      title: 'Menu Padal',
      items: [
        { title: 'Dashboard', url: '/padal/dashboard', icon: LayoutDashboard },
        { title: 'Tiket Saya', url: '/padal/tickets', icon: Ticket },
        { title: 'Semua Tiket', url: '/padal/all-tickets', icon: ListOrdered },
        { title: 'Laporan Bulanan', url: '/padal/reports', icon: BarChart2 },
        { title: 'Anggota Teknisi', url: '/padal/members', icon: Users },
        { title: 'Notifikasi', url: '/padal/notifications', icon: Bell },
      ],
    },
  ],
};
```

Tambahkan item **"Antrian Permohonan"** sebagai item **kedua** (setelah Dashboard, sebelum Tiket Saya):

```js
export const technicianSidebarData = {
  navGroups: [
    {
      title: 'Menu Padal',
      items: [
        { title: 'Dashboard', url: '/padal/dashboard', icon: LayoutDashboard },
        { title: 'Antrian Permohonan', url: '/padal/queue', icon: ListOrdered },
        { title: 'Tiket Saya', url: '/padal/tickets', icon: Ticket },
        { title: 'Semua Tiket', url: '/padal/all-tickets', icon: ListOrdered },
        { title: 'Laporan Bulanan', url: '/padal/reports', icon: BarChart2 },
        { title: 'Anggota Teknisi', url: '/padal/members', icon: Users },
        { title: 'Notifikasi', url: '/padal/notifications', icon: Bell },
      ],
    },
  ],
};
```

---

## Perubahan 2 — Tambahkan "Laporan Bulanan" di Sidebar Teknisi

Temukan `teknisiSidebarData` yang saat ini terlihat seperti ini:

```js
export const teknisiSidebarData = {
  navGroups: [
    {
      title: 'Menu Teknisi',
      items: [
        { title: 'Dashboard', url: '/teknisi/dashboard', icon: LayoutDashboard },
        { title: 'Semua Permohonan', url: '/teknisi/tickets', icon: Ticket },
        { title: 'Notifikasi', url: '/teknisi/notifications', icon: Bell },
      ],
    },
  ],
};
```

Tambahkan item **"Laporan Bulanan"** setelah "Semua Permohonan" dan sebelum "Notifikasi":

```js
export const teknisiSidebarData = {
  navGroups: [
    {
      title: 'Menu Teknisi',
      items: [
        { title: 'Dashboard', url: '/teknisi/dashboard', icon: LayoutDashboard },
        { title: 'Semua Permohonan', url: '/teknisi/tickets', icon: Ticket },
        { title: 'Laporan Bulanan', url: '/teknisi/reports', icon: BarChart2 },
        { title: 'Notifikasi', url: '/teknisi/notifications', icon: Bell },
      ],
    },
  ],
};
```

---

## Verifikasi

Semua icon yang dipakai (`ListOrdered`, `BarChart2`) sudah diimport di file ini — tidak perlu tambah import apapun.

Setelah selesai, konfirmasi bahwa tidak ada file lain yang diubah.
