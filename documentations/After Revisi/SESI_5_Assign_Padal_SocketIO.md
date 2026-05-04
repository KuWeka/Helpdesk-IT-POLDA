# Sesi 5 — Alur Assign Padal & Socket.IO Baru

Tanggal dibuat: 2026-05-04

**Tanggal**: Sesi 5 dari 10  
**Status**: ✅ SELESAI

---

## Ringkasan

Sesi ini mengimplementasikan alur penugasan Padal ke tiket dengan konfirmasi dua arah (Subtekinfo assign → Padal terima/tolak), serta merombak sistem Socket.IO dari chat-room ke room management berbasis user dan peran.

---

## Perubahan Backend

### 1. `backend/src/socket/index.js` — Room Management Baru

**Sebelum**: Socket menggunakan `join_chat`, `leave_chat`, `join_technicians` (sisa dari sistem chat yang telah dihapus di Sesi 4).

**Sesudah**:
- `join_user_room(userId)` → `socket.join('user:{userId}')` — untuk notifikasi langsung ke user tertentu (Padal, Satker, Teknisi)
- `join_subtekinfo_room()` → `socket.join('subtekinfo')` — untuk broadcast ke semua Subtekinfo
- Event `join_padal_room` tidak diperlukan karena Padal menerima notifikasi via `user:{id}`

### 2. `backend/src/routes/tickets.js` — 3 Endpoint Baru

#### `POST /api/tickets/:id/assign` (Subtekinfo only)
- Body: `{ padal_id }`
- Validasi: Padal harus ada dan role = 'Padal'
- Batalkan assignment pending sebelumnya jika ada
- Insert ke `ticket_assignments` dengan status `pending_confirm` (UUID v4)
- Update `tickets.padal_id`
- Emit `ticket:assigned` ke room `user:{padal_id}` via Socket.IO

#### `DELETE /api/tickets/:id/assign` (Subtekinfo only)
- Batalkan semua assignment `pending_confirm` dan `accepted`
- Set `tickets.status = 'Pending'` dan `tickets.padal_id = NULL`
- Invalidasi cache

#### `PATCH /api/tickets/:id/assignment/respond` (Padal only)
- Body: `{ accepted: boolean, note?: string }`
- Cari assignment dengan status `pending_confirm` untuk Padal + tiket tersebut
- Jika `accepted = true`:
  - Update assignment → `accepted`, `responded_at = NOW()`
  - Update tiket → `Proses`
  - Emit `ticket:assignment_responded` ke room `subtekinfo`
  - Emit `ticket:status_changed` ke `user:{satker_id}`
- Jika `accepted = false`:
  - Update assignment → `rejected`, `reject_note = note`, `responded_at = NOW()`
  - Update tiket → `Pending`, `padal_id = NULL`
  - Emit `ticket:assignment_responded` ke room `subtekinfo`

---

## Perubahan Frontend

### 3. `apps/web/src/contexts/AuthContext.jsx` — Socket Join Rooms Otomatis

- Setelah `checkAuth()` berhasil: connect socket, emit `join_user_room(user.id)`, jika Subtekinfo emit `join_subtekinfo_room()`
- Setelah `login()` berhasil: idem

### 4. `apps/web/src/components/modals/AssignPadalModal.jsx` — BARU

Modal untuk Subtekinfo mengassign tiket ke Padal:
- Fetch `GET /api/users?role=Padal` saat modal dibuka
- Select dropdown daftar Padal
- Submit: `POST /api/tickets/:id/assign`
- Callback `onSuccess` untuk refresh daftar tiket

### 5. `apps/web/src/components/tickets/AssignmentNotificationBanner.jsx` — BARU

Komponen banner notifikasi assignment masuk untuk Padal:
- Menampilkan ticket number, judul, dan nama Subtekinfo yang assign
- Tombol **Terima**: panggil `PATCH /api/tickets/:id/assignment/respond` dengan `{ accepted: true }`, lalu navigate ke halaman tiket
- Tombol **Tolak**: tampilkan textarea untuk alasan penolakan, lalu panggil dengan `{ accepted: false, note }`
- Loading state per assignment
- Warna border amber untuk menonjolkan notifikasi penting

### 6. `apps/web/src/pages/admin/AllTicketsPage.jsx` — Update

- **Bug fix**: Ganti `role: 'Teknisi'` → `role: 'Padal'` pada fetch daftar teknisi untuk filter
- **Import** `AssignPadalModal`, ikon `UserPlus`, `UserMinus`
- **State baru**: `assignTarget` (tiket yang sedang di-assign)
- **Fungsi baru**: `handleUnassign(ticketId)` — panggil `DELETE /api/tickets/:id/assign`
- **Dropdown menu tiap tiket** kini punya:
  - "Assign Padal" (muncul jika tiket Pending atau belum ada `padal_id`)
  - "Hapus Assignment" (muncul jika `padal_id` ada dan tiket belum Selesai/Dibatalkan)
- **AssignPadalModal** dirender di bawah tabel

### 7. `apps/web/src/pages/technician/TechnicianDashboard.jsx` — Update

- **Import**: `socket`, `AssignmentNotificationBanner`
- **State baru**: `pendingAssignments` (array assignment pending)
- **Fungsi baru**: `fetchPendingAssignments()` — ambil tiket Pending yang `padal_id` = currentUser.id
- **useEffect socket**: listen `ticket:assigned`, tambahkan ke `pendingAssignments`, tampilkan toast
- **Render**: `AssignmentNotificationBanner` di atas konten dashboard jika ada pending assignments
- Callback `onResponded`: clear `pendingAssignments` dan refresh dashboard

---

## Socket Events (Summary)

| Event | Arah | Room/Target | Payload |
|-------|------|-------------|---------|
| `ticket:new` | Server → Client | `subtekinfo` | `{ ticket_id, ticket_number, title, satker_name, created_at }` |
| `ticket:assigned` | Server → Client | `user:{padal_id}` | `{ ticket_id, ticket_number, title, assigned_by }` |
| `ticket:assignment_responded` | Server → Client | `subtekinfo` | `{ ticket_id, ticket_number, padal_id, padal_name, accepted, note }` |
| `ticket:status_changed` | Server → Client | `user:{satker_id}` | `{ ticket_id, ticket_number, new_status }` |

---

## File Dimodifikasi

| File | Jenis Perubahan |
|------|----------------|
| `backend/src/socket/index.js` | Ganti room management |
| `backend/src/routes/tickets.js` | Tambah 3 endpoint assign |
| `apps/web/src/contexts/AuthContext.jsx` | Tambah socket join rooms setelah auth |
| `apps/web/src/components/modals/AssignPadalModal.jsx` | **BARU** |
| `apps/web/src/components/tickets/AssignmentNotificationBanner.jsx` | **BARU** |
| `apps/web/src/pages/admin/AllTicketsPage.jsx` | Fix role filter + tombol Assign/Unassign |
| `apps/web/src/pages/technician/TechnicianDashboard.jsx` | Socket listener + banner notifikasi |

---

## Catatan

- Tabel `ticket_assignments` sudah ada di migration Sesi 1 (`001_revision_schema.sql`, langkah 5b)
- Kolom reject note di DB adalah `reject_note` (bukan `note`)
- ID assignment menggunakan UUID v4 (konsisten dengan schema lain)
- Bagian 7 (unconfirmed) tidak diimplementasikan
