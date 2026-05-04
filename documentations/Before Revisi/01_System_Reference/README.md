Tanggal: 2026-04-19


## IT Helpdesk System — ProjectPolda
**Versi Dokumentasi:** 1.0  
**Tanggal:** April 2026

---

## File Dokumentasi

| No | File | Deskripsi |
|----|------|-----------|
| 01 | [01_OVERVIEW.md](./01_OVERVIEW.md) | Gambaran umum proyek, tujuan, konsep utama, dan ringkasan fitur |
| 02 | [02_ARSITEKTUR_SISTEM.md](./02_ARSITEKTUR_SISTEM.md) | Arsitektur teknis, stack teknologi, port, environment variables |
| 03 | [03_DATABASE.md](./03_DATABASE.md) | Skema database lengkap, semua tabel, kolom, index, relasi, migrasi |
| 04 | [04_ROLE_DAN_FITUR.md](./04_ROLE_DAN_FITUR.md) | Tiga peran (Admin/Teknisi/User), fitur per role, permission matrix |
| 05 | [05_BACKEND_API.md](./05_BACKEND_API.md) | Dokumentasi semua REST API endpoint, WebSocket events, format respons |
| 06 | [06_ALUR_DAN_LOGIKA.md](./06_ALUR_DAN_LOGIKA.md) | Alur bisnis: autentikasi, tiket, chat, caching, RBAC, audit |
| 07 | [07_KEAMANAN.md](./07_KEAMANAN.md) | Lapisan keamanan, JWT, CSRF, rate limit, SQL injection prevention |
| 08 | [08_CARA_PENGGUNAAN.md](./08_CARA_PENGGUNAAN.md) | Panduan setup, cara pakai per role, operasional, troubleshooting |
| 09 | [09_PERENCANAAN_DAN_KONSEP.md](./09_PERENCANAAN_DAN_KONSEP.md) | Latar belakang, fase pengembangan, keputusan arsitektur, roadmap |

---

## Ringkasan Cepat

### Stack
- **Frontend:** React 18 + Vite + Tailwind CSS v3 + shadcn/ui + React Router v7
- **Backend:** Node.js + Express.js + Socket.IO
- **Database:** MySQL 8+ + Redis (opsional)
- **Auth:** JWT (HttpOnly cookie) + CSRF double-submit
- **Language:** JavaScript (ES Modules di frontend, CommonJS di backend)

### 3 Peran Pengguna
| Peran    | Kapabilitas Utama                                           |
|----------|-------------------------------------------------------------|
| User     | Buat tiket, pantau status, chat dengan teknisi              |
| Teknisi  | Ambil tiket dari antrian, update status, chat dengan user   |
| Admin    | Kelola semua data, assign tiket, monitor, konfigurasi sistem|

### Database: 10 Tabel
`divisions`, `users`, `system_settings`, `technician_settings`, `tickets`, `ticket_attachments`, `ticket_notes`, `chats`, `messages`, `activity_logs`

### Akun Default
```
Email    : admin@admin.com
Password : Admin123!
Role     : Admin
```

### Perintah Penting
```bash
# Development
npm run dev --prefix apps/web      # Frontend: http://localhost:3000
npm run dev --prefix backend       # Backend:  http://localhost:3001

# Setup
npm run db:setup --prefix backend  # Inisialisasi database

# Production
npm run build --prefix apps/web    # Build frontend
npm run start --prefix backend     # Jalankan backend

# Docker
docker-compose up -d               # Jalankan full stack
```

