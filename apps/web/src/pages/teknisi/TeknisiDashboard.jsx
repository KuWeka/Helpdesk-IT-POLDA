import React, { useEffect, useMemo, useState } from 'react';
import api from '@/lib/api.js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Skeleton } from '@/components/ui/skeleton.jsx';
import SectionHeader from '@/components/common/SectionHeader.jsx';
import { ListChecks, Clock3, CheckCircle2, XCircle } from 'lucide-react';

const extractItems = (payload) => {
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload)) return payload;
  return [];
};

function Stat({ title, value, icon: Icon }) {
  return (
    <Card className="border-border shadow-sm">
      <CardContent className="pt-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-semibold mt-1">{value}</p>
          </div>
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function TeknisiDashboard() {
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTickets = async () => {
      setIsLoading(true);
      try {
        const { data } = await api.get('/tickets', { params: { page: 1, perPage: 200 } });
        setTickets(extractItems(data));
      } catch {
        setTickets([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTickets();
  }, []);

  const stats = useMemo(() => {
    const total = tickets.length;
    const pending = tickets.filter((t) => t.status === 'Pending').length;
    const proses = tickets.filter((t) => t.status === 'Proses').length;
    const selesai = tickets.filter((t) => t.status === 'Selesai').length;
    const ditolak = tickets.filter((t) => t.status === 'Ditolak').length;
    return { total, pending, proses, selesai, ditolak };
  }, [tickets]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <SectionHeader
        title="Dashboard Teknisi"
        subtitle="Monitoring ringkas semua permohonan (read-only)."
      />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Stat title="Total Tiket" value={stats.total} icon={ListChecks} />
          <Stat title="Pending" value={stats.pending} icon={Clock3} />
          <Stat title="Proses" value={stats.proses} icon={Clock3} />
          <Stat title="Selesai" value={stats.selesai} icon={CheckCircle2} />
          <Stat title="Ditolak" value={stats.ditolak} icon={XCircle} />
        </div>
      )}

      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Informasi</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Teknisi bersifat pengamat: dapat melihat data tiket tanpa tombol aksi eksekusi.
        </CardContent>
      </Card>
    </div>
  );
}
