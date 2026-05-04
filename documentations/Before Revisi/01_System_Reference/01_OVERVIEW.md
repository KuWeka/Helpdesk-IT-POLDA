Tanggal: 2026-04-19


## Identitas Proyek

| Atribut         | Nilai                        |
|-----------------|------------------------------|
| Nama Sistem     | IT Helpdesk (ProjectPolda)   |
| Versi           | 1.0.0                        |
| Tipe Aplikasi   | Web Application (SPA + REST API) |
| Bahasa Utama    | JavaScript / Node.js / React |
| Database        | MySQL 8+                     |
| Struktur        | Monorepo (apps/web + backend) |

---

## Deskripsi Singkat

IT Helpdesk adalah sistem manajemen tiket gangguan TI berbasis web yang dirancang untuk mengelola permintaan bantuan teknis dari pengguna (staf/karyawan) kepada tim teknisi IT. Sistem ini memungkinkan:

- **Pengguna (User)** melaporkan gangguan IT melalui tiket
- **Teknisi (Teknisi)** menerima, mengelola, dan menyelesaikan tiket tersebut
- **Administrator (Admin)** memantau seluruh operasional, mengelola akun, dan mengkonfigurasi sistem

---

## Tujuan Sistem

1. Menyediakan saluran pelaporan gangguan IT yang terstruktur dan terdokumentasi
2. Mempercepat respons tim IT terhadap masalah teknis pengguna
3. Memberikan visibilitas penuh kepada admin terkait performa tim dan status tiket
4. Menyediakan komunikasi real-time antara pengguna dan teknisi via chat
5. Menciptakan audit trail lengkap untuk setiap aktivitas sistem

---

## Konsep Utama

### Tiket (Ticket)
Unit kerja utama dalam sistem. Setiap laporan gangguan IT direpresentasikan sebagai tiket dengan siklus hidup: `Pending → Proses → Selesai` (atau `Ditolak / Dibatalkan`).

### Peran (Role)
Sistem mengenal 3 peran: **Admin**, **Teknisi**, dan **User**. Setiap peran memiliki akses, menu, dan kapabilitas yang berbeda.

### Chat Real-time
Komunikasi antara User dan Teknisi berlangsung melalui fitur chat berbasis WebSocket (Socket.IO), terhubung langsung ke tiket terkait.

### Dashboard Per-Role
Setiap peran memiliki dashboard terpisah dengan statistik dan data yang relevan untuk pekerjaannya.

### Caching & Performa
Dashboard data di-cache menggunakan Redis untuk mengurangi beban database dan mempercepat respons.

---

## Struktur Monorepo

```
projectpolda/
├── apps/
│   └── web/                    # Frontend React SPA
│       ├── src/
│       │   ├── pages/          # Halaman per role
│       │   ├── components/     # Komponen reusable + shadcn/ui
│       │   ├── contexts/       # React Context (Auth, dll)
│       │   ├── hooks/          # Custom React hooks
│       │   ├── i18n/           # Internasionalisasi (ID/EN)
│       │   ├── lib/            # Utility helpers
│       │   └── styles/         # CSS variables / theme
│       └── public/
├── backend/                    # Backend Express.js REST API
│   ├── src/
│   │   ├── routes/             # Route handler per resource
│   │   ├── middleware/         # Auth, CSRF, validation, dll
│   │   ├── services/           # Business logic layer
│   │   ├── socket/             # Socket.IO event handler
│   │   ├── utils/              # Cache, logger, metrics, dll
│   │   └── config/             # Database & environment config
│   ├── sql/                    # Schema & migrations SQL
│   ├── scripts/                # Operational scripts
│   └── tests/                  # Unit & integration tests
├── documentations/             # Dokumen proyek
└── package.json                # Root workspace config
```

---

## Ringkasan Fitur Inti

| Fitur                     | Deskripsi                                               |
|---------------------------|---------------------------------------------------------|
| Autentikasi JWT            | Login/logout aman dengan access token + refresh token  |
| Manajemen Tiket           | CRUD tiket dengan status, urgensi, lampiran             |
| Real-time Chat            | Komunikasi langsung User ↔ Teknisi via WebSocket        |
| Dashboard Statistik       | Ringkasan data per role dengan grafik                   |
| Manajemen Pengguna        | Admin dapat CRUD user dan teknisi                       |
| Activity Log              | Pencatatan semua aksi admin untuk audit                 |
| Sistem Notifikasi         | Toast notifikasi & opsi WhatsApp untuk teknisi          |
| Pengaturan Sistem         | Admin konfigurasi nama app, mode maintenance            |
| Pengaturan Profil         | Semua role dapat update profil, password, tema, bahasa  |
| Internasionalisasi        | Dukungan Bahasa Indonesia & Inggris (i18n)              |
| Upload Lampiran           | Pengguna dapat melampirkan file pada tiket              |
| Monitoring Prometheus     | Metrics HTTP, cache hit/miss, response time             |
| CSRF Protection           | Double-submit cookie pattern untuk keamanan             |
| Rate Limiting             | Pembatasan percobaan login dan registrasi               |

