# Changelog

Tanggal dibuat: 2026-05-04

Semua perubahan signifikan pada project ProjectPolda akan didokumentasikan di file ini.

Format changelog mengikuti [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [1.0.0] - 2026-04-23

### 🎉 Initial Release

Rilisan pertama ProjectPolda dengan fitur-fitur inti:

#### ✨ Fitur

**Tiket Management:**
- Pembuatan tiket dengan field: judul, deskripsi, lokasi, urgensi, kategori
- Status tiket: Pending, Proses, Selesai, Dibatalkan, Ditolak
- Upload lampiran tiket (multipart/form-data)
- Filtering dan listing tiket berdasarkan role
- Detail tiket dengan catatan internal teknisi

**Assignment & Workflow:**
- Admin dapat assign teknisi ke tiket
- Antrian tiket pending untuk teknisi
- Status management real-time

**Chat Real-Time:**
- Percakapan terkait tiket antara user dan teknisi
- Pesan teks real-time via Socket.IO
- Read receipt (centang 1/2 dengan status)
- Layout dua panel (inbox + percakapan aktif)
- Admin dapat monitor chat

**Roles & Permissions:**
- Admin: Kontrol penuh sistem, kelola user/teknisi, monitoring
- Teknisi: Kelola antrian tiket, percakapan user
- User: Buat tiket, lihat progres, chat dengan teknisi

**Dashboard:**
- User Dashboard: Ringkasan tiket pribadi
- Technician Dashboard: Antrian, SLA, trend
- Admin Dashboard: Monitoring sistem, statistik

**Settings & Preferensi:**
- Profil user/teknisi
- Bahasa (multi-bahasa support)
- Tema (light/dark mode dengan persistence)
- Pengaturan notifikasi
- Preferensi teknisi (status, spesialisasi, kapasitas)

**Keamanan:**
- JWT authentication
- CSRF protection
- Validasi request via Joi
- CORS terkonfigurasi
- Password hashing via bcrypt

**Operasional:**
- Activity logs
- Health check endpoint
- Monitoring setup (Prometheus, Grafana, Loki)
- Incident response runbook
- SLO/SLI definition

#### 🐛 Bug Fixes

- Fixed: Console.log DEBUG statements exposing sensitive data
- Fixed: Password change tanpa verifikasi password lama
- Fixed: Ticket number collision risk (server-side generation)
- Fixed: Stats dashboard calculated inefficiently in frontend
- Fixed: Notification settings mocked, not actually saved
- Fixed: HomePage completely empty
- Fixed: 12 placeholder insight cards di dashboard

#### 📦 Dependencies

**Frontend:**
- React 18+ dengan Vite
- shadcn/ui (30 komponen)
- TailwindCSS
- React Router
- Socket.IO client
- Recharts untuk visualisasi

**Backend:**
- Node.js + Express
- MySQL dengan mysql2
- Redis (opsional)
- Socket.IO server
- Joi untuk validasi
- JWT untuk auth
- bcrypt untuk password

#### 🧹 Optimizations

- Removed 5 unused npm packages dari frontend
- Removed 25 unused shadcn/ui components
- Removed visual editor plugins dari Vite config
- Dependency size reduction ~200KB

#### 📝 Documentation

- 60+ dokumentasi files di file_md_V2
- API Documentation lengkap
- Architecture documentation
- Role & feature documentation
- Operation runbooks
- Remediation program (8 phases)

#### 🏗️ Project Structure

```
projectpolda/
├── apps/web/              # Frontend (React + Vite)
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── services/
│   │   └── hooks/
│   └── package.json
├── backend/               # API Server
│   ├── src/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── middleware/
│   │   ├── config/
│   │   └── utils/
│   ├── tests/
│   ├── scripts/
│   └── package.json
├── documentations/
│   ├── file_md_V2/       # V2 Documentation Suite
│   └── [archived docs]/
├── tools/                 # Build & utility scripts
├── package.json          # Monorepo root
└── README.md

Total size: ~307.61 MB
```

#### 📊 Stats

- Total files: 1000+ (dengan node_modules)
- Frontend dependencies: ~19 MB (node_modules)
- Backend dependencies: ~92 MB (node_modules)
- Documentation: ~0.84 MB (60+ files)
- Upload storage (prod): 0 MB (test files cleaned)
- Logs storage (prod): ~5.87 MB

---

## Versioning Strategy

### Semantic Versioning: MAJOR.MINOR.PATCH

- **MAJOR**: Breaking changes, significant refactor, new phase
- **MINOR**: New features, non-breaking improvements
- **PATCH**: Bug fixes, security patches, small optimizations

### Phases (Major Versions)

Project dibagi menjadi phases utama:

- **v1.0.x**: Initial Release (current)
- **v2.0.x**: Advanced Features (planned)
  - Enhanced analytics & reporting
  - Mobile app
  - Advanced permission system
- **v3.0.x**: Enterprise Features (future)
  - Multi-tenant support
  - SLA automation
  - AI-powered ticket routing

### Release Schedule

- **Patch releases**: As needed (bug fixes)
- **Minor releases**: Monthly sprint cycle
- **Major releases**: Quarterly (per phase)

---

## [Upcoming] - Next Release (v1.1.0 - TBD)

### 🔜 Planned Features

- [ ] Ticket history & audit trail
- [ ] Advanced search & filtering
- [ ] Report generation (PDF/Excel)
- [ ] Bulk operations
- [ ] Custom fields per ticket category
- [ ] Automated ticket routing
- [ ] SLA tracking & alerts

### 🔨 Planned Improvements

- [ ] Performance optimization for large datasets
- [ ] Caching strategy enhancement
- [ ] Database query optimization
- [ ] Frontend bundle size reduction

---

## How to Update Version

### 1. Update VERSION file

```bash
# For patch release (1.0.0 → 1.0.1)
echo "1.0.1" > VERSION

# For minor release (1.0.0 → 1.1.0)
echo "1.1.0" > VERSION

# For major release (1.0.0 → 2.0.0)
echo "2.0.0" > VERSION
```

### 2. Update CHANGELOG.md

Add new section at the top (after Versioning Strategy):

```markdown
## [1.1.0] - YYYY-MM-DD

### ✨ Features
- Feature 1
- Feature 2

### 🐛 Bug Fixes
- Bug fix 1
- Bug fix 2

### 🧹 Improvements
- Improvement 1
```

### 3. Update package.json files

Update version field di:
- `package.json` (root)
- `apps/web/package.json`
- `backend/package.json`

```json
{
  "version": "1.1.0"
}
```

### 4. Create Git tag

```bash
git tag -a v1.1.0 -m "Release version 1.1.0"
git push origin v1.1.0
```

### 5. Update documentation

- Update release notes di `documentations/file_md_V2/08_Release_Notes_v1_0/`
- Create new session notes jika ada phase baru

---

## Release Notes Location

- **Current Release**: `documentations/file_md_V2/08_Release_Notes_v1_0/`
- **Next Release**: `documentations/file_md_V2/09_Release_Notes_v1_1/` (saat ada)

---

## Maintenance

### End of Life (EOL) Policy

- v1.0.x: Supported hingga v2.0.0 release
- v2.0.x: Supported hingga v3.0.0 release
- Security patches tetap diberikan 1 tahun setelah EOL

### Deprecation Policy

- Breaking changes diumumkan 2 release sebelumnya
- Migration guide disediakan
- Support timeline minimal 1 quarter

---

## Contributors & Maintainers

- **Project Owner**: ProjectPolda Team
- **Last Updated**: 2026-04-23
- **Version Manager**: Automated via VERSION file

---

_Last Generated: 2026-04-23_
