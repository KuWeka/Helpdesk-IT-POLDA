# Insight Card Pattern (Fase 5)

Tanggal dibuat: 2026-05-04

## Tujuan
Menyediakan pola reusable untuk insight card di dashboard (user, teknisi, admin):
- Tren tiket (chart)
- SLA penyelesaian
- Aging tiket
- Prioritas hari ini

## Struktur Card
- CardHeader: Judul insight
- CardContent: Visual/chart/angka utama + deskripsi
- CardFooter (opsional): Action atau link detail

## Contoh Implementasi
```jsx
<Card className="border-border bg-card/95 shadow-sm">
  <CardHeader className="pb-2">
    <CardTitle className="text-base font-semibold">Tren Tiket Bulan Ini</CardTitle>
  </CardHeader>
  <CardContent>
    <ChartContainer>...</ChartContainer>
  </CardContent>
</Card>
```

## Catatan
- Gunakan ChartContainer dan Card dari /components/ui untuk konsistensi.
- Data di-fetch dari endpoint summary/trend sesuai role.
- Section "Prioritas Hari Ini" wajib ada di dashboard user & teknisi.
- Insight card harus mudah dipahami, tidak overload info.
