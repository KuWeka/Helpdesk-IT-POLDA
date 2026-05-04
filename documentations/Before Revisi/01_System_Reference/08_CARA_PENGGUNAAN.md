Tanggal: 2026-04-19


## Prasyarat

### Software yang Diperlukan
| Software    | Versi Minimum | Keterangan                          |
|-------------|---------------|-------------------------------------|
| Node.js     | 18.x LTS      | Runtime JavaScript                  |
| npm         | 9.x           | Package manager                     |
| MySQL       | 8.0+          | Database utama                      |
| Redis       | 6.x+          | Cache (opsional, sistem tetap jalan)|
| Docker      | 24+           | Untuk deployment dengan Docker      |

---

## Setup Awal (Fresh Install)

### Langkah 1: Clone & Install Dependencies

```bash
# Clone repository
git clone <repo-url>
cd projectpolda

# Install semua dependencies (root + apps/web + backend)
npm install
```

### Langkah 2: Konfigurasi Environment Backend

Buat file `backend/.env` dengan isi berikut:

```env
# Database
DB_HOST=localhost
DB_USER=root
DB_PASS=password_anda
DB_NAME=helpdesk_db
DB_PORT=3306

# JWT (WAJIB — minimum 32 karakter)
JWT_SECRET=your-super-secret-jwt-key-minimum-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-key-minimum-32-chars
JWT_EXPIRES=1h
JWT_REFRESH_EXPIRES=7d

# Server
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000

# Redis (opsional)
REDIS_URL=redis://localhost:6379

# Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=5242880

# Cookie Names (opsional, ada default)
ACCESS_TOKEN_COOKIE_NAME=helpdesk_access_token
REFRESH_TOKEN_COOKIE_NAME=helpdesk_refresh_token
CSRF_COOKIE_NAME=helpdesk_csrf_token
```

### Langkah 3: Setup Database

```bash
# Pastikan MySQL berjalan dan dapat diakses
# Jalankan script setup (buat database, tabel, seed data)
npm run db:setup --prefix backend

# Atau jalankan SQL manual:
mysql -u root -p < backend/sql/schema.sql

# Jalankan migrasi terbaru
npm run db:migrate --prefix backend
```

### Langkah 4: Jalankan Aplikasi (Development)

```bash
# Terminal 1: Jalankan backend
npm run dev --prefix backend
# Backend berjalan di http://localhost:3001

# Terminal 2: Jalankan frontend
npm run dev --prefix apps/web
# Frontend berjalan di http://localhost:3000
```

### Langkah 5: Akses Aplikasi

Buka browser ke `http://localhost:3000`

**Akun Default (Seed Data):**
| Role  | Email              | Password   |
|-------|--------------------|------------|
| Admin | admin@admin.com    | Admin123!  |

---

## Menjalankan dengan Docker

```bash
# Start semua service (MySQL + Redis + Backend)
cd backend
docker-compose up -d

# Cek status container
docker-compose ps

# Lihat log backend
docker-compose logs -f app

# Stop semua
docker-compose down
```

File `docker-compose.yml` sudah mencakup:
- MySQL 8 dengan healthcheck
- Redis
- Backend Node.js
- Volume untuk data persistence

---

## Panduan Penggunaan Per Role

### Sebagai USER

#### 1. Login
- Buka `http://localhost:3000`
- Masukkan **email** atau **username** dan password
- Klik "Masuk" — akan diarahkan ke `/user/dashboard`

#### 2. Membuat Tiket Gangguan
1. Klik menu **"Buat Tiket"** di sidebar
2. Isi form:
   - **Judul**: Deskripsi singkat masalah (contoh: "Printer di ruang 301 tidak bisa print")
   - **Deskripsi**: Jelaskan masalah secara detail — apa yang terjadi, kapan mulai, sudah dicoba apa
   - **Lokasi**: Ruangan / gedung tempat masalah terjadi
   - **Urgensi**: Pilih tingkat urgensi
     - `Rendah` — tidak mengganggu pekerjaan
     - `Sedang` — agak mengganggu namun bisa disiasati
     - `Tinggi` — mengganggu pekerjaan secara signifikan
     - `Kritis` — pekerjaan berhenti total
