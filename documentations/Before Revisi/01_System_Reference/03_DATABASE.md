Tanggal: 2026-04-19


## Nama Database
```
helpdesk_db
```

---

## Daftar Tabel

| Tabel                  | Deskripsi                                              |
|------------------------|--------------------------------------------------------|
| `divisions`            | Data divisi/departemen pengguna                        |
| `users`                | Semua akun pengguna (User, Teknisi, Admin)             |
| `system_settings`      | Konfigurasi global aplikasi                            |
| `technician_settings`  | Pengaturan spesifik per teknisi                        |
| `tickets`              | Data tiket gangguan IT                                 |
| `ticket_attachments`   | File lampiran yang diunggah pada tiket                 |
| `ticket_notes`         | Catatan internal teknisi pada tiket                    |
| `chats`                | Sesi percakapan antara User dan Teknisi                |
| `messages`             | Pesan individual dalam sebuah sesi chat                |
| `activity_logs`        | Log semua aksi admin untuk audit trail                 |

---

## Skema Tabel Detail

### 1. `divisions`
Menyimpan data divisi/departemen organisasi.

```sql
CREATE TABLE divisions (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  description TEXT,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

| Kolom       | Tipe         | Keterangan              |
|-------------|--------------|-------------------------|
| id          | INT (PK, AI) | Primary key             |
| name        | VARCHAR(100) | Nama divisi             |
| description | TEXT         | Deskripsi divisi        |
| created_at  | TIMESTAMP    | Waktu dibuat            |
| updated_at  | TIMESTAMP    | Waktu terakhir diubah   |

**Seed data:** IT, HR, Finance

---

### 2. `users`
Tabel pusat untuk semua akun dalam sistem.

```sql
CREATE TABLE users (
  id            VARCHAR(36) PRIMARY KEY,      -- UUID v4
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(100) NOT NULL UNIQUE,
  username      VARCHAR(50) UNIQUE DEFAULT NULL,
  password_hash VARCHAR(255) NOT NULL,         -- bcrypt hash (12 rounds)
  phone         VARCHAR(20),
  role          ENUM('Admin','Teknisi','User') DEFAULT 'User',
  is_active     BOOLEAN DEFAULT TRUE,
  division_id   INT NULL,
  language      VARCHAR(10) DEFAULT 'ID',
  theme         ENUM('light','dark','system') DEFAULT 'light',
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (division_id) REFERENCES divisions(id) ON DELETE SET NULL,
  INDEX idx_users_role_is_active (role, is_active)
);
```

| Kolom         | Tipe                        | Keterangan                              |
|---------------|-----------------------------|-----------------------------------------|
| id            | VARCHAR(36) PK              | UUID v4                                 |
| name          | VARCHAR(100)                | Nama lengkap                            |
| email         | VARCHAR(100) UNIQUE NOT NULL| Email, digunakan untuk login            |
| username      | VARCHAR(50) UNIQUE          | Username alternatif untuk login         |
| password_hash | VARCHAR(255)                | Hash bcrypt (12 rounds)                 |
| phone         | VARCHAR(20)                 | Nomor telepon                           |
| role          | ENUM                        | `Admin`, `Teknisi`, atau `User`         |
| is_active     | BOOLEAN                     | Status akun aktif/nonaktif              |
| division_id   | INT FK → divisions.id       | Divisi pengguna (nullable)              |
| language      | VARCHAR(10)                 | Preferensi bahasa: `ID` atau `EN`       |
| theme         | ENUM                        | `light`, `dark`, atau `system`          |

**Index:** `(role, is_active)` untuk filter cepat berdasarkan peran dan status aktif.

**Seed data:** `admin@admin.com` / password `Admin123!`

---

### 3. `system_settings`
Konfigurasi global satu baris (singleton).

```sql
CREATE TABLE system_settings (
  id               INT PRIMARY KEY,
  app_name         VARCHAR(100) DEFAULT 'IT Helpdesk',
  app_description  TEXT,
  maintenance_mode BOOLEAN DEFAULT FALSE,
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

| Kolom            | Tipe         | Keterangan                              |
|------------------|--------------|-----------------------------------------|
| id               | INT PK       | Selalu bernilai `1` (singleton)         |
| app_name         | VARCHAR(100) | Nama aplikasi yang ditampilkan          |
| app_description  | TEXT         | Deskripsi singkat aplikasi              |
| maintenance_mode | BOOLEAN      | Jika `TRUE`, sistem dalam mode maintenance|

---

### 4. `technician_settings`
Pengaturan operasional per teknisi.

```sql
CREATE TABLE technician_settings (
  user_id           VARCHAR(36) PRIMARY KEY,
  is_active         BOOLEAN DEFAULT TRUE,
  shift_start       TIME DEFAULT '08:00:00',
  shift_end         TIME DEFAULT '17:00:00',
  specializations   JSON,
  max_active_tickets INT DEFAULT 5,
  wa_notification   BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

| Kolom              | Tipe          | Keterangan                                  |
|--------------------|---------------|---------------------------------------------|
| user_id            | VARCHAR(36) PK FK | ID teknisi dari tabel users             |
| is_active          | BOOLEAN       | Status aktif teknisi (menerima tiket)       |
| shift_start        | TIME          | Jam mulai shift kerja                       |
| shift_end          | TIME          | Jam akhir shift kerja                       |
| specializations    | JSON          | Array string spesialisasi, contoh: `["Networking","Hardware"]` |
| max_active_tickets | INT           | Batas maksimum tiket aktif bersamaan        |
| wa_notification    | BOOLEAN       | Aktifkan notifikasi WhatsApp                |

---

### 5. `tickets`
Tabel inti sistem — setiap tiket gangguan IT.

```sql
CREATE TABLE tickets (
  id                    VARCHAR(36) PRIMARY KEY,   -- UUID v4
  ticket_number         VARCHAR(50) UNIQUE NOT NULL, -- Format: TKT-XXXXNNNN
  title                 VARCHAR(255) NOT NULL,
  description           TEXT NOT NULL,
  location              VARCHAR(255),
  urgency               ENUM('Rendah','Sedang','Tinggi','Kritis') DEFAULT 'Sedang',
  status                ENUM('Pending','Proses','Selesai','Ditolak','Dibatalkan') DEFAULT 'Pending',
  user_id               VARCHAR(36) NOT NULL,
  assigned_technician_id VARCHAR(36) NULL,
  closed_at             TIMESTAMP NULL,
  created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_technician_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_status (status),
  INDEX idx_user_id (user_id),
  INDEX idx_tech_id (assigned_technician_id),
  INDEX idx_tickets_status_created_at (status, created_at),
  INDEX idx_tickets_status_closed_at (status, closed_at)
);
```

| Kolom                   | Tipe           | Keterangan                                     |
|-------------------------|----------------|------------------------------------------------|
| id                      | VARCHAR(36) PK | UUID v4                                        |
| ticket_number           | VARCHAR(50)    | Nomor tiket unik, format `TKT-{timestamp}{random}` |
| title                   | VARCHAR(255)   | Judul singkat masalah                          |
| description             | TEXT           | Deskripsi lengkap masalah                      |
| location                | VARCHAR(255)   | Lokasi fisik terjadinya masalah                |
| urgency                 | ENUM           | `Rendah`, `Sedang`, `Tinggi`, `Kritis`         |
| status                  | ENUM           | `Pending`, `Proses`, `Selesai`, `Ditolak`, `Dibatalkan` |
| user_id                 | FK → users.id  | Pelapor tiket                                  |
| assigned_technician_id  | FK → users.id  | Teknisi yang ditugaskan (nullable)             |
| closed_at               | TIMESTAMP      | Waktu tiket diselesaikan/ditolak               |

**Index:** 5 index termasuk composite index untuk query dashboard yang sering dijalankan.

#### Siklus Status Tiket
```
[Dibuat oleh User]
      │
      ▼
  Pending  ──────────────────────────► Ditolak   (oleh Teknisi/Admin)
      │
      │ (Teknisi mengambil / Admin assign)
      ▼
   Proses  ──────────────────────────► Dibatalkan (oleh User atau Admin)
      │
      │ (Teknisi menyelesaikan)
      ▼
  Selesai
```

---

### 6. `ticket_attachments`
File lampiran yang diunggah bersamaan atau setelah tiket dibuat.

```sql
CREATE TABLE ticket_attachments (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  ticket_id  VARCHAR(36) NOT NULL,
  file_name  VARCHAR(255) NOT NULL,
  file_path  VARCHAR(500) NOT NULL,
  file_size  INT,
  mime_type  VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
);
```

| Kolom     | Tipe           | Keterangan                           |
|-----------|----------------|--------------------------------------|
| id        | INT (PK, AI)   | Primary key                          |
| ticket_id | FK → tickets.id| Tiket yang memiliki lampiran         |
| file_name | VARCHAR(255)   | Nama file original                   |
| file_path | VARCHAR(500)   | Path file di server                  |
| file_size | INT            | Ukuran file dalam byte               |
| mime_type | VARCHAR(100)   | Tipe MIME file                       |

**Batasan upload:** Maksimum 5 file per request, 5MB per file, tipe file divalidasi whitelist.

---

### 7. `ticket_notes`
Catatan internal dari teknisi pada tiket (tidak terlihat oleh User).

```sql
CREATE TABLE ticket_notes (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  ticket_id      VARCHAR(36) NOT NULL,
  technician_id  VARCHAR(36) NOT NULL,
  note_content   TEXT NOT NULL,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
  FOREIGN KEY (technician_id) REFERENCES users(id) ON DELETE CASCADE
);
```

---

### 8. `chats`
Sesi percakapan antara satu User dan satu Teknisi, opsional terhubung ke tiket.

```sql
CREATE TABLE chats (
  id            VARCHAR(36) PRIMARY KEY,
  user_id       VARCHAR(36) NOT NULL,
  technician_id VARCHAR(36) NOT NULL,
  ticket_id     VARCHAR(36) NULL,
  status        ENUM('Open','Closed') DEFAULT 'Open',
  last_message  TEXT,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (technician_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE SET NULL,
  INDEX idx_chats_user_id (user_id),
  INDEX idx_chats_technician_id (technician_id),
  INDEX idx_chats_ticket_id (ticket_id),
  INDEX idx_chats_updated_at (updated_at)
);
```

| Kolom         | Tipe           | Keterangan                              |
|---------------|----------------|-----------------------------------------|
| id            | VARCHAR(36) PK | UUID v4                                 |
| user_id       | FK → users.id  | Pengguna dalam chat                     |
| technician_id | FK → users.id  | Teknisi dalam chat                      |
| ticket_id     | FK → tickets.id| Tiket yang terkait (nullable)           |
| status        | ENUM           | `Open` atau `Closed`                   |
| last_message  | TEXT           | Isi pesan terakhir (preview)            |

---

### 9. `messages`
Setiap pesan individual dalam sebuah sesi chat.

```sql
CREATE TABLE messages (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  chat_id         VARCHAR(36) NOT NULL,
  sender_id       VARCHAR(36) NOT NULL,
  sender_role     ENUM('User','Teknisi','Admin') NOT NULL,
  message_content TEXT NOT NULL,
  is_read         BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_messages_chat_id_created_at (chat_id, created_at),
  INDEX idx_messages_sender_id (sender_id),
  INDEX idx_messages_created_at (created_at)
);
```

| Kolom           | Tipe         | Keterangan                              |
|-----------------|--------------|-----------------------------------------|
| id              | INT (PK, AI) | Primary key                             |
| chat_id         | FK → chats.id| Chat tempat pesan ini berada            |
| sender_id       | FK → users.id| Pengirim pesan                          |
| sender_role     | ENUM         | Role pengirim saat mengirim             |
| message_content | TEXT         | Isi pesan                               |
| is_read         | BOOLEAN      | Status baca oleh penerima               |

**Auto-mark read:** Saat recipient membuka chat, semua pesan yang belum dibaca otomatis di-update `is_read = 1` dan event `messages_read` dikirim via WebSocket.

---

### 10. `activity_logs`
Audit trail untuk aksi-aksi penting yang dilakukan admin.

```sql
CREATE TABLE activity_logs (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  admin_id    VARCHAR(36) NULL,
  action_type VARCHAR(100) NOT NULL,
  target_type VARCHAR(100) NOT NULL,
  target_id   VARCHAR(100) NULL,
  details     JSON,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE SET NULL
);
```

| Kolom       | Tipe           | Keterangan                              |
|-------------|----------------|-----------------------------------------|
| id          | INT (PK, AI)   | Primary key                             |
| admin_id    | FK → users.id  | Admin yang melakukan aksi (nullable)    |
| action_type | VARCHAR(100)   | Jenis aksi, contoh: `CREATE_USER`       |
| target_type | VARCHAR(100)   | Objek yang dikenai, contoh: `users`     |
| target_id   | VARCHAR(100)   | ID objek yang dikenai (nullable)        |
| details     | JSON           | Detail tambahan aksi (bebas)            |

---

## Entity Relationship Diagram (Teks)

```
divisions ──────────────────── users
    1                            N

users (role=User) ─────────── tickets ─────────── users (role=Teknisi)
    1                            N                      1
    │                            │
    │                            ├──────── ticket_attachments (N)
    │                            └──────── ticket_notes (N) ─── users (Teknisi)
    │
    ├─ chats ─── users (Teknisi)
    │     │
    │     └──────── messages (N)
    │
    └─ activity_logs (admin_id)

system_settings  (singleton, id=1)
technician_settings  (1:1 dengan users role=Teknisi)
```

---

## Migrasi Database

File migrasi berada di `backend/sql/migrations/`:

| File                                    | Perubahan                                      |
|-----------------------------------------|------------------------------------------------|
| `20260417_add_chat_message_indexes.sql` | Tambah composite indexes pada tabel chats dan messages untuk performa query |

---

## Menjalankan Setup Database

```bash
# Setup database awal (buat tabel + seed data)
npm run db:setup --prefix backend

# Jalankan migrasi terbaru
npm run db:migrate --prefix backend

# Backup database
npm run db:backup --prefix backend
```

