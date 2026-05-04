# Versioning Guide - ProjectPolda

Tanggal dibuat: 2026-05-04

Panduan lengkap untuk mengelola versioning dan release cycle ProjectPolda.

---

## Quick Reference

**Current Version**: `1.0.0`
**Location**: 
- [`VERSION`](./VERSION) - Single source of truth
- [`package.json`](./package.json) - Root monorepo
- [`apps/web/package.json`](./apps/web/package.json) - Frontend
- [`backend/package.json`](./backend/package.json) - Backend
- [`CHANGELOG.md`](./CHANGELOG.md) - Release history

---

## Versioning Strategy

### Semantic Versioning (SemVer)

Format: `MAJOR.MINOR.PATCH[-PRERELEASE][+BUILD]`

Contoh: `1.0.0`, `1.1.0-beta.1`, `2.0.0`

#### MAJOR (X._._ → X+1.0.0)
**Saat digunakan**: Breaking changes, major refactor, architecture changes

Contoh perubahan MAJOR:
- Perubahan API contract yang tidak backward compatible
- Database schema breaking change
- Authentication system overhaul
- New phase dengan fitur drastis berbeda

#### MINOR (_.X._ → _.X+1.0)
**Saat digunakan**: New features, non-breaking enhancements, improvements

Contoh perubahan MINOR:
- Fitur tiket baru
- Dashboard baru
- API endpoint baru
- Performa improvement signifikan
- Security enhancement

#### PATCH (_._.X → _._.X+1)
**Saat digunakan**: Bug fixes, hotfixes, minor patches

Contoh perubahan PATCH:
- Bug fix di view
- Security patch
- UI/UX kecil
- Documentation fix
- Performance tweak

### Pre-release Versions

Format: `MAJOR.MINOR.PATCH-PRERELEASE`

Jenis:
- `-alpha.N`: Early development stage
- `-beta.N`: Feature complete, testing phase
- `-rc.N`: Release candidate, final testing

Contoh: `1.1.0-alpha.1`, `1.1.0-beta.2`, `1.1.0-rc.1`

---

## Release Process

### Step 1: Determine Version Type

Review changes sejak last release:

```bash
# Check CHANGELOG untuk fitur/fixes yang sudah ada
cat CHANGELOG.md

# Review git commits
git log --oneline [last-version-tag]..HEAD

# Tanya:
# - Ada breaking changes? → MAJOR
# - Ada fitur baru? → MINOR
# - Hanya fixes? → PATCH
```

### Step 2: Update VERSION File

```bash
# Edit VERSION file (hanya 1 baris)
echo "1.1.0" > VERSION

# Verify
cat VERSION
```

### Step 3: Update package.json Files

Update `version` field di ketiga file:

```bash
# Root monorepo
sed -i 's/"version": "1.0.0"/"version": "1.1.0"/' package.json

# Frontend
sed -i 's/"version": "1.0.0"/"version": "1.1.0"/' apps/web/package.json

# Backend (jika berbeda)
sed -i 's/"version": "1.0.0"/"version": "1.1.0"/' backend/package.json

# Verify semua sama
grep '"version"' package.json apps/web/package.json backend/package.json
```

**Atau manual**: Edit masing-masing file dan ubah version field.

### Step 4: Update CHANGELOG.md

Edit `CHANGELOG.md` dan tambahkan section baru di paling atas (setelah title):

```markdown
## [1.1.0] - 2026-05-XX

### ✨ Features
- Feature A
- Feature B

### 🐛 Bug Fixes
- Fixed: Bug X
- Fixed: Bug Y

### 🧹 Improvements
- Improvement 1
- Improvement 2

### 📚 Documentation
- Updated API docs
- Added deployment guide
```

Template section tersedia di bawah file.

### Step 5: Create Release Commit

```bash
# Stage files
git add VERSION package.json apps/web/package.json backend/package.json CHANGELOG.md

# Commit dengan message convention
git commit -m "chore: release version 1.1.0"

# Verify commit
git log --oneline -1
```

### Step 6: Create Git Tag

