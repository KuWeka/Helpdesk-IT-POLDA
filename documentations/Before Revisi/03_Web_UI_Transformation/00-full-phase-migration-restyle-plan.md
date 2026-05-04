# Full Phase Plan - UI Migration and Visual Restyle

Tanggal Dokumen: 2026-04-17
Versi Dokumen: V2 Professional
Sumber Asli: archived-md/apps/web/docs/ui-rebuild/00-full-phase-migration-restyle-plan.md

## Tujuan Dokumen

Status: Draft for Execution Scope: Rebuild full UI dari nol menggunakan pola komponen shadcn, dengan visual style baru total (warna, typography, spacing, motion, surface).

## Ringkasan Eksekutif

- Dokumen ini telah dinormalisasi agar mudah dipindai oleh tim teknis dan non-teknis.
- Struktur isi disusun ulang menjadi tujuan, ringkasan, daftar bahasan, konten inti, dan checklist verifikasi.
- Bagian teknis asli dipertahankan agar jejak keputusan dan implementasi tetap dapat diaudit.

## Peta Isi

1. 1. Executive Summary
2. 2. Scope and Boundaries
3. In Scope
4. Out of Scope
5. 3. Target Architecture
6. Layering
7. Rules
8. 4. Visual Restyle System

## Konten Inti (Disusun Ulang)

Tanggal: 2026-04-18
Status: Draft for Execution
Scope: Rebuild full UI dari nol menggunakan pola komponen shadcn, dengan visual style baru total (warna, typography, spacing, motion, surface).

## 1. Executive Summary
Dokumen ini adalah playbook full migration UI + visual restyle. Target utamanya:
- Mengganti seluruh layer presentasi tanpa mengubah business logic backend/API.
- Menstandarkan komponen dan styling agar konsisten lintas role (User, Teknisi, Admin).
- Menurunkan technical debt dari styling yang tidak konsisten.

Durasi estimasi total: 10-16 hari kerja (tergantung ukuran tim dan review cycle).

## 2. Scope and Boundaries
### In Scope
- Seluruh halaman di apps/web (auth, user, technician, admin).
- App shell baru (sidebar, topbar, breadcrumb, content frame).
- Theme baru (warna, token, dark mode policy, radius, shadow).
- Komponen visual dan interaksi berbasis shadcn primitives.
- Responsiveness mobile/tablet/desktop.

### Out of Scope
- Perubahan kontrak endpoint backend.
- Perubahan schema database.
- Penambahan fitur bisnis baru di luar parity UI.

