# Sesi 7 — Rating Wajib Satker

Tanggal dibuat: 2026-05-04

**Status**: SELESAI  
**Tanggal**: Sesi revisi ProjectPolda

---

## Ringkasan

Implementasi sistem rating wajib bagi Satker (dan Teknisi) setelah tiket selesai ditangani. Rating menjadi syarat sebelum dapat membuat tiket baru.

---

## Perubahan Backend

### `backend/src/routes/tickets.js`

1. **`POST /` — Gating buat tiket baru**
   - Ditambahkan role guard `role('Satker', 'Teknisi')` di awal
   - Sebelum insert tiket, cek apakah user punya tiket `status='Selesai'` yang belum dirating di tabel `ticket_ratings`
   - Jika ada: return `403 { pendingRating: true, ticket_id, ticket_number }`

2. **`PATCH /:id` — Emit saat tiket Selesai**
   - Ditambahkan emit Socket.IO event `ticket:rating_required` ke room `user:{satker_id}` ketika status diubah menjadi `'Selesai'`
   - Payload: `{ ticket_id, ticket_number }`

3. **`POST /:id/rating` — Endpoint submit rating**
   - Role: `Satker`, `Teknisi`
   - Validasi: `rating` harus integer 1–5
   - Validasi: tiket harus `status='Selesai'` dan milik user
   - Validasi: belum ada rating sebelumnya (cek duplikat)
   - Insert ke tabel `ticket_ratings`
   - Emit `ticket:rating_received` ke room `user:{padal_id}`

4. **`GET /pending-rating` — Cek pending rating**
   - Role: `Satker`, `Teknisi`
   - LEFT JOIN `ticket_ratings` untuk cari tiket `Selesai` belum dirating milik user
   - Return: `{ pending: bool, ticket?: { id, ticket_number, title, updated_at } }`
   - **PENTING**: Route ini ditempatkan SEBELUM `GET /:id` untuk menghindari conflict routing Express (fix bug)

---

## Perubahan Frontend

### `apps/web/src/pages/RatingPage.jsx` (BARU)
- Halaman rating dengan UI 5 bintang interaktif + efek hover
- Label bintang: `1=Sangat Buruk, 2=Buruk, 3=Cukup Baik, 4=Baik, 5=Sangat Baik`
- Fetch `GET /tickets/pending-rating` on mount untuk mendapatkan tiket yang perlu dirating
- Submit ke `POST /tickets/{id}/rating`
- Membaca `?ticket_id` dari query params untuk redirect kembali ke CreateTicket setelah rating
- Menampilkan state "tidak ada yang perlu dirating" dan state setelah berhasil rating

### `apps/web/src/pages/CreateTicketPage.jsx` (DIUPDATE)
- Tambah state `isCheckingRating` dan `pendingRatingTicket`
- On mount: fetch `GET /tickets/pending-rating`; jika ada pending, set `pendingRatingTicket`
- Tampilkan amber banner dengan tombol "Beri Rating Sekarang" jika ada pending
- On submit error 403 dengan `data.pendingRating`: redirect ke `/user/rating`

### `apps/web/src/pages/TicketDetailPage.jsx` (DIUPDATE)
- Tambah state `hasRated` (bool)
- Tambah import `Star` dari lucide-react
- Pada fetch tiket: juga call `GET /tickets/pending-rating` untuk cek apakah tiket ini sudah dirating
- Tampilkan tombol "Beri Rating" (warna amber) jika:
  - `ticket.status === 'Selesai'`
  - `!hasRated`
  - `currentUser.role` adalah `Satker` atau `Teknisi`
- Klik tombol → navigate ke `/user/rating?ticket_id={id}`

### `apps/web/src/pages/UserDashboard.jsx` (DIUPDATE)
- Tambah import `socket`, `useNavigate`, `Star`, `toast`
- Tambah state `pendingRating`
- Socket listener `ticket:rating_required`: set `pendingRating`, tampilkan toast
- Tampilkan banner amber dengan tombol "Beri Rating" jika `pendingRating !== null`

### `apps/web/src/App.jsx` (DIUPDATE)
- Import `RatingPage`
- Tambah route `<Route path="rating" element={<RatingPage />} />` di dalam `/user` routes

---

## Bug yang Diperbaiki

- **Routing conflict Express**: `GET /pending-rating` awalnya ditempatkan di akhir file setelah `GET /:id`. Express akan mencocokkan `/pending-rating` sebagai `/:id` dengan `id = "pending-rating"`. Diperbaiki dengan memindahkan route `/pending-rating` sebelum `/:id`.

---

## Database

Tabel `ticket_ratings` (sudah dibuat di Sesi 1):
```sql
CREATE TABLE ticket_ratings (
  id VARCHAR(36) PRIMARY KEY,
  ticket_id VARCHAR(36) NOT NULL,
  user_id INT NOT NULL,
  rating TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ticket_id) REFERENCES tickets(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

---

## Flow Lengkap

```
1. Padal ubah status tiket → "Selesai"
2. Backend emit ticket:rating_required → room user:{satker_id}
3. Satker terima notifikasi Socket → banner muncul di UserDashboard
4. Satker klik "Beri Rating" → navigate ke /user/rating
5. Satker submit rating 1-5 bintang
6. Backend insert ke ticket_ratings, emit ticket:rating_received ke Padal
7. Satker bisa buat tiket baru (gating dilewati)
```
