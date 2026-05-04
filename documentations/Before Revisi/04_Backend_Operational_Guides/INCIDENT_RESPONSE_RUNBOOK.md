# INCIDENT RESPONSE RUNBOOK

Tanggal dibuat: 2026-05-04

Tanggal Dokumen: 2026-04-23
Versi Dokumen: V2 Professional
Sumber Asli: archived-md/backend/INCIDENT_RESPONSE_RUNBOOK.md

## Tujuan Dokumen

1. Sev-1 - Full outage, critical business impact

## Ringkasan Eksekutif

- Dokumen ini telah dinormalisasi agar mudah dipindai oleh tim teknis dan non-teknis.
- Struktur isi disusun ulang menjadi tujuan, ringkasan, daftar bahasan, konten inti, dan checklist verifikasi.
- Bagian teknis asli dipertahankan agar jejak keputusan dan implementasi tetap dapat diaudit.

## Peta Isi

1. Severity Levels
2. Immediate Triage (first 10 minutes)
3. Mitigation
4. Communication
5. Post-Incident Checklist

## Konten Inti (Disusun Ulang)

## Severity Levels

1. Sev-1
- Full outage, critical business impact

2. Sev-2
- Partial outage, degraded core functionality

3. Sev-3
- Non-critical defects with workaround

## Immediate Triage (first 10 minutes)

1. Confirm impact
- run smoke test: npm run smoke:test
- run synthetic test: npm run ops:synthetic

2. Validate infrastructure
- check /api/health/live and /api/health/metrics
- check mysql and redis container health

3. Check last deployment
- inspect latest CI run and deployed image tag

## Mitigation

1. Rollback deployment
- run: bash scripts/rollback-staging.sh

2. Clear cache if stale behavior suspected
- run: npm run cache:clear

3. Restore database from backup if data corruption confirmed
- run: bash scripts/restore-db.sh backups/<file>.sql

## Communication

1. Open incident channel
2. Publish impact summary every 15 minutes
3. Publish resolution and postmortem within 24 hours

## Post-Incident Checklist

1. Capture root cause and timeline
2. Add regression tests
3. Update runbook and alerts
4. Track follow-up action items

## Checklist Review

- [ ] Istilah teknis sudah konsisten antar dokumen
- [ ] Referensi script/path masih valid terhadap struktur repo terbaru
- [ ] Action item lanjutan sudah memiliki owner atau milestone
- [ ] Dokumen siap dipakai untuk onboarding dan audit teknis
