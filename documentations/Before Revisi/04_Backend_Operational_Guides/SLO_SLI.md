# SLO SLI

Tanggal dibuat: 2026-05-04

Tanggal Dokumen: 2026-04-23
Versi Dokumen: V2 Professional
Sumber Asli: archived-md/backend/SLO_SLI.md

## Tujuan Dokumen

This document defines production reliability objectives for the backend API.

## Ringkasan Eksekutif

- Dokumen ini telah dinormalisasi agar mudah dipindai oleh tim teknis dan non-teknis.
- Struktur isi disusun ulang menjadi tujuan, ringkasan, daftar bahasan, konten inti, dan checklist verifikasi.
- Bagian teknis asli dipertahankan agar jejak keputusan dan implementasi tetap dapat diaudit.

## Peta Isi

1. Scope
2. Service Level Indicators (SLIs)
3. Service Level Objectives (SLOs)
4. Alerting Thresholds
5. Operational Actions

## Konten Inti (Disusun Ulang)

## Scope
This document defines production reliability objectives for the backend API.

## Service Level Indicators (SLIs)

1. Availability SLI
- Definition: ratio of successful health checks for /api/health/live
- Source: synthetic monitoring and uptime checks

2. Latency SLI
- Definition: p95 of helpdesk_http_request_duration_ms for core endpoints
- Source: Prometheus metrics from /api/health/metrics

3. Error Rate SLI
- Definition: proportion of 5xx responses over total responses
- Source: helpdesk_http_requests_total

## Service Level Objectives (SLOs)

1. Availability SLO
- Target: >= 99.9% monthly availability

2. Latency SLO
- Target: p95 < 1000ms for core endpoints

3. Error Rate SLO
- Target: < 1% 5xx in rolling 1 hour window

## Alerting Thresholds

1. Warning
- 5xx ratio > 2% for 5 minutes
- p95 latency > 800ms for 10 minutes

2. Critical
- 5xx ratio > 5% for 5 minutes
- availability below 99% in rolling 1 hour

## Operational Actions

1. On warning
- check deploy history
- inspect logs in Loki
- inspect DB/Redis health

2. On critical
- trigger rollback script
- pause further deployments
- open incident timeline

## Checklist Review

- [ ] Istilah teknis sudah konsisten antar dokumen
- [ ] Referensi script/path masih valid terhadap struktur repo terbaru
- [ ] Action item lanjutan sudah memiliki owner atau milestone
- [ ] Dokumen siap dipakai untuk onboarding dan audit teknis
