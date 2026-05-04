# Dokumentasi Sesi 2 — Restrukturisasi Role Backend

Tanggal dibuat: 2026-05-04

**Proyek:** ProjectPolda — IT Helpdesk Ticket Management  
**Sesi:** 2 dari 10  
**Tanggal:** Mei 2026  
**Status:** ✅ Selesai

---

## Ringkasan

Sesi ini memperbarui fondasi otorisasi backend agar semua route dan schema menggunakan role baru. Tidak ada fitur baru yang ditambahkan — hanya restrukturisasi otorisasi dan pembersihan field terkait role lama.

---

## File yang Diubah

| File | Jenis Perubahan |
|---|---|
| `backend/src/utils/validationSchemas.js` | Update role enum, hapus urgency, update ticket schemas, tambah schema baru |
| `backend/src/routes/tickets.js` | Update role-based filtering, hapus urgency dari query/insert, update DELETE & notes role |
| `backend/src/routes/users.js` | Update semua role guard, hapus auto-create technician_settings |
| `backend/src/middleware/role.js` | **Tidak diubah** — logika sudah benar, hanya nilai role yang berubah di route-route |

---

## Rincian Perubahan

### 1. `validationSchemas.js`

| Yang Diubah | Sebelum | Sesudah |
|---|---|---|
| `patterns.urgency` | Ada | **Dihapus** |
| `patterns.role` | `valid('Admin','Teknisi','User')` | `valid('Subtekinfo','Padal','Teknisi','Satker')` |
| `authSchemas.register` default role | `'User'` | `'Satker'` |
| `userSchemas.create` field `division_id` | Ada | **Dihapus** |
| `userSchemas.update` field `division_id` | Ada | **Dihapus** |
| `ticketSchemas.create` field `urgency` | Required | **Dihapus** |
| `ticketSchemas.update` field `urgency` | Optional | **Dihapus** |
| `ticketSchemas.list` field `urgency` | Ada | **Dihapus** |
| `ticketSchemas.list` field `sort` | Include `'urgency'` | Tanpa `'urgency'` |
| `ratingSchema` | Tidak ada | **Ditambah** — `{ rating: integer 1–5 }` |
| `assignSchema` | Tidak ada | **Ditambah** — `{ padal_id: uuid }` |
| `rejectSchema` | Tidak ada | **Ditambah** — `{ reason: string min 5 max 1000 }` |
| `module.exports` | Tanpa schema baru | Ekspor `ratingSchema`, `assignSchema`, `rejectSchema` |

---

### 2. `routes/tickets.js`

#### `GET /api/tickets`
- Hapus `urgency` dari destructuring query
- Ganti `effectiveAssignedTechnicianId` → `effectivePadalId`
- Role `'User'` → `'Satker'` (scope ke tiket sendiri)
- Role `'Teknisi'` → `'Padal'` (scope ke tiket yang di-assign ke dirinya via `padal_id`)
- Hapus `urgency` dari object yang dikirim ke `TicketService.getTickets()`

#### `GET /api/tickets/summary`
- Role `'User'` → `'Satker'`
- Role `'Teknisi'` → `'Padal'` (filter via `padal_id`)
- Role `'Admin'` → `'Subtekinfo'`
- **Hapus** query `urgentRows` (urgency tidak ada lagi di DB)
- **Hapus** `urgent_count` dari response
- **Tambah** `ditolak` dan `dibatalkan` ke response summary

#### `GET /api/tickets/:id`
- Hapus `LEFT JOIN divisions d` (tabel sudah di-drop)
- Hapus `d.name as reporter_division_name` dari SELECT
- Tambah `LEFT JOIN users padal ON t.padal_id = padal.id`
- Tambah `padal.name as padal_name` ke SELECT
- Role check: `'User'` → `'Satker'`
- Tambah role check untuk `'Padal'` (hanya bisa lihat tiket yang padal_id-nya adalah dirinya)
- Tambah `padal_id` ke `ticket.expand`

#### `POST /api/tickets`
- Hapus `urgency` dari destructuring body
- Hapus `urgency` dari INSERT query dan values array
- Ganti `io.to('technicians').emit('new_ticket', ...)` → `io.to('subtekinfo').emit('ticket:new', ...)` dengan payload baru
- Hapus `urgency` dari `ticketData` response

#### `DELETE /api/tickets/:id`
- Role: `role('Admin')` → `role('Subtekinfo', 'Padal')`

#### `POST /api/tickets/:id/notes`
- Role: `role('Admin', 'Teknisi')` → `role('Subtekinfo', 'Padal')`

---

### 3. `routes/users.js`

| Endpoint | Sebelum | Sesudah |
|---|---|---|
| `GET /api/users` | `role('Admin', 'Teknisi')` | `role('Subtekinfo')` |
| `GET /api/users/:id` (role check) | `req.user.role !== 'Admin'` | `req.user.role !== 'Subtekinfo'` |
| `POST /api/users` | `role('Admin')` | `role('Subtekinfo')` |
| `PATCH /api/users/:id` (role check) | `req.user.role !== 'Admin'` | `req.user.role !== 'Subtekinfo'` |
| `PATCH /api/users/:id` | Auto-create `technician_settings` saat role → Teknisi | **Dihapus** (tabel sudah di-drop) |
| `DELETE /api/users/:id` | `role('Admin')` | `role('Subtekinfo')` |

---

## Checklist Sesi 2

- [x] `patterns.role` diperbarui ke 4 role baru
- [x] `patterns.urgency` dihapus dari validationSchemas
- [x] `ticketSchemas.create` — field `urgency` dihapus
- [x] `ticketSchemas.update` — field `urgency` dihapus
- [x] `ticketSchemas.list` — field `urgency` dan sort `urgency` dihapus
- [x] `userSchemas.create/update` — field `division_id` dihapus
- [x] `ratingSchema` ditambahkan
- [x] `assignSchema` ditambahkan
- [x] `rejectSchema` ditambahkan
- [x] `GET /api/tickets` — role filtering diperbarui (Satker, Padal, Teknisi, Subtekinfo)
- [x] `GET /api/tickets/summary` — `urgent_count` dihapus, role checks diperbarui
- [x] `GET /api/tickets/:id` — JOIN divisions dihapus, JOIN padal ditambah, role checks diperbarui
- [x] `POST /api/tickets` — urgency dihapus dari INSERT, emit diperbarui ke `ticket:new`
- [x] `DELETE /api/tickets/:id` — role diperbarui ke `Subtekinfo, Padal`
- [x] `POST /api/tickets/:id/notes` — role diperbarui ke `Subtekinfo, Padal`
- [x] `GET /api/users` — role guard diperbarui ke `Subtekinfo`
- [x] `POST /api/users` — role guard diperbarui ke `Subtekinfo`
- [x] `PATCH /api/users/:id` — role check dan auto-create technician_settings dihapus
- [x] `DELETE /api/users/:id` — role guard diperbarui ke `Subtekinfo`
- [x] `middleware/role.js` — diverifikasi, tidak perlu perubahan logika

---

## Catatan

- Schema baru (`ratingSchema`, `assignSchema`, `rejectSchema`) sudah disiapkan di sesi ini tetapi baru digunakan di Sesi 5, 6, dan 7.
- `TicketService.getTickets()` masih menerima parameter `urgency` dari sisi service — pembersihan menyeluruh ke service layer dilakukan di **Sesi 3**.
- Endpoint `technician_settings` di `users.js` belum dihapus sepenuhnya (hanya auto-create dihapus) — refactor ke `/api/padal-shifts` dilakukan di **Sesi 8**.
