Tanggal: 2026-04-19


## 1. Alur Autentikasi

```
[User membuka aplikasi]
         │
         ▼
[Cek localStorage: app_theme]
    ← set default dark →
         │
         ▼
[Cek cookie: helpdesk_access_token]
    ┌────┴────┐
    │         │
  Ada      Tidak ada
    │         │
    ▼         ▼
[Verify   [Redirect ke
 JWT via   /login]
 /api/auth/me]
    │
    ├── Valid ──► [Redirect ke dashboard sesuai role]
    │
    └── Expired ──► [POST /api/auth/refresh]
                         │
                    ┌────┴────┐
                    │         │
                  Berhasil  Gagal
                    │         │
                    ▼         ▼
              [Set access  [Redirect ke
               token baru   /login]
               & lanjutkan]
```

### Detail Mekanisme Token
1. **Access Token** (JWT, 1 jam): Dikirim di setiap request via cookie `HttpOnly` — tidak bisa diakses JavaScript
2. **Refresh Token** (JWT, 7 hari): Hanya dikirim ke endpoint `/api/auth/*` via cookie HttpOnly
3. **CSRF Token** (64-char hex): Disimpan di readable cookie, dikirim di header `x-csrf-token` untuk semua mutasi (POST/PATCH/DELETE)
4. **Double-submit cookie** pattern melindungi dari Cross-Site Request Forgery

---

## 2. Alur Pembuatan Tiket

```
[User] → Klik "Buat Tiket"
         │
         ▼
[Isi Form: judul, deskripsi, lokasi, urgensi]
         │
         ▼
[Submit → POST /api/tickets]
         │
         ▼
[Server: generate UUID + ticket_number]
Format: TKT-{4 digit timestamp}{4 digit random}
         │
         ▼
[INSERT ke tabel tickets, status='Pending']
         │
         ├── [Invalidate Redis cache dashboard]
         │
         └── [Emit WebSocket 'new_ticket' → room 'technicians']
                    │
                    ▼
         [Semua Teknisi yang online mendapat notifikasi real-time]
         │
         ▼
[User diarahkan ke halaman Tiket Saya]
```

### Aturan Nomor Tiket
- Format: `TKT-{4 digit terakhir Unix timestamp}{4 digit random 0000-9999}`
- Contoh: `TKT-57319482`
- Dijamin unik melalui constraint `UNIQUE` di database

---

## 3. Alur Penanganan Tiket oleh Teknisi

```
[Teknisi] → Membuka "Antrian Tiket"
                │
                ▼
         [GET /api/tickets?unassigned=true]
         Tampil: semua tiket Pending tanpa teknisi
                │
                ▼
         [Teknisi klik "Ambil Tiket"]
                │
                ▼
         [PATCH /api/tickets/:id]
         { status: "Proses", assigned_technician_id: <techId> }
                │
                ▼
         [Server update tiket + invalidate cache]
                │
                ▼
         [Tiket muncul di "Tiket Saya" teknisi]
                │
                ▼
         [Teknisi bekerja menyelesaikan masalah]
                │
         ┌──────┴──────┐
         │             │
         ▼             ▼
   [Selesai]      [Ditolak/Tidak bisa ditangani]
         │             │
         ▼             ▼
   [PATCH status    [PATCH status
    = "Selesai"      = "Ditolak"
    + closed_at]     + catatan alasan]
         │
         └─── [Invalidate cache + update statistik]
```

---

## 4. Alur Chat Real-time

```
[User membuka chat baru dengan teknisi]
         │
         ▼
[POST /api/chats] → Buat sesi chat baru
(opsional: tautkan ke ticket_id)
         │
         ▼
[User & Teknisi membuka halaman chat]
         │
         ▼
[Frontend: socket.emit('join_chat', chatId)]
→ Keduanya bergabung ke room: chat:{chatId}
         │
         ▼
[User mengirim pesan → POST /api/messages]
         │
         ▼
[Server: INSERT messages → emit 'new_message' ke room]
         │
         ▼
[Teknisi menerima pesan real-time tanpa refresh]
         │
         ▼
[Teknisi membuka chat → GET /api/messages?chat_id=...]
         │
         ▼
[Server: UPDATE messages SET is_read=1 WHERE sender_id != techId]
         │
         └── [emit 'messages_read' → User tahu pesannya sudah dibaca]
```

---

## 5. Alur Manajemen Pengguna oleh Admin

```
[Admin] → Halaman "Kelola Pengguna"
               │
               ▼
         [GET /api/users?role=User]
               │
               ▼
         [Tampil DataTable dengan search + filter]
               │
        ┌──────┴──────────┐
        │                 │
        ▼                 ▼
  [Tambah User]      [Edit / Nonaktifkan]
        │                 │
        ▼                 ▼
  [POST /api/users]  [PATCH /api/users/:id]
  (validasi email    (cek duplikasi email/username
   unik, hash        jika berubah, lalu update)
   password bcrypt)
        │
        └── [Aksi dicatat ke activity_logs]
                └── [Invalidate dashboard cache]
```

---

## 6. Alur Caching Dashboard

```
[Request ke /api/dashboard/admin-summary]
         │
         ▼
[Cek Redis key: 'dashboard:admin:summary']
    ┌────┴────┐
    │         │
   HIT       MISS
    │         │
    ▼         ▼
[Return   [Jalankan 7 query paralel ke MySQL]
 cached        │
 (X-Cache:     ▼
  HIT)]  [Gabungkan hasil → format payload]
              │
              ▼
         [Simpan ke Redis TTL=60 detik]
              │
              ▼
         [Return data (X-Cache: MISS)]

[Saat tiket dibuat/diupdate:]
→ invalidateAllDashboardCaches() dipanggil
→ Hapus semua key: dashboard:admin:*, dashboard:technician:*, dashboard:user:*
→ Request berikutnya akan query ulang ke MySQL
```

