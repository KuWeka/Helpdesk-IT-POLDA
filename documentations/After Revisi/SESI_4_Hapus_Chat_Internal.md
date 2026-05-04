# Sesi 4 — Hapus Sistem Chat Internal

Tanggal dibuat: 2026-05-04

**Tanggal:** Sesi 4 dari 10  
**Status:** ✅ Selesai  
**Scope:** Menghapus seluruh sistem chat internal (backend + frontend) dan mengganti tombol Chat di halaman detail tiket Satker dengan tombol "Hubungi via WhatsApp" yang membaca nomor dari `system_settings`.

---

## Latar Belakang

Sistem chat internal (User-Teknisi, Monitoring Admin) dihapus karena pada sistem baru tidak ada hubungan langsung antara Satker dan Padal melalui chat. Komunikasi langsung dilakukan melalui WhatsApp dengan nomor yang dikonfigurasi di pengaturan sistem.

---

## File yang Dihapus

### Backend

| File | Keterangan |
|------|------------|
| `backend/src/routes/chats.js` | Route API chat |
| `backend/src/routes/messages.js` | Route API pesan |
| `backend/src/services/ChatService.js` | Service logika chat |
| `backend/src/services/MessageService.js` | Service logika pesan |

### Frontend — Halaman

| File | Keterangan |
|------|------------|
| `apps/web/src/pages/ChatListPage.jsx` | Daftar chat user (Satker) |
| `apps/web/src/pages/ChatDetailPage.jsx` | Detail percakapan chat |
| `apps/web/src/pages/technician/TechnicianChatsPage.jsx` | Halaman chat Padal/Teknisi |
| `apps/web/src/pages/technician/TechnicianSettingsPage.jsx` | Pengaturan teknisi (berisi pengaturan notif chat) |
| `apps/web/src/pages/admin/ChatMonitoringPage.jsx` | Monitoring chat oleh Admin/Subtekinfo |

### Frontend — Komponen

| File | Keterangan |
|------|------------|
| `apps/web/src/components/chat/` (seluruh folder) | Berisi `ChatDetail.jsx`, `ChatMessage.jsx`, `MessageInput.jsx` |
| `apps/web/src/components/modals/NewChatModal.jsx` | Modal buat chat baru |

---

## File yang Dimodifikasi

### Backend

#### `backend/src/server.js`
- **Dihapus:** `const chatRoutes = require('./routes/chats')`
- **Dihapus:** `const messageRoutes = require('./routes/messages')`
- **Dihapus:** `app.use('/api/chats', chatRoutes)`
- **Dihapus:** `app.use('/api/messages', messageRoutes)`

#### `backend/src/middleware/csrf.js`
- **Dihapus:** `'/chats'` dan `'/messages'` dari `EXCLUDED_PATHS` (tidak lagi diperlukan)

#### `backend/migrations/001_revision_schema.sql` (diperbarui)
- **Ditambahkan:** Langkah migrasi baru untuk menambah kolom `whatsapp_number VARCHAR(20) NULL` ke tabel `system_settings` (idempotent dengan cek `INFORMATION_SCHEMA.COLUMNS`)

#### `backend/src/routes/settings.js`
- **Diperbarui:** `PATCH /api/settings` — tambah dukungan field `whatsapp_number`
- **Validasi:** Harus berupa angka 8-20 digit (tanpa `+` atau spasi). Nilai `null`/kosong diizinkan untuk menghapus nomor.

---

### Frontend

#### `apps/web/src/App.jsx`
- **Dihapus:** Import `ChatListPage`, `ChatDetailPage`, `TechnicianChatsPage`, `TechnicianSettingsPage`, `ChatMonitoringPage`
- **Dihapus:** Route `/user/chats`, `/user/chats/:chatId`, `/technician/chats`, `/technician/settings`, `/admin/chats`
- **Diperbarui:** `RootRedirect` — role `Admin` → `Subtekinfo`, role `Teknisi` → `Padal`
- **Diperbarui:** `allowedRoles` pada `ProtectedRoute`:
  - User routes: `['User']` → `['Satker', 'Teknisi']`
  - Technician routes: `['Teknisi']` → `['Padal']`
  - Admin routes: `['Admin']` → `['Subtekinfo']`

