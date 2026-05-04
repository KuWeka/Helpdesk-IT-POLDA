Tanggal: 2026-04-19


## Arsitektur Umum

Sistem menggunakan arsitektur **Client-Server** yang dipisah secara penuh (decoupled) antara frontend dan backend:

```
┌─────────────────────────────────────────────────────────┐
│                    BROWSER (Client)                     │
│                                                         │
│   React SPA (Vite)  ←→  REST API (Axios HTTP)          │
│                     ←→  WebSocket (Socket.IO Client)    │
└────────────────────────────┬────────────────────────────┘
                             │
                    HTTPS / WSS
                             │
┌────────────────────────────▼────────────────────────────┐
│                  BACKEND (Node.js / Express)             │
│                                                         │
│   ┌──────────────┐   ┌────────────┐  ┌───────────────┐ │
│   │  REST Routes │   │ Socket.IO  │  │  Middleware   │ │
│   │  /api/...    │   │  Server    │  │  Auth/CSRF/   │ │
│   └──────┬───────┘   └─────┬──────┘  │  Rate Limit   │ │
│          │                 │         └───────────────┘ │
│   ┌──────▼─────────────────▼──────┐                    │
│   │         Service Layer         │                    │
│   │  TicketService / UserService  │                    │
│   └──────────────┬────────────────┘                    │
└─────────────────-│─────────────────────────────────────┘
                   │
        ┌──────────▼──────────┐
        │                     │
   ┌────▼─────┐        ┌──────▼──────┐
   │  MySQL   │        │    Redis    │
   │ Database │        │    Cache    │
   └──────────┘        └─────────────┘
```

---

## Stack Teknologi

### Frontend

| Teknologi               | Versi     | Fungsi                                       |
|-------------------------|-----------|----------------------------------------------|
| React                   | 18.3.1    | Library UI utama (SPA)                       |
| Vite                    | 7.x       | Build tool & dev server                      |
| React Router DOM        | v7        | Client-side routing                          |
| Tailwind CSS            | v3        | Utility-first CSS framework                  |
| shadcn/ui               | Latest    | Komponen UI berbasis Radix UI                |
| Radix UI                | Latest    | Accessible primitive components              |
| @tanstack/react-table   | 8.21.3    | Tabel data dengan sorting/filtering          |
| Axios                   | 1.6.0     | HTTP client untuk REST API calls             |
| Socket.IO Client        | 4.x       | WebSocket client untuk real-time chat        |
| React Hook Form         | 7.71.2    | Form state management & validation           |
| Zod / Joi               | —         | Schema validation untuk form                 |
| Framer Motion           | 11.15.0   | Animasi UI                                   |
| Recharts                | 2.x       | Grafik & chart untuk dashboard               |
| i18next / react-i18next | 23.x/14.x | Internasionalisasi (ID / EN)                 |
| Lucide React            | 0.469.0   | Icon library                                 |
| Sonner                  | Latest    | Toast notification system                    |
| next-themes             | 0.4.6     | Dark/light theme management                  |
| date-fns                | 4.1.0     | Utility manipulasi tanggal                   |
| Zustand / Context API   | —         | State management global                      |
| react-helmet            | 6.1.0     | Manajemen `<head>` tag per halaman           |
| clsx + CVA              | Latest    | Conditional CSS class utility                |

### Backend

| Teknologi               | Versi     | Fungsi                                       |
|-------------------------|-----------|----------------------------------------------|
| Node.js                 | 18+       | Runtime JavaScript server-side               |
| Express.js              | 4.19.2    | Web framework REST API                       |
| MySQL2                  | 3.9.7     | MySQL database driver (dengan connection pool)|
| Socket.IO               | 4.7.5     | WebSocket server untuk real-time             |
| jsonwebtoken (JWT)      | 9.0.2     | Autentikasi berbasis token                   |
| bcryptjs                | 2.4.3     | Hashing password                             |
| multer                  | 1.4.5-lts | Penanganan file upload                       |
| redis                   | 5.12.1    | Client Redis untuk caching                   |
| helmet                  | 8.1.0     | HTTP security headers                        |
| cors                    | 2.8.5     | Cross-Origin Resource Sharing                |
| express-rate-limit      | 8.3.2     | Rate limiting untuk endpoint sensitif        |
| express-validator       | 7.0.1     | Input validation middleware                  |
| joi                     | 18.1.2    | Schema validation                            |
| winston                 | 3.19.0    | Structured logging                           |
| winston-daily-rotate-file| 5.0.0   | Log rotation harian                          |
| prom-client             | 15.1.3    | Prometheus metrics collection                |
| compression             | 1.8.1     | Gzip response compression                   |
| uuid                    | 9.0.1     | UUID v4 generator untuk ID                   |
| swagger-jsdoc + swagger-ui-express | 6/5 | API dokumentasi otomatis          |
| dotenv                  | 16.4.5    | Environment variable loader                  |
| nodemon                 | 3.1.0     | Auto-restart dev server                      |
| Jest                    | 30.3.0    | Unit & integration testing                   |
| Supertest               | 7.2.2     | HTTP integration testing                     |

