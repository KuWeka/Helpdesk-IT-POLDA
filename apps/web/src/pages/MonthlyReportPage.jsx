import React, { useState, useCallback } from 'react';
import api from '@/lib/api.js';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table.jsx';
import { Skeleton } from '@/components/ui/skeleton.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import SectionHeader from '@/components/common/SectionHeader.jsx';
import { FileSpreadsheet, FileText, Download, Loader2, BarChart2, Star } from 'lucide-react';
import { toast } from 'sonner';

const BULAN = [
  { value: '1', label: 'Januari' }, { value: '2', label: 'Februari' },
  { value: '3', label: 'Maret' }, { value: '4', label: 'April' },
  { value: '5', label: 'Mei' }, { value: '6', label: 'Juni' },
  { value: '7', label: 'Juli' }, { value: '8', label: 'Agustus' },
  { value: '9', label: 'September' }, { value: '10', label: 'Oktober' },
  { value: '11', label: 'November' }, { value: '12', label: 'Desember' },
];

const STATUS_COLOR = {
  Selesai: 'bg-green-100 text-green-700',
  Proses: 'bg-blue-100 text-blue-700',
  Pending: 'bg-yellow-100 text-yellow-700',
  Ditolak: 'bg-red-100 text-red-700',
  Dibatalkan: 'bg-gray-100 text-gray-500',
};

const now = new Date();

