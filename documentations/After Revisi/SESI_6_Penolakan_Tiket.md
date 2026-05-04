# Sesi 6 — Penolakan Tiket dengan Alasan Wajib

Tanggal dibuat: 2026-05-04

**Tanggal**: Mei 2026  
**Status**: ✅ Selesai

---

## Cakupan Pengerjaan

### 1. Backend — `POST /api/tickets/:id/reject`

**File**: `backend/src/routes/tickets.js`

- Role: `Subtekinfo` only
- Validasi: `reason` wajib, tidak boleh kosong/whitespace → return 400 jika kosong
- Validasi: tiket tidak boleh sudah berstatus `Ditolak`
- Update: `status = 'Ditolak'`, `rejection_reason = reason.trim()`, `updated_at = NOW()`
- Emit Socket.IO: `ticket:status_changed` ke room `user:{satker_id}` dengan payload `{ ticket_id, ticket_number, new_status: 'Ditolak', reason }`
- Invalidasi cache tiket + dashboard

---

### 2. Frontend — `RejectTicketModal.jsx` (Baru)

**File**: `apps/web/src/components/modals/RejectTicketModal.jsx`

- Dialog dengan `Textarea` wajib diisi
- Tombol "Tolak Tiket" disabled selama `reason.trim()` kosong atau loading
- Counter karakter ditampilkan di bawah textarea
- Pesan error dari API ditampilkan via `toast.error`

---

### 3. Frontend — `AllTicketsPage.jsx` (Update)

**File**: `apps/web/src/pages/admin/AllTicketsPage.jsx`

- Import `RejectTicketModal` dan ikon `XCircle`
- State baru: `rejectTarget`
- Tombol **Tolak Tiket** di dropdown menu — hanya tampil jika `ticket.status === 'Pending'`
- Warna amber untuk membedakan dari aksi destructive delete
- Modal `RejectTicketModal` di-render di bawah modal `AssignPadalModal`

---

### 4. Frontend — `TicketDetailPage.jsx` (Update)

**File**: `apps/web/src/pages/TicketDetailPage.jsx`

- Import `socket` dari `@/lib/socket.js`
- `useEffect` baru: listen `ticket:status_changed`
  - Jika `ticket_id` match: update state ticket (status + rejection_reason)
  - Jika status `Ditolak`: `toast.error` dengan alasan (durasi 8 detik)
  - Jika status lain: `toast.info` info perubahan status
- Tambahan: Card banner "Tiket Ditolak" ditampilkan jika `ticket.status === 'Ditolak'` dan `rejection_reason` terisi
- **Fix**: duplicate `</Button>` pada tombol WhatsApp dihapus

---

## Alur Lengkap

```
Subtekinfo → AllTicketsPage → dropdown tiket Pending → Tolak Tiket
  → RejectTicketModal (isi alasan, klik Tolak)
    → POST /api/tickets/:id/reject { reason }
      → DB: status='Ditolak', rejection_reason=reason
      → Socket emit → user:{satker_id} → ticket:status_changed
        → Satker di TicketDetailPage → toast.error + banner merah tampil
```

---

## File yang Diubah

| File | Tipe Perubahan |
|---|---|
| `backend/src/routes/tickets.js` | Tambah endpoint `POST /:id/reject` |
| `apps/web/src/components/modals/RejectTicketModal.jsx` | **Baru** |
| `apps/web/src/pages/admin/AllTicketsPage.jsx` | Tambah tombol Tolak + modal |
| `apps/web/src/pages/TicketDetailPage.jsx` | Socket listener + banner rejection_reason + fix bug |
