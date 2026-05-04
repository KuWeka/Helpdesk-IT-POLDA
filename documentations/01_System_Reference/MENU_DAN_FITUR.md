# Menu dan Fitur ProjectPolda

Tanggal dibuat: 2026-05-04

Dokumen ini menjelaskan menu, fitur, tombol, dan interaksi yang tersedia di sistem berdasarkan role pengguna.

---

## 🔐 Halaman Auth (Semua Role)

**Halaman Login**
- Form email + password
- Tombol "Login"
- Link ke halaman Daftar

**Halaman Daftar (Register)**
- Form nama, email, password, konfirmasi password, nomor HP
- Role otomatis terdaftar sebagai **Satker** — tidak bisa pilih role lain
- Tombol "Daftar"
- Link kembali ke Login

---

## 👤 SATKER

**Sidebar Menu:**
- Dashboard
- Buat Permohonan
- Permohonan Saya
- Notifikasi

---

**Dashboard Satker**
- Statistik ringkas: total tiket dibuat, tiket pending, tiket proses, tiket selesai
- Tombol shortcut "Buat Permohonan Baru"
- Jika ada tiket selesai yang belum dirating → muncul **banner peringatan** dengan tombol "Beri Rating Sekarang" yang mengarahkan ke halaman Rating

---

**Halaman Buat Permohonan**
- Sistem cek dulu apakah ada tiket selesai yang belum dirating. Kalau ada → redirect paksa ke halaman Rating, tidak bisa akses halaman ini
- Form:
  - Judul permohonan (text input, wajib)
  - Deskripsi / detail masalah (textarea, wajib)
  - Lokasi (text input, wajib)
  - Kategori (dropdown: Jaringan, Hardware, Software, Akses Sistem, Umum, Lainnya — wajib dipilih)
  - Lampiran (upload file, opsional)
- Tombol "Kirim Permohonan"
- Tombol "Batal"

---

**Halaman Permohonan Saya**
- Tabel daftar semua tiket milik Satker ini
- Kolom: Nomor tiket, Judul, Kategori, Status, Tanggal dibuat
- Filter status: Semua / Pending / Proses / Selesai / Ditolak / Dibatalkan
- Setiap baris ada tombol **Detail**

**Halaman Detail Tiket (Satker)**
- Informasi lengkap tiket: judul, deskripsi, kategori, lokasi, lampiran, tanggal dibuat, status
- Jika status **Ditolak**: muncul keterangan alasan penolakan
- Jika status **Pending**: tombol **Batalkan Permohonan** (muncul dialog konfirmasi AlertDialog sebelum dieksekusi)
- Jika status **Selesai** dan belum dirating: tombol **Beri Rating**
- Tombol **Hubungi via WhatsApp** (mengarah ke nomor Subtekinfo)

---

**Halaman Rating**
- Muncul otomatis saat ada tiket selesai yang belum dirating
- Menampilkan informasi tiket yang perlu dirating
- Komponen bintang 1–5 (klik untuk memilih)
- Field komentar/ulasan (opsional)
- Tombol "Kirim Rating"
- Setelah submit → bisa lanjut buat tiket baru

---

**Notifikasi**
- List semua notifikasi masuk secara realtime (Socket.IO)
- Notifikasi yang diterima Satker: tiket diassign, tiket ditolak (beserta alasan), tiket selesai
- Klik notifikasi → masuk ke halaman detail tiket terkait

---

## 🛡️ SUBTEKINFO

**Sidebar Menu:**
- Dashboard
- Semua Tiket
- Kelola Padal
- Kelola Teknisi
- Laporan Bulanan
- Kelola User
- Notifikasi

---

**Dashboard Subtekinfo**
- Statistik realtime: total tiket pending, proses, selesai hari ini, total tiket bulan ini
- List tiket terbaru yang masuk (5 tiket terakhir)
- Auto-refresh saat ada tiket baru masuk via Socket.IO
- Grafik atau ringkasan performa bulan berjalan

