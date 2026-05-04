# Update Sesi Pengembangan - 2026-04-18

Tanggal Dokumen: 2026-04-18
Versi Dokumen: V2 Professional
Sumber Asli: UPDATE_V1.0/UPDATE_SESSION_2026-04-18.md

## Tujuan Dokumen

Versi rilis dokumen: 1.0 Scope: Frontend (React/Vite), Backend (Express/MySQL), API contracts, UX stabilisasi lintas role

## Ringkasan Eksekutif

- Dokumen ini telah dinormalisasi agar mudah dipindai oleh tim teknis dan non-teknis.
- Struktur isi disusun ulang menjadi tujuan, ringkasan, daftar bahasan, konten inti, dan checklist verifikasi.
- Bagian teknis asli dipertahankan agar jejak keputusan dan implementasi tetap dapat diaudit.

## Peta Isi

1. Ringkasan
2. Perubahan Utama yang Dilakukan
3. 1) Validasi dan Kontrak API Tiket
4. 2) QueryBuilder dan Error Runtime
5. 3) Dashboard Teknisi
6. 4) Manajemen Teknisi (Admin)
7. 5) Alur Chat User/Teknisi
8. 6) Read Receipt (Centang 2)

## Konten Inti (Disusun Ulang)

Versi rilis dokumen: 1.0
Tanggal: 2026-04-18
Scope: Frontend (React/Vite), Backend (Express/MySQL), API contracts, UX stabilisasi lintas role

## Ringkasan
Sesi ini berfokus pada stabilisasi end-to-end aplikasi HelpDesk lintas role (Admin, User, Teknisi), sinkronisasi kontrak API frontend-backend, perbaikan validasi/query yang memicu error runtime, penyempurnaan alur chat realtime, persistence tema, serta perbaikan upload dan akses lampiran tiket.

## Perubahan Utama yang Dilakukan

### 1) Validasi dan Kontrak API Tiket
- Menyelaraskan validasi status/urgensi agar kompatibel dengan nilai domain yang digunakan aplikasi.
- Menambah dukungan parameter antrian `unassigned` pada query tiket.
- Memperbaiki alur antrian teknisi (pending unassigned).

Dampak:
- Halaman antrian teknisi dapat memuat tiket pending yang belum di-assign.

### 2) QueryBuilder dan Error Runtime
- Memperbaiki konflik method/property pada util query builder.
- Memperbaiki pembuatan count query dan mutasi parameter internal agar pagination stabil.

Dampak:
- Error `qb.orderBy is not a function` terselesaikan.
- Endpoint chat/messages/settings yang memakai helper query menjadi stabil.

### 3) Dashboard Teknisi
- Memperbaiki SQL field yang tidak ada pada `technician_settings`.

Dampak:
- Endpoint ringkasan dashboard teknisi kembali 200.

### 4) Manajemen Teknisi (Admin)
- Menyesuaikan flow tambah teknisi menjadi promosi user existing.
- Memperbaiki fetch kandidat user (parameter `perPage` valid dan extraction response robust).

Dampak:
- Dropdown user existing pada modal tambah teknisi terisi.

### 5) Alur Chat User/Teknisi
- Menormalkan parameter request chat/messages ke format API yang didukung.
- Menghapus request patch chat redundant setelah kirim pesan (menghindari false error toast).
- Meningkatkan kompatibilitas parsing response detail chat.

Dampak:
- Pesan sinkron dua arah lebih stabil.
- Notifikasi gagal kirim palsu berkurang/hilang.

### 6) Read Receipt (Centang 2)
- Menambahkan mekanisme read receipt:
  - Pesan incoming ditandai terbaca saat recipient fetch message list.
  - Emit event realtime `messages_read` melalui socket.
  - Frontend update status centang 2 realtime.
- Skema tampilan:
  - Centang 2 abu-abu = terkirim belum dibaca.
  - Centang 2 biru = sudah dibaca.

Dampak:
- Perilaku chat mendekati UX WhatsApp.

### 7) Layout Chat User
- Refactor halaman chat user menjadi layout dua panel seperti teknisi:
  - Panel kiri daftar percakapan (`Pesan Masuk`).
  - Panel kanan percakapan aktif + input.
- Responsive mobile dengan mode list/detail.

Dampak:
- Konsistensi UX antar role meningkat.

### 8) Persistence Tema
- Menambahkan persistence tema global (`app_theme`) + hydration saat app boot.
- Sinkronisasi preferensi tema dari settings ke state user dan local storage.

Dampak:
- Tema tidak kembali ke default saat refresh/pindah menu.

### 9) Pembuatan Tiket dengan Lampiran
- Memperbaiki endpoint upload lampiran dari endpoint non-eksis ke endpoint backend valid:
  - Dari: `/ticket-attachments`
  - Ke: `/uploads/ticket/:ticketId` (multipart/form-data)

Dampak:
- Submit tiket dengan lampiran tidak lagi gagal 404.

### 10) Lampiran di Detail Tiket Lintas Role
- Memperbaiki parsing response lampiran (`attachments`) pada detail tiket User dan Teknisi.
- Menambahkan section lampiran pada detail tiket Admin.
- Menstandarkan tautan unduh agar mengarah ke origin backend untuk file statis.

Dampak:
- Lampiran tampil lintas role dan dapat diunduh/dibuka dari sumber yang benar.

## Stabilitas dan Validasi
- Berulang kali dilakukan pengecekan error statis pada file yang diubah.
- Verifikasi endpoint utama dilakukan melalui script terminal terhadap role berbeda.

## Catatan Operasional
- Untuk perubahan backend/env besar, restart backend diperlukan.
- Untuk perubahan frontend/env, restart frontend + hard refresh browser disarankan.

## Status Akhir Sesi
- Mayoritas blocker lintas role yang dilaporkan pengguna sudah tertangani.
- Performa runtime lebih stabil pada jalur tiket, dashboard, dan chat.
- Dokumentasi sesi ini ditetapkan sebagai baseline update versi 1.0.

## Checklist Review

- [ ] Istilah teknis sudah konsisten antar dokumen
- [ ] Referensi script/path masih valid terhadap struktur repo terbaru
- [ ] Action item lanjutan sudah memiliki owner atau milestone
- [ ] Dokumen siap dipakai untuk onboarding dan audit teknis
