<div align="center">

# 📚 Dokumentasi — Helpdesk IT POLDA Kalsel

**Pusat Referensi Teknis, Histori Perubahan, dan Panduan Sistem**

---

![Docs](https://img.shields.io/badge/Dokumentasi-Teknis-0078D4?style=for-the-badge&logo=readthedocs&logoColor=white)
![Status](https://img.shields.io/badge/Status-Up%20to%20Date-brightgreen?style=for-the-badge)
![Sesi](https://img.shields.io/badge/Revisi-11%20Sesi-orange?style=for-the-badge)

</div>

---

## 📋 Daftar Isi

- [Tentang Folder Ini](#-tentang-folder-ini)
- [Struktur Folder](#-struktur-folder)
- [Panduan Baca untuk Developer Baru](#-panduan-baca-untuk-developer-baru)
- [Referensi Sistem](#-referensi-sistem)
- [Histori Revisi (Sesi per Sesi)](#-histori-revisi-sesi-per-sesi)
- [Bug Report & Remediation](#-bug-report--remediation)
- [Status Implementasi Saat Ini](#-status-implementasi-saat-ini)
- [Aturan Sinkronisasi Dokumen](#-aturan-sinkronisasi-dokumen)

---

## 📖 Tentang Folder Ini

Folder `documentations/` adalah repositori pengetahuan teknis project **Helpdesk IT POLDA Kalsel**. Berisi:

- **Referensi sistem** — alur pemakaian, menu, dan fitur per role
- **Histori revisi** — catatan implementasi dari setiap sesi pengerjaan
- **Bug report & remediation** — analisis masalah dan bukti perbaikan
- **Arsip historis** — kondisi sistem sebelum rangkaian revisi berjalan
- **Prompt kerja** — brief dan instruksi yang digunakan selama siklus pengembangan

> **Catatan Penting**: Folder `After Revisi/` adalah referensi utama kondisi implementasi paling baru. Mulailah dari sini untuk memahami state sistem saat ini.

---

## 🗂️ Struktur Folder

```
documentations/
│
├── 01_System_Reference/          # Referensi sistem inti
│   ├── ALUR_PEMAKAIAN.md         # Alur penggunaan per role (Satker, Subtekinfo, Padal, Teknisi)
│   └── MENU_DAN_FITUR.md         # Daftar lengkap menu, fitur, tombol, dan interaksi per role
│
├── 07_Remediation_Program/       # Analisis & perbaikan
│   └── ProjectPolda_BugReport_dan_Saran.md   # Laporan bug, analisis akar masalah, saran perbaikan
│
├── After Revisi/                 # Changelog implementasi per sesi (TERBARU)
│   ├── SESI_1_Migrasi_Database.md
│   ├── SESI_2_Restrukturisasi_Role_Backend.md
│   ├── SESI_3_Hapus_Fitur_Urgensi.md
│   ├── SESI_4_Hapus_Chat_Internal.md
│   ├── SESI_5_Assign_Padal_SocketIO.md
│   ├── SESI_6_Penolakan_Tiket.md
│   ├── SESI_7_Rating_Wajib_Satker.md
│   ├── SESI_8_Manajemen_Shift_Padal.md
│   ├── SESI_9_Laporan_Bulanan.md
│   ├── SESI_10_Restrukturisasi_Frontend_Navigasi.md
│   ├── SESI_11_Commit_Push_dan_SmokeTest/
│   │   └── LAPORAN_PELAKSANAAN.md
│   ├── CHANGELOG_BUGFIX.md       # Ringkasan semua bug yang sudah diperbaiki
│   ├── CHANGELOG_PADAL_MEMBERS.md
│   └── BELUM_DIIMPLEMENTASIKAN.md  # Fitur/saran yang belum dikerjakan
│
├── Before Revisi/                # Arsip kondisi sebelum revisi (historis)
│
├── Promt/                        # Brief & prompt kerja pengembangan
│
└── README.md                     # Dokumen ini
```

---

## 🚀 Panduan Baca untuk Developer Baru

Ikuti urutan berikut untuk membangun konteks secara efisien:

### Tahap 1 — Pahami Sistem (Baca Pertama)

| # | Dokumen | Tujuan |
|---|---------|--------|
| 1 | [01_System_Reference/ALUR_PEMAKAIAN.md](01_System_Reference/ALUR_PEMAKAIAN.md) | Pahami alur kerja sistem dari sudut pandang setiap role |
| 2 | [01_System_Reference/MENU_DAN_FITUR.md](01_System_Reference/MENU_DAN_FITUR.md) | Daftar lengkap semua menu, fitur, tombol, dan interaksi di UI |

### Tahap 2 — Pahami Kondisi Terkini

| # | Dokumen | Tujuan |
|---|---------|--------|
| 3 | [After Revisi/CHANGELOG_BUGFIX.md](After%20Revisi/CHANGELOG_BUGFIX.md) | Lihat semua bug yang sudah diperbaiki |
| 4 | [After Revisi/SESI_10_Restrukturisasi_Frontend_Navigasi.md](After%20Revisi/SESI_10_Restrukturisasi_Frontend_Navigasi.md) | Perubahan terbesar sebelum sesi terakhir |
| 5 | [After Revisi/SESI_11_Commit_Push_dan_SmokeTest/LAPORAN_PELAKSANAAN.md](After%20Revisi/SESI_11_Commit_Push_dan_SmokeTest/LAPORAN_PELAKSANAAN.md) | Laporan sesi revisi terbaru |

### Tahap 3 — Konteks Masalah & Perbaikan

| # | Dokumen | Tujuan |
|---|---------|--------|
| 6 | [07_Remediation_Program/ProjectPolda_BugReport_dan_Saran.md](07_Remediation_Program/ProjectPolda_BugReport_dan_Saran.md) | Analisis mendalam bug, akar masalah, dan saran perbaikan |
| 7 | [After Revisi/BELUM_DIIMPLEMENTASIKAN.md](After%20Revisi/BELUM_DIIMPLEMENTASIKAN.md) | Fitur/saran yang belum dikerjakan — kandidat sprint berikutnya |

### Tahap 4 — Perbandingan Historis (Jika Diperlukan)

| # | Dokumen | Tujuan |
|---|---------|--------|
| 8 | `Before Revisi/` | Kondisi sistem sebelum rangkaian revisi — hanya untuk referensi historis |

---

## 📖 Referensi Sistem

### Alur Pemakaian Per Role

Dokumen: [`01_System_Reference/ALUR_PEMAKAIAN.md`](01_System_Reference/ALUR_PEMAKAIAN.md)

Menjelaskan alur lengkap penggunaan sistem dari perspektif masing-masing role:

#### 👤 Satker (Pelapor)
1. Login → sistem cek tiket `Selesai` yang belum dirating
2. Jika ada tanggungan rating → diarahkan paksa ke halaman Rating (tidak bisa buat tiket baru)
3. Buat permohonan: isi judul, deskripsi, lokasi, kategori, dan lampiran
4. Pantau status tiket di "Permohonan Saya"
5. Terima notifikasi realtime saat status berubah
6. Beri rating 1–5 saat tiket selesai

#### 🛡️ Subtekinfo (Admin)
1. Terima notifikasi tiket baru masuk
2. Review dan assign ke Padal yang tersedia (shift aktif tampil di atas)
3. Kelola user: tambah/edit/hapus Padal, Teknisi, Satker
4. Atur shift aktif tiap Padal
5. Kelola anggota Padal–Teknisi (tambah/hapus anggota)
6. Unduh laporan bulanan (Excel/PDF)

#### 🧑‍💼 Padal (Koordinator Lapangan)
1. Terima notifikasi saat di-assign tiket
2. Pilih **Terima** → status tiket jadi `Proses`
3. Atau **Tolak** (dengan alasan) → tiket kembali ke `Pending`, Subtekinfo assign ulang
4. Setelah pekerjaan selesai → update ke `Selesai`
5. Koordinasi dengan Teknisi dilakukan di luar sistem

#### 🔧 Teknisi (Lapangan — Read-Only)
1. Lihat tiket yang relevan dengan kelompoknya
2. Pantau status pekerjaan
3. Tidak dapat mengubah status tiket

---

### Menu & Fitur Per Role

Dokumen: [`01_System_Reference/MENU_DAN_FITUR.md`](01_System_Reference/MENU_DAN_FITUR.md)

Menjelaskan setiap halaman, komponen, tombol, dan interaksi tersedia per role di UI frontend.

| Role | Halaman Utama |
|------|---------------|
| Satker | Dashboard, Buat Permohonan, Permohonan Saya, Rating, Notifikasi, Pengaturan |
| Subtekinfo | Dashboard, Semua Tiket, Kelola Padal, Kelola Teknisi, Laporan, Pengaturan |
| Padal | Dashboard, Tiket Saya, Shift Saya, Laporan, Pengaturan |
| Teknisi | Dashboard, Tiket Terkait, Pengaturan |

---

## 📝 Histori Revisi (Sesi per Sesi)

Setiap sesi revisi didokumentasikan di folder [`After Revisi/`](After%20Revisi/).

| Sesi | File | Topik | Lingkup |
|------|------|-------|---------|
| **SESI 1** | [SESI_1_Migrasi_Database.md](After%20Revisi/SESI_1_Migrasi_Database.md) | Migrasi Database | DB, SQL schema |
| **SESI 2** | [SESI_2_Restrukturisasi_Role_Backend.md](After%20Revisi/SESI_2_Restrukturisasi_Role_Backend.md) | Restrukturisasi Role Backend | Backend, RBAC |
| **SESI 3** | [SESI_3_Hapus_Fitur_Urgensi.md](After%20Revisi/SESI_3_Hapus_Fitur_Urgensi.md) | Hapus Fitur Urgensi | Refactor, backend, frontend |
| **SESI 4** | [SESI_4_Hapus_Chat_Internal.md](After%20Revisi/SESI_4_Hapus_Chat_Internal.md) | Hapus Chat Internal | Frontend, socket |
| **SESI 5** | [SESI_5_Assign_Padal_SocketIO.md](After%20Revisi/SESI_5_Assign_Padal_SocketIO.md) | Assign Padal + Socket.IO | Backend, frontend, realtime |
| **SESI 6** | [SESI_6_Penolakan_Tiket.md](After%20Revisi/SESI_6_Penolakan_Tiket.md) | Penolakan Tiket | Backend, frontend |
| **SESI 7** | [SESI_7_Rating_Wajib_Satker.md](After%20Revisi/SESI_7_Rating_Wajib_Satker.md) | Rating Wajib Satker | Backend, frontend, UX |
| **SESI 8** | [SESI_8_Manajemen_Shift_Padal.md](After%20Revisi/SESI_8_Manajemen_Shift_Padal.md) | Manajemen Shift Padal | Backend, frontend |
| **SESI 9** | [SESI_9_Laporan_Bulanan.md](After%20Revisi/SESI_9_Laporan_Bulanan.md) | Laporan Bulanan | Backend, export Excel/PDF |
| **SESI 10** | [SESI_10_Restrukturisasi_Frontend_Navigasi.md](After%20Revisi/SESI_10_Restrukturisasi_Frontend_Navigasi.md) | Restrukturisasi Frontend & Navigasi | Frontend, routing, layout |
| **SESI 11** | [SESI_11_Commit_Push_dan_SmokeTest/](After%20Revisi/SESI_11_Commit_Push_dan_SmokeTest/) | Commit, Push, Smoke Test & Dokumentasi | Full stack, CI, docs |

### Changelog Lintas Sesi

| File | Isi |
|------|-----|
| [CHANGELOG_BUGFIX.md](After%20Revisi/CHANGELOG_BUGFIX.md) | Semua bug (BUG-01 s.d. BUG-09) + saran yang sudah diimplementasikan (SARAN-01 s.d. SARAN-05) |
| [CHANGELOG_PADAL_MEMBERS.md](After%20Revisi/CHANGELOG_PADAL_MEMBERS.md) | Perubahan terkait manajemen anggota Padal-Teknisi |
| [BELUM_DIIMPLEMENTASIKAN.md](After%20Revisi/BELUM_DIIMPLEMENTASIKAN.md) | Daftar fitur/saran yang belum dikerjakan |

---

## 🐛 Bug Report & Remediation

Dokumen: [`07_Remediation_Program/ProjectPolda_BugReport_dan_Saran.md`](07_Remediation_Program/ProjectPolda_BugReport_dan_Saran.md)

Analisis dilakukan pada **3 Mei 2026** terhadap seluruh source code frontend dan backend.

### Bug yang Ditemukan & Diperbaiki

| ID | Tingkat | File | Masalah | Status |
|----|:-------:|------|---------|:------:|
| BUG-01 | 🔴 Kritis | `routes/dashboard.js` | Middleware `role('Admin')` — role sudah ganti jadi `Subtekinfo`, semua request dashboard 403 | ✅ |
| BUG-02 | 🔴 Kritis | `routes/technicians.js` | `LEFT JOIN divisions` ke tabel yang sudah di-drop → crash 500 | ✅ |
| BUG-03 | 🟠 Tinggi | `routes/auth.js` | Role truncation saat register — fungsi `normalizeRole` tidak menangani semua varian | ✅ |
| BUG-04 | 🟠 Tinggi | `CreateTicketPage.jsx` | Memanggil API `/divisions/:id` yang sudah dihapus | ✅ |
| BUG-05 | 🟠 Tinggi | `AdminTicketDetailPage.jsx` | Role check `role === 'Admin'` → harusnya `=== 'Subtekinfo'` | ✅ |
| BUG-06 | 🟡 Sedang | `utils/cache.js` | `client.del(key)` signature salah → cache clear error | ✅ |
| BUG-07 | 🟡 Sedang | `routes/reports.js` | Filter laporan pakai `updated_at` → harusnya `created_at` | ✅ |
| BUG-08 | 🟡 Sedang | `routes/tickets.js` | Teknisi bisa akses rating endpoints | ✅ |
| BUG-09 | 🟡 Sedang | `UserDashboard.jsx` | Referensi `division_id` yang sudah dihapus dari schema | ✅ |

### Saran yang Diimplementasikan

| ID | Fitur | Deskripsi | Status |
|----|-------|-----------|:------:|
| SARAN-01 | Assignment Timeout Cron | Auto-expire assignment Padal yang tidak merespons dalam batas waktu (node-cron) | ✅ |
| SARAN-02 | Rating Rata-rata Padal | Tampilkan avg rating + statistik tiket per Padal di panel Subtekinfo | ✅ |
| SARAN-03 | Badge Status Shift | Badge warna aktif/nonaktif lebih eksplisit di modal Assign Padal | ✅ |
| SARAN-04 | Indikator Export | Loading toast + disable tombol saat export Excel/PDF berlangsung | ✅ |
| SARAN-05 | Matriks Pembatalan | Backend: aturan cancel per role; Frontend: tombol edit/cancel hanya muncul sesuai kondisi | ✅ |

---

## 📊 Status Implementasi Saat Ini

Kondisi per **Sesi 11 (4 Mei 2026)**:

### Backend

| Komponen | Status | Catatan |
|----------|:------:|---------|
| Express API server | ✅ Aktif | Port 3001 |
| JWT Auth + Refresh Token | ✅ Aktif | httpOnly cookie |
| RBAC middleware | ✅ Aktif | 4 role: Satker, Padal, Teknisi, Subtekinfo |
| CSRF protection | ✅ Aktif | Token validasi per request |
| Rate limiting | ✅ Aktif | express-rate-limit |
| Helmet security headers | ✅ Aktif | |
| MySQL connection pool | ✅ Aktif | Parameterized queries |
| Redis cache | ✅ Aktif | TTL 5 menit, fallback ke DB |
| Socket.IO realtime | ✅ Aktif | Events: ticket:update, assignment:new, assignment:timeout |
| Assignment timeout cron | ✅ Aktif | node-cron, interval 5 menit |
| Export Excel | ✅ Aktif | exceljs |
| Export PDF | ✅ Aktif | pdfkit |
| Swagger UI | ✅ Aktif | `/api/docs` |
| Prometheus metrics | ✅ Aktif | `/api/health/metrics` |

### Frontend

| Komponen | Status | Catatan |
|----------|:------:|---------|
| React 18 + Vite | ✅ Aktif | Port 3000 |
| React Router v7 | ✅ Aktif | Route per role |
| shadcn/ui + Tailwind | ✅ Aktif | |
| Socket.IO client | ✅ Aktif | Terhubung via AuthContext |
| i18n Bahasa Indonesia | ✅ Aktif | Default |
| i18n English | ✅ Aktif | Toggle di pengaturan |
| Dark mode | ✅ Aktif | light/dark/system |
| Dashboard Satker | ✅ Aktif | Statistik + banner rating |
| Dashboard Subtekinfo | ✅ Aktif | Semua tiket + assign |
| Dashboard Padal | ✅ Aktif | Tiket assigned + shift |
| Manajemen Padal/Teknisi | ✅ Aktif | Tab terpisah, avg rating |
| Laporan Bulanan | ✅ Aktif | Grafik + export |
| Rating Satker | ✅ Aktif | Wajib sebelum buat tiket baru |
| localStorage sensitif | ✅ Bersih | `helpdesk_user` dihapus (anti-XSS) |

### Fitur Belum Diimplementasikan

Lihat: [`After Revisi/BELUM_DIIMPLEMENTASIKAN.md`](After%20Revisi/BELUM_DIIMPLEMENTASIKAN.md)

---

## 🔄 Aturan Sinkronisasi Dokumen

Aturan yang harus diikuti saat melakukan perubahan pada sistem:

1. **Setiap perubahan fitur/backend/frontend** → update dokumen sesi terkait di `After Revisi/`
2. **Bug baru yang ditemukan** → tambahkan ke `07_Remediation_Program/ProjectPolda_BugReport_dan_Saran.md`
3. **Bug yang diperbaiki** → catat di `After Revisi/CHANGELOG_BUGFIX.md`
4. **Fitur yang baru direncanakan tapi belum dikerjakan** → tambahkan ke `BELUM_DIIMPLEMENTASIKAN.md`
5. **Perubahan alur atau menu di UI** → update `01_System_Reference/` yang relevan
6. **Jangan modifikasi folder `Before Revisi/`** — itu arsip historis read-only

---

<div align="center">

**Dokumentasi Helpdesk IT POLDA Kalsel**

*Diperbarui terakhir: Sesi 11 — 4 Mei 2026*

[← Kembali ke Root README](../README.md)

</div>
