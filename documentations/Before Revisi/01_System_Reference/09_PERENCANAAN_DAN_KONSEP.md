Tanggal: 2026-04-19


## Latar Belakang

Sistem ini dirancang untuk lingkungan organisasi (contoh: instansi kepolisian / perusahaan) yang memiliki:
- Banyak pengguna (staf/karyawan) yang menggunakan perangkat IT
- Tim IT terbatas yang harus menangani banyak gangguan secara efisien
- Kebutuhan akan visibilitas dan akuntabilitas penanganan masalah IT
- Kebutuhan komunikasi langsung antara pelapor dan teknisi

---

## Tujuan Perencanaan

| Tujuan                          | Solusi Teknis                                           |
|---------------------------------|---------------------------------------------------------|
| Sentralisasi pelaporan IT       | Sistem tiket terpusat dengan nomor unik per laporan     |
| Percepatan respons tim IT       | Antrian tiket real-time + notifikasi WebSocket          |
| Akuntabilitas teknisi           | Assignment tiket + audit trail + statistik kinerja      |
| Komunikasi transparan           | Chat real-time terhubung ke tiket                       |
| Visibilitas manajemen           | Dashboard admin dengan statistik dan grafik             |
| Skalabilitas                    | Caching Redis + connection pool + indeks database       |
| Keamanan data                   | JWT + CSRF + RBAC + bcrypt + parameterized query        |
| Kemudahan operasional           | Docker + health endpoints + automated backup scripts    |

---

## Fase Pengembangan

### Fase 1 — Core (Fondasi)
- Setup monorepo (apps/web + backend)
- Database schema & relasi
- Autentikasi JWT dengan refresh token
- CRUD tiket dasar
- CRUD user & teknisi
- Role-based routing & authorization

### Fase 2 — Real-time & Communication
- Integrasi Socket.IO (WebSocket)
- Sistem chat User ↔ Teknisi
- Notifikasi tiket baru ke teknisi
- Mark-read otomatis pesan

### Fase 3 — Dashboard & Analytics
- Dashboard per role dengan statistik
- Grafik top teknisi
- Caching Redis untuk dashboard
- Invalidasi cache saat data berubah

### Fase 4 — Operations & Security
- Middleware CSRF, rate limiting, helmet
- Audit logging (file + database)
- Upload lampiran (multer + whitelist)
- Health endpoints + Prometheus metrics
- Swagger API documentation

### Fase 5 — Monitoring & Deployment
- Docker + docker-compose
- Grafana dashboard JSON
- Prometheus + Promtail + Loki
- Smoke test & load test scripts
- Release readiness checks
- SBOM generation (supply chain security)

### Fase 6 — Frontend Polish
- Internasionalisasi (ID/EN)
- Tema dark/light dengan HSL CSS variables
- shadcn/ui component library
- Skeleton loading states
- Empty states
- Responsive layout

---

## Konsep Desain Sistem

### 1. Separation of Concerns
- **Frontend** (apps/web): Hanya UI + state management + API calls
- **Backend** (backend/src): Business logic, database, security
- **Database** (MySQL): Storage, constraints, indexes
- **Cache** (Redis): Performance layer, bukan sumber kebenaran utama

### 2. Stateless API
Backend sepenuhnya stateless — semua state disimpan di:
- **Database**: Data permanen
- **Redis**: Cache sementara (boleh hilang)
- **Client cookie**: Auth token
Tidak ada session server-side.

### 3. Role-based Multi-tenant
Satu database, satu codebase, tapi tiap pengguna hanya melihat data yang relevan dengan perannya. Pembatasan diterapkan di layer API (bukan hanya UI).

### 4. Event-driven Real-time
Komunikasi real-time menggunakan model pub-sub Socket.IO:
- Server sebagai event broker
- Client subscribe ke room tertentu (`chat:{id}`, `technicians`)
- Event dikirim point-to-point ke room yang relevan

### 5. Cache-aside Pattern
```
Request data
    │
    ▼
Cek cache
    ├── HIT → Return dari cache
    └── MISS → Query DB → Simpan ke cache → Return
```

Invalidasi cache dilakukan secara eksplisit saat data berubah (bukan TTL semata).