---

## 7. Logika Role-based Access Control (RBAC)

### Middleware Auth
```
Request masuk
     │
     ▼
[Cek token di Authorization header atau cookie]
     │
     ├── Tidak ada → 401 Unauthorized
     ├── Expired   → 401 Token Expired
     ├── Invalid   → 401 Invalid Token
     │
     └── Valid → decode payload → req.user = { id, role, name, email }
                      │
                      ▼
               [Middleware role(allowedRoles)]
                      │
               ┌──────┴──────┐
               │             │
         req.user.role   req.user.role
         di allowedRoles  tidak di list
               │             │
               ▼             ▼
            next()      403 Forbidden
```

### Filtering Data Otomatis Berdasarkan Role
Contoh di `GET /api/tickets`:
```javascript
if (req.user.role === 'User') {
  // Hanya tiket milik sendiri
  effectiveUserId = req.user.id;
} else if (req.user.role === 'Teknisi') {
  // Default: tiket yang di-assign ke dirinya
  // Dengan ?unassigned=true: tiket antrian (belum diassign)
  effectiveAssignedTechnicianId = req.user.id;
}
// Admin: tidak ada filter tambahan, lihat semua
```

---

## 8. Logika Upload File

```
[Multer middleware memproses request multipart/form-data]
         │
         ▼
[fileFilter: validasi MIME type (whitelist)]
  Allowed: jpg, jpeg, png, gif, pdf, doc, docx, xls, xlsx, txt, zip
         │
         ├── Ditolak → Error
         ▼
[Check ukuran: max 5MB per file, max 5 file]
         │
         ▼
[Simpan file: ./uploads/{timestamp}-{random}{ext}]
         │
         ▼
[INSERT ke ticket_attachments: file_name, file_path, file_size, mime_type]
         │
         ▼
[Response: daftar file yang berhasil diupload]
```

---

## 9. Logika Password & Keamanan

### Hash Password
- Semua password di-hash menggunakan **bcrypt** dengan 12 salt rounds
- Hash disimpan di kolom `password_hash`, password asli tidak pernah disimpan
- Perbandingan password menggunakan `bcrypt.compare()` — aman dari timing attacks

### Validasi Password
- Minimal 8 karakter
- Harus mengandung huruf besar, huruf kecil, angka, karakter spesial
- Dicek di middleware validasi sebelum proses

### CSRF Protection
- Setiap mutasi (POST/PATCH/DELETE) memerlukan header `x-csrf-token`
- Server membandingkan nilai header dengan nilai cookie `helpdesk_csrf_token`
- Jika tidak cocok → 403 Forbidden
- Login dan Register dikecualikan dari CSRF check

---

## 10. Logika Internasionalisasi (i18n)

```
[User membuka aplikasi]
         │
         ▼
[i18next inisialisasi dengan bahasa default 'id' (Indonesia)]
         │
         ▼
[Cek preferensi bahasa di:
  1. localStorage → 'i18nextLng'
  2. User settings dari server (user.language)
  3. Browser navigator.language
  4. Default: 'id']
         │
         ▼
[Load file terjemahan: /i18n/{lang}/translation.json]
         │
         ▼
[Semua teks UI menggunakan: t('key.path')]

[Saat user ganti bahasa di Settings:]
→ PATCH /api/users/:id { language: 'EN' }
→ i18n.changeLanguage('en')
→ localStorage 'i18nextLng' = 'en'
→ UI re-render dengan bahasa baru
```

---

## 11. Logika Redirect Berdasarkan Role

```javascript
// Komponen RootRedirect
function RootRedirect() {
  const { currentUser } = useAuth();
  
  if (!currentUser) return <Navigate to="/login" />;
  if (currentUser.role === 'Admin')   return <Navigate to="/admin/dashboard" />;
  if (currentUser.role === 'Teknisi') return <Navigate to="/technician/dashboard" />;
  return <Navigate to="/user/dashboard" />;
}
```

Route dilindungi oleh komponen `ProtectedRoute` yang memvalidasi `allowedRoles`. Jika role tidak sesuai, pengguna diarahkan ke halaman yang sesuai dengan rolenya.

---

## 12. Alur Audit Logging

```
[Admin melakukan aksi (create/update/delete user, assign tiket, dll)]
         │
         ▼
[Route handler memanggil auditLogger.log({
  action: 'CREATE_USER',
  userId: req.user.id,
  userRole: req.user.role,
  resource: 'users',
  resourceId: newUser.id,
  details: { name: ..., email: ... },
  ip: req.ip
})]
         │
         ▼
[AuditLogger menulis ke:
  1. File: backend/logs/audit.log (JSON per baris)
  2. Rotasi otomatis jika > 10MB (simpan 5 file terakhir)
  3. INSERT ke tabel activity_logs (untuk ditampilkan di UI)]
```

---

## 13. Alur Metrics & Monitoring

```
[Setiap HTTP request masuk ke backend]
         │
         ▼
[metricsMiddleware: catat waktu mulai via process.hrtime()]
         │
         ▼
[Request diproses...]
         │
         ▼
[Response 'finish' event: hitung durasi]
         │
         ▼
[Prometheus counters/histograms diupdate:
  - helpdesk_http_requests_total{method, route, status_code}
  - helpdesk_http_request_duration_ms{...} 
  - helpdesk_cache_hit_total{keyspace}
  - helpdesk_cache_miss_total{keyspace}]
         │
         ▼
[Prometheus scrape GET /api/health/metrics setiap 15s]
         │
         ▼
[Grafana visualisasi dashboard dari data Prometheus]
```