3. Upload lampiran jika ada (foto, tangkapan layar)
4. Klik **"Kirim Tiket"**
5. Nomor tiket akan digenerate otomatis

#### 3. Memantau Status Tiket
1. Klik menu **"Tiket Saya"**
2. Gunakan filter untuk mempersempit pencarian
3. Klik tiket untuk melihat detail dan update terbaru
4. Status tiket yang mungkin:
   - **Pending** — menunggu diambil teknisi
   - **Proses** — sedang ditangani teknisi
   - **Selesai** — masalah telah diselesaikan
   - **Ditolak** — tiket ditolak (lihat catatan teknisi untuk alasan)
   - **Dibatalkan** — tiket dibatalkan oleh Anda

#### 4. Membatalkan Tiket
- Hanya tiket berstatus **Pending** yang bisa dibatalkan
- Buka detail tiket → klik "Batalkan Tiket"

#### 5. Berkomunikasi via Chat
1. Klik menu **"Chat"**
2. Pilih sesi chat yang ada, atau buat sesi baru dengan teknisi
3. Ketik pesan dan tekan Enter atau klik tombol kirim
4. Pesan dikirim real-time — teknisi akan mendapat notifikasi

#### 6. Pengaturan Akun
1. Klik menu **"Pengaturan"**
2. Ubah data profil, password, preferensi bahasa dan tema
3. Klik "Simpan" di setiap tab

---

### Sebagai TEKNISI

#### 1. Login
- Masukkan email/username teknisi
- Akan diarahkan ke `/technician/dashboard`

#### 2. Melihat Antrian Tiket
1. Klik menu **"Antrian Tiket"**
2. Tampil semua tiket **Pending** yang belum diassign ke siapapun
3. Tiket diurutkan dari terbaru
4. Tiket dengan urgensi Kritis/Tinggi tampil dengan badge warna mencolok

#### 3. Mengambil Tiket dari Antrian
1. Di halaman Antrian, klik tiket yang ingin ditangani
2. Klik tombol **"Ambil Tiket"**
3. Tiket otomatis di-assign ke akun Anda dan statusnya berubah ke **Proses**
4. Tiket akan muncul di halaman **"Tiket Saya"**

#### 4. Mengelola Tiket yang Ditangani
1. Klik menu **"Tiket Saya"** untuk melihat tiket yang di-assign ke Anda
2. Klik tiket untuk membuka detail
3. Di halaman detail, tersedia aksi:
   - **Tandai Selesai**: Status berubah ke `Selesai` + `closed_at` dicatat
   - **Tolak Tiket**: Status berubah ke `Ditolak`, tambahkan catatan alasan
   - **Tambah Catatan**: Tulis catatan internal (tidak terlihat user)

#### 5. Chat dengan Pengguna
1. Klik menu **"Chat"**
2. Lihat semua percakapan yang melibatkan Anda
3. Balas pesan pengguna secara real-time
4. Chat baru dari pengguna akan muncul di daftar

#### 6. Pengaturan Teknisi
1. Klik menu **"Pengaturan"**
2. Tersedia 10 tab konfigurasi:
   - **Profil** — update data diri
   - **Password** — ganti password
   - **Status Default** — set aktif/tidak aktif (apakah mau menerima tiket)
   - **Jam Shift** — atur jam kerja Anda
   - **Spesialisasi** — pilih bidang keahlian
   - **Batas Tiket** — set berapa maksimum tiket aktif bersamaan
   - **Notif WhatsApp** — aktifkan notifikasi WA

---

### Sebagai ADMIN

#### 1. Login
- Masukkan email admin
- Akan diarahkan ke `/admin/dashboard`

#### 2. Memantau Dashboard
- Dashboard menampilkan statistik keseluruhan:
  - Total tiket, Pending, Proses, Selesai
  - Total pengguna dan teknisi aktif
  - Tabel 10 tiket terbaru per status
  - Grafik top 5 teknisi bulan ini
- Klik tombol **Refresh** untuk memperbarui data cache

