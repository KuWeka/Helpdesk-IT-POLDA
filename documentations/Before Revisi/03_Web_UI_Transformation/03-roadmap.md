# UI Rebuild Roadmap (From Zero)

Tanggal Dokumen: 2026-04-17
Versi Dokumen: V2 Professional
Sumber Asli: archived-md/apps/web/docs/ui-rebuild/03-roadmap.md

## Tujuan Dokumen

Target: Rebuild UI total tanpa mengganggu business flow.

## Ringkasan Eksekutif

- Dokumen ini telah dinormalisasi agar mudah dipindai oleh tim teknis dan non-teknis.
- Struktur isi disusun ulang menjadi tujuan, ringkasan, daftar bahasan, konten inti, dan checklist verifikasi.
- Bagian teknis asli dipertahankan agar jejak keputusan dan implementasi tetap dapat diaudit.

## Peta Isi

1. Phase 0 - Setup and Guardrails
2. Phase 1 - Foundation Build
3. Phase 2 - Auth + Shared Pages
4. Phase 3 - User Domain
5. Phase 4 - Technician Domain
6. Phase 5 - Admin Domain
7. Phase 6 - Hardening and QA
8. Rollback Plan

## Konten Inti (Disusun Ulang)

Tanggal: 2026-04-18
Target: Rebuild UI total tanpa mengganggu business flow.

## Phase 0 - Setup and Guardrails
Durasi: 0.5-1 hari

Output:
- Theme token baseline baru disepakati.
- Konvensi coding UI ditetapkan.
- Baseline visual reference (desktop + mobile).

Checklist:
- [ ] Tetapkan brand color dan semantic colors.
- [ ] Tetapkan font family, radius, shadow, spacing scale.
- [ ] Definisikan acceptance criteria per page.

## Phase 1 - Foundation Build
Durasi: 1-2 hari

Output:
- App shell baru siap pakai.
- Primitive shadcn utama siap.

Checklist:
- [ ] Rework src/index.css token agar brand baru aktif.
- [ ] Standarisasi komponen ui yang dipakai lintas halaman.
- [ ] Selesaikan layout utama (sidebar/header/content).

## Phase 2 - Auth + Shared Pages
Durasi: 1 hari

Output:
- Login, signup, not-found, global error view selesai.

Checklist:
- [ ] Rebuild LoginPage dan SignupPage.
- [ ] Rebuild 404 dan fallback error UI.
- [ ] Validasi flow redirect role.

## Phase 3 - User Domain
Durasi: 2-3 hari

Output:
- Seluruh halaman /user selesai visual baru.

Checklist:
- [ ] Dashboard user
- [ ] Create ticket
- [ ] Ticket list + detail
- [ ] Chat list + detail
- [ ] Settings

## Phase 4 - Technician Domain
Durasi: 1-2 hari

Output:
- Seluruh halaman /technician selesai visual baru.

Checklist:
- [ ] Dashboard teknisi
- [ ] Queue
- [ ] Ticket list + detail
- [ ] Chat
- [ ] Settings

## Phase 5 - Admin Domain
Durasi: 2-3 hari

Output:
- Seluruh halaman /admin selesai visual baru.

Checklist:
- [ ] Admin dashboard
- [ ] All tickets + detail + history
- [ ] Manage users + technicians
- [ ] Chat monitoring
- [ ] Activity logs
- [ ] System settings

## Phase 6 - Hardening and QA
Durasi: 1-2 hari

Output:
- UI stabil, aksesibilitas dan responsif tervalidasi.

Checklist:
- [ ] Cross-browser smoke test.
- [ ] Mobile and tablet pass.
- [ ] Kontras dan keyboard navigation pass.
- [ ] Regression test flow kritikal.

## Rollback Plan
- Simpan branch terpisah untuk rebuild UI.
- Merge bertahap per domain.
- Jika ada regresi besar, rollback per domain commit, bukan full revert project.

## Success Metrics
- Konsistensi komponen lintas role pages.
- Penurunan duplikasi style manual.
- Tidak ada P1 regression pada auth, ticket, chat flow.

## Checklist Review

- [ ] Istilah teknis sudah konsisten antar dokumen
- [ ] Referensi script/path masih valid terhadap struktur repo terbaru
- [ ] Action item lanjutan sudah memiliki owner atau milestone
- [ ] Dokumen siap dipakai untuk onboarding dan audit teknis
