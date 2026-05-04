# Sesi 8 — Manajemen Shift Padal

Tanggal dibuat: 2026-05-04

**Tanggal:** Mei 2026  
**Status:** ✅ Selesai

---

## Ringkasan

Sesi ini mengimplementasikan manajemen jadwal shift Padal. Subtekinfo dapat mengatur tanggal mulai dan akhir shift untuk setiap Padal. Status aktif dihitung otomatis berdasarkan tanggal hari ini (kolom `VIRTUAL` di MySQL). Padal aktif diprioritaskan saat memilih assignee tiket.

---

## Perubahan Backend

### File Baru: `backend/src/routes/padal-shifts.js`

| Endpoint | Keterangan |
|---|---|
| `GET /api/padal-shifts` | Hanya Subtekinfo. List semua Padal + data shift + `is_shift_active`. Diurutkan: aktif dahulu, kemudian alfabet nama. |
| `PUT /api/padal-shifts/:padal_id` | Hanya Subtekinfo. Upsert (INSERT or UPDATE) shift Padal. Validasi: `shift_start` dan `shift_end` wajib, `shift_end >= shift_start`. Validasi bahwa `padal_id` adalah user dengan role `Padal`. |

### `backend/src/server.js`
- Import dan register `padalShiftRoutes` di `/api/padal-shifts`

### `backend/src/services/UserService.js` — `getUsers()`
- Ditambah LEFT JOIN ke `padal_shifts` pada semua query user
- Kolom tambahan di SELECT: `ps.shift_start`, `ps.shift_end`, `ps.is_active AS is_shift_active`, `ps.notes AS shift_notes`
- Sorting khusus untuk `role=Padal`: `ORDER BY ps.is_active DESC, u.name ASC` (Padal sedang aktif shift muncul di atas)

---

## Perubahan Frontend

### File Baru: `apps/web/src/pages/admin/ManageShiftPage.jsx`
- Tabel list semua Padal dengan kolom: Nama, Shift Mulai, Shift Selesai, Status, Catatan, Aksi
- Badge status: **Aktif** (hijau), **Tidak Aktif** (secondary), **Belum Diatur** (outline)
- Dialog edit shift: date picker mulai/selesai, textarea catatan, preview status otomatis
- Validasi client-side: tanggal wajib, `shift_end >= shift_start`
- Reload tabel otomatis setelah simpan

### `apps/web/src/pages/admin/ManageTechniciansPage.jsx`
- Import ikon `Calendar` dari lucide-react
- Tambah kolom **Status Shift** di tabel dengan badge:
  - 🔵 `Sedang Shift` (biru) — jika `is_shift_active = true`
  - Abu-abu `Tidak Aktif` — jika shift ada tapi tidak aktif
  - `Belum diatur` (teks kecil) — jika belum ada data shift

### `apps/web/src/components/modals/AssignPadalModal.jsx`
- Import `Badge` dari shadcn/ui
- Tampilkan badge **Aktif** (hijau) di sebelah nama Padal yang sedang aktif shift
- Data sudah terurut (aktif di atas) karena `UserService.getUsers` otomatis sort saat `role=Padal`

### `apps/web/src/App.jsx`
- Import `ManageShiftPage`
- Route `/admin/padal-shifts` ditambahkan di bawah `/admin` routes

### `apps/web/src/components/layout/sidebar-data.js`
- Import ikon `Calendar`
- Menu **Shift Padal** (`/admin/padal-shifts`) ditambahkan di grup "Manajemen Pengguna" sidebar Subtekinfo

---

## Struktur Database yang Digunakan

```sql
-- Dibuat di Sesi 1 (kolom is_active adalah VIRTUAL — dihitung otomatis)
CREATE TABLE padal_shifts (
  id          VARCHAR(36) PRIMARY KEY,
  padal_id    VARCHAR(36) NOT NULL UNIQUE,
  shift_start DATE        NOT NULL,
  shift_end   DATE        NOT NULL,
  is_active   BOOLEAN GENERATED ALWAYS AS (
                CURDATE() BETWEEN shift_start AND shift_end
              ) VIRTUAL,
  notes       TEXT        NULL,
  created_at  TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP   DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (padal_id) REFERENCES users(id) ON DELETE CASCADE
);
```