---

**Halaman Semua Tiket**
- Tabel semua tiket dari semua Satker
- Kolom: Nomor tiket, Judul, Satker pelapor, Kategori, Status, Padal yang ditugaskan, Tanggal
- Filter: status, kategori, periode tanggal
- Tombol aksi per baris:
  - **Detail** — buka halaman detail tiket
  - **Assign Padal** — buka modal assign (hanya muncul jika status Pending)
  - **Tolak Tiket** — buka modal tolak dengan field alasan wajib diisi (hanya muncul jika status Pending)

**Halaman Detail Tiket (Subtekinfo)**
- Informasi lengkap tiket
- Jika status Pending: tombol **Assign Padal**, tombol **Tolak Tiket**
- Jika status Proses: tombol **Force Complete** (paksa selesai), tombol **Delete**
- Tombol **Delete** (hapus tiket permanen) — muncul dialog konfirmasi
- Jika ada alasan penolakan: ditampilkan di sini

**Modal Assign Padal**
- Daftar Padal yang bisa dipilih
- Padal yang sedang **shift aktif** muncul di bagian atas dengan label "Shift Aktif"
- Padal yang tidak aktif tetap bisa dipilih tapi ditampilkan di bawah
- Tombol "Assign" untuk konfirmasi

**Modal Tolak Tiket**
- Textarea untuk mengisi alasan penolakan (wajib diisi)
- Tombol "Tolak Tiket" untuk konfirmasi
- Alasan penolakan akan dikirim ke Satker via notifikasi

---

**Halaman Kelola Padal**
- Tabel daftar semua user dengan role Padal
- Kolom: Nama, Email, No HP, Status Shift, Aksi
- Status Shift dihitung otomatis: **Aktif** (hari ini dalam rentang shift) / **Tidak Aktif**
- Tombol **Tambah Padal** — buka modal form tambah user baru dengan role Padal
- Tombol aksi per baris:
  - **Detail** — buka halaman detail Padal
  - **Atur Shift** — buka modal untuk mengatur tanggal mulai dan selesai shift
  - **Nonaktifkan** / **Aktifkan** akun Padal

**Halaman Detail Padal**
- Informasi Padal: nama, email, HP, status shift, periode shift aktif
- **Tabel list Teknisi anggota Padal ini**
  - Kolom: Nama Teknisi, Email, No HP, Aksi
  - Tombol **Hapus** per baris Teknisi (keluarkan dari kelompok Padal ini)
- Tombol **Tambah Teknisi**
  - Buka modal dengan dropdown berisi Teknisi yang **belum punya Padal**
  - Pilih Teknisi → klik "Tambah"
  - Teknisi yang sudah punya Padal lain tidak muncul di dropdown

---

**Halaman Kelola Teknisi**
- Tabel daftar semua user dengan role Teknisi
- Kolom: Nama, Email, No HP, Padal (nama Padal tempat Teknisi ini terdaftar, atau "-" jika belum punya Padal), Aksi
- Tombol **Tambah Teknisi** — buka modal form tambah user baru dengan role Teknisi
- Tombol aksi per baris:
  - **Edit** — ubah data Teknisi
  - **Nonaktifkan** / **Aktifkan** akun Teknisi

---

**Halaman Laporan Bulanan**
- Pilihan periode: bulan dan tahun (dropdown)
- Setelah pilih periode, menampilkan:
  - Total tiket masuk, selesai, ditolak, dibatalkan bulan tersebut
  - Tabel performa per Padal: jumlah tiket dikerjakan, jumlah selesai, rata-rata rating yang diterima
  - Ranking Satker: siapa yang paling banyak mengajukan tiket
  - Grafik tren tiket per hari/minggu dalam bulan tersebut
- Tombol **Download Excel**
- Tombol **Download PDF**

---