#### `apps/web/src/components/layout/sidebar-data.js`
- **Dihapus:** Import `MessageSquare` dari lucide-react
- **Dihapus:** Menu item "Chat" dari `userSidebarData` (Satker)
- **Dihapus:** Menu item "Chat" dan "Pengaturan" dari `technicianSidebarData` (Padal)
- **Dihapus:** Menu item "Monitoring Chat" dari `adminSidebarData` (Subtekinfo)
- **Diperbarui:** Judul menu dan label role: `USER` → `SATKER/TEKNISI`, `TECHNICIAN` → `PADAL`, `ADMIN` → `SUBTEKINFO`
- **Diperbarui:** `getSidebarData()` — case `'Admin'` → `'Subtekinfo'`, case `'Teknisi'` → `'Padal'`

#### `apps/web/src/pages/TicketDetailPage.jsx`
- **Dihapus:** State `isChatLoading` dan fungsi `handleChatTechnician`
- **Dihapus:** Import `MessageSquare, Loader2` dari lucide-react
- **Ditambahkan:** State `waNumber`
- **Ditambahkan:** Fetch `GET /api/settings` saat load halaman untuk membaca `whatsapp_number`
- **Ditambahkan:** Fungsi `handleWhatsApp()` — buka `wa.me/{waNumber}` di tab baru; tampilkan toast error jika nomor belum dikonfigurasi
- **Diperbarui:** Tombol di header tiket — dari tombol "Chat Teknisi" menjadi tombol "Hubungi via WhatsApp" dengan icon `Phone`

#### `apps/web/src/pages/admin/TicketHistoryPage.jsx`
- **Dihapus:** Logika loop hapus chat + pesan sebelum hapus tiket di `handleDeleteTicket()` — kini langsung `DELETE /tickets/:id`

#### `apps/web/src/pages/technician/TechnicianTicketDetailPage.jsx`
- **Dihapus:** Import `MessageSquare` dari lucide-react
- **Dihapus:** Tombol "Chat Pelapor" (navigasi ke `/technician/chats`)

#### `apps/web/src/pages/UserDashboard.jsx`
- **Dihapus:** Import `MessageSquare` dari lucide-react
- **Dihapus:** Tombol "Chat Teknisi" di header dashboard

#### `apps/web/src/pages/UserTicketsPage.jsx`
- **Dihapus:** Import `MessageSquare` dari lucide-react
- **Dihapus:** Fungsi `canChat()` dan tombol chat inline di tabel tiket

---

## Verifikasi

Setelah semua perubahan, dilakukan verifikasi dengan pattern search untuk:
- `ChatList|ChatDetail|TechnicianChats|ChatMonitor|NewChat|ChatMessage|MessageInput|TechnicianSettings`
- `/user/chats|/technician/chats|/admin/chats|api.*chats|api.*messages`

**Hasil: 0 match** — tidak ada referensi chat tersisa di seluruh frontend.

---

## Catatan Penting

- Kolom `whatsapp_number` di `system_settings` harus diisi via `PATCH /api/settings` oleh Subtekinfo agar tombol WA di halaman detail tiket Satker berfungsi.
- Migration SQL perlu dijalankan manual untuk menambah kolom `whatsapp_number` ke database yang sudah ada.
- Tabel `chats` dan `messages` di database sudah dihapus sejak Sesi 1 (migrasi `001_revision_schema.sql`).

---

## Sesi Berikutnya

**Sesi 5 — Alur Assign Padal & Socket.IO Baru:**
- Backend: Buat `POST /api/tickets/:id/assign`, `DELETE /api/tickets/:id/assign`, `PATCH /api/tickets/:id/assignment/respond`
- Backend: Update `socket/index.js` — room management + events baru
- Frontend: Buat `AssignPadalModal.jsx`, komponen notifikasi assign untuk Padal, update `AllTicketsPage.jsx` dan `PadalTicketsPage`
