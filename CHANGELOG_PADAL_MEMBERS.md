# CHANGELOG — PadalMembersPage

> Dikerjakan oleh: GitHub Copilot
> Tanggal: 2026-05-03

## File Baru
- `apps/web/src/pages/technician/PadalMembersPage.jsx`
  Halaman Padal untuk mengelola anggota Teknisi kelompoknya.
  Fitur: lihat anggota, tambah Teknisi (modal + dropdown filter), hapus anggota (AlertDialog konfirmasi).

## File Diubah
- `apps/web/src/App.jsx` — ditambahkan import dan route `/padal/members`
- `apps/web/src/components/layout/sidebar-data.js` — ditambahkan menu "Anggota Teknisi"

## Catatan
Backend endpoint sudah tersedia sebelumnya di `/api/padal-shifts/:padal_id/members`.