export default function MonthlyReportPage() {
  const { currentUser } = useAuth();
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [year, setYear] = useState(String(now.getFullYear()));
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(null); // 'xlsx' | 'pdf' | null

  const fetchReport = useCallback(async () => {
    setIsLoading(true);
    setReportData(null);
    try {
      const { data } = await api.get('/reports/monthly', { params: { month, year } });
      setReportData(data?.data || data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal memuat laporan');
    } finally {
      setIsLoading(false);
    }
  }, [month, year]);

  const handleExport = async (format) => {
    setIsExporting(format);
    const toastId = toast.loading(`Sedang menyiapkan laporan ${format.toUpperCase()}... Mohon tunggu.`);
    try {
      const response = await api.get('/reports/monthly/export', {
        params: { month, year, format },
        responseType: 'blob',
      });
      const ext = format === 'xlsx' ? 'xlsx' : 'pdf';
      const mime = format === 'xlsx'
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        : 'application/pdf';
      const url = window.URL.createObjectURL(new Blob([response.data], { type: mime }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `laporan_${year}_${String(month).padStart(2, '0')}.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success(`Laporan ${format.toUpperCase()} berhasil diunduh`, { id: toastId });
    } catch {
      toast.error('Gagal mengunduh laporan. Coba lagi.', { id: toastId });
    } finally {
      setIsExporting(null);
    }
  };

  const yearOptions = Array.from({ length: 5 }, (_, i) => String(now.getFullYear() - i));
  const role = currentUser?.role;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 flex flex-col gap-6 duration-500">
      <SectionHeader
        title="Laporan Bulanan"
        subtitle="Pilih bulan dan tahun untuk melihat laporan. Tersedia ekspor Excel dan PDF."
        actions={null}
      />

      {/* Filter */}
      <Card className="border-border shadow-sm">
        <CardContent className="p-5">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Bulan</label>
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BULAN.map((b) => (
                    <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Tahun</label>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((y) => (
                    <SelectItem key={y} value={y}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={fetchReport} disabled={isLoading} className="gap-2">
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              <BarChart2 className="h-4 w-4" />
              Tampilkan
            </Button>
            {reportData && (
              <>
                <Button
                  variant="outline"
                  className="gap-2 ml-auto"
                  onClick={() => handleExport('xlsx')}
                  disabled={isExporting !== null}
                >
                  {isExporting === 'xlsx'
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Menyiapkan...</>
                    : <><FileSpreadsheet className="h-4 w-4 text-green-600" /> Download Excel</>}
                </Button>
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => handleExport('pdf')}
                  disabled={isExporting !== null}
                >
                  {isExporting === 'pdf'
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Menyiapkan...</>
                    : <><FileText className="h-4 w-4 text-red-600" /> Download PDF</>}
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      )}

      {/* Konten laporan */}
      {!isLoading && reportData && (
        <div className="space-y-6">
          {/* Ringkasan */}
          <ReportSummary data={reportData} role={role} />

          {/* Tabel tiket (Satker & Padal) */}
          {(role === 'Satker' || role === 'Teknisi' || role === 'Padal') && reportData.tickets && (
            <Card className="border-border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Daftar Tiket</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <TicketTable tickets={reportData.tickets} role={role} />
              </CardContent>
            </Card>
          )}

          {/* Subtekinfo: per Padal */}
          {role === 'Subtekinfo' && reportData.perPadal && (
            <Card className="border-border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Performa Padal</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama Padal</TableHead>
                      <TableHead className="text-right">Total Tiket</TableHead>
                      <TableHead className="text-right">Selesai</TableHead>
                      <TableHead className="text-right">Rata-rata Rating</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.perPadal.length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">Tidak ada data</TableCell></TableRow>
                    ) : reportData.perPadal.map((p, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{p.nama_padal}</TableCell>
                        <TableCell className="text-right">{p.total_tiket}</TableCell>
                        <TableCell className="text-right">{p.selesai}</TableCell>
                        <TableCell className="text-right">
                          {p.rata_rating ? (
                            <span className="flex items-center justify-end gap-1">
                              <Star className="h-3 w-3 text-amber-400" />
                              {p.rata_rating}
                            </span>
                          ) : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Subtekinfo: tiket ditolak */}
          {role === 'Subtekinfo' && reportData.ditolak && reportData.ditolak.length > 0 && (
            <Card className="border-border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Tiket Ditolak</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>No. Tiket</TableHead>
                      <TableHead>Judul</TableHead>
                      <TableHead>Satker</TableHead>
                      <TableHead>Alasan Penolakan</TableHead>
                      <TableHead>Tanggal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.ditolak.map((d, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-mono text-xs">{d.ticket_number}</TableCell>
                        <TableCell>{d.title}</TableCell>
                        <TableCell>{d.nama_satker}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{d.rejection_reason || '-'}</TableCell>
                        <TableCell>{d.tanggal_tolak}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Subtekinfo: ranking satker */}
          {role === 'Subtekinfo' && reportData.rankingSatker && reportData.rankingSatker.length > 0 && (
            <Card className="border-border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Ranking Satker (Tiket Terbanyak)</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Nama Satker</TableHead>
                      <TableHead className="text-right">Total Tiket</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.rankingSatker.map((r, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                        <TableCell className="font-medium">{r.nama_satker}</TableCell>
                        <TableCell className="text-right">{r.total_tiket}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

// ── Sub-komponen Ringkasan ─────────────────────────────────────────────────────

function StatBox({ label, value, color = '' }) {
  return (
    <div className={`rounded-lg border p-4 space-y-1 ${color}`}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold">{value ?? 0}</p>
    </div>
  );
}

function ReportSummary({ data, role }) {
  const s = data.summary || {};
  const stats = (role === 'Satker' || role === 'Teknisi')
    ? [
        { label: 'Total Tiket', value: s.total },
        { label: 'Selesai', value: s.selesai, color: 'border-green-300 bg-green-50 dark:bg-green-950/20' },
        { label: 'Proses', value: s.proses, color: 'border-blue-300 bg-blue-50 dark:bg-blue-950/20' },
        { label: 'Pending', value: s.pending, color: 'border-yellow-300 bg-yellow-50 dark:bg-yellow-950/20' },
        { label: 'Ditolak', value: s.ditolak, color: 'border-red-300 bg-red-50 dark:bg-red-950/20' },
      ]
    : role === 'Padal'
      ? [
          { label: 'Total Tiket', value: s.total },
          { label: 'Selesai', value: s.selesai, color: 'border-green-300 bg-green-50 dark:bg-green-950/20' },
          { label: 'Sedang Proses', value: s.proses, color: 'border-blue-300 bg-blue-50 dark:bg-blue-950/20' },
          { label: 'Rata-rata Rating', value: s.rata_rating || '-', color: 'border-amber-300 bg-amber-50 dark:bg-amber-950/20' },
        ]
      : [
          { label: 'Total Masuk', value: s.total },
          { label: 'Selesai', value: s.selesai, color: 'border-green-300 bg-green-50 dark:bg-green-950/20' },
          { label: 'Ditolak', value: s.ditolak, color: 'border-red-300 bg-red-50 dark:bg-red-950/20' },
          { label: 'Dibatalkan', value: s.dibatalkan },
          { label: 'Masih Aktif', value: s.aktif, color: 'border-blue-300 bg-blue-50 dark:bg-blue-950/20' },
          { label: 'Rata-rata Selesai', value: s.avg_menit_selesai ? `${s.avg_menit_selesai} mnt` : '-' },
        ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {stats.map((stat) => (
        <StatBox key={stat.label} label={stat.label} value={stat.value} color={stat.color} />
      ))}
    </div>
  );
}

// ── Sub-komponen Tabel Tiket ──────────────────────────────────────────────────

function TicketTable({ tickets, role }) {
  if (tickets.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-12 text-sm">
        Tidak ada tiket pada periode ini.
      </div>
    );
  }
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>No. Tiket</TableHead>
          <TableHead>Judul</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Tanggal Buat</TableHead>
          <TableHead>{role === 'Padal' ? 'Satker' : 'Padal'}</TableHead>
          <TableHead className="text-right">Rating</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tickets.map((t, i) => (
          <TableRow key={i}>
            <TableCell className="font-mono text-xs">{t.ticket_number}</TableCell>
            <TableCell className="max-w-[200px] truncate">{t.title}</TableCell>
            <TableCell>
              <Badge className={`text-xs ${STATUS_COLOR[t.status] || ''}`} variant="outline">
                {t.status}
              </Badge>
            </TableCell>
            <TableCell className="text-sm">{t.tanggal_buat}</TableCell>
            <TableCell className="text-sm">{(role === 'Padal' ? t.nama_satker : t.nama_padal) || '-'}</TableCell>
            <TableCell className="text-right text-sm">
              {t.rating
                ? <span className="flex items-center justify-end gap-1"><Star className="h-3 w-3 text-amber-400" />{t.rating}</span>
                : '-'}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
