# SUPPLY CHAIN SECURITY

Tanggal dibuat: 2026-05-04

Tanggal Dokumen: 2026-04-23
Versi Dokumen: V2 Professional
Sumber Asli: archived-md/backend/SUPPLY_CHAIN_SECURITY.md

## Tujuan Dokumen

This document defines supply-chain controls for the backend service.

## Ringkasan Eksekutif

- Dokumen ini telah dinormalisasi agar mudah dipindai oleh tim teknis dan non-teknis.
- Struktur isi disusun ulang menjadi tujuan, ringkasan, daftar bahasan, konten inti, dan checklist verifikasi.
- Bagian teknis asli dipertahankan agar jejak keputusan dan implementasi tetap dapat diaudit.

## Peta Isi

1. Scope
2. Controls
3. Response Policy
4. Verification Commands

## Konten Inti (Disusun Ulang)

## Scope
This document defines supply-chain controls for the backend service.

## Controls

1. Secret scanning
- Tool: gitleaks
- Workflow: backend-supply-chain.yml

2. Dependency vulnerability scanning
- Tool: Trivy filesystem scan + npm audit in governance workflows

3. Container image scanning
- Tool: Trivy image scan on CI-built image

4. SBOM generation
- Lightweight CycloneDX-like JSON artifact via script
- Artifact path: backend/artifacts/sbom-lite.cdx.json

5. Release gating
- Supply chain workflow must pass before release readiness gates

## Response Policy

1. HIGH/CRITICAL findings
- Block release pipeline
- Create remediation issue and patch before redeploy

2. False positives
- Document justification in PR
- Add time-boxed exception with follow-up date

## Verification Commands

1. Generate SBOM
- npm run security:sbom

2. Run readiness checks
- npm run phase7:readiness

3. Run synthetic checks
- npm run ops:synthetic

## Checklist Review

- [ ] Istilah teknis sudah konsisten antar dokumen
- [ ] Referensi script/path masih valid terhadap struktur repo terbaru
- [ ] Action item lanjutan sudah memiliki owner atau milestone
- [ ] Dokumen siap dipakai untuk onboarding dan audit teknis
