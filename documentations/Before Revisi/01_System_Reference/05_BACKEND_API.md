Tanggal: 2026-04-19


## Base URL
```
http://localhost:3001/api
```

## Format Respons Standar

### Sukses (Single Resource)
```json
{
  "success": true,
  "data": { ... },
  "message": "Operasi berhasil"
}
```

### Sukses (Paginated List)
```json
{
  "success": true,
  "items": [ ... ],
  "totalItems": 50,
  "page": 1,
  "perPage": 10,
  "totalPages": 5
}
```

### Error
```json
{
  "success": false,
  "message": "Deskripsi error",
  "errors": [ "detail error 1", "detail error 2" ]
}
```

---

## Autentikasi

Semua endpoint yang memerlukan autentikasi menggunakan middleware `auth` yang memvalidasi JWT dari:
1. Header `Authorization: Bearer <token>`, ATAU
2. Cookie `helpdesk_access_token` (HttpOnly)

### POST /api/auth/login
Login menggunakan email atau username.

**Body:**
```json
{
  "identifier": "admin@admin.com",
  "password": "Admin123!"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": { "id": "...", "name": "Super Admin", "role": "Admin", ... },
    "csrfToken": "64-char-hex-string"
  },
  "message": "Login berhasil"
}
```

**Set Cookies:**
- `helpdesk_access_token` (HttpOnly, berlaku 1 jam)
- `helpdesk_refresh_token` (HttpOnly, path=/api/auth, berlaku 7 hari)
- `helpdesk_csrf_token` (readable, berlaku 7 hari)

**Rate Limit:** 5 percobaan per 15 menit per IP

---

### POST /api/auth/register
Daftar akun User baru (publik, tidak perlu auth).

**Body:**
```json
{
  "name": "Budi Santoso",
  "email": "budi@example.com",
  "password": "Password123!",
  "phone": "081234567890"
}
```

**Rate Limit:** 3 percobaan per jam per IP

---

### POST /api/auth/refresh
Memperbarui access token menggunakan refresh token.

**Cookies required:** `helpdesk_refresh_token`  
**Response:** Set cookie access token baru

---

### POST /api/auth/logout
Menghapus semua auth cookies.

**Auth required:** Ya  
**Response:** Hapus semua cookie (access, refresh, csrf)

---

### GET /api/auth/me
Mendapatkan data pengguna saat ini berdasarkan token.

**Auth required:** Ya

---

## Users API

### GET /api/users
Daftar pengguna.

**Auth:** Admin, Teknisi  
**Query params:**
| Param     | Tipe    | Keterangan                              |
|-----------|---------|-----------------------------------------|
| role      | string  | Filter: `Admin`, `Teknisi`, `User`      |
| is_active | boolean | Filter status aktif                     |
| search    | string  | Cari nama atau email                    |
| page      | number  | Nomor halaman                           |
| perPage   | number  | Jumlah per halaman                      |
| sort      | string  | Kolom sorting                           |
| order     | string  | `asc` atau `desc`                       |

---

### GET /api/users/:id
Detail satu pengguna.

**Auth:** Admin (semua), User/Teknisi (hanya milik sendiri)

---

### POST /api/users
Buat pengguna baru.

**Auth:** Admin  
**Body:**
```json
{
  "name": "...",
  "email": "...",
  "password": "...",
  "phone": "...",
  "role": "User"
}
```

---

### PATCH /api/users/:id
Update data pengguna.

**Auth:** Admin (semua), User/Teknisi (hanya milik sendiri)  
**Body:** Field yang ingin diubah (partial update)

---

### DELETE /api/users/:id
Hapus pengguna.

**Auth:** Admin

---

## Tickets API

### GET /api/tickets
Daftar tiket dengan filtering.

**Auth:** Semua role  
**Filtering otomatis berdasarkan role:**
- `User`: hanya melihat tiket milik sendiri
- `Teknisi`: default hanya tiket yang di-assign ke dirinya; `?unassigned=true` untuk antrian
- `Admin`: melihat semua tiket

**Query params:**
| Param                  | Tipe    | Keterangan                     |
|------------------------|---------|--------------------------------|
| status                 | string  | Filter status tiket            |
| urgency                | string  | Filter urgensi                 |
| unassigned             | boolean | Teknisi: lihat tiket tak-assign|
| search                 | string  | Cari judul/nomor tiket         |
| page, perPage          | number  | Paginasi                       |
| sort, order            | string  | Sorting                        |

---

### GET /api/tickets/:id
Detail tiket.

**Auth:** Semua role  
**Otorisasi:** User hanya bisa melihat tiket milik sendiri

**Response include:**
- Data tiket lengkap
- Nama & email pelapor
- Nama teknisi yang ditugaskan
- Nama divisi pelapor

---

### POST /api/tickets
Buat tiket baru.

**Auth:** User (otomatis menggunakan user_id dari token)  
**Body:**
```json
{
  "title": "Komputer tidak bisa menyala",
  "description": "Setelah ditekan tombol power, tidak ada reaksi apapun...",
  "location": "Ruang Rapat Lt.3",
  "urgency": "Tinggi"
}
```

**Side effects:**
- Emit WebSocket event `new_ticket` ke room `technicians`
- Invalidasi semua cache dashboard

---

### PATCH /api/tickets/:id
Update tiket (status, assign, dll).

**Auth:** Semua role (dengan batasan)  
**Body:** Partial update dari field: `status`, `assigned_technician_id`, `closed_at`, `title`, `description`

---

### DELETE /api/tickets/:id
Hapus tiket.