---

## Model Domain

### Entitas Utama

```
User ──────────────────────────── membuat ──── Ticket
  │                                               │
  │ melakukan percakapan dengan                   │ ditangani oleh
  │                                               │
Teknisi ──────────────── terlibat dalam ────── Ticket
  │
  │ memiliki
  │
TechnicianSettings

Ticket ──────── memiliki ──── TicketAttachment (N)
Ticket ──────── memiliki ──── TicketNote (N, dari Teknisi)

User ──── memiliki ──── Chat ──── memiliki ──── Message (N)
Teknisi ─────────────────/

Admin ──── mencatat ──── ActivityLog

Division ──── mengelompokkan ──── User (N)
```

---

## Keputusan Arsitektur

### Mengapa MySQL bukan NoSQL?
- Data terstruktur dengan relasi yang jelas (tiket → user → teknisi → divisi)
- Kebutuhan join query untuk dashboard
- ACID compliance untuk konsistensi data tiket
- Kemudahan backup dan restore

### Mengapa JWT bukan Session?
- Stateless — tidak perlu session store
- Mudah di-scale horizontal
- Kompatibel dengan mobile client di masa depan
- Refresh token pattern memberikan keamanan yang baik

### Mengapa Redis Optional?
- Sistem tetap fungsional tanpa Redis (fallback graceful)
- Redis meningkatkan performa tapi bukan dependency kritis
- Memudahkan setup development lokal

### Mengapa Socket.IO bukan SSE atau Long Polling?
- Duplex communication (kirim & terima dari kedua arah)
- Room-based broadcasting yang efisien
- Auto-reconnect built-in
- Dukungan fallback ke HTTP long-polling jika WebSocket tidak tersedia

### Mengapa Monorepo?
- Satu repository untuk frontend dan backend
- Mudah koordinasi perubahan yang mempengaruhi keduanya
- Satu CI/CD pipeline
- Berbagi tipe/konstanta di masa depan

---

## Skalabilitas & Pertimbangan Produksi

### Database
- Connection pool MySQL (default: dikonfigurasi via `mysql2/promise`)
- Index pada kolom yang sering di-query: `status`, `user_id`, `assigned_technician_id`, composite indexes untuk dashboard
- Partisi tabel `tickets` dapat dipertimbangkan jika data sangat besar

### Backend
- Dapat di-scale horizontal (stateless, JWT tidak perlu shared session)
- Redis sebagai shared cache jika ada multiple instance
- Load balancer di depan multiple backend instance
- Sticky sessions untuk WebSocket (atau Redis adapter untuk Socket.IO)

### Frontend
- Build output adalah static files (`dist/apps/web`)
- Dapat di-deploy ke CDN (Cloudflare, CloudFront)
- Code splitting otomatis via Vite

### Monitoring
- Prometheus metrics di `/api/health/metrics`
- Grafana dashboard sudah tersedia di `monitoring/grafana-dashboard.json`
- Alert rules di `monitoring/alerts.yml`
- Log aggregation dengan Loki + Promtail

---

## Rencana Pengembangan Mendatang (Roadmap)

| Fitur                          | Prioritas | Deskripsi                                      |
|--------------------------------|-----------|------------------------------------------------|
| Notifikasi Email               | Tinggi    | Kirim email saat status tiket berubah          |
| Notifikasi Push Browser        | Sedang    | Web Push API untuk notifikasi offline          |
| Integrasi WhatsApp nyata       | Sedang    | Kirim notifikasi via WhatsApp Business API     |
| SLA & Escalation               | Tinggi    | Alert jika tiket belum ditangani setelah X jam |
| Laporan & Ekspor               | Sedang    | Export tiket ke PDF/Excel                      |
| Rating Kepuasan                | Rendah    | User dapat memberi rating setelah tiket selesai|
| Kategori & Tag Tiket           | Sedang    | Klasifikasi tiket berdasarkan kategori         |
| Mobile App                     | Rendah    | React Native app menggunakan API yang sama     |
| SSO / LDAP Integration         | Tinggi    | Login dengan akun organisasi (Active Directory)|
| Multi-tenancy                  | Rendah    | Support beberapa organisasi dalam satu instance|

