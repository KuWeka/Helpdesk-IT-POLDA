# Alur Pemakaian ProjectPolda

Tanggal dibuat: 2026-05-04

Dokumen ini menjelaskan alur lengkap pemakaian ProjectPolda setelah revisi, termasuk fitur Padal-Teknisi yang telah dikonfirmasi.

---

### 👤 Satker — Pelapor

Satker adalah user yang mengajukan permohonan bantuan IT. Alurnya:

1. Login → sistem cek apakah ada tiket yang sudah selesai tapi **belum dirating**. Kalau ada, Satker langsung diarahkan ke halaman rating dan **tidak bisa buat tiket baru** sebelum rating selesai diisi.
2. Setelah tidak ada tanggungan rating, Satker bisa buka **Buat Permohonan** → isi judul, deskripsi, lokasi, kategori, dan lampiran.
3. Tiket masuk ke sistem dengan status **Pending**, Satker tinggal menunggu notifikasi.
4. Kalau tiket **ditolak**, Satker menerima notifikasi beserta alasan penolakannya.
5. Kalau tiket **selesai**, muncul prompt untuk memberi **rating 1–5** ke Padal yang mengerjakan.
6. Setelah rating dikirim, Satker bebas membuat tiket baru.
7. Untuk komunikasi, tidak ada chat internal — cukup klik tombol **WhatsApp** yang terhubung langsung ke nomor Subtekinfo.

---

### 🛡️ Subtekinfo — Admin Pengendali

Subtekinfo adalah pengelola utama sistem. Tugasnya mencakup beberapa hal:

**Kelola Tiket:**
1. Setiap tiket baru masuk, Subtekinfo dapat notifikasi realtime.
2. Dari halaman **Semua Tiket**, Subtekinfo bisa:
   - **Assign ke Padal** — pilih Padal dari modal, yang sedang shift aktif otomatis muncul di atas
   - **Tolak tiket** — wajib isi alasan, alasan dikirim ke Satker lewat notifikasi
3. Kalau Padal menolak assignment, tiket kembali ke Pending dan Subtekinfo assign ulang ke Padal lain.

**Kelola Shift Padal:**
- Subtekinfo mengatur tanggal mulai dan selesai shift tiap Padal. Status aktif/nonaktif dihitung otomatis berdasarkan tanggal hari ini.

**Kelola Anggota Padal–Teknisi:**
- Di menu **Kelola Padal**, ada tabel daftar semua Padal dengan tombol **Detail** di setiap barisnya.
- Klik Detail → muncul informasi Padal + **list Teknisi anggotanya**.
- Subtekinfo bisa **Tambah Teknisi** ke kelompok Padal tersebut — dropdown hanya menampilkan Teknisi yang belum punya Padal.
- Subtekinfo juga bisa **Hapus** Teknisi dari kelompok jika perlu dipindah ke Padal lain.
- Penambahan ini **manual** — setiap Teknisi harus didaftarkan sendiri ke Padal yang sesuai.

**Laporan Bulanan:**
- Laporan komprehensif: total tiket masuk/selesai/ditolak, performa tiap Padal, rating yang diterima, ranking Satker, dll.
- Bisa didownload Excel atau PDF.

---

### 🔧 Padal — Eksekutor Lapangan

Padal adalah yang mengerjakan tiket di lapangan, dibantu Teknisi di bawahnya.

**Alur tiket:**
1. Dapat notifikasi saat di-assign tiket oleh Subtekinfo.
2. Pilih **Terima** → status tiket jadi **Proses**, tiket masuk ke daftar "Tiket Saya".
3. Atau pilih **Tolak** (dengan alasan opsional) → tiket kembali ke Pending, Subtekinfo assign ulang.
4. Setelah pekerjaan selesai di lapangan, Padal update status tiket ke **Selesai** → Satker dapat notifikasi.
5. Koordinasi dengan Teknisi dilakukan **di luar sistem** (offline).

**Kelola Anggota Teknisi:**
- Padal bisa melihat **list Teknisi anggotanya** dari menu di sisi Padal.
- Padal juga bisa **Tambah** atau **Hapus** Teknisi dari kelompoknya sendiri, sama seperti yang bisa dilakukan Subtekinfo.

**Laporan:**
- Padal punya laporan bulanan sendiri: total tiket dikerjakan, daftar tiket, dan rating yang diterima dari Satker.

---

### 👁️ Teknisi — Pengamat

Teknisi adalah anggota dari kelompok Padal. Di dalam sistem, Teknisi hanya bisa **melihat** — list tiket (pending, proses, selesai) dan detail tiketnya. Tidak ada tombol aksi apapun. Koordinasi dengan Padal dilakukan di luar sistem.

---

### Alur Satu Tiket dari Awal sampai Selesai

```
Satker buat tiket
      ↓
  (sistem cek: ada tiket belum dirating? → wajib rating dulu)
      ↓
Tiket masuk → status: Pending
      ↓
Subtekinfo assign ke Padal
      ↓
Padal Terima → status: Proses
  (atau Padal Tolak → balik ke Pending → Subtekinfo assign ulang)
      ↓
Padal selesaikan → status: Selesai
      ↓
Satker beri Rating 1–5
      ↓
Selesai ✅
```

---

Sudah sesuai? Kalau iya, saya bisa langsung update file prompt Copilot dan dokumen panduan revisi dengan tambahan fitur Padal–Teknisi ini.