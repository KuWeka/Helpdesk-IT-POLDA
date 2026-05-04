# Fase 2 - API Contract Matrix (Kritikal)

Tanggal Dokumen: 2026-04-20
Versi Dokumen: V2 Professional
Sumber Asli: phase-master-internal/02_PHASE_2_API_CONTRACT_MATRIX.md

## Tujuan Dokumen

Status: In Progress

## Ringkasan Eksekutif

- Dokumen ini telah dinormalisasi agar mudah dipindai oleh tim teknis dan non-teknis.
- Struktur isi disusun ulang menjadi tujuan, ringkasan, daftar bahasan, konten inti, dan checklist verifikasi.
- Bagian teknis asli dipertahankan agar jejak keputusan dan implementasi tetap dapat diaudit.

## Peta Isi

1. Endpoint Kontrak Prioritas
2. 1) POST /api/auth/login
3. 2) POST /api/auth/refresh
4. 3) GET /api/auth/me
5. 4) POST /api/tickets
6. 5) GET /api/tickets/:id
7. 6) PATCH /api/tickets/:id
8. 7) POST /api/uploads/ticket/:ticketId

## Konten Inti (Disusun Ulang)

Tanggal: 2026-04-20
Status: In Progress

Tujuan dokumen:
- Menyamakan kontrak request/response antara frontend dan backend untuk alur kritikal.
- Menjadi dasar integration contract test Fase 2.

## Endpoint Kontrak Prioritas

## 1) POST /api/auth/login

Request minimum:
- identifier: string
- password: string

Response yang dipakai frontend:
- success: boolean
- data.user: object
- data.csrfToken: string
- message: string

Catatan:
- Frontend membaca data.user untuk menyimpan sesi.

## 2) POST /api/auth/refresh

Request:
- body boleh kosong (refresh token di cookie)

Response minimum:
- success: boolean
- data.csrfToken: string
- message: string

Catatan:
- Dipakai interceptor axios saat 401.

## 3) GET /api/auth/me

Response minimum:
- success: boolean
- data.user: object | null

Catatan:
- Dipakai bootstrap sesi saat app load.

## 4) POST /api/tickets

Request minimum:
- title: string
- description: string
- location: string
- urgency: enum(Rendah|Sedang|Tinggi|Kritis)

Response yang dipakai frontend saat ini:
- id: string
- ticket_number: string

Catatan:
- Kontrak endpoint ini masih format legacy (bukan wrapper success/data).
- Perubahan bentuk response harus backward-compatible.

## 5) GET /api/tickets/:id

Response yang dipakai frontend saat ini:
- object tiket langsung (legacy)
- field umum: id, title, description, status, urgency, ticket_number

Catatan:
- Beberapa halaman membaca properti langsung tanpa data wrapper.

## 6) PATCH /api/tickets/:id

Request (contoh):
- status
- assigned_technician_id
- closed_at

Response saat ini:
- message: string

Catatan:
- Frontend tidak ketat pada payload, lebih mengandalkan status code sukses.

## 7) POST /api/uploads/ticket/:ticketId

Request:
- multipart/form-data, key: files (max 5)

Response minimum:
- success: boolean
- message: string
- uploadedFiles: array

## 8) GET /api/chats

Response yang dipakai frontend:
- success: boolean
- items: array
- totalItems/page/perPage (jika mode paginated)

Catatan:
- Frontend memakai helper extractItems (items/data/array).

## 9) GET /api/messages

Request query minimum:
- chat_id: string

Response yang dipakai frontend:
- success: boolean
- items: array
- totalItems/page/perPage (jika paginated)

## 10) POST /api/messages

Request minimum:
- chat_id: string
- message_content: string

Response minimum:
- success: boolean
- message: string
- data: object

## Risiko Kontrak Yang Ditemukan

1. Endpoint tickets masih campuran format legacy dan wrapper.
2. Frontend sudah defensif untuk chats/messages, namun tidak untuk beberapa endpoint tiket.
3. Perubahan bentuk payload tiket berisiko memicu regresi lintas halaman jika tanpa compatibility layer.

## Strategi Fase 2

1. Bekukan format legacy tickets untuk saat ini (stabilitas internal).
2. Tambahkan integration contract tests sebagai guard.
3. Lakukan standardisasi bertahap dengan compatibility fallback di frontend.

## Checklist Review

- [ ] Istilah teknis sudah konsisten antar dokumen
- [ ] Referensi script/path masih valid terhadap struktur repo terbaru
- [ ] Action item lanjutan sudah memiliki owner atau milestone
- [ ] Dokumen siap dipakai untuk onboarding dan audit teknis
