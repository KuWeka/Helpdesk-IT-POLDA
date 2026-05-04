# Fase 1 - Stabilitas Alur Inti dan UAT

Tanggal dibuat: 2026-05-04

Tanggal Dokumen: 2026-04-20
Versi Dokumen: V2 Professional
Sumber Asli: phase-master-internal/01_PHASE_1_EXECUTION_PLAN.md

## Tujuan Dokumen

Tanggal mulai: 2026-04-20 Status: Ready for UAT Sign-off Owner: Tim Internal (QA + Backend + Frontend + Ops)

## Ringkasan Eksekutif

- Dokumen ini telah dinormalisasi agar mudah dipindai oleh tim teknis dan non-teknis.
- Struktur isi disusun ulang menjadi tujuan, ringkasan, daftar bahasan, konten inti, dan checklist verifikasi.
- Bagian teknis asli dipertahankan agar jejak keputusan dan implementasi tetap dapat diaudit.

## Peta Isi

1. Objective
2. Scope Wajib
3. Alur Kritikal yang Wajib Lulus
4. Gate Kualitas Teknis (Minimum)
5. Checklist UAT Lintas Role
6. Admin
7. Teknisi
8. User

## Konten Inti (Disusun Ulang)

Tanggal mulai: 2026-04-20
Status: Ready for UAT Sign-off
Owner: Tim Internal (QA + Backend + Frontend + Ops)

## Objective

Menjadikan sistem siap pakai internal dengan menutup semua risiko blocker/high pada alur kritikal.

## Scope Wajib

1. Feature freeze (tanpa fitur baru).
2. Validasi alur kritikal lintas role.
3. Gate kualitas wajib lulus.
4. UAT lintas role berbasis checklist.

## Alur Kritikal yang Wajib Lulus

1. Login + session refresh.
2. User membuat tiket dengan lampiran.
3. Admin assign tiket ke teknisi.
4. Teknisi mengambil tiket dari antrian dan memproses.
5. Progress tiket hingga status selesai.
6. Chat realtime dua arah + read receipt.

## Gate Kualitas Teknis (Minimum)

1. Backend lint pass.
2. Backend test pass.
3. Release readiness pass.
4. Smoke test pass.
5. Synthetic check pass.

## Checklist UAT Lintas Role

### Admin

1. Login dan akses dashboard.
2. Lihat daftar tiket seluruh user.
3. Buka detail tiket dan assign teknisi.
4. Monitor chat dan activity logs.

### Teknisi

1. Login dan akses dashboard teknisi.
2. Buka antrian pending unassigned.
3. Ambil tiket.
4. Update status tiket dan tambah catatan.
5. Balas chat user dan verifikasi read receipt.

### User

1. Login dan akses dashboard user.
2. Buat tiket dengan lampiran valid.
3. Pantau perubahan status tiket.
4. Chat dengan teknisi pada tiket terkait.

## Definisi Selesai Fase 1

1. 0 blocker.
2. 0 high severity.
3. Semua alur kritikal UAT pass.
4. Semua gate kualitas teknis pass.

## Format Evidence UAT (Wajib)

Gunakan format ini untuk setiap skenario:

- Role:
- Skenario:
- Data uji:
- Hasil aktual:
- Status: PASS/FAIL
- Severity jika fail: Blocker/High/Medium/Low
- Bukti: screenshot atau rekaman singkat
- Penguji:
- Tanggal/Jam:

## Workflow Penutupan Fase 1

1. Jalankan seluruh skenario UAT Admin.
2. Jalankan seluruh skenario UAT Teknisi.
3. Jalankan seluruh skenario UAT User.
4. Rekap hasil FAIL dan tetapkan prioritas per severity.
5. Tutup seluruh Blocker/High.
6. Re-test area terdampak.
7. Lakukan Go/No-Go meeting internal.

## Entry Criteria Fase 2

Fase 2 boleh dimulai jika semua poin ini terpenuhi:

1. Gate teknis pass (lint, test, readiness, smoke, synthetic).
2. Seluruh skenario UAT kritikal berstatus PASS.
3. Tidak ada issue severity Blocker/High yang terbuka.
4. Dokumen log Fase 1 sudah diperbarui dan disetujui owner.

## Checklist Review

- [ ] Istilah teknis sudah konsisten antar dokumen
- [ ] Referensi script/path masih valid terhadap struktur repo terbaru
- [ ] Action item lanjutan sudah memiliki owner atau milestone
- [ ] Dokumen siap dipakai untuk onboarding dan audit teknis
