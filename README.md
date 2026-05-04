<div align="center">

# 🖥️ Helpdesk IT POLDA Kalsel

**Sistem Manajemen Tiket Layanan IT Internal**
*Bidang Teknologi Informasi — Kepolisian Daerah Kalimantan Selatan*

---

![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![MySQL](https://img.shields.io/badge/MySQL-8.0%2B-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-Cache-DC382D?style=for-the-badge&logo=redis&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-API-000000?style=for-the-badge&logo=express&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-Frontend-646CFF?style=for-the-badge&logo=vite&logoColor=white)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)
![Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen?style=flat-square)
![Version](https://img.shields.io/badge/Version-1.0.0-blue?style=flat-square)

</div>

---

## 📋 Daftar Isi

- [Tentang Project](#-tentang-project)
- [Fitur Utama](#-fitur-utama)
- [Role & Hak Akses](#-role--hak-akses)
- [Alur Tiket](#-alur-tiket)
- [Arsitektur Sistem](#-arsitektur-sistem)
- [Tech Stack](#-tech-stack)
- [Struktur Project](#-struktur-project)
- [Prasyarat](#-prasyarat)
- [Instalasi](#-instalasi)
- [Konfigurasi Environment](#-konfigurasi-environment)
- [Setup Database](#-setup-database)
- [Menjalankan Aplikasi](#-menjalankan-aplikasi)
- [Scripts & Perintah](#-scripts--perintah)
- [API Endpoints](#-api-endpoints)
- [Keamanan](#-keamanan)
- [Docker](#-docker)
- [Testing](#-testing)
- [Monitoring & Observability](#-monitoring--observability)
- [Dokumentasi Internal](#-dokumentasi-internal)
- [Kontribusi](#-kontribusi)

---

## 🏢 Tentang Project

**Helpdesk IT POLDA Kalsel** adalah sistem manajemen tiket layanan IT yang dibangun khusus untuk kebutuhan internal Bidang Teknologi Informasi Polda Kalimantan Selatan. Sistem ini menghubungkan pelapor tiket dari satuan kerja (Satker), koordinator lapangan (Padal), dan teknisi IT dalam satu platform yang terintegrasi.

### Latar Belakang

Sebelumnya, laporan kerusakan atau gangguan IT ditangani secara manual melalui pesan singkat dan catatan tidak terstruktur. Sistem ini hadir untuk:

- **Digitalisasi** proses pelaporan dan penanganan tiket IT
- **Transparansi** status penanganan yang dapat dipantau secara realtime
- **Akuntabilitas** dengan riwayat lengkap setiap tiket dan penilaian layanan
- **Efisiensi** melalui assignment otomatis dan notifikasi berbasis event

### Kemampuan Sistem

| Kemampuan | Keterangan |
|-----------|------------|
| Manajemen Tiket | Buat, assign, proses, selesai, tolak, batalkan tiket |
| Realtime Update | Notifikasi live via Socket.IO saat status tiket berubah |
| Auto-Timeout | Cron job otomatis expire assignment Padal yang tidak merespons |
| Dashboard & Laporan | Statistik, grafik, dan export laporan bulanan Excel/PDF |
| Manajemen User | CRUD user dengan role RBAC dari panel admin |
| Shift Teknisi | Pengaturan jadwal aktif/nonaktif Padal |
| Rating Layanan | Satker dapat memberi rating setelah tiket selesai |
| Bilingual UI | Antarmuka tersedia dalam Bahasa Indonesia dan English |
| Dark Mode | Dukungan tema terang, gelap, dan ikut sistem |

---

## ✨ Fitur Utama

### 🎫 Manajemen Tiket End-to-End

- Pembuatan tiket dengan judul, deskripsi, lokasi, kategori, dan tingkat urgensi
- Upload lampiran file pendukung
- Riwayat aktivitas tiket lengkap dengan timestamp
- Pembatalan tiket dengan aturan berbasis role (lihat [Alur Tiket](#-alur-tiket))

### 👥 Role-Based Access Control (RBAC)

- 4 role dengan hak akses berbeda: `Satker`, `Padal`, `Teknisi`, `Subtekinfo`
- Setiap endpoint API diproteksi middleware RBAC
- Tampilan UI disesuaikan otomatis per role

### ⚡ Realtime dengan Socket.IO

- Update status tiket secara instan tanpa refresh halaman
- Notifikasi assignment Padal dan perubahan status
- Event `assignment:timeout` dikirim saat timeout terjadi
- Room berbasis user untuk notifikasi tertarget

### ⏰ Assignment Timeout Otomatis

- Cron job berjalan setiap 5 menit (konfigurasi via `ASSIGNMENT_TIMEOUT_MINUTES`)
- Tiket yang di-assign ke Padal dan tidak ditindaklanjuti dalam batas waktu akan otomatis di-reset ke status `Pending`
- Catatan timeout tersimpan di log backend

### 📊 Dashboard & Laporan Bulanan

- Statistik tiket: total, pending, proses, selesai, ditolak, dibatalkan
- Grafik tren tiket per bulan (recharts)
- Export laporan ke **Excel** (exceljs) dan **PDF** (pdfkit)
- Indikator progress loading saat proses export berjalan

### ⚙️ Panel Admin (Subtekinfo)

- Manajemen user (tambah, edit, hapus, aktif/nonaktif)
- Manajemen Padal dan Teknisi dengan tab terpisah
- Lihat rating rata-rata dan statistik tiket per Padal
- Konfigurasi shift (jadwal aktif) Padal
- Pengaturan sistem global

---

## 👤 Role & Hak Akses

Sistem menggunakan 4 role dengan hierarki akses yang jelas:

### 🏛️ Satker (Satuan Kerja — Pelapor)

Pengguna dari satuan kerja yang melaporkan gangguan IT.

| Aksi | Diizinkan |
|------|-----------|
| Buat tiket baru | ✅ |
| Lihat tiket miliknya | ✅ |
| Upload lampiran | ✅ |
| Batalkan tiket (status `Pending`) | ✅ |
| Edit tiket (status `Pending`) | ✅ |
| Beri rating tiket `Selesai` | ✅ |
| Lihat tiket orang lain | ❌ |
| Assign tiket | ❌ |

### 🧑‍💼 Padal (Penanggung Jawab Lapangan — Koordinator)

Koordinator yang menerima dan mendistribusikan tiket ke teknisi.

| Aksi | Diizinkan |
|------|-----------|
| Lihat semua tiket yang di-assign kepadanya | ✅ |
| Terima / tolak assignment tiket | ✅ |
| Ubah status tiket ke `Proses` dan `Selesai` | ✅ |
| Tolak tiket (`Ditolak`) | ✅ |
| Lihat statistik tiket yang ditangani | ✅ |
| Kelola jadwal shift sendiri | ✅ |
| Batalkan tiket | ❌ |
| Buat tiket baru | ❌ |

### 🔧 Teknisi (Teknisi Lapangan — Read-Only)

Teknisi IT di lapangan. Akses read-only untuk memantau tiket terkait.

| Aksi | Diizinkan |
|------|-----------|
| Lihat tiket yang relevan | ✅ |
| Lihat detail tiket | ✅ |
| Update status tiket | ❌ |
| Assign tiket | ❌ |

### 🛡️ Subtekinfo (Administrator Sistem)

Administrator penuh sistem helpdesk.

| Aksi | Diizinkan |
|------|-----------|
| Lihat semua tiket dari semua user | ✅ |
| Batalkan tiket apapun | ✅ |
| Assign tiket ke Padal manapun | ✅ |
| CRUD user (semua role) | ✅ |
| Konfigurasi shift Padal | ✅ |
| Lihat laporan dan statistik global | ✅ |
| Pengaturan sistem | ✅ |

---

## 🔄 Alur Tiket

### Status Tiket

```
                    ┌─────────────────────┐
                    │        Satker        │
                    │   membuat tiket baru │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │       PENDING        │◄──────────────────┐
                    │  Menunggu assignment │                   │
                    └──────────┬──────────┘          Timeout! │
                               │                    (auto-reset│
              Subtekinfo/       │                    via cron) │
              Padal assign      │                              │
                               ▼                              │
                    ┌─────────────────────┐                   │
                    │       PROSES         │───────────────────┘
                    │  Sedang ditangani   │
                    └──────────┬──────────┘
                               │
               ┌───────────────┼───────────────┐
               │               │               │
               ▼               ▼               ▼
     ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
     │   SELESAI   │  │   DITOLAK   │  │ DIBATALKAN  │
     │ Tiket tuntas│  │  Tiket      │  │ Dibatalkan  │
     │ + Rating    │  │  ditolak    │  │ oleh Satker/│
     │ oleh Satker │  │  Padal      │  │ Subtekinfo  │
     └─────────────┘  └─────────────┘  └─────────────┘
```

### Matriks Pembatalan

| Role | Status `Pending` | Status `Proses` | Status lainnya |
|------|:---:|:---:|:---:|
| Satker (pemilik tiket) | ✅ | ❌ | ❌ |
| Padal | ❌ | ❌ | ❌ |
| Teknisi | ❌ | ❌ | ❌ |
| Subtekinfo | ✅ | ✅ | ❌ |

### Tingkat Urgensi

| Level | Deskripsi |
|-------|-----------|
| `Rendah` | Gangguan ringan, tidak mempengaruhi operasional utama |
| `Sedang` | Gangguan yang perlu ditangani dalam waktu normal |
| `Tinggi` | Gangguan serius yang mempengaruhi operasional |
| `Kritis` | Gangguan parah, butuh penanganan segera |

---

## 🏗️ Arsitektur Sistem

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT BROWSER                        │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              React 18 + Vite (Port 3000)             │   │
│  │                                                     │   │
│  │  AuthContext │ React Router v7 │ Socket.IO Client   │   │
│  │  shadcn/ui   │ Tailwind CSS    │ axios (API calls)  │   │
│  │  i18next     │ recharts        │ react-hook-form    │   │
│  └──────────────────────┬──────────────────────────────┘   │
│                         │ HTTP / WebSocket                  │
└─────────────────────────┼───────────────────────────────────┘
                          │
┌─────────────────────────┼───────────────────────────────────┐
│                    BACKEND SERVER                            │
│                                                             │
│  ┌──────────────────────▼──────────────────────────────┐   │
│  │           Express.js API (Port 3001)                 │   │
│  │                                                     │   │
│  │  Middleware Stack:                                  │   │
│  │  Helmet │ CORS │ Rate-Limit │ CSRF │ JWT Auth       │   │
│  │                                                     │   │
│  │  Routes:                                            │   │
│  │  /api/auth  /api/tickets  /api/users                │   │
│  │  /api/technicians  /api/reports  /api/dashboard     │   │
│  │  /api/padal-shifts  /api/settings  /api/health      │   │
│  │                                                     │   │
│  │  Services:                                          │   │
│  │  TicketService │ UserService │ ReportService        │   │
│  │  AssignmentTimeoutService (node-cron)               │   │
│  └──────────┬──────────────────────────┬──────────────┘   │
│             │                          │                   │
│  ┌──────────▼──────┐        ┌──────────▼──────────────┐   │
│  │   MySQL 8.0+    │        │    Redis (Cache)         │   │
│  │                 │        │                         │   │
│  │  users          │        │  Tiket list cache       │   │
│  │  tickets        │        │  Dashboard stats        │   │
│  │  divisions      │        │  TTL: 5 menit           │   │
│  │  ticket_history │        └─────────────────────────┘   │
│  │  technician_    │                                       │
│  │    settings     │        ┌─────────────────────────┐   │
│  │  padal_shifts   │        │   Socket.IO Server      │   │
│  │  ratings        │        │                         │   │
│  └─────────────────┘        │  Events:                │   │
│                             │  ticket:update          │   │
│                             │  assignment:new         │   │
│                             │  assignment:timeout     │   │
│                             └─────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

### Frontend (`apps/web`)

| Teknologi | Versi | Kegunaan |
|-----------|-------|----------|
| React | 18.3.x | UI framework utama |
| Vite | 6.x | Build tool & dev server |
| React Router | 7.x | Client-side routing |
| Tailwind CSS | 3.x | Utility-first styling |
| shadcn/ui + Radix UI | latest | Komponen UI aksesibel |
| Socket.IO Client | 4.8.x | Koneksi realtime ke backend |
| axios | 1.6.x | HTTP client dengan interceptors |
| react-hook-form + zod | latest | Form handling & validasi |
| recharts | 2.x | Grafik dan visualisasi data |
| i18next | 23.x | Internasionalisasi (ID/EN) |
| sonner | 2.x | Toast notifications |
| date-fns | 4.x | Manipulasi tanggal |
| lucide-react | 0.469 | Icon library |

### Backend (`backend`)

| Teknologi | Versi | Kegunaan |
|-----------|-------|----------|
| Node.js | 18+ | Runtime |
| Express.js | 4.x | Web framework |
| MySQL2 | 3.9.x | Koneksi database MySQL |
| Redis (ioredis) | latest | Caching layer |
| Socket.IO | 4.x | Realtime events |
| node-cron | 4.2.x | Scheduled jobs (timeout cron) |
| jsonwebtoken | 9.x | JWT access & refresh token |
| bcryptjs | 2.4.x | Password hashing |
| Joi | 18.x | Validasi input schema |
| Helmet | 8.x | HTTP security headers |
| express-rate-limit | 8.x | Rate limiting |
| cors | 2.8.x | CORS policy |
| cookie-parser | 1.4.x | Cookie handling |
| exceljs | 4.4.x | Export laporan Excel |
| pdfkit | 0.18.x | Export laporan PDF |
| multer | 1.4.x | Upload file |
| prom-client | latest | Prometheus metrics |
| Winston | latest | Structured logging |
| swagger-ui-express | latest | API documentation |

---

## 📁 Struktur Project

```
projectpolda/
│
├── apps/
│   └── web/                          # Frontend React + Vite
│       ├── src/
│       │   ├── components/
│       │   │   ├── layout/           # Header, Sidebar, Layout wrapper
│       │   │   ├── modals/           # Dialog modals (AssignPadal, dll)
│       │   │   └── ui/               # shadcn/ui components
│       │   ├── contexts/
│       │   │   └── AuthContext.jsx   # Global auth state + socket
│       │   ├── hooks/                # Custom React hooks
│       │   ├── lib/
│       │   │   └── api.js            # axios instance + interceptors
│       │   ├── locales/              # File terjemahan i18n (id, en)
│       │   ├── pages/
│       │   │   ├── admin/            # Halaman panel Subtekinfo
│       │   │   ├── padal/            # Halaman khusus Padal
│       │   │   ├── satker/           # Halaman khusus Satker
│       │   │   ├── LoginPage.jsx
│       │   │   ├── TicketDetailPage.jsx
│       │   │   ├── MonthlyReportPage.jsx
│       │   │   └── UserSettingsPage.jsx
│       │   ├── router/               # Definisi rute per role
│       │   └── App.jsx               # Root component + routing
│       ├── components.json           # shadcn/ui config
│       ├── tailwind.config.js
│       └── vite.config.js
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js           # MySQL pool config
│   │   │   ├── redis.js              # Redis client config
│   │   │   └── swagger.js            # Swagger/OpenAPI setup
│   │   ├── middleware/
│   │   │   ├── auth.js               # JWT verify + RBAC
│   │   │   ├── csrf.js               # CSRF token validation
│   │   │   ├── errorHandler.js       # Global error handler
│   │   │   └── validationSchemas.js  # Joi schemas
│   │   ├── routes/
│   │   │   ├── auth.js               # Login, logout, refresh token
│   │   │   ├── tickets.js            # CRUD tiket + cancel matrix
│   │   │   ├── users.js              # Manajemen user
│   │   │   ├── technicians.js        # Data Padal + Teknisi
│   │   │   ├── dashboard.js          # Statistik dashboard
│   │   │   ├── reports.js            # Laporan bulanan + export
│   │   │   ├── padal-shifts.js       # Jadwal shift Padal
│   │   │   ├── settings.js           # Pengaturan sistem
│   │   │   ├── health.js             # Health check endpoints
│   │   │   └── uploads.js            # Upload & serve file
│   │   ├── services/
│   │   │   ├── TicketService.js      # Business logic tiket
│   │   │   ├── UserService.js        # Business logic user
│   │   │   ├── ReportService.js      # Generate laporan
│   │   │   └── AssignmentTimeoutService.js  # Cron timeout otomatis
│   │   ├── socket/
│   │   │   └── index.js              # Socket.IO event handlers
│   │   ├── utils/
│   │   │   ├── cache.js              # Redis cache helpers
│   │   │   └── logger.js             # Winston logger
│   │   └── server.js                 # Entry point + cron init
│   ├── sql/
│   │   ├── schema.sql                # DDL lengkap semua tabel
│   │   └── migrations/               # File migrasi incremental
│   ├── scripts/
│   │   ├── setup-db.js               # Setup database awal
│   │   ├── migrate.js                # Jalankan migrasi
│   │   ├── backup-db.js              # Backup database
│   │   ├── smoke-test.js             # Smoke test post-deploy
│   │   ├── release-readiness.js      # Cek kesiapan release
│   │   ├── load-test.js              # Load testing
│   │   └── generate-sbom-lite.js     # Generate SBOM
│   ├── monitoring/
│   │   ├── prometheus.yml            # Konfigurasi scraping
│   │   ├── grafana-dashboard.json    # Dashboard Grafana
│   │   ├── alerts.yml                # Alert rules
│   │   └── promtail-config.yml       # Log shipping
│   ├── tests/
│   │   ├── routes/                   # Unit test routes
│   │   ├── services/                 # Unit test services
│   │   ├── middleware/               # Unit test middleware
│   │   └── integration/              # Integration tests
│   ├── Dockerfile
│   └── docker-compose.yml
│
├── documentations/
│   ├── README.md                     # Indeks dokumentasi
│   ├── 01_System_Reference/          # Referensi alur & menu
│   ├── 07_Remediation_Program/       # Bug report & saran
│   └── After Revisi/                 # Changelog sesi revisi
│
├── package.json                      # Root monorepo scripts
└── README.md                         # Dokumen ini
```

---

## ✅ Prasyarat

Pastikan semua prasyarat berikut sudah terinstal sebelum memulai:

| Prasyarat | Versi Minimum | Cek Versi |
|-----------|:---:|-----------|
| Node.js | 18.0.0 | `node --version` |
| npm | 9.0.0 | `npm --version` |
| MySQL | 8.0 | `mysql --version` |
| Redis | 6.0 | `redis-server --version` |
| Git | 2.x | `git --version` |

> **Catatan**: Redis bersifat opsional tetapi sangat direkomendasikan. Backend memiliki fallback ke database jika Redis tidak tersedia, namun performa akan lebih baik dengan Redis aktif.

---

## 🚀 Instalasi

### 1. Clone Repository

```bash
git clone https://github.com/KuWeka/Helpdesk-IT-POLDA.git
cd Helpdesk-IT-POLDA/projectpolda
```

### 2. Install Dependencies

Install semua dependencies sekaligus dari root monorepo:

```bash
# Install root dependencies
npm install

# Install frontend dependencies
npm install --prefix apps/web

# Install backend dependencies
npm install --prefix backend
```

### 3. Konfigurasi Environment

Salin file environment template:

```bash
# Backend environment
cp backend/.env.example backend/.env

# Frontend environment (jika ada)
cp apps/web/.env.example apps/web/.env
```

Lanjutkan ke bagian [Konfigurasi Environment](#-konfigurasi-environment) untuk mengisi nilai yang diperlukan.

---

## ⚙️ Konfigurasi Environment

### Backend (`backend/.env`)

```env
# ─────────────────────────────────────────────
# SERVER
# ─────────────────────────────────────────────
PORT=3001
NODE_ENV=development

# ─────────────────────────────────────────────
# DATABASE (MySQL)
# ─────────────────────────────────────────────
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=helpdesk_db

# ─────────────────────────────────────────────
# REDIS (Cache)
# ─────────────────────────────────────────────
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=          # Kosongkan jika tanpa password
REDIS_DB=0

# ─────────────────────────────────────────────
# JWT AUTH
# ─────────────────────────────────────────────
JWT_SECRET=your_very_long_random_jwt_secret_here
JWT_REFRESH_SECRET=your_very_long_random_refresh_secret_here
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# ─────────────────────────────────────────────
# CORS
# ─────────────────────────────────────────────
CORS_ORIGIN=http://localhost:3000

# ─────────────────────────────────────────────
# FILE UPLOAD
# ─────────────────────────────────────────────
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760    # 10MB dalam bytes

# ─────────────────────────────────────────────
# ASSIGNMENT TIMEOUT CRON
# ─────────────────────────────────────────────
ASSIGNMENT_TIMEOUT_MINUTES=30   # Menit sebelum assignment kadaluarsa

# ─────────────────────────────────────────────
# RATE LIMITING
# ─────────────────────────────────────────────
RATE_LIMIT_WINDOW_MS=900000     # 15 menit
RATE_LIMIT_MAX=100              # Max request per window
```

### Frontend (`apps/web/.env`)

```env
VITE_API_URL=http://localhost:3001/api
VITE_SOCKET_URL=http://localhost:3001
```

> **Keamanan**: Jangan pernah commit file `.env` ke repository. File ini sudah ada di `.gitignore`.

---

## 🗄️ Setup Database

### 1. Buat Database dan Schema

```bash
# Jalankan setup database awal (membuat DB dan tabel)
npm run db:setup --prefix backend
```

Script ini akan:
- Membuat database `helpdesk_db` jika belum ada
- Menjalankan `sql/schema.sql` untuk membuat semua tabel
- Membuat data awal (seed) jika diperlukan

### 2. Jalankan Migrasi

```bash
# Jalankan file migrasi incremental
npm run db:migrate --prefix backend
```

### 3. Verifikasi Schema

Tabel utama yang dibuat:

| Tabel | Deskripsi |
|-------|-----------|
| `users` | Data semua pengguna sistem dengan role RBAC |
| `divisions` | Satuan kerja / divisi |
| `tickets` | Tiket layanan IT |
| `ticket_history` | Riwayat perubahan status tiket |
| `ticket_attachments` | File lampiran tiket |
| `technician_settings` | Konfigurasi per Padal/Teknisi |
| `padal_shifts` | Jadwal shift aktif Padal |
| `ratings` | Rating kepuasan dari Satker |
| `system_settings` | Konfigurasi global aplikasi |

---

## ▶️ Menjalankan Aplikasi

### Mode Development

Jalankan frontend dan backend secara bersamaan:

```bash
# Dari root monorepo
npm run dev
```

Atau jalankan terpisah di terminal berbeda:

```bash
# Terminal 1 - Backend
npm run dev --prefix backend

# Terminal 2 - Frontend
npm run dev --prefix apps/web
```

### Mode Production

```bash
# Build frontend
npm run build

# Jalankan backend production
npm run start --prefix backend
```

### URL Akses

| Layanan | URL | Keterangan |
|---------|-----|------------|
| Frontend | `http://localhost:3000` | Antarmuka pengguna |
| Backend API | `http://localhost:3001/api` | REST API |
| Swagger UI | `http://localhost:3001/api/docs` | Dokumentasi API interaktif |
| Health Live | `http://localhost:3001/api/health/live` | Liveness check |
| Health Ready | `http://localhost:3001/api/health/ready` | Readiness check |
| Metrics | `http://localhost:3001/api/health/metrics` | Prometheus metrics |

---

## 📜 Scripts & Perintah

### Root Monorepo

```bash
npm run dev          # Jalankan frontend + backend bersamaan
npm run build        # Build frontend untuk production
npm run start        # Jalankan backend production
npm run lint         # Lint kode frontend
```

### Backend

```bash
# Development
npm run dev --prefix backend              # Dev server dengan nodemon
npm run start --prefix backend            # Production server

# Testing
npm run test --prefix backend             # Jalankan semua unit test
npm run test:watch --prefix backend       # Test mode watch
npm run test:coverage --prefix backend    # Test dengan laporan coverage
npm run test:integration --prefix backend # Integration tests

# Code Quality
npm run lint --prefix backend             # ESLint check
npm run format --prefix backend           # Format kode dengan Prettier
npm run format:check --prefix backend     # Cek format tanpa mengubah

# Database
npm run db:setup --prefix backend         # Setup DB dari awal
npm run db:migrate --prefix backend       # Jalankan migrasi
npm run db:backup --prefix backend        # Backup database
npm run db:restore --prefix backend       # Restore dari backup

# Cache
npm run cache:clear --prefix backend      # Bersihkan cache Redis

# DevOps & Operations
npm run smoke:test --prefix backend       # Smoke test post-deploy
npm run release:readiness --prefix backend # Cek release readiness
npm run load:test --prefix backend        # Load/stress testing
npm run ops:synthetic --prefix backend    # Synthetic monitoring

# Security
npm run security:audit --prefix backend   # Audit npm dependencies
npm run security:sbom --prefix backend    # Generate Software Bill of Materials
npm run phase7:readiness --prefix backend # Supply chain readiness check

# Health
npm run health:check --prefix backend     # Cek health endpoint
npm run health:metrics --prefix backend   # Lihat Prometheus metrics

# Docker
npm run docker:build --prefix backend     # Build Docker image
npm run docker:run --prefix backend       # Jalankan container Docker

# Staging Deploy
npm run deploy:staging --prefix backend   # Deploy ke staging
npm run rollback:staging --prefix backend # Rollback staging
```

---

## 🔌 API Endpoints

Dokumentasi lengkap tersedia via Swagger di `/api/docs`. Berikut ringkasan endpoint utama:

### Auth (`/api/auth`)

| Method | Endpoint | Akses | Deskripsi |
|--------|----------|-------|-----------|
| `POST` | `/auth/login` | Public | Login dengan email/password |
| `POST` | `/auth/logout` | Auth | Logout dan hapus cookie |
| `POST` | `/auth/refresh` | Public | Refresh access token |
| `GET` | `/auth/me` | Auth | Data profil user aktif |
| `PATCH` | `/auth/me` | Auth | Update profil sendiri |
| `PATCH` | `/auth/me/password` | Auth | Ganti password |

### Tiket (`/api/tickets`)

| Method | Endpoint | Akses | Deskripsi |
|--------|----------|-------|-----------|
| `GET` | `/tickets` | Auth | List tiket (filter per role) |
| `POST` | `/tickets` | Satker | Buat tiket baru |
| `GET` | `/tickets/:id` | Auth | Detail tiket |
| `PATCH` | `/tickets/:id` | Satker/Padal | Update tiket |
| `DELETE` | `/tickets/:id` | Satker/Subtekinfo | Batalkan tiket |
| `POST` | `/tickets/:id/assign` | Subtekinfo | Assign tiket ke Padal |
| `POST` | `/tickets/:id/accept` | Padal | Terima assignment |
| `POST` | `/tickets/:id/reject` | Padal | Tolak tiket |
| `POST` | `/tickets/:id/complete` | Padal | Selesaikan tiket |
| `POST` | `/tickets/:id/rate` | Satker | Beri rating tiket selesai |
| `GET` | `/tickets/:id/history` | Auth | Riwayat aktivitas tiket |

### Users (`/api/users`)

| Method | Endpoint | Akses | Deskripsi |
|--------|----------|-------|-----------|
| `GET` | `/users` | Subtekinfo | List semua user |
| `POST` | `/users` | Subtekinfo | Buat user baru |
| `GET` | `/users/:id` | Subtekinfo | Detail user |
| `PATCH` | `/users/:id` | Subtekinfo | Update user |
| `DELETE` | `/users/:id` | Subtekinfo | Hapus user |

### Teknisi & Padal (`/api/technicians`)

| Method | Endpoint | Akses | Deskripsi |
|--------|----------|-------|-----------|
| `GET` | `/technicians` | Auth | List Padal + Teknisi |
| `GET` | `/technicians/:id/settings` | Auth | Setting Padal/Teknisi |
| `PATCH` | `/technicians/:id/settings` | Subtekinfo | Update setting |

### Dashboard (`/api/dashboard`)

| Method | Endpoint | Akses | Deskripsi |
|--------|----------|-------|-----------|
| `GET` | `/dashboard/stats` | Auth | Statistik tiket per role |
| `GET` | `/dashboard/trend` | Auth | Tren tiket per bulan |

### Laporan (`/api/reports`)

| Method | Endpoint | Akses | Deskripsi |
|--------|----------|-------|-----------|
| `GET` | `/reports/monthly` | Auth | Data laporan bulanan |
| `GET` | `/reports/monthly/export/excel` | Auth | Export Excel |
| `GET` | `/reports/monthly/export/pdf` | Auth | Export PDF |

### Health (`/api/health`)

| Method | Endpoint | Akses | Deskripsi |
|--------|----------|-------|-----------|
| `GET` | `/health/live` | Public | Liveness probe |
| `GET` | `/health/ready` | Public | Readiness probe |
| `GET` | `/health/metrics` | Public | Prometheus metrics |

---

## 🔒 Keamanan

Sistem menerapkan berbagai lapisan keamanan sesuai best practices:

### Autentikasi & Otorisasi

| Mekanisme | Implementasi |
|-----------|--------------|
| JWT Access Token | Short-lived (15 menit), disimpan di memory |
| JWT Refresh Token | Long-lived (7 hari), disimpan di httpOnly cookie |
| CSRF Protection | Token sisi server, divalidasi setiap request state-changing |
| RBAC | Middleware `requireRole()` di setiap endpoint sensitif |
| Password Hashing | bcryptjs dengan salt rounds 12 |

### HTTP Security

| Fitur | Library | Keterangan |
|-------|---------|------------|
| Security Headers | Helmet.js | HSTS, X-Frame-Options, CSP, dll |
| Rate Limiting | express-rate-limit | Batasi jumlah request per IP per window |
| CORS Policy | cors | Hanya izinkan origin yang terdaftar |
| Input Validation | Joi | Validasi skema seluruh body request |
| SQL Injection | Prepared statements | MySQL2 parameterized queries |

### Data Security

- Tidak menyimpan data sensitif di `localStorage` (anti-XSS)
- Cookie `httpOnly` dan `secure` untuk refresh token
- File upload dibatasi tipe dan ukuran
- Log tidak mencatat password atau token

---

## 🐳 Docker

### Menjalankan dengan Docker Compose

```bash
# Development
cd backend
docker-compose up -d

# Staging
docker-compose -f docker-compose.staging.yml up -d
```

### Build Manual

```bash
# Build image
npm run docker:build --prefix backend

# Jalankan container
npm run docker:run --prefix backend
```

### Struktur docker-compose.yml

`docker-compose.yml` mengorkestrasi:
- **Backend API** — Node.js app container
- **MySQL** — Database container dengan volume persist
- **Redis** — Cache container

```yaml
services:
  api:       # Backend Express
  mysql:     # Database
  redis:     # Cache
```

---

## 🧪 Testing

### Jalankan Semua Test

```bash
npm run test --prefix backend
```

### Test dengan Coverage

```bash
npm run test:coverage --prefix backend
```

Coverage report tersimpan di `backend/coverage/`. Target coverage:

| Kategori | Target |
|----------|--------|
| Statements | ≥ 80% |
| Branches | ≥ 75% |
| Functions | ≥ 80% |
| Lines | ≥ 80% |

### Struktur Test

```
backend/tests/
├── routes/
│   ├── auth.test.js
│   ├── tickets.test.js
│   └── ...
├── services/
│   ├── ticketService.test.js
│   └── ...
├── middleware/
│   └── auth.test.js
└── integration/
    └── *.integration.test.js
```

### Smoke Test Post-Deploy

```bash
npm run smoke:test --prefix backend
```

Smoke test memverifikasi:
- Server merespons di port yang benar
- Health endpoint `live` dan `ready` 200 OK
- Koneksi database aktif
- Koneksi Redis aktif

---

## 📡 Monitoring & Observability

Sistem terintegrasi dengan stack monitoring modern:

### Prometheus + Grafana

Konfigurasi tersimpan di `backend/monitoring/`:

```bash
# Konfigurasi Prometheus
backend/monitoring/prometheus.yml

# Dashboard Grafana (import via UI)
backend/monitoring/grafana-dashboard.json

# Alert rules
backend/monitoring/alerts.yml

# Log shipping dengan Promtail
backend/monitoring/promtail-config.yml
```

### Metrics yang Diekspos

Endpoint: `GET /api/health/metrics`

| Metric | Tipe | Deskripsi |
|--------|------|-----------|
| `http_requests_total` | Counter | Total HTTP request |
| `http_request_duration_seconds` | Histogram | Durasi response per endpoint |
| `nodejs_heap_used_bytes` | Gauge | Memory heap Node.js |
| `process_cpu_seconds_total` | Counter | CPU usage |

### Logging

Backend menggunakan Winston dengan format terstruktur (JSON). Log level:
- `error` — Error kritis yang perlu perhatian segera
- `warn` — Peringatan kondisi tidak normal
- `info` — Event operasional normal (startup, request, dll)
- `debug` — Detail debugging (hanya aktif di development)

---

## 📚 Dokumentasi Internal

Dokumentasi teknis lengkap tersimpan di folder [`documentations/`](documentations/).

### Indeks Dokumentasi

| Folder | Isi |
|--------|-----|
| [`01_System_Reference/`](documentations/01_System_Reference/) | Alur pemakaian sistem, menu dan fitur lengkap |
| [`07_Remediation_Program/`](documentations/07_Remediation_Program/) | Bug report, saran perbaikan |
| [`After Revisi/`](documentations/After%20Revisi/) | Changelog implementasi per sesi revisi |

### Sesi Revisi

| Sesi | Topik |
|------|-------|
| SESI 1 | Migrasi Database |
| SESI 2 | Restrukturisasi Role Backend |
| SESI 3 | Hapus Fitur Urgensi (refactor) |
| SESI 4 | Hapus Chat Internal |
| SESI 5 | Assign Padal + Socket.IO |
| SESI 6 | Penolakan Tiket |
| SESI 7 | Rating Wajib Satker |
| SESI 8 | Manajemen Shift Padal |
| SESI 9 | Laporan Bulanan |
| SESI 10 | Restrukturisasi Frontend & Navigasi |
| SESI 11 | Commit, Push, Smoke Test & Dokumentasi |

---

## 🤝 Kontribusi

Project ini digunakan untuk kebutuhan internal Bidtik Polda Kalsel. Untuk melaporkan bug atau memberikan saran perbaikan:

1. Buat issue baru di repository ini
2. Sertakan langkah reproduksi yang jelas
3. Cantumkan versi Node.js, OS, dan browser yang digunakan
4. Tambahkan screenshot atau log jika relevan

Untuk referensi bug report yang sudah ada, lihat:
[`documentations/07_Remediation_Program/ProjectPolda_BugReport_dan_Saran.md`](documentations/07_Remediation_Program/ProjectPolda_BugReport_dan_Saran.md)

---

## 📄 Lisensi

Project ini dikembangkan untuk keperluan internal Bidang Teknologi Informasi Polda Kalimantan Selatan.

---

<div align="center">

**Helpdesk IT POLDA Kalsel** · Bidang Teknologi Informasi · Polda Kalimantan Selatan

*Dibuat dengan ❤️ untuk pelayanan IT internal yang lebih baik*

</div>
