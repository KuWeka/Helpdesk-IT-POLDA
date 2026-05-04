# PHASE 5 GUIDE

Tanggal dibuat: 2026-05-04

Tanggal Dokumen: 2026-04-23
Versi Dokumen: V2 Professional
Sumber Asli: archived-md/backend/PHASE_5_GUIDE.md

## Tujuan Dokumen

Phase 5 focuses on software supply-chain controls and hardened release artifacts.

## Ringkasan Eksekutif

- Dokumen ini telah dinormalisasi agar mudah dipindai oleh tim teknis dan non-teknis.
- Struktur isi disusun ulang menjadi tujuan, ringkasan, daftar bahasan, konten inti, dan checklist verifikasi.
- Bagian teknis asli dipertahankan agar jejak keputusan dan implementasi tetap dapat diaudit.

## Peta Isi

1. Goals
2. Implemented Deliverables
3. Checklist
4. Validation

## Konten Inti (Disusun Ulang)

Phase 5 focuses on software supply-chain controls and hardened release artifacts.

## Goals

- Add automated secrets and vulnerability scanning
- Scan filesystem and container images in CI
- Generate SBOM artifact for release evidence
- Enforce readiness gate for supply-chain controls
- Harden Docker build context to reduce artifact leakage

---

## Implemented Deliverables

1. Supply-chain CI workflow
- File: `/.github/workflows/backend-supply-chain.yml`
- Includes gitleaks, trivy fs scan, trivy image scan, SBOM artifact upload, and readiness gate.

2. SBOM generation script
- File: `backend/scripts/generate-sbom-lite.js`
- Output: `backend/artifacts/sbom-lite.cdx.json`

3. Readiness gate script
- File: `backend/scripts/supply-chain-readiness.js`
- Validates required files, workflow presence, script commands, and .dockerignore hardening entries.

4. Docker context hardening
- File: `backend/.dockerignore`
- Excludes backups, security scan artifacts, and phase documents from build context.

5. Supply-chain policy doc
- File: `backend/SUPPLY_CHAIN_SECURITY.md`

6. Package scripts
- Added `security:sbom`
- Added `phase7:readiness`

---

## Checklist

- [x] Secret scanning in CI
- [x] Filesystem vulnerability scanning in CI
- [x] Image vulnerability scanning in CI
- [x] SBOM artifact generation and upload
- [x] Supply-chain readiness gate script
- [x] Docker context hardening
- [x] Policy documentation published

---

## Validation

- `npm run lint` passes
- `npm test -- --runInBand` passes
- `npm run security:sbom` passes
- `npm run phase7:readiness` passes
- `npm run ops:synthetic` passes

---

**Status**: Phase 5 implementation completed.

**Last Updated**: April 18, 2026

## Checklist Review

- [ ] Istilah teknis sudah konsisten antar dokumen
- [ ] Referensi script/path masih valid terhadap struktur repo terbaru
- [ ] Action item lanjutan sudah memiliki owner atau milestone
- [ ] Dokumen siap dipakai untuk onboarding dan audit teknis
