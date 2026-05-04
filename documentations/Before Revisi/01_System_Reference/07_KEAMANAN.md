Tanggal: 2026-04-19


## Ringkasan Lapisan Keamanan

Sistem mengimplementasikan keamanan berlapis mengikuti prinsip **Defense in Depth** dan panduan **OWASP Top 10**:

```
[Internet]
    │
    ▼
[Rate Limiting]          ← Cegah brute force & DoS
    │
    ▼
[CORS Validation]        ← Tolak origin yang tidak diizinkan
    │
    ▼
[Helmet (HTTP Headers)]  ← Security headers standar
    │
    ▼
[CSRF Protection]        ← Cegah Cross-Site Request Forgery
    │
    ▼
[JWT Authentication]     ← Verifikasi identitas
    │
    ▼
[Role-based Authorization] ← Verifikasi hak akses
    │
    ▼
[Input Validation]       ← Cegah injeksi & data kotor
    │
    ▼
[Parameterized Queries]  ← Cegah SQL Injection
    │
    ▼
[Business Logic]
```

---

## 1. Autentikasi JWT (OWASP A07: Identification & Authentication)

### Access Token
- **Algoritma:** HS256 (HMAC SHA-256)
- **Payload:** `{ id, role, name, email }`
- **Durasi:** 1 jam (dapat dikonfigurasi via `JWT_EXPIRES`)
- **Penyimpanan:** `HttpOnly` cookie — tidak dapat diakses JavaScript
- **Secret:** Minimum 32 karakter, diperiksa saat startup

### Refresh Token
- **Durasi:** 7 hari (`JWT_REFRESH_EXPIRES`)
- **Path:** Cookie hanya dikirim ke `/api/auth` — tidak ke semua endpoint
- **Penggunaan:** Memperbarui access token yang expired tanpa re-login

### Keamanan Cookie
```javascript
{
  httpOnly: true,    // Tidak bisa diakses via document.cookie
  secure: true,      // Hanya HTTPS di production
  sameSite: 'lax',   // Perlindungan CSRF dasar
  path: '/',
  maxAge: 3600000    // 1 jam
}
```

---

## 2. CSRF Protection (OWASP A01: Broken Access Control)

Menggunakan pola **Double-Submit Cookie**:

1. Saat login berhasil, server membuat CSRF token (64-char crypto-random hex)
2. Token disimpan di cookie **readable** (`helpdesk_csrf_token`)
3. Client JavaScript membaca cookie dan menyisipkannya ke header `x-csrf-token` di setiap request mutasi
4. Server membandingkan nilai cookie dengan nilai header — harus identik

**Endpoint yang dikecualikan:** `/auth/login`, `/auth/register` (login belum punya token)

**Endpoint aman dari CSRF:** GET, HEAD, OPTIONS (tidak mengubah data)

```javascript
// Cek CSRF di middleware
const csrfCookie = cookies['helpdesk_csrf_token'];
const csrfHeader = req.headers['x-csrf-token'];
if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
  return res.status(403).json({ message: 'CSRF token tidak valid' });
}
```

---

## 3. Rate Limiting (OWASP A04: Insecure Design)

| Endpoint              | Limit          | Window     | Pesan Error                                    |
|-----------------------|----------------|------------|------------------------------------------------|
| POST /api/auth/login  | 5 permintaan   | 15 menit   | "Terlalu banyak percobaan login..."            |
| POST /api/auth/register| 3 permintaan  | 1 jam      | "Terlalu banyak percobaan registrasi..."       |

Menggunakan `express-rate-limit` dengan tracking per IP address.

---

## 4. Input Validation (OWASP A03: Injection)

### Validasi Schema (Joi)
Semua body request divalidasi menggunakan schema Joi sebelum sampai ke logic handler:

- **Auth schemas:** `identifier` (string, min 1), `password` (string, min 8, pattern)
- **User schemas:** `name`, `email` (email format), `phone` (numerik), `role` (enum)
- **Ticket schemas:** `title` (max 255), `urgency` (enum), `status` (enum)

### Sanitasi Input
Fungsi `sanitizeInput()` digunakan untuk membersihkan input dari karakter berbahaya sebelum disimpan ke database.

### Validasi Upload File
- **Whitelist MIME type:** Hanya tipe yang diizinkan (`image/*`, `application/pdf`, `application/msword`, dll)
- **Ukuran file:** Maksimum 5MB per file (dikonfigurasi via `MAX_FILE_SIZE`)
- **Jumlah file:** Maksimum 5 file per request
- **Validasi ganda:** Di middleware multer DAN di validator utility