```bash
# Create annotated tag
git tag -a v1.1.0 -m "Release version 1.1.0: Brief description of what changed"

# Verify tag
git tag -l -n1 v1.1.0

# Push tag to remote
git push origin v1.1.0
```

### Step 7: Create Release Notes

Create atau update release notes di dokumentasi:

**Location**: `documentations/file_md_V2/08_Release_Notes_v1_0/UPDATE_SESSION_YYYY-MM-DD.md`

Atau buatkan folder baru jika major version:

**Location**: `documentations/file_md_V2/09_Release_Notes_v1_1/` (untuk v1.1)

### Step 8: Deploy & Announce

```bash
# Build & test before deployment
npm run build
npm run lint

# Deploy to staging/production (sesuai process)
# npm run deploy:staging
# npm run deploy:prod

# Announce release di team channel
# Contoh: "🎉 ProjectPolda v1.1.0 released! See CHANGELOG.md for details"
```

---

## Version Lifecycle

### Active Development (Current Minor)
- Menerima bug fixes (PATCH)
- Menerima fitur baru (MINOR)
- Testing & QA active

### Feature Freeze (Last Week)
- Hanya critical bug fixes
- Release candidate testing
- No new features

### End of Life (EOL)
- Hanya security patches (PATCH)
- Support window: 1 quarter setelah next major release
- Deprecated: 1 quarter sebelum EOL

**Example Timeline:**
```
v1.0.0 released: 2026-04-23
├─ Active: 2026-04-23 to 2026-07-23 (3 months)
├─ Security Only: 2026-07-23 to 2026-10-23 (3 months)
└─ EOL: 2026-10-23

v1.1.0 released: 2026-07-20
├─ Active: 2026-07-20 to 2026-10-20 (3 months)
└─ [continues...]
```

---

## Branch Strategy

### Main Branches

- **main**: Production-ready, tagged with versions
- **develop**: Integration branch, pre-release features
- **release/v1.x**: Release branches untuk bug fixes

### Feature Branches

- **feature/TICKET-ID-description**: New features
- **fix/TICKET-ID-description**: Bug fixes
- **docs/description**: Documentation updates

### Example Workflow

```bash
# 1. Create feature branch
git checkout -b feature/TICKET-123-new-dashboard

# 2. Commit changes
git commit -m "feat: add new dashboard widget"

# 3. Push & create PR
git push origin feature/TICKET-123-new-dashboard

# 4. After PR approved & tested
git checkout develop
git merge feature/TICKET-123-new-dashboard

# 5. When ready for release
git checkout main
git merge develop
git tag -a v1.1.0 -m "Release v1.1.0"
```

---

## Commit Message Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

Format: `type(scope): subject`

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style (no logic change)
- `refactor`: Code refactor (no feature/bug change)
- `perf`: Performance improvement
- `test`: Test changes
- `chore`: Build, deps, release, etc.

### Examples

```bash
git commit -m "feat(dashboard): add ticket trend chart"
git commit -m "fix(auth): password change validation"
git commit -m "docs: update API documentation"
git commit -m "chore: release version 1.1.0"
```

---

## Version Query

### Get Current Version

```bash
# From VERSION file
cat VERSION

# From package.json
grep '"version"' package.json | head -1

# From git tag
git describe --tags --abbrev=0
```

### List All Versions

```bash
# Git tags
git tag -l

# Formatted
git tag -l | sort -V
```

### Check Version Info

```bash
# Create script `scripts/version-info.sh`
#!/bin/bash
echo "ProjectPolda Version Information"
echo "================================"
echo "Current Version: $(cat VERSION)"
echo "Root Package: $(grep '"version"' package.json | head -1)"
echo "Web Package: $(grep '"version"' apps/web/package.json | head -1)"
echo "Backend Package: $(grep '"version"' backend/package.json | head -1)"
echo ""
echo "Recent Tags:"
git tag -l | sort -V | tail -5
```

---

## Common Scenarios

### Scenario 1: Bug Fix in Production