## 3. Target Architecture
### Layering
1. Core layer: hooks, contexts, utils, i18n, services.
2. UI primitive layer: src/components/ui (shadcn-based).
3. Domain component layer: src/components/{tickets,chat,dashboard,users,...}.
4. Page layer: src/pages/*.
5. App shell layer: main layout and route frame.

### Rules
- Business logic tetap di hooks/contexts/services, bukan di UI primitive.
- Semua warna harus token-based, tidak boleh hardcoded hex di page components.
- Semua state penting tersedia: loading, empty, error, success, disabled.

## 4. Visual Restyle System
### 4.1 Brand and Theme Direction
- Nuansa: professional modern, high-clarity, operational dashboard friendly.
- Kontras: minimum WCAG AA.
- Dark mode: optional, diaktifkan setelah light theme stabil.

### 4.2 Core Tokens (mandatory)
- Surface: --background, --foreground, --card, --card-foreground, --popover.
- Brand: --primary, --primary-foreground, --secondary, --accent.
- Feedback: --destructive, --warning, --success, --info.
- Utility: --border, --input, --ring, --muted, --muted-foreground.
- Shape: --radius.
- Layout shell: --sidebar-*.

### 4.3 Typography
- Heading scale jelas (h1-h6) dengan tracking rapi.
- Body text untuk readability dashboard (13-16px range by context).
- Data dense text untuk table/log (12-14px).

### 4.4 Spacing and Radius
- Grid spacing berbasis skala 4px.
- Konsistensi radius komponen via --radius token.
- Gunakan container + section spacing yang konsisten lintas halaman.

### 4.5 Motion
- Motion ringan dan fungsional:
  - Enter/exit untuk dialog/sheet/popover.
  - Page transition subtle (tidak mengganggu).
  - Stagger ringan untuk list load (opsional).
- Hindari motion berlebihan pada dashboard data real-time.

## 5. Full Phase Execution Plan
## Phase 0 - Discovery and Baseline
Durasi: 0.5-1 hari

Tujuan:
- Menyepakati baseline fitur yang harus parity setelah rebuild.
- Menginventarisasi semua page, route, dan state penting.

Aktivitas:
- Audit route tree per role.
- Audit page states (loading, empty, error).
- Audit komponen existing dan technical debt.

Output:
- Baseline matrix fitur per page.
- Risk register awal.

Exit Criteria:
- Tidak ada page kritikal yang belum terpetakan.

## Phase 1 - Design Foundation and Tokens
Durasi: 1-2 hari

Tujuan:
- Menetapkan visual language baru.

Aktivitas:
- Definisikan palette semantic.
- Definisikan typography scale dan density rules.
- Definisikan elevation, border, radius.
- Update token CSS root + dark variant policy.

Output:
- Theme token spec final.
- Global CSS foundation siap dipakai.

Exit Criteria:
- Seluruh primitive dapat membaca token baru.

## Phase 2 - Primitive Component Standardization
Durasi: 1-2 hari

Tujuan:
- Menyatukan komponen dasar agar reusable di semua domain.

Aktivitas:
- Standardisasi button/input/select/table/dialog/tabs/toast.
- Validasi states: hover/focus/active/disabled/loading.
- Tambahkan wrappers untuk form patterns.

Output:
- Stable primitive kit di src/components/ui.

Exit Criteria:
- Primitive kit lulus smoke visual dan keyboard nav.

## Phase 3 - App Shell Rebuild
Durasi: 1 hari

Tujuan:
- Membangun kerangka aplikasi baru.

Aktivitas:
- Rebuild sidebar, topbar, breadcrumb, page container.
- Role-aware navigation treatment.
- Offline banner dan global alert placement.

Output:
- Main layout baru siap jadi host semua page.

Exit Criteria:
- Routing dan protected routes tetap berjalan normal.

## Phase 4 - Shared Pages Rebuild
Durasi: 1 hari

Tujuan:
- Menyelesaikan halaman bersama lintas role.

Aktivitas:
- Rebuild login/signup.
- Rebuild not-found dan generic error fallback.
- Rebuild global loading view.

Output:
- Shared page suite selesai.

Exit Criteria:
- Auth flow tetap utuh (login, redirect role, logout).

## Phase 5 - User Domain Rebuild
Durasi: 2-3 hari

Tujuan:
- Migrasi seluruh route /user.

Aktivitas:
- User dashboard.
- Ticket create/list/detail.
- Chat list/detail.
- User settings.

Output:
- User domain full parity + visual baru.

Exit Criteria:
- Semua user flow lulus smoke test end-to-end.

## Phase 6 - Technician Domain Rebuild
Durasi: 1-2 hari

Tujuan:
- Migrasi seluruh route /technician.

Aktivitas:
- Technician dashboard.
- Queue.
- Ticket list/detail.
- Chat.
- Settings.

Output:
- Technician domain full parity + visual baru.

Exit Criteria:
- Semua technician flow lulus smoke test.

## Phase 7 - Admin Domain Rebuild
Durasi: 2-3 hari

Tujuan:
- Migrasi seluruh route /admin.

Aktivitas:
- Admin dashboard.
- All tickets/detail/history.
- Manage users/technicians.
- Chat monitoring.
- Activity logs.
- System settings.

Output:
- Admin domain full parity + visual baru.

Exit Criteria:
- Semua admin flow kritikal lulus smoke test.

## Phase 8 - Accessibility and Responsive Hardening
Durasi: 1-2 hari

Tujuan:
- Menstabilkan pengalaman semua viewport dan aksesibilitas.

Aktivitas:
- Keyboard-only navigation pass.
- Focus ring and tab order pass.
- Contrast pass.
- Mobile and tablet polish.

Output:
- A11y baseline report.
- Responsive pass report.

Exit Criteria:
- Tidak ada blocker a11y/responsive pada flow utama.

## Phase 9 - Regression and Release Readiness
Durasi: 1-2 hari

Tujuan:
- Menjaga release aman tanpa regresi bisnis.

Aktivitas:
- Regression checklist per role.
- Quick performance sanity (bundle and interaction).
- Staging UAT dengan scenario prioritas.

Output:
- Release readiness checklist signed.

Exit Criteria:
- P0/P1 issue = 0 untuk flow prioritas.

## Phase 10 - Production Cutover and Stabilization
Durasi: 0.5-1 hari

Tujuan:
- Deploy aman dan monitor pasca rilis.

Aktivitas:
- Deploy bertahap (jika memungkinkan).
- Monitor error log, API error rate, key interactions.
- Hotfix lane jika ada isu kritikal.

Output:
- Rebuild UI live.
- Stabilization notes 24-48 jam.

Exit Criteria:
- Tidak ada incident kritikal pasca deploy.

## 6. Quality Gates (Must Pass)
- Functional parity untuk semua route existing.
- Visual consistency lintas role.
- Keyboard navigation on critical path.
- Responsive pass: 360/768/1024/1280+.
- No critical regressions pada auth, ticket, chat.

## 7. Risk Register and Mitigation
1. Scope creep visual
- Mitigasi: lock token spec di Phase 1, perubahan besar hanya via change request.

2. Regressi form behavior
- Mitigasi: gunakan form pattern tunggal (react-hook-form + zod).

3. Inconsistent component usage
- Mitigasi: enforce usage via ui layer checklist + code review gate.

4. Waktu molor di admin pages
- Mitigasi: prioritas flow kritikal dulu, cosmetic deferred.

5. Merge conflict berkepanjangan
- Mitigasi: domain-based branch strategy dan merge berkala.

## 8. Branching and Release Strategy
- Branch utama rebuild: feat/ui-rebuild-foundation.
- Sub-branch per domain:
  - feat/ui-rebuild-shared
  - feat/ui-rebuild-user
  - feat/ui-rebuild-technician
  - feat/ui-rebuild-admin
- Merge incremental per phase, bukan big bang akhir.

## 9. Definition of Done
Sebuah page dianggap selesai jika:
- Semua state UI lengkap.
- Tidak ada hardcoded brand lama.
- Visual sesuai token system baru.
- Flow API tetap berjalan.
- Lulus smoke test untuk role terkait.

## 10. Deliverables Checklist
- [ ] Finalized token map and typography spec.
- [ ] Primitive component kit stabilized.
- [ ] New app shell in production path.
- [ ] Shared pages rebuilt.
- [ ] User domain rebuilt.
- [ ] Technician domain rebuilt.
- [ ] Admin domain rebuilt.
- [ ] Accessibility and responsive pass report.
- [ ] Regression report and release checklist.

## 11. Recommended Team Cadence
- Daily standup fokus blocker per phase.
- Design + dev sync setiap selesai major phase.
- QA handoff per domain, bukan menunggu semua domain selesai.

## 11A. Solo Execution Mode (You + AI)
Mode ini dipakai jika project dikerjakan hanya oleh 1 developer utama dibantu AI pair.

Prinsip:
- Kurangi overhead proses, fokus ke output shipping.
- Kerjakan vertical slice kecil, selesai end-to-end per potongan.
- Dokumentasi ringkas tapi konsisten untuk memudahkan resume kerja.

Ritme kerja yang direkomendasikan:
- Gunakan sprint mikro 1-2 hari per domain slice.
- Tiap hari tutup dengan checklist: done, blocker, next-first-task.
- Review mandiri wajib sebelum merge: functional parity + responsive + a11y dasar.

Template eksekusi harian:
1. Pilih 1 slice (contoh: user ticket list).
2. Build UI + state handling (loading/empty/error/success).
3. Jalankan smoke test manual flow slice tersebut.
4. Catat delta dan lanjut ke slice berikutnya.

Definisi slice ideal:
- Maksimal 1 halaman atau 1 fitur utama per commit.
- Harus bisa di-demo sendiri dalam kondisi stabil.
- Hindari membuka banyak page paralel agar context switching rendah.

Branching untuk solo mode:
- Sederhanakan jadi 2 level:
  - feat/ui-rebuild (utama)
  - feat/ui-rebuild-<slice> (sementara, cepat merge)

Quality gate minimum sebelum merge:
- Route tidak rusak.
- Flow utama halaman berfungsi.
- Tidak ada hardcoded warna brand lama.
- Mobile viewport tidak broken parah.

Catatan:
- Tidak perlu menunggu phase besar selesai untuk validasi.
- Prioritaskan halaman dengan dampak user tertinggi terlebih dahulu.

## 12. Immediate Next Actions (48 Jam Pertama)
1. Lock visual direction dan token semantic final.
2. Freeze komponen legacy untuk mencegah style drift baru.
3. Mulai Phase 1: rework global token + typography + shell foundation.
4. Setup tracking issue board per phase dan per role flow.

## Checklist Review

- [ ] Istilah teknis sudah konsisten antar dokumen
- [ ] Referensi script/path masih valid terhadap struktur repo terbaru
- [ ] Action item lanjutan sudah memiliki owner atau milestone
- [ ] Dokumen siap dipakai untuk onboarding dan audit teknis
