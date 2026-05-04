# Sesi 3 — Hapus Fitur Urgensi Menyeluruh

Tanggal dibuat: 2026-05-04

**Tanggal:** Sesi 3 dari 10  
**Status:** ✅ Selesai  
**Scope:** Menghapus semua referensi urgency (tingkat urgensi tiket) dari backend dan frontend secara menyeluruh.

---

## Latar Belakang

Fitur urgency (Low/Medium/High/Critical atau Rendah/Sedang/Tinggi/Kritis) dihapus karena tidak relevan dengan alur kerja revisi baru. Pada sistem baru, penentuan prioritas penanganan tiket dilakukan oleh Padal/Subtekinfo secara manual, bukan berdasarkan label urgensi.

---

## File yang Diubah

### Backend

#### `backend/src/services/TicketService.js`
- **Dihapus:** Blok filter `if (filters.urgency)` pada method `getTickets()`
- **Dihapus:** Field `urgency: ticketData.urgency` dari objek ticket di `createTicket()`
- **Diubah:** Query INSERT — kolom `urgency` dihapus dari daftar kolom dan nilai parameter dikurangi dari 13 menjadi 12
- **Dihapus:** 4 baris `SUM(CASE WHEN urgency = '...' THEN 1 ELSE 0 END)` dari query `getTicketStats()`

#### `backend/src/routes/dashboard.js`
- **Diubah:** 5 query SELECT — `t.urgency` dihapus dari daftar kolom pada:
  - Admin-summary: query Pending, Proses, Selesai
  - Technician-summary: query Pending, query Proses (my tickets)

#### `backend/src/utils/swagger.js`
- **Dihapus:** Properti `urgency` dari definisi skema Ticket di dokumentasi Swagger

---

### Frontend (Komponen Dihapus)

| File | Alasan |
|------|--------|
| `apps/web/src/components/tickets/UrgencyBadge.jsx` | Komponen tidak lagi diperlukan |
| `apps/web/src/components/modals/ConfirmTakeTicketDialog.jsx` | Mengimpor UrgencyBadge; juga akan dihapus di Sesi 4 (hapus chat) |

---

### Frontend (File Dimodifikasi)

#### `apps/web/src/lib/constants.js`
- **Dihapus:** Export `URGENCY_LEVELS`
- **Diperbarui:** `ROLES` — dari `{ ADMIN, USER, TECHNICIAN }` menjadi `{ SUBTEKINFO, PADAL, TEKNISI, SATKER }` sesuai role baru

#### `apps/web/src/pages/CreateTicketPage.jsx`
- Dihapus: `urgency` dari `formData` state
- Dihapus: `handleSelectChange` (handler khusus urgency)
- Dihapus: Validasi wajib urgency pada `handleSubmit`
- Dihapus: Field `urgency` dari payload POST `/tickets`
- Dihapus: Elemen form Select Urgensi beserta `SelectItem`-nya
- Dihapus: Import `Select, SelectContent, SelectItem, SelectTrigger, SelectValue`

#### `apps/web/src/pages/admin/AdminDashboard.jsx`
- Dihapus: Import `UrgencyBadge`
- Dihapus: State `urgentTickets` dan logika filter urgentCount
- Dihapus: Kolom "Urgensi" dari header tabel dan baris skeleton
- Dihapus: `<UrgencyBadge urgency={tk.urgency} />` dari baris tabel
- Diperbarui: `colSpan` dari 6/5 menjadi 5/4

#### `apps/web/src/pages/admin/AllTicketsPage.jsx`
- Dihapus: Import `UrgencyBadge`
- Dihapus: State `urgencyFilter`
- Dihapus: Logika filter `urgency` pada `filterStr` dan parameter API
- Dihapus: `urgencyFilter` dari `useEffect` dependency array
- Dihapus: Reset `urgencyFilter` di `resetFilters()`
- Dihapus: Select dropdown Urgency dari filter UI
- Dihapus: Kolom "Urgency" dari tabel header dan baris data/skeleton
- Diperbarui: `colSpan` empty state dari 8 menjadi 7

#### `apps/web/src/pages/admin/TicketHistoryPage.jsx`
- Dihapus: Import `UrgencyBadge`
- Dihapus: State `urgencyFilter`
- Dihapus: Logika filter urgency pada `filterStr` dan parameter API
- Dihapus: `urgencyFilter` dari `useEffect` dependency array
- Dihapus: Kolom "Urgency" dari tabel header dan baris data
- Dihapus: `<UrgencyBadge urgency={selectedTicket.urgency} />` dari modal detail
- Diperbarui: `colSpan` dari 7 menjadi 6