---

## 5. SQL Injection Prevention (OWASP A03)

Semua query database menggunakan **parameterized queries** dengan `mysql2`:

```javascript
// AMAN - parameterized query
await pool.query(
  'SELECT * FROM users WHERE email = ? AND is_active = 1',
  [identifier]
);

// Tidak pernah menggunakan string concatenation untuk user input
```

`QueryBuilder` utility digunakan untuk query dinamis yang tetap menggunakan parameter binding, bukan string interpolasi.

---

## 6. HTTP Security Headers (OWASP A05: Security Misconfiguration)

Menggunakan `helmet` untuk mengaktifkan header keamanan standar:

| Header                        | Nilai / Fungsi                                          |
|-------------------------------|---------------------------------------------------------|
| `X-Content-Type-Options`      | `nosniff` — cegah MIME sniffing                         |
| `X-Frame-Options`             | `SAMEORIGIN` — cegah clickjacking                       |
| `Strict-Transport-Security`   | Paksa HTTPS (di production)                             |
| `X-XSS-Protection`            | Filter XSS di browser lama                              |
| `Referrer-Policy`             | Batasi informasi referrer                               |
| `X-DNS-Prefetch-Control`      | Kontrol DNS prefetching                                 |

`contentSecurityPolicy: false` — dinonaktifkan karena frontend SPA memerlukan konfigurasi CSP yang lebih fleksibel.

---

## 7. CORS Configuration (OWASP A05)

```javascript
// Origin validation yang ketat
app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn('CORS blocked request', { origin });
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true  // Diperlukan untuk cookie
}));
```

Di production:
- `CORS_ORIGIN` harus diset eksplisit
- Localhost/127.0.0.1 tidak diizinkan di production (validasi saat startup)
- Server akan fail-fast jika CORS_ORIGIN tidak dikonfigurasi di production

---

## 8. Password Security (OWASP A02: Cryptographic Failures)

- **Algoritma:** bcrypt dengan **12 salt rounds** (sangat kuat, lambat secara sengaja)
- Password asli tidak pernah disimpan atau di-log
- Kolom `password_hash` tidak pernah dikembalikan dalam response API
- Perbandingan dilakukan dengan `bcrypt.compare()` yang timing-safe

---

## 9. Authorization (OWASP A01: Broken Access Control)

### Role-based Middleware
```javascript
const role = (...allowedRoles) => (req, res, next) => {
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  next();
};
```

### Resource-level Authorization
Contoh: User tidak bisa melihat tiket orang lain:
```javascript
if (req.user.role === 'User' && ticket.user_id !== req.user.id) {
  return res.status(403).json({ message: 'Forbidden' });
}
```

Contoh: Teknisi tidak bisa melihat chat teknisi lain:
```javascript
if (req.user.role === 'Teknisi' && chat.technician_id !== req.user.id) {
  return res.status(403).json({ message: 'Tidak memiliki izin' });
}
```

---

## 10. Error Handling yang Aman (OWASP A09: Security Logging)

### Global Error Handler
```javascript
app.use((err, req, res, next) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  
  // Di production: jangan expose stack trace
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Internal Server Error' 
      : err.message
  });
});
```

Stack trace tidak pernah dikembalikan ke client di production. Error detail hanya masuk ke log server.

---

## 11. Audit Logging (OWASP A09: Security Logging & Monitoring)

Semua aksi penting dicatat mencakup:
- Siapa yang melakukan (userId, userRole)
- Apa yang dilakukan (action_type)
- Pada objek apa (target_type, target_id)
- Kapan (timestamp ISO)
- Dari IP mana
- Detail tambahan (JSON)

Log disimpan di:
1. File `backend/logs/audit.log` (rotasi 10MB, 5 file)
2. Tabel `activity_logs` di database (untuk ditampilkan di UI admin)

---

## 12. Environment Security

- File `.env` tidak pernah di-commit ke version control (ada di `.gitignore`)
- `JWT_SECRET` minimum 32 karakter — server gagal start jika tidak ada
- `CORS_ORIGIN` wajib diset di production — server gagal start jika tidak ada
- Semua credential database dari environment variable, tidak hardcoded
- `NODE_ENV=production` mengaktifkan mode strict (secure cookies, no stack trace, CORS strict)

---

## 13. Dependency Security

```bash
# Audit dependensi untuk kerentanan
npm run security:audit --prefix backend

# Generate Software Bill of Materials (SBOM)
npm run security:sbom --prefix backend
```

File SBOM tersedia di `backend/artifacts/sbom-lite.cdx.json` format CycloneDX.

