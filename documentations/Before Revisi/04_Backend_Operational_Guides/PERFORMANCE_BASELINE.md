# PERFORMANCE BASELINE

Tanggal dibuat: 2026-05-04

Tanggal Dokumen: 2026-04-23
Versi Dokumen: V2 Professional
Sumber Asli: archived-md/backend/PERFORMANCE_BASELINE.md

## Tujuan Dokumen

| Endpoint | Concurrency | Duration | Req/sec | p95 (ms) | Error Rate | |---|---:|---:|---:|---:|---:| | /api/health/live | 20 | 20s | 1177.3 | 33 | 0% | | /api/dashboard/admin-summary | 20 | 20s | TBD | TBD | TBD | | /api/tickets | 20 | 20s | TBD | TBD | TBD |

## Ringkasan Eksekutif

- Dokumen ini telah dinormalisasi agar mudah dipindai oleh tim teknis dan non-teknis.
- Struktur isi disusun ulang menjadi tujuan, ringkasan, daftar bahasan, konten inti, dan checklist verifikasi.
- Bagian teknis asli dipertahankan agar jejak keputusan dan implementasi tetap dapat diaudit.

## Peta Isi

1. Tooling
2. Latest Baseline (April 18, 2026)
3. Metrics to Track
4. Optimization Checklist
5. Reporting Template

## Konten Inti (Disusun Ulang)

## Tooling
- Load tool: `autocannon`
- Command: `npm run load:test`
- Default target: `http://localhost:3001/api/health/live`
- Default profile: 20 connections, 20 seconds

## Latest Baseline (April 18, 2026)
- Status: Completed
- Target: /api/health/live
- Profile: 20 connections, 20 seconds
- Average requests/sec: 1177.3
- p95 latency: 33 ms
- p99 latency: 57 ms
- Throughput avg: 890035 bytes/sec
- Total requests: 23546
- Error rate: 0%
- Timeouts: 0

## Metrics to Track
- Requests/sec
- p50, p95, p99 latency
- Throughput (bytes/sec)
- Non-2xx responses
- Errors and timeouts

## Optimization Checklist
- Keep p95 latency under 1000ms for core endpoints
- Keep error rate < 1%
- Use dashboard caching for summary endpoints
- Keep DB indexes aligned with filtering and sorting patterns

## Reporting Template

| Endpoint | Concurrency | Duration | Req/sec | p95 (ms) | Error Rate |
|---|---:|---:|---:|---:|---:|
| /api/health/live | 20 | 20s | 1177.3 | 33 | 0% |
| /api/dashboard/admin-summary | 20 | 20s | TBD | TBD | TBD |
| /api/tickets | 20 | 20s | TBD | TBD | TBD |

## Checklist Review

- [ ] Istilah teknis sudah konsisten antar dokumen
- [ ] Referensi script/path masih valid terhadap struktur repo terbaru
- [ ] Action item lanjutan sudah memiliki owner atau milestone
- [ ] Dokumen siap dipakai untuk onboarding dan audit teknis