**Halaman Kelola User**
- Tabel semua user (semua role)
- Filter berdasarkan role
- Tombol **Tambah User** — form dengan pilihan role lengkap (Subtekinfo, Padal, Teknisi, Satker)
- Tombol aksi per baris:
  - **Edit** — ubah data user termasuk role
  - **Reset Password**
  - **Nonaktifkan** / **Aktifkan** akun

---

**Notifikasi**
- Notifikasi yang diterima Subtekinfo: tiket baru masuk, Padal menolak assignment, tiket dibatalkan Satker
- Realtime via Socket.IO

---

## 🔧 PADAL

**Sidebar Menu:**
- Dashboard
- Tiket Saya
- Semua Tiket (read-only)
- Anggota Teknisi
- Laporan Bulanan
- Notifikasi

---

**Dashboard Padal**
- Statistik: tiket sedang dikerjakan, tiket selesai bulan ini, rata-rata rating yang diterima
- List tiket yang sedang dalam status Proses (tiket aktif yang harus dikerjakan)

---

**Halaman Tiket Saya**
- Tabel tiket yang di-assign ke Padal ini
- Tab atau filter: Menunggu Konfirmasi / Proses / Selesai / Ditolak
- Tombol aksi per baris:
  - **Detail** — buka halaman detail
  - **Terima** — ubah status ke Proses (hanya muncul jika status Menunggu Konfirmasi)
  - **Tolak** — buka modal isi alasan (hanya muncul jika status Menunggu Konfirmasi)

**Halaman Detail Tiket (Padal)**
- Informasi lengkap tiket: judul, deskripsi, kategori, lokasi, lampiran, Satker pelapor, tanggal
- Jika status Menunggu Konfirmasi: tombol **Terima** dan **Tolak**
- Jika status Proses: tombol **Tandai Selesai** — ubah status ke Selesai
- Setelah Selesai: tidak ada tombol aksi lagi

---

**Halaman Semua Tiket (Padal)**
- Sama seperti yang dilihat Teknisi — hanya bisa melihat semua tiket tanpa tombol aksi
- Untuk keperluan monitoring

---

**Halaman Anggota Teknisi**
- List Teknisi yang terdaftar di kelompok Padal ini
- Kolom: Nama, Email, No HP, Aksi
- Tombol **Tambah Teknisi** — dropdown pilih dari Teknisi yang belum punya Padal
- Tombol **Hapus** per baris — keluarkan Teknisi dari kelompok

---

**Halaman Laporan Bulanan (Padal)**
- Pilihan periode: bulan dan tahun
- Menampilkan:
  - Total tiket dikerjakan, selesai, ditolak bulan tersebut
  - Daftar tiket lengkap beserta status dan rating yang diterima
  - Rata-rata rating bulan itu

---

**Notifikasi (Padal)**
- Notifikasi yang diterima: tiket baru di-assign oleh Subtekinfo
- Realtime via Socket.IO

---

## 👁️ TEKNISI

**Sidebar Menu:**
- Dashboard
- Semua Tiket
- Notifikasi

---

**Dashboard Teknisi**
- Tampilan ringkas statistik tiket (semua tiket, bukan milik Teknisi)
- Informasi Padal tempat Teknisi ini terdaftar

---

**Halaman Semua Tiket (Teknisi)**
- Tabel semua tiket dari semua Satker
- Bisa filter berdasarkan status dan kategori
- Tombol **Detail** per baris untuk melihat isi tiket
- **Tidak ada tombol aksi apapun** — murni read-only

**Halaman Detail Tiket (Teknisi)**
- Informasi lengkap tiket: judul, deskripsi, kategori, lokasi, lampiran, status, Satker pelapor, Padal yang mengerjakan
- **Tidak ada tombol apapun**

---

**Notifikasi (Teknisi)**
- Bisa menerima notifikasi informasional (tiket baru, tiket selesai) untuk keperluan monitoring

---

Itu gambaran lengkapnya. Ada yang perlu dikoreksi, ditambah, atau ada fitur yang belum ada di sini tapi Eka ingin tambahkan?