Tanggal: 2026-04-19


## Daftar Peran

Sistem memiliki **3 peran pengguna** yang diatur di kolom `role` tabel `users`:

| Peran      | Nilai ENUM | Deskripsi                                              |
|------------|------------|--------------------------------------------------------|
| Admin      | `Admin`    | Administrator sistem — kontrol penuh                   |
| Teknisi    | `Teknisi`  | Staff IT yang menangani tiket dan melayani pengguna    |
| User       | `User`     | Pengguna akhir yang melaporkan gangguan IT             |

---

## Peran: USER

### Deskripsi
Pengguna akhir (staf/karyawan) yang mengalami gangguan IT dan ingin melaporkannya untuk ditangani tim IT.

### Akses Route Frontend
```
/user/dashboard           → Dashboard pengguna
/user/create-ticket       → Buat tiket baru
/user/tickets             → Daftar tiket saya
/user/tickets/:id         → Detail tiket
/user/chats               → Daftar percakapan saya
/user/chats/:chatId       → Percakapan dengan teknisi
/user/settings            → Pengaturan akun saya
```

### Menu Sidebar
| Menu              | Path                   | Fungsi                           |
|-------------------|------------------------|----------------------------------|
| Dashboard         | /user/dashboard        | Ringkasan tiket dan aktivitas    |
| Buat Tiket        | /user/create-ticket    | Form pengajuan tiket baru        |
| Tiket Saya        | /user/tickets          | Riwayat semua tiket yang diajukan|
| Chat              | /user/chats            | Daftar sesi chat dengan teknisi  |
| Pengaturan        | /user/settings         | Profil, password, tema, bahasa   |

### Fitur Lengkap

#### A. Dashboard Pengguna
- Melihat statistik tiket milik sendiri: total, pending, sedang diproses, selesai
- Daftar tiket terbaru
- Link cepat ke "Buat Tiket" dan "Lihat Semua Tiket"
- Data dashboard di-cache server-side (Redis)

#### B. Manajemen Tiket
- **Buat Tiket Baru**: Mengisi form dengan judul, deskripsi, lokasi, tingkat urgensi (Rendah/Sedang/Tinggi/Kritis)
- **Upload Lampiran**: Melampirkan file (foto, dokumen) saat membuat atau pada tiket yang sudah ada — maksimum 5 file, 5MB per file
- **Lihat Tiket Saya**: Tabel tiket dengan filter status, urgensi, pencarian teks, dan paginasi
- **Detail Tiket**: Melihat seluruh informasi tiket, status terkini, nama teknisi yang ditugaskan, dan lampiran
- **Batalkan Tiket**: User dapat membatalkan tiket yang masih berstatus `Pending`
- User **tidak bisa** melihat tiket pengguna lain (pembatasan sisi server)

#### C. Chat Real-time
- Melihat daftar sesi chat yang dimiliki
- Membuka percakapan dengan teknisi
- Mengirim dan menerima pesan secara real-time via WebSocket
- Pesan otomatis ditandai **terbaca** saat chat dibuka
- Chat dapat terhubung ke tiket tertentu

#### D. Pengaturan Akun
- **Tab Profil**: Update nama, username, nomor telepon, divisi
- **Tab Password**: Ganti password (perlu konfirmasi password lama)
- **Tab Notifikasi**: Preferensi notifikasi
- **Tab Bahasa**: Pilih antara Bahasa Indonesia atau English
- **Tab Tema**: Pilih light / dark / system

### Batasan User
- Hanya bisa melihat tiket milik sendiri
- Tidak bisa assign teknisi ke tiket
- Tidak bisa mengubah status tiket (kecuali membatalkan)
- Tidak bisa mengakses halaman admin atau teknisi
- Tidak bisa melihat log aktivitas atau monitoring

---

## Peran: TEKNISI

### Deskripsi
Staff IT yang bertugas menerima, memproses, dan menyelesaikan tiket gangguan. Teknisi bekerja aktif menangani tiket dari antrian dan berkomunikasi langsung dengan pengguna.

### Akses Route Frontend
```
/technician/dashboard         → Dashboard teknisi
/technician/queue             → Antrian tiket belum diassign
/technician/tickets           → Tiket yang ditangani saya
/technician/tickets/:ticketId → Detail tiket (mode teknisi)
/technician/chats             → Daftar chat dengan pengguna
/technician/settings          → Pengaturan akun teknisi
```

### Menu Sidebar
| Menu              | Path                        | Fungsi                                     |
|-------------------|-----------------------------|--------------------------------------------|
| Dashboard         | /technician/dashboard       | Statistik kinerja dan tiket aktif          |
| Antrian Tiket     | /technician/queue           | Tiket Pending yang belum diassign          |
| Tiket Saya        | /technician/tickets         | Tiket yang sedang ditangani                |
| Chat              | /technician/chats           | Percakapan dengan pengguna                 |
| Pengaturan        | /technician/settings        | Profil, shift, spesialisasi, notifikasi    |