```bash
# 1. Checkout last release tag
git checkout v1.0.0

# 2. Create hotfix branch
git checkout -b hotfix/v1.0.1-critical-bug

# 3. Fix bug & commit
git commit -m "fix: critical security issue in auth"

# 4. Back to main
git checkout main
git merge hotfix/v1.0.1-critical-bug

# 5. Update version
echo "1.0.1" > VERSION
git add VERSION CHANGELOG.md package.json apps/web/package.json backend/package.json
git commit -m "chore: release hotfix version 1.0.1"
git tag -a v1.0.1 -m "Hotfix v1.0.1: Critical bug fix"
```

### Scenario 2: Release New Minor Version

```bash
# 1. Ensure develop branch is ready
git checkout develop

# 2. Create release branch
git checkout -b release/v1.1.0

# 3. Update version
echo "1.1.0" > VERSION
# Update all package.json
# Update CHANGELOG.md

# 4. Commit release changes
git commit -m "chore: prepare release v1.1.0"

# 5. Merge to main
git checkout main
git merge release/v1.1.0

# 6. Create tag
git tag -a v1.1.0 -m "Release v1.1.0: [description]"
git push origin v1.1.0

# 7. Back to develop
git checkout develop
git merge main
```

### Scenario 3: Detect Version Mismatch

```bash
# Script untuk check semua file punya version konsisten
echo "Checking version consistency..."
VERSION=$(cat VERSION)
WEB_VER=$(grep '"version"' apps/web/package.json | grep -o '"[^"]*"' | sed 's/"//g')
BACKEND_VER=$(grep '"version"' backend/package.json | grep -o '"[^"]*"' | sed 's/"//g')
ROOT_VER=$(grep '"version"' package.json | head -1 | grep -o '"[^"]*"' | sed 's/"//g')

if [ "$VERSION" = "$WEB_VER" ] && [ "$VERSION" = "$BACKEND_VER" ] && [ "$VERSION" = "$ROOT_VER" ]; then
  echo "✅ All versions match: $VERSION"
else
  echo "❌ Version mismatch!"
  echo "VERSION file: $VERSION"
  echo "Root package.json: $ROOT_VER"
  echo "Web package.json: $WEB_VER"
  echo "Backend package.json: $BACKEND_VER"
fi
```

---

## Version History

| Version | Date | Type | Focus |
|---------|------|------|-------|
| 1.0.0 | 2026-04-23 | Initial Release | Core features, security fixes, dependency cleanup |
| 1.1.0 | TBD | Minor | [Planned features] |
| 2.0.0 | TBD | Major | [Phase 2] |

---

## Best Practices

### Do's ✅
- ✅ Update VERSION, package.json, dan CHANGELOG.md bersamaan
- ✅ Gunakan semantic versioning yang konsisten
- ✅ Create annotated tags (bukan lightweight)
- ✅ Update CHANGELOG sebelum release
- ✅ Test semua sebelum tag
- ✅ Push tags ke remote segera setelah create
- ✅ Follow commit message convention

### Don'ts ❌
- ❌ Jangan skip PATCH untuk fix minor
- ❌ Jangan update version tanpa changelog
- ❌ Jangan push ke main tanpa PR/review
- ❌ Jangan delete published tags
- ❌ Jangan mix breaking changes dengan features biasa
- ❌ Jangan skip testing sebelum release
- ❌ Jangan rebase after tag published

---

## Automation Ideas

### Pre-commit Hook

```bash
# .git/hooks/pre-commit
#!/bin/bash
# Check version consistency
VERSION=$(cat VERSION)
if ! grep -q "\"version\": \"$VERSION\"" package.json; then
  echo "❌ Version mismatch! Update package.json"
  exit 1
fi
```

### CI/CD Integration

```yaml
# .github/workflows/version-check.yml
name: Version Check
on: [pull_request]
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: |
          VERSION=$(cat VERSION)
          grep "\"version\": \"$VERSION\"" package.json
          grep "\"version\": \"$VERSION\"" apps/web/package.json
          grep "\"version\": \"$VERSION\"" backend/package.json
```

---

## Support & Questions

- **Versioning Issues**: Check CHANGELOG.md & recent commits
- **Version Update Needed**: Follow release process di section ini
- **Questions**: Refer ke Contributing Guide (jika ada)

---

_Last Updated: 2026-04-23_
_Maintained By: ProjectPolda Team_
