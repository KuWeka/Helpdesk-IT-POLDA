Tanggal: 2026-04-18

> Jalankan setelah Sesi 1 selesai dan sudah diverifikasi berjalan normal
> Fokus: Konsistenkan stats cards dan migrasikan charts ke ChartContainer

---

## KONTEKS

Project: Helpdesk System — React 18 + Vite + shadcn/ui + Axios + Socket.io.
Sesi 1 sudah selesai: layout bersih, tidak ada duplikasi.

`src/components/ui/chart.jsx` sudah ada dan siap dipakai. API yang tersedia:
- `ChartContainer` — wrapper utama, menggantikan `ResponsiveContainer`
- `ChartTooltip` — alias dari `recharts.Tooltip`
- `ChartTooltipContent` — tooltip content yang sudah di-style

---

## YANG TIDAK BOLEH DIUBAH

```
❌ Semua api.get/post/patch/delete calls
❌ Semua useState, useEffect, handler functions
❌ src/lib/api.js, socket.js, AuthContext.jsx
❌ src/components/ui/
❌ src/styles/theme.css
```

**Hanya ubah bagian JSX/render saja.**

---

## TUGAS SESI INI

### TUGAS 1 — `src/pages/admin/AdminDashboard.jsx`

#### 1A. Migrasikan chart recharts → ChartContainer

```jsx
// HAPUS import ini:
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// GANTI dengan:
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

// Tambahkan chartConfig (letakkan di luar komponen):
const chartConfig = {
  count: {
    label: 'Jumlah Tiket',
    color: 'hsl(var(--primary))',
  },
};
```

Ganti bagian render chart:
```jsx
// SEBELUM:
<ResponsiveContainer width="100%" height={300}>
  <BarChart data={chartData}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="name" />
    <YAxis />
    <Tooltip />
    <Bar dataKey="value" fill="#8b5cf6" />
  </BarChart>
</ResponsiveContainer>

// SESUDAH:
<ChartContainer config={chartConfig} className="h-[280px] w-full">
  <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
    <CartesianGrid strokeDasharray="3 3" vertical={false} />
    <XAxis
      dataKey="name"
      tickLine={false}
      axisLine={false}
      tickMargin={8}
      tick={{ fontSize: 12 }}
    />
    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
    <ChartTooltip content={<ChartTooltipContent />} />
    <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} />
  </BarChart>
</ChartContainer>
```

> Sesuaikan `dataKey` dengan field yang sebenarnya ada di `chartData` — cek state `chartData` di file tersebut.

#### 1B. Konsistenkan stats cards

Ganti semua stat card menjadi pola berikut:

```jsx
// Pola stats card yang konsisten:
<Card>
  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
    <CardTitle className="text-sm font-medium text-muted-foreground">
      Total Tiket
    </CardTitle>
    <Ticket className="h-4 w-4 text-muted-foreground" />
  </CardHeader>
  <CardContent>
    <div className="text-2xl font-bold">
      {isLoading ? <Skeleton className="h-8 w-16" /> : stats.total}
    </div>
    <p className="text-xs text-muted-foreground mt-1">Semua tiket terdaftar</p>
  </CardContent>
</Card>
```

Buat grid stats card dengan layout:
```jsx
<div className="grid gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
  {/* card per stats */}
</div>
```

Stats yang ada: `total`, `pending`, `proses`, `selesai`, `activeTechs`, `totalUsers`.
Icon yang sesuai (sudah diimport): `Ticket`, `Clock`, `PlayCircle`, `CheckCircle2`, `UserCog`, `Users`.

#### 1C. Bungkus chart dalam Card

```jsx
<Card>
  <CardHeader>
    <CardTitle className="text-base font-semibold flex items-center gap-2">
      <BarChart3 className="h-4 w-4" />
      Statistik Tiket Bulanan
    </CardTitle>
  </CardHeader>
  <CardContent>
    {/* ChartContainer di sini */}
  </CardContent>
</Card>
```

---

### TUGAS 2 — `src/pages/technician/TechnicianDashboard.jsx`

Terapkan pola yang sama dengan AdminDashboard:
- Migrasikan chart recharts → ChartContainer (jika ada)
- Konsistenkan stats cards dengan pola Card yang sama
- Pertahankan semua logic: `fetchDashboardData`, `handleToggleStatus`, `handleTakeTicket`, dll

---

### TUGAS 3 — `src/pages/UserDashboard.jsx`

Terapkan pola stats card yang konsisten.
Jika ada chart, migrasikan ke ChartContainer.
Pertahankan semua logic fetching data.

---

### POLA SKELETON LOADING — wajib konsisten di semua dashboard

```jsx
// Saat isLoading === true, tampilkan skeleton:
{isLoading ? (
  <div className="grid gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
    {Array.from({ length: 6 }).map((_, i) => (
      <Card key={i}>
        <CardHeader className="pb-2">
          <Skeleton className="h-4 w-24" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-16" />
        </CardContent>
      </Card>
    ))}
  </div>
) : (
  // grid stats card normal
)}
```

---

## VERIFIKASI SETELAH SELESAI

- [ ] Chart di AdminDashboard muncul dengan style shadcn (tooltip muncul saat hover)
- [ ] Stats cards konsisten di semua 3 dashboard (Admin, Teknisi, User)
- [ ] Skeleton loading muncul saat data belum ada
- [ ] Tidak ada error `ChartContainer` atau `ResponsiveContainer` di console
- [ ] Data tetap tampil benar (tidak ada perubahan logika fetching)

