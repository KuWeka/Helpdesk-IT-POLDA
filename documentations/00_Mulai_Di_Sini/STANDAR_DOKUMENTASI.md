# Standar Dokumentasi

Tanggal dibuat: 2026-05-04

Dokumen ini mendefinisikan standar minimum agar seluruh isi folder `documentations/` tetap konsisten, mudah dibaca, dan mudah dipelihara.

## Standar Minimum Setiap File Markdown

Setiap file `.md` sebaiknya memiliki elemen berikut:

1. Judul yang jelas di bagian atas.
2. Baris `Tanggal dibuat: YYYY-MM-DD`.
3. Ringkasan konteks atau tujuan dokumen pada 1-3 paragraf awal.
4. Struktur heading yang konsisten.
5. Jika dokumen bersifat historis, cantumkan status atau sesi revisi.

## Penempatan Dokumen

- `00_Mulai_Di_Sini/` untuk onboarding dan standar dokumentasi.
- `01_System_Reference/` untuk referensi sistem yang berlaku saat ini.
- `07_Remediation_Program/` untuk analisis bug, remediation, dan evaluasi teknis.
- `After Revisi/` untuk histori implementasi setelah rangkaian revisi.
- `Before Revisi/` untuk arsip historis sebelum revisi besar.
- `Promt/` untuk prompt kerja, brief, dan workflow AI/developer.

## Aturan Update

- Jika perubahan memengaruhi alur pengguna, update `01_System_Reference/`.
- Jika perubahan adalah hasil pengerjaan sesi, update `After Revisi/`.
- Jika ditemukan bug baru atau root cause baru, update `07_Remediation_Program/`.
- Jangan menulis ulang arsip `Before Revisi/` kecuali untuk penambahan metadata atau indeks navigasi.

## Penamaan File

- Gunakan huruf kapital konsisten bila file memang berupa dokumen resmi.
- Gunakan nama yang menjelaskan isi, bukan nama generik seperti `catatan.md`.
- Gunakan prefix numerik hanya jika dokumen memang bagian dari urutan baca.

## Link Internal

- Gunakan link relatif antar dokumen.
- Setelah memindahkan atau mengganti nama file, perbarui indeks terkait.
- Hindari dokumen yatim tanpa tautan dari README area.
