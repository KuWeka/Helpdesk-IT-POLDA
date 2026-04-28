# HelpdeskPolda

> **v1.0.0** — Sistem Helpdesk IT Polda Kalsel

Aplikasi helpdesk berbasis monorepo untuk manajemen tiket gangguan IT, assignment teknisi, chat real-time, observability, dan operasional staging. Dibangun dengan React + Vite (frontend) dan Node.js + Express + MySQL + Redis + Socket.IO (backend).

---

## Fitur Utama

| Fitur | Keterangan |
|-------|-----------|
| Manajemen Tiket | Buat, track, dan selesaikan tiket gangguan per kategori & urgensi |
| Assignment Teknisi | Admin assign teknisi ke tiket; teknisi lihat antrian via dashboard |
| Chat Real-time | Komunikasi user ↔ teknisi via Socket.IO per tiket |
| Multi-role | Tiga role: `user`, `technician`, `admin` |
| Internasionalisasi | UI tersedia dalam Bahasa Indonesia dan English |
| Observability | Prometheus metrics, Grafana dashboard, structured logging (Winston) |
| Security | JWT auth, CSRF protection, rate limiting, Helmet, RBAC |

---

## Struktur Proyek

```text
projectpolda/
├── apps/
│   └── web/                          # Frontend — React 18 + Vite + shadcn/ui
│       ├── src/
│       │   ├── pages/
│       │   │   ├── LoginPage.jsx
│       │   │   ├── SignupPage.jsx
│       │   │   ├── UserDashboard.jsx
│       │   │   ├── UserTicketsPage.jsx
│       │   │   ├── TicketDetailPage.jsx
│       │   │   ├── CreateTicketPage.jsx
│       │   │   ├── ChatListPage.jsx
│       │   │   ├── ChatDetailPage.jsx
│       │   │   ├── UserSettingsPage.jsx
│       │   │   ├── admin/            # Dashboard, tiket, user, teknisi, chat monitor
│       │   │   └── technician/       # Dashboard, antrian, tiket, chat, settings
│       │   ├── components/
│       │   │   ├── common/           # LoadingSpinner, ProtectedRoute, ScrollToTop, SectionHeader
│       │   │   ├── modals/           # AddEditTechnicianModal, NewChatModal, UserEditModal, ConfirmTakeTicketDialog
│       │   │   ├── tickets/          # StatusBadge, UrgencyBadge, TechnicianCard, InsightCard
│       │   │   ├── chat/             # ChatMessage, ChatDetailReadOnly, MessageInput
│       │   │   ├── layout/           # AppSidebar, Header, MainLayout
│       │   │   └── ui/               # Komponen shadcn/ui (button, card, dialog, table, dll)
│       │   ├── contexts/             # AuthContext
│       │   ├── hooks/                # use-mobile, use-toast
│       │   ├── lib/                  # api.js, socket.js, utils.js, constants.js
│       │   ├── i18n/                 # Lokalisasi — en.json, id.json
│       │   └── styles/               # theme.css
│       └── plugins/                  # Vite plugins kustom
│
├── backend/                          # API Server — Node.js + Express
│   ├── src/
│   │   ├── server.js
│   │   ├── routes/                   # auth, tickets, chats, messages, users,
│   │   │                             #   technicians, dashboard, settings, uploads, health
│   │   ├── services/                 # ChatService, MessageService, TicketService, UserService
│   │   ├── middleware/               # auth, role, csrf, validation, errorHandler, apiVersioning
│   │   ├── utils/                    # logger, apiResponse, cache, auditLogger, swagger, metrics
│   │   ├── config/                   # db.js
│   │   └── socket/                   # Socket.IO handler
│   ├── scripts/                      # migrate, setup-db, backup-db, deploy-staging,
│   │                                 #   rollback-staging, smoke-test, load-test,
│   │                                 #   release-readiness, supply-chain-readiness,
│   │                                 #   synthetic-check, generate-sbom-lite, build-file-md-v2
│   ├── sql/
│   │   ├── schema.sql
│   │   └── migrations/               # 20260417_add_chat_message_indexes.sql, dll
│   ├── tests/                        # Unit tests (utils/) + integration tests (integration/)
│   └── monitoring/                   # prometheus.yml, grafana-dashboard.json, alerts.yml, promtail-config.yml
│
├── documentations/
│   ├── 01_System_Reference/          # Overview, arsitektur, DB, role & fitur, keamanan
│   ├── 02_API_Documentation/         # Dokumentasi endpoint API
│   ├── 03_Web_UI_Transformation/     # Catatan migrasi UI ke shadcn/ui + execution logs
│   ├── 04_Backend_Operational_Guides/# Incident response, SLO/SLI, supply chain, release governance
│   ├── 05_Release_and_Versioning/    # Changelog, catatan rilis v1.0
│   ├── 06_Delivery_Execution_Records/# Log eksekusi & execution plan per fase
│   ├── 07_Remediation_Program/       # Laporan remediation & testing (Workstream 01–08)
│   ├── 08_AI_Prompts_and_Workflows/  # Prompt AI dan panduan workflow
│   ├── 09_Legacy_Architecture/       # Arsitektur lama (referensi historis)
│   └── 10_Archive/                   # Arsip phase completion reports & REVISI_BESAR
│
├── .github/
│   └── workflows/                    # backend-ci, backend-ops, backend-release-governance,
│                                     #   backend-supply-chain, dependabot
└── package.json                      # Workspace root — scripts orkestrasi monorepo
```

