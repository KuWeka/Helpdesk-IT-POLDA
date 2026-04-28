<div align="center">

<img src="apps/web/public/images/logo_bidtik.png" alt="Bidtik" width="120" />

# 🖥️ Helpdesk IT POLDA Kalsel

**Sistem Helpdesk IT terpadu untuk Kepolisian Daerah Kalimantan Selatan**

[![Version](https://img.shields.io/badge/version-1.0.0-blue?style=for-the-badge)](./VERSION)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![MySQL](https://img.shields.io/badge/MySQL-8+-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://mysql.com)
[![Redis](https://img.shields.io/badge/Redis-optional-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io)
[![License](https://img.shields.io/badge/license-MIT-green?style=for-the-badge)](./LICENSE)

[![Backend CI](https://img.shields.io/github/actions/workflow/status/your-org/helpdesk-polda/backend-ci.yml?style=flat-square&label=Backend%20CI&logo=github)](/.github/workflows/backend-ci.yml)
[![Docker](https://img.shields.io/badge/Docker-ready-2496ED?style=flat-square&logo=docker&logoColor=white)](./backend/Dockerfile)
[![Swagger](https://img.shields.io/badge/API%20Docs-Swagger-85EA2D?style=flat-square&logo=swagger&logoColor=black)](http://localhost:3001/api-docs)

<br/>

> Aplikasi helpdesk berbasis **monorepo** untuk manajemen tiket gangguan IT, assignment teknisi, chat real-time, observability, dan operasional staging — dibangun dengan stack modern yang aman dan skalabel.

<br/>

[🚀 Mulai Cepat](#-instalasi) · [📖 Dokumentasi](#-dokumentasi) · [🔧 API Docs](#api-docs) · [🐳 Docker](#-docker)

---

</div>

## ✨ Fitur Utama

<table>
<tr>
<td width="50%">

### 🎫 Manajemen Tiket
Buat, track, dan selesaikan tiket gangguan IT berdasarkan **kategori** dan **tingkat urgensi**. Dilengkapi riwayat lengkap dan status real-time.

### 👷 Assignment Teknisi
Admin dapat assign teknisi ke tiket secara langsung. Teknisi melihat antrian tugas mereka via dashboard khusus.

### 💬 Chat Real-time
Komunikasi langsung antara **user ↔ teknisi** per tiket menggunakan **Socket.IO**. Admin dapat memantau semua percakapan.

</td>
<td width="50%">

### 👥 Multi-role System
Tiga peran terpisah dengan akses berbeda:
- 🔵 **User** — Buat & pantau tiket, chat dengan teknisi
- 🟡 **Teknisi** — Kelola antrian & tiket yang diassign
- 🔴 **Admin** — Kelola semua aspek sistem

### 🌐 Bilingual UI
Antarmuka tersedia dalam **Bahasa Indonesia** dan **English** dengan dukungan i18n penuh.

### 📊 Observability
Monitoring lengkap dengan **Prometheus metrics**, **Grafana dashboard**, dan **structured logging** via Winston.

</td>
</tr>
</table>

### 🛡️ Keamanan

| Fitur | Teknologi |
|---|---|
| Autentikasi | JWT + Refresh Token (HttpOnly Cookie) |
| Proteksi CSRF | Token-based CSRF protection |
| Rate Limiting | Configurable per endpoint |
| HTTP Headers | Helmet.js |
| Akses Kontrol | RBAC (Role-Based Access Control) |
| Audit Trail | Audit logger terpusat |

---

## 🗂️ Struktur Proyek

```
Helpdesk-IT-POLDA/
├── 📁 apps/
│   └── 📁 web/                     # Frontend — React 18 + Vite + shadcn/ui
│       └── src/
│           ├── pages/
│           │   ├── 👤 user/         # Dashboard, tiket, chat, settings
│           │   ├── 🔧 technician/   # Dashboard, antrian, tiket, chat
│           │   └── 🛠️  admin/        # Dashboard, manajemen user & teknisi
│           ├── components/          # Common, modals, tickets, chat, layout, UI
│           ├── contexts/            # AuthContext
│           ├── hooks/               # use-mobile, use-toast
│           ├── lib/                 # api.js, socket.js, constants.js
│           └── i18n/               # en.json, id.json
│
├── 📁 backend/                     # API Server — Node.js + Express
│   └── src/
│       ├── routes/                 # auth, tickets, chats, messages, users,
│       │                           #   technicians, dashboard, settings, uploads, health
│       ├── services/               # ChatService, MessageService, TicketService, UserService
│       ├── middleware/             # auth, role, csrf, validation, errorHandler
│       ├── utils/                  # logger, cache, auditLogger, swagger, metrics
│       ├── socket/                 # Socket.IO handler
│       └── config/                 # db.js
│
├── 📁 backend/sql/                 # Schema & migrations
├── 📁 backend/monitoring/          # Prometheus, Grafana, Alerting, Promtail
├── 📁 backend/scripts/             # migrate, setup-db, backup, deploy, smoke-test, dll
├── 📁 documentations/              # 10 folder dokumentasi lengkap
└── 📁 .github/workflows/           # CI/CD — backend-ci, ops, release-governance, supply-chain
```

---

## 🔧 Tech Stack

<div align="center">

| Layer | Teknologi |
|---|---|
| **Frontend** | React 18, Vite, shadcn/ui, Tailwind CSS, Socket.IO Client |
| **Backend** | Node.js 18+, Express.js, Socket.IO |
| **Database** | MySQL 8+ |
| **Cache** | Redis *(opsional, ada in-memory fallback)* |
| **Auth** | JWT + Refresh Token, bcryptjs |
| **Validation** | Joi |
| **Logging** | Winston + winston-daily-rotate-file |
| **Metrics** | prom-client (Prometheus) |
| **Docs** | Swagger / OpenAPI |
| **Containerization** | Docker + Docker Compose |
| **CI/CD** | GitHub Actions |
| **Security** | Helmet, CSRF, Rate Limiting, RBAC |

</div>

---

## ⚙️ Prasyarat

| Komponen | Versi Minimum | Keterangan |
|---|---|---|
| ![Node.js](https://img.shields.io/badge/-Node.js-339933?logo=node.js&logoColor=white&style=flat-square) | **18+** | Runtime backend & tooling |
| ![npm](https://img.shields.io/badge/-npm-CB3837?logo=npm&logoColor=white&style=flat-square) | **9+** | Package manager |
| ![MySQL](https://img.shields.io/badge/-MySQL-4479A1?logo=mysql&logoColor=white&style=flat-square) | **8+** | Database utama |
| ![Redis](https://img.shields.io/badge/-Redis-DC382D?logo=redis&logoColor=white&style=flat-square) | *Opsional* | Caching (ada fallback in-memory) |

---

## 🚀 Instalasi

### 1. Clone & Install Dependencies

```bash
# Clone repository
git clone https://github.com/your-org/Helpdesk-IT-POLDA.git
cd Helpdesk-IT-POLDA

# Install semua dependency (root + frontend + backend)
npm install
npm install --prefix apps/web
npm install --prefix backend
```

### 2. Konfigurasi Environment

```bash
# Salin file env
cp backend/.env.example backend/.env
cp apps/web/.env.example apps/web/.env
```

Edit `backend/.env` dan isi variabel berikut:

```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=helpdesk_user
DB_PASSWORD=your_password
DB_NAME=helpdesk

# JWT (WAJIB diganti di production!)
JWT_SECRET=your_super_secret_jwt_key_min_32_chars
JWT_REFRESH_SECRET=your_refresh_secret_key

# Redis (opsional)
REDIS_HOST=localhost
REDIS_PORT=6379

# CORS
CORS_ORIGIN=http://localhost:3000
```

> ⚠️ **Penting:** Generate JWT secret yang kuat untuk production:
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```

### 3. Setup Database

```bash
# Buat database & tabel
npm run db:setup --prefix backend

# Jalankan migrasi
npm run db:migrate --prefix backend
```

---

## ▶️ Menjalankan Aplikasi

### Mode Development (Frontend + Backend sekaligus)

```bash
npm run dev
```

| Service | URL |
|---|---|
| 🌐 Frontend | `http://localhost:3000` |
| 🔌 Backend API | `http://localhost:3001` |
| 📋 API Docs (Swagger) | `http://localhost:3001/api-docs` |
| ❤️ Health Check | `http://localhost:3001/health` |

### Menjalankan Terpisah

```bash
# Frontend saja
npm run dev --prefix apps/web

# Backend saja
npm run dev --prefix backend
```

---

## 🏗️ Build & Production

```bash
# Build frontend
npm run build

# Start backend production
npm run start
```

---

## 🧪 Testing & Lint

```bash
# Lint frontend
npm run lint

# Unit test backend
npm run test --prefix backend

# Test dengan coverage
npm run test:coverage --prefix backend

# Integration test
npm run test:integration --prefix backend
```

---

## 🐳 Docker

```bash
# Build Docker image
npm run docker:build --prefix backend

# Jalankan dengan Docker Compose
docker compose -f backend/docker-compose.yml up -d

# Staging environment
docker compose -f backend/docker-compose.staging.yml up -d
```

---

## 🔁 Operasional & Monitoring

```bash
# Health check
npm run health:check --prefix backend

# Smoke test (post-deploy)
npm run smoke:test --prefix backend

# Release readiness check
npm run release:readiness --prefix backend

# Generate SBOM (Software Bill of Materials)
npm run security:sbom --prefix backend

# Load test
npm run load:test --prefix backend

# Deploy / rollback staging
npm run deploy:staging --prefix backend
npm run rollback:staging --prefix backend

# Clear cache
npm run cache:clear --prefix backend
```

Monitoring stack tersedia di `backend/monitoring/`:

| File | Keterangan |
|---|---|
| `prometheus.yml` | Konfigurasi scraping Prometheus |
| `grafana-dashboard.json` | Dashboard Grafana siap pakai |
| `alerts.yml` | Aturan alerting |
| `promtail-config.yml` | Konfigurasi log shipping |

---

## 🌐 API Endpoints

Dokumentasi API lengkap tersedia via Swagger di `/api-docs` saat server berjalan.

| Method | Endpoint | Keterangan |
|---|---|---|
| `POST` | `/api/v1/auth/login` | Login user |
| `POST` | `/api/v1/auth/register` | Registrasi user baru |
| `GET` | `/api/v1/tickets` | Daftar tiket |
| `POST` | `/api/v1/tickets` | Buat tiket baru |
| `GET` | `/api/v1/tickets/:id` | Detail tiket |
| `GET` | `/api/v1/chats` | Daftar chat |
| `GET` | `/api/v1/dashboard` | Data dashboard |
| `GET` | `/health` | Health check |

---

## 📖 Dokumentasi

Dokumentasi lengkap tersimpan di folder [`documentations/`](documentations/):

| # | Folder | Isi |
|---|---|---|
| 01 | [System Reference](documentations/01_System_Reference/) | Overview, arsitektur, DB schema, role & fitur, keamanan |
| 02 | [API Documentation](documentations/02_API_Documentation/) | Dokumentasi endpoint API lengkap |
| 03 | [Web UI Transformation](documentations/03_Web_UI_Transformation/) | Catatan migrasi UI ke shadcn/ui |
| 04 | [Backend Operational Guides](documentations/04_Backend_Operational_Guides/) | Incident response, SLO/SLI, release governance |
| 05 | [Release & Versioning](documentations/05_Release_and_Versioning/) | Changelog dan catatan rilis |
| 06 | [Delivery Execution Records](documentations/06_Delivery_Execution_Records/) | Log eksekusi per fase pengembangan |
| 07 | [Remediation Program](documentations/07_Remediation_Program/) | Laporan remediation & testing (Workstream 01–08) |
| 08 | [AI Prompts & Workflows](documentations/08_AI_Prompts_and_Workflows/) | Prompt AI dan panduan workflow |
| 09 | [Legacy Architecture](documentations/09_Legacy_Architecture/) | Arsitektur lama (referensi historis) |
| 10 | [Archive](documentations/10_Archive/) | Arsip phase completion reports |

---

## 🔀 GitHub Actions / CI-CD

| Workflow | Trigger | Fungsi |
|---|---|---|
| `backend-ci.yml` | Push / PR | Lint, test, coverage |
| `backend-ops.yml` | Manual / Schedule | Deploy & operasional |
| `backend-release-governance.yml` | Tag push | Release readiness & governance |
| `backend-supply-chain.yml` | Schedule | Audit supply chain & SBOM |
| `dependabot.yml` | Schedule | Auto-update dependencies |

---

## 🤝 Kontribusi

1. Fork repository ini
2. Buat branch fitur: `git checkout -b feat/nama-fitur`
3. Commit perubahan: `git commit -m 'feat: tambah fitur X'`
4. Push ke branch: `git push origin feat/nama-fitur`
5. Buat Pull Request

---

## 📄 Lisensi

Proyek ini dibuat untuk keperluan internal **Polda Kalimantan Selatan** — Bidang Teknologi Informasi.

---

<div align="center">

Dibuat dengan ❤️ oleh **Bidtik Polda Kalsel**

<img src="apps/web/public/images/logo_bidtik.png" alt="Bidtik" width="60" />

</div>
