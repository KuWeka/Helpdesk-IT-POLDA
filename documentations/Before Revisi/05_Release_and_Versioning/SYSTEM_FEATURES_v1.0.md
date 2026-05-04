# HelpDesk ProjectPolda - Fitur dan Sistem Saat Ini (v1.0)

Tanggal dibuat: 2026-05-04

Tanggal Dokumen: 2026-04-18
Versi Dokumen: V2 Professional
Sumber Asli: UPDATE_V1.0/SYSTEM_FEATURES_v1.0.md

## Tujuan Dokumen

Versi Dokumen: 1.0 Tanggal Baseline: 2026-04-18

## Ringkasan Eksekutif

- Dokumen ini telah dinormalisasi agar mudah dipindai oleh tim teknis dan non-teknis.
- Struktur isi disusun ulang menjadi tujuan, ringkasan, daftar bahasan, konten inti, dan checklist verifikasi.
- Bagian teknis asli dipertahankan agar jejak keputusan dan implementasi tetap dapat diaudit.

## Peta Isi

1. 1. Gambaran Sistem
2. 2. Role dan Hak Akses
3. Admin
4. Teknisi
5. User
6. 3. Fitur Tiket
7. 4. Fitur Chat
8. 5. Fitur Dashboard

## Konten Inti (Disusun Ulang)

Versi Dokumen: 1.0
Tanggal Baseline: 2026-04-18

## 1. Gambaran Sistem
Aplikasi HelpDesk internal untuk pelaporan kendala, penanganan tiket, dan komunikasi realtime antara User dan Teknisi, dengan kontrol operasional oleh Admin.

Arsitektur utama:
- Frontend: React + Vite + Tailwind + komponen UI berbasis shadcn/Radix.
- Backend: Node.js + Express.
- Database: MySQL.
- Realtime: Socket.IO.
- Cache (opsional): Redis.

## 2. Role dan Hak Akses

### Admin
- Melihat seluruh tiket.
- Melihat detail tiket dan assign teknisi.
- Paksa selesai/hapus tiket.
- Kelola user.
- Kelola teknisi (promote/downgrade).
- Monitoring chat dan log aktivitas.
- Akses dashboard admin dan pengaturan sistem.

### Teknisi
- Melihat dashboard teknisi.
- Melihat antrian tiket pending (unassigned).
- Mengambil tiket, memproses status tiket, menambah catatan internal.
- Akses daftar chat dan percakapan user terkait tiket.
- Mengatur preferensi teknisi.

### User
- Membuat tiket.
- Melihat tiket milik sendiri.
- Melihat detail tiket beserta status/progres.
- Membuat chat dengan teknisi terkait tiket.
- Mengatur profil/preferensi.

## 3. Fitur Tiket
- Create ticket dengan field utama: judul, deskripsi, lokasi, urgensi.
- Status tiket domain: Pending, Proses, Selesai, Dibatalkan, Ditolak.
- Filter/list tiket berdasarkan role.
- Detail tiket per role.
- Catatan internal teknisi.
- Assign teknisi oleh admin.
- Dukungan upload lampiran tiket (multipart) dan listing lampiran pada detail tiket.

## 4. Fitur Chat
- Pembuatan chat terkait tiket.
- Daftar chat per role (user/teknisi/admin).
- Detail chat realtime via Socket.IO.
- Kirim/terima pesan teks.
- Status chat Open/Closed.
- Read receipt (centang 2):
  - Abu-abu: terkirim belum dibaca.
  - Biru: sudah dibaca.
- Layout chat user dan teknisi model dua panel (inbox + percakapan aktif).

## 5. Fitur Dashboard

### Dashboard Admin
- Ringkasan statistik tiket.
- Panel status tiket dan distribusi data.

### Dashboard Teknisi
- Ringkasan pending, tiket proses milik teknisi, selesai harian, total bulanan.
- Snapshot antrian tiket.

### Dashboard User
- Ringkasan tiket pribadi.
- Akses cepat ke tiket dan chat.

## 6. Pengaturan dan Preferensi
- Profil user/teknisi.
- Bahasa antarmuka.
- Tema (light/dark) dengan persistence (`app_theme`) sehingga tidak reset saat reload/navigation.
- Pengaturan teknisi (status aktif, shift, spesialisasi, batas tiket aktif, notifikasi).

## 7. API dan Keamanan
- REST API berbasis Express.
- JWT auth.
- CSRF protection untuk method state-changing.
- Validasi request/query berbasis Joi.
- CORS terkonfigurasi.
- Middleware error handling terpusat.

## 8. Operasional dan Observabilitas
- Logging aplikasi dan error.
- Endpoint health check.
- Konfigurasi monitoring tersedia di backend (prometheus/grafana/loki configs).
- Dokumen runbook incident/operasional tersedia.

## 9. Storage dan File
- Upload lampiran tiket ke direktori upload backend.
- Metadata file disimpan ke tabel `ticket_attachments`.
- File dapat diakses via endpoint static `/uploads/...` dari backend.

## 10. Struktur Data Inti (Ringkas)
Entitas utama:
- users
- divisions
- tickets
- ticket_attachments
- ticket_notes
- chats
- messages
- technician_settings
- system_settings
- activity_logs

## 11. Batasan dan Catatan
- Redis bersifat opsional (aplikasi masih bisa jalan tanpa Redis, dengan degradasi fitur cache).
- Endpoint yang berubah kontrak harus diikuti sinkronisasi frontend secara disiplin.

## 12. Penetapan Versi
Dokumen ini menetapkan baseline fitur sistem saat ini sebagai:

Versi Sistem: 1.0

## Checklist Review

- [ ] Istilah teknis sudah konsisten antar dokumen
- [ ] Referensi script/path masih valid terhadap struktur repo terbaru
- [ ] Action item lanjutan sudah memiliki owner atau milestone
- [ ] Dokumen siap dipakai untuk onboarding dan audit teknis