#### `apps/web/src/pages/admin/AdminTicketDetailPage.jsx`
- Dihapus: Import `UrgencyBadge`
- Dihapus: `<UrgencyBadge urgency={ticket.urgency} />` dari header tiket

#### `apps/web/src/pages/technician/TechnicianDashboard.jsx`
- Dihapus: Import `UrgencyBadge`
- Dihapus: State `urgentTickets` dan logika urgentCount
- Dihapus: Kolom "Urgency" dari tabel antrian pending
- Dihapus: `<UrgencyBadge urgency={ticket.urgency} />` dari tabel
- Dihapus: `<UrgencyBadge urgency={selectedTicket.urgency} />` dari dialog konfirmasi ambil tiket

#### `apps/web/src/pages/technician/TechnicianQueuePage.jsx`
- Dihapus: Import `UrgencyBadge`
- Dihapus: Kolom "Urgency" dari tabel header dan baris data/skeleton

#### `apps/web/src/pages/technician/TechnicianTicketDetailPage.jsx`
- Dihapus: Import `UrgencyBadge`
- Dihapus: `<UrgencyBadge urgency={ticket.urgency} />` dari header tiket

#### `apps/web/src/pages/technician/TechnicianTicketsPage.jsx`
- Dihapus: Import `UrgencyBadge`
- Dihapus: State `urgencyFilter` dan default `sortOrder` diubah dari `'urgency_desc'` ke `'newest'`
- Dihapus: Parameter `urgency` dari API call
- Dihapus: `urgencyFilter` dari dependency array
- Dihapus: Select dropdown Urgency dari filter UI
- Dihapus: Sort option `urgency_desc` dari dropdown Sort
- Dihapus: Kolom "Urgensi" dari tabel header dan baris data/skeleton
- Diperbarui: `colSpan` dari 7 menjadi 6

#### `apps/web/src/pages/TicketDetailPage.jsx`
- Dihapus: Import `UrgencyBadge`
- Dihapus: `<UrgencyBadge urgency={ticket.urgency} />` dari header tiket

#### `apps/web/src/pages/UserTicketsPage.jsx`
- Dihapus: Import `UrgencyBadge`
- Dihapus: Logika `canChat` yang bergantung pada `ticket.urgency === 'Kritis'`
- Dihapus: Case `urgency_desc` dari `mapSortOrder()`
- Diubah: Default `sortOrder` dari `'urgency_desc'` menjadi `'newest'`
- Dihapus: SelectItem `urgency_desc` dari dropdown Sort
- Dihapus: Kolom "Urgency" dari tabel header dan baris data/skeleton
- Diperbarui: `colSpan` dari 7 menjadi 6

#### `apps/web/src/i18n/locales/en.json`
- Dihapus: `"common.urgency"` key
- Dihapus: `"userTickets.sortUrgencyDesc"` key
- Dihapus: `"techTickets.allUrgency"` key

#### `apps/web/src/i18n/locales/id.json`
- Dihapus: `"common.urgency"` key
- Dihapus: `"userTickets.sortUrgencyDesc"` key
- Dihapus: `"techTickets.allUrgency"` key

---

## Verifikasi

Setelah semua perubahan, dilakukan verifikasi menyeluruh dengan `Select-String -Pattern "urgency"` pada semua file `.js`, `.jsx`, `.json` di `backend/src` dan `apps/web/src`. **Hasil: 0 match** — tidak ada referensi urgency yang tersisa.

---

## Catatan Tambahan

- File `ConfirmTakeTicketDialog.jsx` dihapus di Sesi 3 (bukan Sesi 4) karena secara langsung mengimpor `UrgencyBadge`. File ini tetap terdaftar untuk dihapus di Sesi 4 dalam konteks penghapusan fitur chat.
- `constants.js` diperbarui dengan nama role baru (`Subtekinfo`, `Padal`, `Teknisi`, `Satker`) sebagai pelengkap Sesi 2.

---

## Sesi Berikutnya

**Sesi 4 — Hapus Sistem Chat Internal:**
- Backend: Hapus `routes/chats.js`, `routes/messages.js`, `services/ChatService.js`, `services/MessageService.js`; bersihkan `server.js`
- Frontend: Hapus semua halaman chat (`ChatListPage`, `ChatDetailPage`, `TechnicianChatsPage`, dll.), hapus rute chat dari `App.jsx`, hapus menu chat dari sidebar
- Ganti tombol Chat di `TicketDetailPage.jsx` dengan tombol WhatsApp yang membaca nomor WA dari `system_settings`
