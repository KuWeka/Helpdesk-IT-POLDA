import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext.jsx';
import api from '@/lib/api.js';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Skeleton } from '@/components/ui/skeleton.jsx';
import SectionHeader from '@/components/common/SectionHeader.jsx';
import { Star, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const RATING_LABELS = {
  1: 'Sangat Buruk',
  2: 'Buruk',
  3: 'Cukup Baik',
  4: 'Baik',
  5: 'Sangat Baik',
};

const safeFormatDate = (value) => {
  if (!value) return '-';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return format(d, 'dd MMM yyyy, HH:mm');
};

export default function RatingPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTicketId = searchParams.get('ticket_id');

  const [pendingTicket, setPendingTicket] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [selectedRating, setSelectedRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const fetchPending = async () => {
      setIsLoading(true);
      try {
        const { data } = await api.get('/tickets/pending-rating');
        if (data.pending && data.ticket) {
          // Jika ada redirectTicketId, pastikan tiket yang ditampilkan adalah yang diminta
          if (redirectTicketId && data.ticket.id !== redirectTicketId) {
            // Tiket pending bukan yang diminta — tetap tampilkan tiket pending yang ada
            // tapi beri peringatan
            toast.warning('Terdapat permohonan lain yang perlu dirating terlebih dahulu.');
          }
          setPendingTicket(data.ticket);
        } else {
          // Tidak ada yang perlu dirating
          setPendingTicket(null);
        }
      } catch (err) {
        toast.error('Gagal memuat data rating');
      } finally {
        setIsLoading(false);
      }
    };
    fetchPending();
  }, [redirectTicketId]);

  const handleSubmit = async () => {
    if (selectedRating === 0 || !pendingTicket) return;
    setIsSubmitting(true);
    try {
      await api.post(`/tickets/${pendingTicket.id}/rating`, { rating: selectedRating });
      setDone(true);
      toast.success('Rating berhasil diberikan. Terima kasih!');
      // Setelah 1.5 detik, redirect ke halaman buat permohonan atau daftar permohonan
      setTimeout(() => {
        if (redirectTicketId) {
            navigate('/satker/create-ticket');
        } else {
          navigate('/satker/tickets');
        }
      }, 1500);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal mengirim rating');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-lg mx-auto space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!pendingTicket) {
    return (
      <div className="max-w-lg mx-auto text-center space-y-4 py-16">
        <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
        <h2 className="text-xl font-semibold">Tidak ada permohonan yang perlu dirating</h2>
        <p className="text-muted-foreground">Semua permohonan Anda yang sudah selesai sudah dirating.</p>
        <Button onClick={() => navigate('/satker/tickets')}>Lihat Permohonan Saya</Button>
      </div>
    );
  }

  if (done) {
    return (
      <div className="max-w-lg mx-auto text-center space-y-4 py-16">
        <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
        <h2 className="text-xl font-semibold">Rating Terkirim!</h2>
        <p className="text-muted-foreground">Terima kasih atas penilaian Anda.</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-6 animate-in fade-in duration-500">
      <SectionHeader
        title="Beri Rating Permohonan"
        subtitle="Bantu kami meningkatkan layanan dengan memberi penilaian"
      />

      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Permohonan yang Perlu Dirating</CardTitle>
          <CardDescription>
            Selesaikan rating ini sebelum membuat permohonan baru.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 bg-muted/40 rounded-xl border space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold text-muted-foreground bg-background border px-2 py-0.5 rounded">
                {pendingTicket.ticket_number}
              </span>
            </div>
            <p className="font-medium text-foreground">{pendingTicket.title}</p>
            <p className="text-xs text-muted-foreground">Selesai: {safeFormatDate(pendingTicket.updated_at)}</p>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium text-center">Bagaimana penilaian Anda terhadap penanganan permohonan ini?</p>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className="focus:outline-none transition-transform hover:scale-110"
                  onMouseEnter={() => setHoveredStar(star)}
                  onMouseLeave={() => setHoveredStar(0)}
                  onClick={() => setSelectedRating(star)}
                >
                  <Star
                    className={`h-10 w-10 transition-colors ${
                      star <= (hoveredStar || selectedRating)
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-muted-foreground'
                    }`}
                  />
                </button>
              ))}
            </div>
            {(hoveredStar || selectedRating) > 0 && (
              <p className="text-center text-sm font-medium text-amber-600">
                {RATING_LABELS[hoveredStar || selectedRating]}
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => navigate('/satker/tickets')}>
            Nanti Saja
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={selectedRating === 0 || isSubmitting}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Kirim Rating
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