### Fitur Lengkap

#### A. Dashboard Teknisi
- Statistik tiket pribadi: total ditangani, sedang proses, selesai hari ini/bulan
- Daftar tiket aktif yang sedang dikerjakan
- Tiket dalam antrian (Pending belum diassign)
- Data di-cache per teknisi di Redis

#### B. Antrian Tiket (Queue)
- Melihat semua tiket berstatus `Pending` yang **belum** diassign ke teknisi manapun
- Filter berdasarkan urgensi, pencarian judul
- **Ambil Tiket**: Teknisi mengklaim tiket dari antrian — tiket langsung di-assign ke dirinya dan status berubah ke `Proses`
- Tiket kritis/tinggi ditandai dengan badge urgensi berwarna

#### C. Manajemen Tiket Saya
- Melihat semua tiket yang di-assign ke dirinya
- Filter berdasarkan status, urgensi, rentang tanggal, pencarian
- **Detail Tiket**: Akses penuh ke seluruh informasi tiket
- **Update Status**: Mengubah status tiket dari `Proses` ke `Selesai` atau `Ditolak`
- **Tambah Catatan**: Menulis catatan internal (ticket notes) pada tiket
- **Lihat Lampiran**: Mengunduh file yang dilampirkan pengguna
- Batas tiket aktif dikonfigurasi di `technician_settings.max_active_tickets`

#### D. Chat dengan Pengguna
- Melihat semua sesi chat yang melibatkan dirinya
- Membalas pesan pengguna secara real-time
- Menerima notifikasi tiket baru via WebSocket event `new_ticket`
- Bergabung ke room `technicians` untuk menerima broadcast tiket baru

#### E. Pengaturan Teknisi (10 Tab)
| Tab                | Fungsi                                                       |
|--------------------|--------------------------------------------------------------|
| Profil             | Update nama, username, telepon, divisi                       |
| Password           | Ganti password                                               |
| Notifikasi         | Preferensi notifikasi sistem                                 |
| Bahasa             | Pilih bahasa (ID/EN)                                         |
| Tema               | Pilih tema tampilan                                          |
| Status Default     | Atur status aktif/tidak aktif (menerima tiket atau tidak)    |
| Jam Shift          | Atur jam mulai dan selesai shift kerja                       |
| Notif WhatsApp     | Aktifkan/nonaktifkan notifikasi via WhatsApp                 |
| Spesialisasi       | Pilih bidang keahlian (Networking, Hardware, Software, dll)  |
| Batas Tiket        | Set batas maksimum tiket aktif bersamaan                     |

### Batasan Teknisi
- Hanya melihat tiket yang di-assign ke dirinya (kecuali antrian)
- Tidak bisa membuat tiket untuk orang lain
- Tidak bisa mengakses panel admin
- Tidak bisa melihat tiket sesama teknisi
- Tidak bisa mengelola akun pengguna lain

---

## Peran: ADMIN

### Deskripsi
Administrator sistem dengan akses penuh ke semua data, konfigurasi, dan manajemen pengguna. Admin memantau operasional keseluruhan dan dapat melakukan intervensi pada tiket manapun.

### Akses Route Frontend
```
/admin/dashboard         → Dashboard admin (overview keseluruhan)
/admin/tickets           → Semua tiket dari semua pengguna
/admin/tickets/:id       → Detail tiket (mode admin)
/admin/ticket-history    → Riwayat tiket yang sudah selesai/ditolak
/admin/users             → Kelola semua pengguna
/admin/technicians       → Kelola semua teknisi
/admin/chats             → Monitoring semua percakapan
/admin/activity-logs     → Log aktivitas sistem
/admin/settings          → Konfigurasi sistem
```

### Menu Sidebar
| Menu                | Path                     | Fungsi                                     |
|---------------------|--------------------------|---------------------------------------------|
| Dashboard           | /admin/dashboard         | Overview statistik + grafik                 |
| Semua Tiket         | /admin/tickets           | Seluruh tiket aktif lintas pengguna         |
| Riwayat Tiket       | /admin/ticket-history    | Tiket Selesai, Ditolak, Dibatalkan          |
| Kelola Pengguna     | /admin/users             | CRUD akun pengguna (User role)              |
| Kelola Teknisi      | /admin/technicians       | CRUD akun teknisi + lihat settings teknisi  |
| Monitor Chat        | /admin/chats             | Pantau semua sesi percakapan                |
| Log Aktivitas       | /admin/activity-logs     | Audit trail aksi admin                      |
| Pengaturan Sistem   | /admin/settings          | Konfigurasi nama app, maintenance mode      |

### Fitur Lengkap

#### A. Dashboard Admin
- **Statistik keseluruhan**: Total tiket, Pending, Proses, Selesai
- **Total pengguna** aktif dan total teknisi aktif
- **Tabel terbaru**: 10 tiket Pending terbaru, 10 tiket Proses, 10 tiket Selesai
- **Grafik Top Teknisi**: Bar chart 5 teknisi dengan tiket selesai terbanyak bulan ini
- Data di-cache 60 detik di Redis, dapat di-refresh manual dengan query `?refresh=true`