### Database & Infrastruktur

| Komponen      | Teknologi       | Keterangan                                     |
|---------------|-----------------|------------------------------------------------|
| Primary DB    | MySQL 8+        | Data utama (users, tickets, chats, messages)   |
| Cache Layer   | Redis           | Optional — fallback ke in-memory jika tidak ada|
| File Storage  | Local Filesystem| Direktori `backend/uploads/`                  |
| Containerisasi| Docker          | `docker-compose.yml` untuk stack lengkap       |
| Monitoring    | Prometheus      | Metrics via `/api/health/metrics`              |
| Log Aggregasi | Loki + Promtail | Konfigurasi di `monitoring/`                   |
| Dashboard Ops | Grafana         | `monitoring/grafana-dashboard.json`            |

---

## Struktur Port

| Service     | Port Default | Keterangan                       |
|-------------|-------------|----------------------------------|
| Frontend    | 3000        | Vite dev server / preview        |
| Backend API | 3001        | Express HTTP server              |
| MySQL       | 3306        | Database                         |
| Redis       | 6379        | Cache (opsional)                 |
| Prometheus  | 9090        | Metrics scraping                 |
| Grafana     | 3003        | Monitoring dashboard             |

---

## Pola Komunikasi

### REST API
Semua operasi CRUD menggunakan REST API dengan format respons standar:
```json
{
  "success": true,
  "data": { ... },
  "message": "Operasi berhasil",
  "pagination": {
    "page": 1,
    "perPage": 10,
    "total": 50,
    "totalPages": 5
  }
}
```

### WebSocket (Socket.IO)
Digunakan untuk:
- Notifikasi tiket baru ke teknisi (`new_ticket`)
- Pengiriman/penerimaan pesan chat real-time (`send_message`)
- Status baca pesan (`messages_read`)
- Bergabung/meninggalkan room chat (`join_chat`, `leave_chat`)
- Room khusus teknisi (`technicians`)

### Autentikasi Token
- **Access Token**: JWT, berlaku 1 jam, disimpan di `HttpOnly cookie`
- **Refresh Token**: JWT, berlaku 7 hari, disimpan di `HttpOnly cookie` path `/api/auth`
- **CSRF Token**: 64-char hex random, disimpan di readable cookie, dikirim via header `x-csrf-token`

---

## Environment Variables Backend

| Variable              | Default              | Keterangan                          |
|-----------------------|----------------------|-------------------------------------|
| `DB_HOST`             | localhost            | Host MySQL                          |
| `DB_USER`             | root                 | Username MySQL                      |
| `DB_PASS`             | —                    | Password MySQL                      |
| `DB_NAME`             | helpdesk_db          | Nama database                       |
| `DB_PORT`             | 3306                 | Port MySQL                          |
| `JWT_SECRET`          | (required)           | Secret key JWT (min 32 karakter)    |
| `JWT_EXPIRES`         | 1h                   | Durasi access token                 |
| `JWT_REFRESH_EXPIRES` | 7d                   | Durasi refresh token                |
| `REDIS_URL`           | redis://localhost:6379| URL Redis                           |
| `CORS_ORIGIN`         | http://localhost:5173| Allowed CORS origins                |
| `PORT`                | 3001                 | Port backend                        |
| `NODE_ENV`            | development          | Environment (development/production)|
| `UPLOAD_DIR`          | ./uploads            | Direktori upload file               |
| `MAX_FILE_SIZE`       | 5242880 (5MB)        | Batas ukuran file upload            |

---

## Alur Build & Deployment

### Development
```bash
# Frontend
npm run dev --prefix apps/web       # Jalankan Vite dev server di port 3000

# Backend
npm run dev --prefix backend        # Jalankan nodemon di port 3001
```

### Production Build
```bash
# Build frontend (output ke dist/apps/web)
npm run build --prefix apps/web

# Jalankan backend
npm run start --prefix backend
```

### Docker (Full Stack)
```bash
# Jalankan semua service (MySQL + Redis + Backend + Frontend)
docker-compose up -d
```

