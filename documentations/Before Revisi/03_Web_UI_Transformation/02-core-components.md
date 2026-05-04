# Core Components Inventory (shadcn-first)

Tanggal Dokumen: 2026-04-17
Versi Dokumen: V2 Professional
Sumber Asli: archived-md/apps/web/docs/ui-rebuild/02-core-components.md

## Tujuan Dokumen

Dokumen ini jadi checklist komponen inti sebelum rebuild semua halaman.

## Ringkasan Eksekutif

- Dokumen ini telah dinormalisasi agar mudah dipindai oleh tim teknis dan non-teknis.
- Struktur isi disusun ulang menjadi tujuan, ringkasan, daftar bahasan, konten inti, dan checklist verifikasi.
- Bagian teknis asli dipertahankan agar jejak keputusan dan implementasi tetap dapat diaudit.

## Peta Isi

1. 1. Foundations
2. 2. Inputs and Forms
3. 3. Feedback and Overlay
4. 4. Data Display
5. 5. Navigation
6. 6. Domain Compositions
7. 7. Global States
8. 8. Quality Gates

## Konten Inti (Disusun Ulang)

Tanggal: 2026-04-18

Dokumen ini jadi checklist komponen inti sebelum rebuild semua halaman.

## 1. Foundations
- [ ] Theme provider (light/dark strategy)
- [ ] App shell layout (sidebar, header, content container)
- [ ] Typography scale utility
- [ ] Spacing and container rules

## 2. Inputs and Forms
- [ ] Button
- [ ] Input
- [ ] Textarea
- [ ] Label
- [ ] Select
- [ ] Checkbox
- [ ] Radio Group
- [ ] Switch
- [ ] Date Picker
- [ ] Form wrapper (react-hook-form + zod pattern)
- [ ] Validation message component

## 3. Feedback and Overlay
- [ ] Dialog
- [ ] Alert Dialog
- [ ] Sheet
- [ ] Popover
- [ ] Tooltip
- [ ] Toast/Sonner
- [ ] Skeleton
- [ ] Progress
- [ ] Loading spinner standard

## 4. Data Display
- [ ] Card
- [ ] Badge
- [ ] Avatar
- [ ] Tabs
- [ ] Table (tanstack integration)
- [ ] Pagination
- [ ] Empty state block
- [ ] Error state block
- [ ] Stat/KPI block

## 5. Navigation
- [ ] Sidebar nav item
- [ ] Breadcrumb
- [ ] Top search/command bar (cmdk opsional)
- [ ] User menu/dropdown

## 6. Domain Compositions
- [ ] Ticket list panel
- [ ] Ticket detail timeline
- [ ] Chat list item
- [ ] Chat message bubble set
- [ ] Dashboard metrics grid
- [ ] Activity log table row

## 7. Global States
- [ ] Page loading template
- [ ] API offline banner component
- [ ] Unauthorized/Forbidden view
- [ ] Not Found view

## 8. Quality Gates
- [ ] Semua komponen pakai token warna
- [ ] Semua komponen punya states hover/focus/disabled
- [ ] Semua komponen punya story/test minimal

## Checklist Review

- [ ] Istilah teknis sudah konsisten antar dokumen
- [ ] Referensi script/path masih valid terhadap struktur repo terbaru
- [ ] Action item lanjutan sudah memiliki owner atau milestone
- [ ] Dokumen siap dipakai untuk onboarding dan audit teknis
