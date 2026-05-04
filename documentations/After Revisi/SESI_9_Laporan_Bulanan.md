# Sesi 9 — Laporan Bulanan

Tanggal dibuat: 2026-05-04

**Tanggal Pengerjaan:** 2 Mei 2026  
**Status:** ✅ Selesai

---

## Tujuan

Menambahkan fitur Laporan Bulanan yang dapat diakses oleh semua role (Satker, Padal/Teknisi, Subtekinfo). Setiap role mendapat tampilan laporan yang sesuai dengan cakupan kerjanya, serta kemampuan mengekspor laporan ke format Excel dan PDF.

---

## Perubahan Backend

### 1. Instalasi Dependency Baru

```bash
cd backend
npm install exceljs pdfkit
```

- `exceljs` — generate file Excel (.xlsx) dengan styling
- `pdfkit` — generate file PDF dengan streaming

### 2. File Baru: `backend/src/routes/reports.js`

Dua endpoint utama:

#### `GET /api/reports/monthly`
Query params: `month`, `year`

Respons berbeda per role:

| Role | Data yang dikembalikan |
|------|----------------------|
| Satker / Teknisi | `totalTickets`, `openTickets`, `closedTickets`, `ditolakTickets`, daftar tiket milik sendiri |
| Padal | `totalHandled`, `selesai`, `ditolak`, `avgRating`, daftar tiket yang dikerjakan + kolom rating |
| Subtekinfo | `summary` (total keseluruhan), `perPadal` (statistik per Padal), `ditolak` (daftar tiket ditolak + alasan), `rankingSatker` (satker paling banyak buat tiket), daftar semua tiket |

#### `GET /api/reports/monthly/export`
Query params: `format` (xlsx / pdf), `month`, `year`

- **xlsx**: ExcelJS workbook dengan header berwarna, baris summary, tabel tiket lengkap
- **pdf**: PDFKit document dengan judul, summary bullet points, tabel tiket, section tambahan untuk Subtekinfo
- Keduanya di-stream langsung ke response dengan header `Content-Disposition: attachment`

### 3. `backend/src/server.js`

Menambahkan registrasi route baru:

```js
import reportRoutes from './routes/reports.js';
// ...
app.use('/api/reports', reportRoutes);
```

---

## Perubahan Frontend

### 4. File Baru: `apps/web/src/pages/MonthlyReportPage.jsx`

Halaman laporan bulanan dengan fitur:

- **Filter**: Dropdown pilih bulan + tahun + tombol "Tampilkan"
- **Export**: Tombol "Download Excel" (FileSpreadsheet) dan "Download PDF" (FileText) muncul setelah data ditampilkan
- **Download mechanism**: Axios `responseType: 'blob'` + membuat object URL + trigger klik `<a>` element
- **Tampilan berbeda per role**:
  - Satker/Teknisi: StatBox 4 kolom (Total Tiket, Selesai, Ditolak, Diproses) + tabel tiket
  - Padal: StatBox 4 kolom (Total Ditangani, Selesai, Ditolak, Rata-rata Rating) + tabel tiket + kolom rating
  - Subtekinfo: StatBox 4 kolom sistem + tabel tiket + tabel perPadal + tabel ditolak + tabel rankingSatker

Sub-komponen internal:
- `StatBox` — kotak statistik dengan label dan value
- `ReportSummary` — section ringkasan berisi grid StatBox
- `TicketTable` — tabel tiket dengan badge status

### 5. `apps/web/src/App.jsx`

Menambahkan import dan route:

```jsx
import MonthlyReportPage from '@/pages/MonthlyReportPage.jsx';

// /user routes
<Route path="reports" element={<MonthlyReportPage />} />

// /technician routes
<Route path="reports" element={<MonthlyReportPage />} />

// /admin routes
<Route path="reports" element={<MonthlyReportPage />} />
```

### 6. `apps/web/src/components/layout/sidebar-data.js`

Menambahkan icon `BarChart2` dari lucide-react dan menu "Laporan Bulanan" di semua sidebar:

```js
import { ..., BarChart2 } from 'lucide-react';

// userSidebarData (Satker/Teknisi)
{ title: 'Laporan Bulanan', url: '/user/reports', icon: BarChart2 }

// technicianSidebarData (Padal)
{ title: 'Laporan Bulanan', url: '/technician/reports', icon: BarChart2 }

// adminSidebarData (Subtekinfo) — di group "Monitoring & Laporan"
{ title: 'Laporan Bulanan', url: '/admin/reports', icon: BarChart2 }
```

---

## Ringkasan File yang Diubah / Dibuat

| File | Aksi |
|------|------|
| `backend/src/routes/reports.js` | Dibuat (baru) |
| `backend/src/server.js` | Diubah (tambah register route) |
| `apps/web/src/pages/MonthlyReportPage.jsx` | Dibuat (baru) |
| `apps/web/src/App.jsx` | Diubah (tambah import + 3 route) |
| `apps/web/src/components/layout/sidebar-data.js` | Diubah (tambah BarChart2 + 3 menu item) |

---

## Catatan

- Laporan hanya menampilkan data bulan yang dipilih (default: bulan & tahun saat ini)
- Autentikasi wajib untuk semua endpoint laporan
- Export PDF dan Excel menggunakan data yang sama dengan tampilan web (query identik)
- Tidak ada perubahan schema database di sesi ini