#### B. Manajemen Semua Tiket
- Melihat **semua tiket** dari seluruh pengguna
- Filter: status, urgensi, user, teknisi, unassigned, pencarian, paginasi
- **Assign Teknisi**: Admin dapat menetapkan atau mengganti teknisi pada tiket
- **Ubah Status**: Admin dapat mengubah status tiket ke status apapun
- **Detail Tiket**: Akses penuh termasuk info pelapor, teknisi, lampiran, catatan

#### C. Riwayat Tiket
- Melihat tiket yang sudah berstatus `Selesai`, `Ditolak`, atau `Dibatalkan`
- Filter rentang tanggal, urgensi, teknisi yang menangani
- Ekspor data tiket (jika diimplementasikan)

#### D. Kelola Pengguna
- **Daftar semua User** dengan status aktif/nonaktif
- **Tambah User Baru**: Membuat akun dengan nama, email, password, telepon, role, divisi
- **Edit User**: Update semua field profil pengguna
- **Nonaktifkan / Aktifkan**: Toggle `is_active` tanpa menghapus data
- **Reset Password**: Admin dapat mengubah password pengguna
- Pencarian, filter role, filter status aktif, paginasi

#### E. Kelola Teknisi
- **Daftar semua Teknisi** beserta data `technician_settings`-nya
- **Tambah Teknisi Baru**: Buat akun role `Teknisi` + auto-create record `technician_settings`
- **Edit Teknisi**: Update profil dan pengaturan teknisi
- **Nonaktifkan Teknisi**: Toggle `is_active` di tabel users
- Lihat shift, spesialisasi, batas tiket, status WA notifikasi per teknisi

#### F. Monitor Chat
- Melihat **semua sesi chat** yang ada dalam sistem
- Filter berdasarkan user, teknisi, ticket
- Admin dapat membuka dan membaca percakapan apapun (read-only monitoring)
- Melihat status chat (Open/Closed) dan pesan terakhir

#### G. Log Aktivitas
- Melihat semua entri `activity_logs`
- Setiap aksi admin yang penting (create/update/delete user, assign tiket, dll) dicatat otomatis
- Filter berdasarkan action_type, target_type, rentang waktu
- Data mencakup: admin yang melakukan, waktu, jenis aksi, objek yang dikenai, detail JSON

#### H. Pengaturan Sistem
- **Nama Aplikasi**: Mengubah nama yang tampil di header/title
- **Deskripsi Aplikasi**: Teks deskripsi aplikasi
- **Mode Maintenance**: Toggle untuk mematikan akses sementara

### Batasan Admin
- Admin tidak memiliki `technician_settings` (bukan teknisi)
- Admin tidak dapat mengakses/mengubah route `/user/*` atau `/technician/*`
- Semua aksi admin dicatat di `activity_logs`

---

## Matriks Izin (Permission Matrix)

| Aksi                          | User | Teknisi | Admin |
|-------------------------------|:----:|:-------:|:-----:|
| Login / Logout                | ✅   | ✅      | ✅    |
| Register (self)               | ✅   | ❌      | ❌    |
| Buat tiket                    | ✅   | ❌      | ❌    |
| Lihat tiket sendiri           | ✅   | ❌      | ✅    |
| Batalkan tiket sendiri        | ✅   | ❌      | ✅    |
| Lihat semua tiket             | ❌   | ❌      | ✅    |
| Lihat tiket yang di-assign    | ❌   | ✅      | ✅    |
| Lihat antrian tiket           | ❌   | ✅      | ✅    |
| Ambil tiket dari antrian      | ❌   | ✅      | ✅    |
| Assign teknisi ke tiket       | ❌   | ❌      | ✅    |
| Update status tiket           | ❌   | ✅*     | ✅    |
| Tambah catatan tiket          | ❌   | ✅      | ✅    |
| Upload lampiran tiket         | ✅   | ❌      | ✅    |
| Chat dengan teknisi           | ✅   | ✅      | 👁️   |
| Monitor semua chat            | ❌   | ❌      | ✅    |
| Kelola pengguna (CRUD)        | ❌   | ❌      | ✅    |
| Kelola teknisi (CRUD)         | ❌   | ❌      | ✅    |
| Lihat log aktivitas           | ❌   | ❌      | ✅    |
| Ubah pengaturan sistem        | ❌   | ❌      | ✅    |
| Lihat dashboard analytics     | ❌   | ✅*     | ✅    |
| Update profil sendiri         | ✅   | ✅      | ✅    |
| Update password sendiri       | ✅   | ✅      | ✅    |
| Ubah preferensi tema/bahasa   | ✅   | ✅      | ✅    |

> `✅*` = Terbatas pada data milik sendiri / tiket yang di-assign ke dirinya  
> `👁️` = Admin hanya dapat memantau (read), tidak ikut berkomunikasi di chat

