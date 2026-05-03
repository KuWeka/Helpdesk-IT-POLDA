import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '@/lib/api.js';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Textarea } from '@/components/ui/textarea.jsx';
import { Skeleton } from '@/components/ui/skeleton.jsx';
import SectionHeader from '@/components/common/SectionHeader.jsx';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function EditTicketPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
  });

  useEffect(() => {
    const loadTicket = async () => {
      try {
        const { data } = await api.get(`/tickets/${id}`);
        if (data?.status !== 'Pending') {
          toast.error('Hanya permohonan berstatus Pending yang dapat diedit');
          navigate(`/satker/tickets/${id}`);
          return;
        }
        setFormData({
          title: data?.title || '',
          description: data?.description || '',
          location: data?.location || '',
        });
      } catch (error) {
        toast.error(error.response?.data?.message || 'Gagal memuat permohonan');
        navigate('/satker/tickets');
      } finally {
        setIsLoading(false);
      }
    };

    loadTicket();
  }, [id, navigate]);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.description.trim() || !formData.location.trim()) {
      toast.error('Judul, deskripsi, dan lokasi wajib diisi');
      return;
    }

    setIsSaving(true);
    try {
      await api.patch(`/tickets/${id}`, {
        title: formData.title.trim(),
        description: formData.description.trim(),
        location: formData.location.trim(),
      });
      toast.success('Permohonan berhasil diperbarui');
      navigate(`/satker/tickets/${id}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal memperbarui permohonan');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500">
      <SectionHeader
        title="Edit Permohonan"
        subtitle="Perbarui detail permohonan Anda (hanya saat status Pending)"
      />

      <Card className="border-border shadow-sm">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle className="text-base">Detail Permohonan</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Judul Kendala</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={handleChange}
                disabled={isSaving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Deskripsi Detail</Label>
              <Textarea
                id="description"
                className="min-h-[120px] resize-y"
                value={formData.description}
                onChange={handleChange}
                disabled={isSaving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Lokasi</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={handleChange}
                disabled={isSaving}
              />
            </div>
          </CardContent>

          <CardFooter className="justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(`/satker/tickets/${id}`)}
              disabled={isSaving}
            >
              Batal
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Simpan Perubahan
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
