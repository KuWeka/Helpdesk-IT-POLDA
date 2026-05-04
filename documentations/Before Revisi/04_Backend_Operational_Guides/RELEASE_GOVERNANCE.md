# RELEASE GOVERNANCE

Tanggal dibuat: 2026-05-04

Tanggal Dokumen: 2026-04-23
Versi Dokumen: V2 Professional
Sumber Asli: archived-md/backend/RELEASE_GOVERNANCE.md

## Tujuan Dokumen

1. All releases must pass: - lint - unit tests - production dependency audit - release readiness checks - smoke/synthetic checks in staging

## Ringkasan Eksekutif

- Dokumen ini telah dinormalisasi agar mudah dipindai oleh tim teknis dan non-teknis.
- Struktur isi disusun ulang menjadi tujuan, ringkasan, daftar bahasan, konten inti, dan checklist verifikasi.
- Bagian teknis asli dipertahankan agar jejak keputusan dan implementasi tetap dapat diaudit.

## Peta Isi

1. Release Policy
2. Required Runtime Metadata
3. Rollback Policy
4. Security Governance
5. Evidence Artifacts

## Konten Inti (Disusun Ulang)

## Release Policy

1. All releases must pass:
- lint
- unit tests
- production dependency audit
- release readiness checks
- smoke/synthetic checks in staging

2. Release versioning:
- Semantic version format `major.minor.patch`
- Increment rule:
  - patch: fixes only
  - minor: backward-compatible feature
  - major: breaking change

## Required Runtime Metadata

- `APP_VERSION`
- `GIT_SHA`
- `NODE_ENV`

Runtime metadata is exposed on `GET /api/health/version`.

## Rollback Policy

- Use `bash scripts/rollback-staging.sh` for staging rollback.
- Production rollback follows the same image pinning pattern.

## Security Governance

- Weekly Dependabot updates for npm and GitHub Actions
- Scheduled `npm audit --omit=dev --audit-level=high`

## Evidence Artifacts

- CI logs from workflows:
  - backend-ci
  - backend-ops
  - backend-release-governance
- Baseline performance report in `PERFORMANCE_BASELINE.md`
- Incident handling in `INCIDENT_RESPONSE_RUNBOOK.md`

## Checklist Review

- [ ] Istilah teknis sudah konsisten antar dokumen
- [ ] Referensi script/path masih valid terhadap struktur repo terbaru
- [ ] Action item lanjutan sudah memiliki owner atau milestone
- [ ] Dokumen siap dipakai untuk onboarding dan audit teknis
