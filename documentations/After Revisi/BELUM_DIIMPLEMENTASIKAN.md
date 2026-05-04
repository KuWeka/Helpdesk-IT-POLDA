# Catatan Fitur yang Masih Perlu Keputusan

Tanggal dibuat: 2026-05-04

> Dokumen ini diperbarui setelah implementasi batch 4 Mei 2026.
> Item yang sebelumnya ada pada daftar ini sudah diimplementasikan kecuali yang masih butuh keputusan bisnis.

---

## 1. Format Kolom Laporan Excel vs PDF

**Pertanyaan:** Apakah format kolom laporan Excel dan PDF harus sama persis, atau berbeda?

**Kondisi saat ini:**
- Excel (`exceljs`): header berwarna, baris summary, tabel tiket lengkap.
- PDF (`pdfkit`): judul, summary bullet points, tabel tiket, section tambahan Subtekinfo.
- Keduanya saat ini disesuaikan dengan karakter format masing-masing.

**Yang perlu diputuskan:**
- Apakah perlu menyamakan kolom secara presisi.
- Apakah perlu logo/kop surat instansi di PDF.
- Apakah perlu pagination/partition tambahan pada file Excel.

**Dampak implementasi:**
- Perubahan lanjutan di `backend/src/routes/reports.js` untuk sinkronisasi output.

---

## Item Yang Sudah Ditutup

- Tampilan rata-rata rating Padal: sudah diimplementasikan.
- Batas waktu konfirmasi assign Padal (timeout): sudah diimplementasikan.
- Teknisi pada halaman manajemen Padal: sudah diimplementasikan (tab Padal/Teknisi).
- Matriks izin pembatalan tiket: sudah diimplementasikan.
- Batas waktu edit tiket oleh Satker: sudah diimplementasikan.