**Auth:** Admin

---

## Technicians API

### GET /api/technicians
Daftar semua teknisi beserta `technician_settings`.

**Auth:** Semua role

---

### GET /api/technicians/:userId
Detail satu teknisi.

**Auth:** Admin (semua), Teknisi (hanya milik sendiri)

---

### POST /api/technicians
Buat akun teknisi baru.

**Auth:** Admin  
**Side effects:** Auto-create record `technician_settings`

---

### PATCH /api/technicians/:userId
Update data teknisi (termasuk settings).

**Auth:** Admin, Teknisi (hanya milik sendiri)

---

### DELETE /api/technicians/:userId
Hapus teknisi.

**Auth:** Admin

---

## Chats API

### GET /api/chats
Daftar sesi chat.

**Auth:** Semua role  
**Filtering otomatis:**
- `User`: hanya chat milik sendiri
- `Teknisi`: hanya chat yang melibatkan dirinya
- `Admin`: semua chat

---

### GET /api/chats/:id
Detail satu sesi chat.

**Auth:** Semua role  
**Otorisasi:** User/Teknisi hanya bisa akses chat yang melibatkan dirinya

---

### POST /api/chats
Buat sesi chat baru.

**Auth:** User (start chat dengan teknisi)  
**Body:**
```json
{
  "technician_id": "...",
  "ticket_id": "..."  // opsional
}
```

---

### PATCH /api/chats/:id
Update status chat (Open/Closed).

**Auth:** Teknisi, Admin

---

## Messages API

### GET /api/messages
Daftar pesan dari satu chat.

**Auth:** Semua role  
**Query params required:** `chat_id`  
**Side effects:** Auto-mark pesan sebagai `is_read = TRUE` + emit WebSocket `messages_read`

---

### POST /api/messages
Kirim pesan baru.

**Auth:** User, Teknisi  
**Body:**
```json
{
  "chat_id": "...",
  "message_content": "Halo, masalah saya adalah..."
}
```

**Side effects:**
- Emit WebSocket event `new_message` ke room `chat:{chatId}`
- Update `last_message` di tabel `chats`

---

## Dashboard API

### GET /api/dashboard/admin-summary
Ringkasan data dashboard admin.

**Auth:** Admin  
**Cache:** Redis, 60 detik  
**Query:** `?refresh=true` untuk bypass cache

**Response data:**
```json
{
  "stats": {
    "total": 150,
    "pending": 20,
    "proses": 35,
    "selesai": 95,
    "activeTechs": 8,
    "totalUsers": 200
  },
  "tables": {
    "pending": [ ...10 tiket ],
    "proses": [ ...10 tiket ],
    "selesai": [ ...10 tiket ]
  },
  "chartData": [
    { "name": "Budi", "total": 25 },
    { "name": "Sari", "total": 20 }
  ]
}
```

---

### GET /api/dashboard/technician-summary
Ringkasan data dashboard teknisi.

**Auth:** Teknisi  
**Cache:** Redis per teknisi ID, 60 detik

---

### GET /api/dashboard/user-summary
Ringkasan data dashboard user.

**Auth:** User  
**Cache:** Redis per user ID, 60 detik

---

## Settings API

### GET /api/settings
Ambil konfigurasi sistem (publik, tidak perlu auth).

---

### PATCH /api/settings
Update konfigurasi sistem.

**Auth:** Admin  
**Body:**
```json
{
  "app_name": "IT Helpdesk Polda",
  "app_description": "Sistem helpdesk untuk...",
  "maintenance_mode": false
}
```

---

## Uploads API

### POST /api/uploads/ticket/:ticketId
Upload lampiran ke tiket.

**Auth:** User (yang memiliki tiket)  
**Content-Type:** `multipart/form-data`  
**Field:** `files` (multiple)  
**Batasan:** Maksimum 5 file, 5MB per file  
**Tipe yang diizinkan:** jpg, jpeg, png, gif, pdf, doc, docx, xls, xlsx, txt, zip

---

### GET /api/uploads/ticket/:ticketId
Daftar lampiran pada tiket.

**Auth:** Semua role yang berhak lihat tiket tersebut

---

## Health & Monitoring API

### GET /api/health/live
Liveness check.

**Response:** `{ "status": "ok", "timestamp": "..." }`

### GET /api/health/ready
Readiness check (cek koneksi DB dan Redis).

**Response:** `{ "status": "ready", "db": "ok", "redis": "ok" }`

### GET /api/health/metrics
Prometheus metrics endpoint (teks format).

**Response:** Plain text Prometheus metrics format

---

## Swagger / API Docs

Dokumentasi API interaktif tersedia di:
```
http://localhost:3001/api-docs
```

---

## WebSocket Events

### Client → Server

| Event             | Payload        | Keterangan                          |
|-------------------|----------------|-------------------------------------|
| `join_chat`       | `chatId`       | Masuk ke room chat tertentu         |
| `leave_chat`      | `chatId`       | Keluar dari room chat               |
| `join_technicians`| —              | Masuk ke room broadcast teknisi     |

### Server → Client

| Event             | Payload                          | Keterangan                          |
|-------------------|----------------------------------|-------------------------------------|
| `new_ticket`      | `{ id, ticket_number, title, urgency, status }` | Ada tiket baru (ke room `technicians`) |
| `new_message`     | message object                   | Ada pesan baru (ke room `chat:{id}`) |
| `messages_read`   | `{ chat_id, reader_id, read_count }` | Pesan dibaca (ke room `chat:{id}`) |