#### 3. Mengelola Semua Tiket
1. Klik menu **"Semua Tiket"**
2. Gunakan filter: status, urgensi, search
3. Klik tiket untuk membuka detail
4. Di detail tiket admin tersedia:
   - **Assign Teknisi**: Pilih teknisi dari dropdown untuk menugaskan
   - **Ganti Status**: Ubah status tiket ke nilai apapun
   - **Lihat lampiran** dan **catatan teknisi**

#### 4. Mengelola Pengguna (User)
1. Klik menu **"Kelola Pengguna"**
2. Lihat daftar semua user
3. **Tambah User Baru**:
   - Klik tombol "Tambah User"
   - Isi: nama, email, password, telepon, divisi, role
   - Klik "Simpan"
4. **Edit User**: Klik ikon edit di baris user → ubah data → Simpan
5. **Nonaktifkan User**: Toggle switch aktif/nonaktif
6. **Hapus User**: Klik ikon hapus (konfirmasi terlebih dahulu)

#### 5. Mengelola Teknisi
1. Klik menu **"Kelola Teknisi"**
2. Lihat daftar semua teknisi beserta informasi shift dan spesialisasi
3. Proses sama dengan Kelola Pengguna
4. Tambah Teknisi akan otomatis membuat record `technician_settings`

#### 6. Monitor Chat
1. Klik menu **"Monitor Chat"**
2. Lihat semua sesi chat dalam sistem
3. Klik sesi chat untuk membaca percakapan (read-only)
4. Filter berdasarkan user atau teknisi

#### 7. Melihat Log Aktivitas
1. Klik menu **"Log Aktivitas"**
2. Lihat semua aksi yang pernah dilakukan admin
3. Filter berdasarkan jenis aksi atau rentang waktu
4. Data mencakup: siapa, apa, kapan, pada objek apa

#### 8. Pengaturan Sistem
1. Klik menu **"Pengaturan Sistem"**
2. Tersedia konfigurasi:
   - **Nama Aplikasi**: Nama yang tampil di browser title dan header
   - **Deskripsi**: Deskripsi singkat sistem
   - **Mode Maintenance**: Aktifkan untuk menutup akses sementara
3. Klik "Simpan Perubahan"

---

## Operasional & Maintenance

### Backup Database
```bash
npm run db:backup --prefix backend
# Output: backup file dengan timestamp di folder backups/
```

### Restore Database
```bash
npm run db:restore --prefix backend
```

### Clear Cache Redis
```bash
npm run cache:clear --prefix backend
```

### Cek Health Sistem
```bash
# Liveness check
curl http://localhost:3001/api/health/live

# Readiness check (cek DB dan Redis)
curl http://localhost:3001/api/health/ready

# Metrics Prometheus
curl http://localhost:3001/api/health/metrics
```

### Jalankan Tests
```bash
# Unit tests
npm run test --prefix backend

# Tests dengan coverage report
npm run test:coverage --prefix backend

# Load test
npm run load:test --prefix backend
```

### Smoke Test (Post-deploy)
```bash
npm run smoke:test --prefix backend
```

### Release Readiness Check
```bash
npm run release:readiness --prefix backend
```

---

## Troubleshooting Umum

### Backend tidak bisa connect ke MySQL
1. Pastikan MySQL service berjalan (`mysqladmin -u root -p status`)
2. Periksa nilai `DB_HOST`, `DB_USER`, `DB_PASS`, `DB_NAME` di `.env`
3. Pastikan database `helpdesk_db` sudah dibuat

### Redis tidak tersedia
- Sistem akan tetap berjalan tanpa Redis
- Dashboard data akan langsung query ke MySQL setiap request (lebih lambat)
- Log akan muncul: "Redis unavailable, running without cache"

### JWT Secret Error saat start backend
- Pastikan `JWT_SECRET` diset di `.env`
- Minimum 32 karakter
- Backend akan fail-start jika tidak ada

### CORS Error di frontend
- Periksa `CORS_ORIGIN` di backend `.env`
- Harus sesuai dengan URL frontend yang diakses (termasuk port)
- Contoh: `CORS_ORIGIN=http://localhost:3000`

### Login gagal setelah setup
- Pastikan seed data sudah dijalankan (`npm run db:setup --prefix backend`)
- Kredensial default: `admin@admin.com` / `Admin123!`
- Pastikan `is_active = 1` di record user tersebut