---

## Prasyarat

| Komponen | Versi minimum |
|----------|--------------|
| Node.js | 18+ |
| npm | 9+ |
| MySQL | 8+ |
| Redis | Opsional (ada in-memory fallback) |

---

## Instalasi

```bash
# Install semua dependency (root + frontend + backend)
npm install
npm install --prefix apps/web
npm install --prefix backend
```

Salin dan isi file environment:

```bash
cp backend/.env.example backend/.env
# Edit backend/.env — isi DB_HOST, DB_USER, DB_PASSWORD, JWT_SECRET, dll
```

Setup database:

```bash
npm run db:setup --prefix backend
npm run db:migrate --prefix backend
```

---

## Menjalankan Project

### Development (frontend + backend sekaligus)

```bash
npm run dev
```

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:3001`

### Menjalankan terpisah

```bash
# Frontend saja
npm run dev --prefix apps/web

# Backend saja
npm run dev --prefix backend
```

---

## Build & Production

```bash
# Build frontend (output ke dist/apps/web/)
npm run build

# Jalankan backend production
npm run start
```

---

## Testing & Lint

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

## Operasional Backend

```bash
# Health check
npm run health:check --prefix backend

# Smoke test (post-deploy)
npm run smoke:test --prefix backend

# Release readiness check
npm run release:readiness --prefix backend

# Generate SBOM (software bill of materials)
npm run security:sbom --prefix backend

# Load test
npm run load:test --prefix backend

# Deploy / rollback staging
npm run deploy:staging --prefix backend
npm run rollback:staging --prefix backend
```

---

## Docker

```bash
# Build image
npm run docker:build --prefix backend

# Jalankan container
npm run docker:run --prefix backend

# Jalankan via Docker Compose
docker compose -f backend/docker-compose.yml up -d
```

---

## Dokumentasi

Dokumentasi lengkap tersimpan di [`documentations/`](documentations/README.md).

| Folder | Isi |
|--------|-----|
| [01_System_Reference](documentations/01_System_Reference/) | Referensi sistem (overview, arsitektur, DB, API, keamanan) |
| [02_API_Documentation](documentations/02_API_Documentation/) | Dokumentasi endpoint API |
| [03_Web_UI_Transformation](documentations/03_Web_UI_Transformation/) | Catatan migrasi UI ke shadcn/ui |
| [04_Backend_Operational_Guides](documentations/04_Backend_Operational_Guides/) | Incident response, SLO, release governance |
| [05_Release_and_Versioning](documentations/05_Release_and_Versioning/) | Changelog dan catatan rilis |
| [06_Delivery_Execution_Records](documentations/06_Delivery_Execution_Records/) | Log eksekusi per fase pengembangan |
| [07_Remediation_Program](documentations/07_Remediation_Program/) | Remediation & testing per workstream |
| [08_AI_Prompts_and_Workflows](documentations/08_AI_Prompts_and_Workflows/) | Prompt AI dan panduan workflow |