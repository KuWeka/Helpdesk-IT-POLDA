
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import api from '@/lib/api.js';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Skeleton } from '@/components/ui/skeleton.jsx';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx';
import {
  Empty,
  EMPTY_STATE_VARIANTS,
} from '@/components/ui/empty.jsx';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu.jsx';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog.jsx';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';
import { PlusCircle, Edit, Trash2, MoreHorizontal, Calendar, Users, UserPlus, Loader2, Star } from 'lucide-react';
import { toast } from 'sonner';
import AddEditTechnicianModal from '@/components/modals/AddEditTechnicianModal.jsx';
import { ROLES } from '@/lib/constants.js';
import SectionHeader from '@/components/common/SectionHeader.jsx';

const extractTechnicians = (payload) => {
  if (Array.isArray(payload?.data?.technicians)) return payload.data.technicians;
  if (Array.isArray(payload?.technicians)) return payload.technicians;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload)) return payload;
  return [];
};

const extractUsers = (payload) => {
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload)) return payload;
  return [];
};

const syncPadalMemberCount = (padalList, padalId, nextMembers) => (
  padalList.map((item) => (
    item.id === padalId
      ? { ...item, member_count: nextMembers.length }
      : item
  ))
);

export default function ManageTechniciansPage() {
  const { t } = useTranslation();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(location.pathname.includes('/teknisi') ? 'Teknisi' : 'Padal');
  const [users, setUsers] = useState([]);
  const [candidateUsers, setCandidateUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalState, setModalState] = useState({ isOpen: false, tech: null });
  const [isSaving, setIsSaving] = useState(false);
  const [actionTarget, setActionTarget] = useState({ type: null, tech: null });
  const [detailTarget, setDetailTarget] = useState(null);
  const [members, setMembers] = useState([]);
  const [teknisiList, setTeknisiList] = useState([]);
  const [selectedTeknisi, setSelectedTeknisi] = useState('');
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [isAddingMember, setIsAddingMember] = useState(false);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'Padal') {
        try {
          const { data } = await api.get('/technicians');
          setUsers(extractTechnicians(data).filter((item) => item.role === ROLES.PADAL));
        } catch (_) {
          // Fallback ke endpoint users agar daftar Padal tetap tampil meski
          // endpoint agregasi /technicians gagal karena ketergantungan tabel tambahan.
          const { data } = await api.get('/users', {
            params: {
              role: 'Padal',
              is_active: true,
              sort: 'name',
              order: 'asc',
              perPage: 100,
            }
          });
          const fallbackUsers = extractUsers(data).map((user) => ({
            ...user,
            member_count: 0,
            total_tickets_selesai: 0,
            avg_rating: null,
            total_ratings: 0,
            is_shift_active: false,
          }));
          setUsers(fallbackUsers);
        }
      } else {
        const { data } = await api.get('/users', {
          params: {
            role: 'Teknisi',
            is_active: true,
            sort: 'name',
            order: 'asc',
            perPage: 100,
          }
        });
        setUsers(extractUsers(data).filter((item) => item.role === ROLES.TEKNISI));
      }
    } catch (err) {
      toast.error(
        activeTab === 'Padal'
          ? t('manageTechs.loadPadalFailed', 'Gagal memuat data padal')
          : t('manageTechs.loadFailed', 'Gagal memuat data teknisi')
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, [activeTab]);

  const fetchCandidateUsers = async () => {
    try {
      const { data } = await api.get('/users', {
        params: {
          role: ROLES.SATKER,
          is_active: true,
          sort: 'name',
          order: 'asc',
          perPage: 100,
        }
      });

      setCandidateUsers(extractUsers(data));
    } catch (_) {
      setCandidateUsers([]);
    }
  };

  useEffect(() => {
    if (modalState.isOpen && !modalState.tech) {
      fetchCandidateUsers();
    }
  }, [modalState.isOpen, modalState.tech]);

  const handleSave = async (data) => {
    setIsSaving(true);
    try {
      if (modalState.tech && modalState.tech.id) {
        await api.patch(`/technicians/${modalState.tech.id}`, {
          name: data.name, email: data.email, phone: data.phone, is_active: data.is_active, role: ROLES.PADAL
        });
        toast.success(t('manageTechs.updateSuccess', 'Technician updated'));
      } else {
        await api.post('/technicians/promote', {
          user_id: data.user_id,
          tech_is_active: data.is_active,
          shift_start: data.shift_start,
          shift_end: data.shift_end,
          specializations: data.specializations,
          max_active_tickets: Number(data.max_active_tickets || 5),
          wa_notification: false,
        });
        toast.success(t('manageTechs.promoteSuccess', 'User promoted to technician'));
      }
      setModalState({ isOpen: false, tech: null });
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.message || t('manageTechs.saveFailed', 'Failed to save technician'));
    } finally {
      setIsSaving(false);
    }
  };

  const openDetail = async (tech) => {
    setDetailTarget(tech);
    setSelectedTeknisi('');
    setIsLoadingMembers(true);
    try {
      const [membersRes, teknisiRes] = await Promise.allSettled([
        api.get(`/padal-shifts/${tech.id}/members`),
        api.get('/users', { params: { role: 'Teknisi', perPage: 100 } }),
      ]);

      const nextMembers = membersRes.status === 'fulfilled'
        ? (membersRes.value.data?.data?.members || [])
        : [];
      if (membersRes.status === 'rejected') toast.error('Gagal memuat data anggota');

      setMembers(nextMembers);
      setUsers((prev) => syncPadalMemberCount(prev, tech.id, nextMembers));

      if (teknisiRes.status === 'fulfilled') {
        setTeknisiList(extractUsers(teknisiRes.value.data).filter((item) => item.role === ROLES.TEKNISI));
      } else {
        setTeknisiList([]);
        toast.error('Gagal memuat daftar teknisi');
      }
    } catch {
      toast.error('Gagal memuat data anggota');
    } finally {
      setIsLoadingMembers(false);
    }
  };

  const handleAddMember = async () => {
    if (!selectedTeknisi) return;
    setIsAddingMember(true);
    try {
      await api.post(`/padal-shifts/${detailTarget.id}/members`, { teknisi_id: selectedTeknisi });
      toast.success('Anggota berhasil ditambahkan');
      setSelectedTeknisi('');
      const res = await api.get(`/padal-shifts/${detailTarget.id}/members`);
      const nextMembers = res.data?.data?.members || [];
      setMembers(nextMembers);
      setUsers((prev) => syncPadalMemberCount(prev, detailTarget.id, nextMembers));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menambahkan anggota');
    } finally {
      setIsAddingMember(false);
    }
  };

  const handleRemoveMember = async (teknisiId, teknisiName) => {
    try {
      await api.delete(`/padal-shifts/${detailTarget.id}/members/${teknisiId}`);
      toast.success(`${teknisiName} dihapus dari Padal`);
      setMembers((prev) => {
        const nextMembers = prev.filter((m) => m.id !== teknisiId);
        setUsers((usersPrev) => syncPadalMemberCount(usersPrev, detailTarget.id, nextMembers));
        return nextMembers;
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menghapus anggota');
    }
  };

  const handlePermanentDelete = async (tech) => {
    try {
      await api.delete(`/users/${tech.id}`);
      toast.success(t('manageTechs.deleteSuccess', 'Technician account deleted permanently'));
      fetchUsers();
    } catch (err) {
      toast.error(t('manageTechs.deleteFailed', 'Failed to delete technician account'));
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <SectionHeader
            title={activeTab === 'Padal' ? t('admin.manage_techs', 'Kelola Padal') : 'Kelola Teknisi'}
            subtitle={
              activeTab === 'Padal'
                ? t('admin.total_techs', { count: users.length, defaultValue: `Total: ${users.length} padal` })
                : `Total: ${users.length} teknisi`
            }
          />
        </div>
        {activeTab === 'Padal' && (
          <Button onClick={() => setModalState({ isOpen: true, tech: null })} className="gap-2 shrink-0">
            <PlusCircle className="h-4 w-4" /> {t('manageTechs.addPadal', 'Tambah Padal')}
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="Padal">Padal</TabsTrigger>
          <TabsTrigger value="Teknisi">Teknisi</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="overflow-x-auto rounded-lg border border-border">
        <Table className="min-w-full">
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead className="px-6">{t('manageTechs.nameInfo', 'Name & Info')}</TableHead>
              <TableHead>{t('manageTechs.contact', 'Contact')}</TableHead>
              <TableHead>{t('common.status', 'Status')}</TableHead>
              {activeTab === 'Padal' ? (
                <>
                  <TableHead>Status Shift</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Tiket Selesai</TableHead>
                  <TableHead>Jumlah Anggota</TableHead>
                </>
              ) : (
                <TableHead>Role</TableHead>
              )}
              <TableHead className="text-right px-6">{t('common.actions', 'Actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell className="px-6"><Skeleton className="h-10 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-10" /></TableCell>
                  <TableCell className="text-right px-6"><Skeleton className="h-8 w-8 ml-auto rounded-md" /></TableCell>
                </TableRow>
              ))
            ) : users.length > 0 ? (
              users.map((tech) => (
                <TableRow key={tech.id} className="hover:bg-muted/30">
                  <TableCell className="px-6 py-3">
                    <div className="font-medium text-foreground">{tech.name}</div>
                    <div className="text-sm text-muted-foreground">{tech.email}</div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {tech.phone || '-'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={tech.is_active ? 'bg-green-500/10 text-green-600' : 'bg-muted text-muted-foreground'}>
                      {tech.is_active ? t('manageTechs.active', 'Active') : t('manageTechs.offDuty', 'Off Duty')}
                    </Badge>
                  </TableCell>
                  {activeTab === 'Padal' ? (
                    <>
                      <TableCell>
                        {tech.is_shift_active ? (
                          <Badge className="bg-blue-100 text-blue-700 border-blue-300 gap-1 text-xs">
                            <Calendar className="h-3 w-3" />
                            Sedang Shift
                          </Badge>
                        ) : tech.shift_start ? (
                          <Badge variant="outline" className="text-muted-foreground text-xs">
                            Tidak Aktif
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">Belum diatur</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {tech.avg_rating ? (
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                            <span className="font-medium">{tech.avg_rating}</span>
                            <span className="text-xs text-muted-foreground">({tech.total_ratings || 0})</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">Belum ada</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span>{tech.total_tickets_selesai || 0}</span>
                      </TableCell>
                      <TableCell className="text-sm">
                        <span className="inline-flex items-center gap-1 text-muted-foreground">
                          <Users className="h-3.5 w-3.5" />
                          {tech.member_count ?? 0}
                        </span>
                      </TableCell>
                    </>
                  ) : (
                    <TableCell>
                      <Badge variant="outline">{tech.role || 'Teknisi'}</Badge>
                    </TableCell>
                  )}
                  <TableCell className="text-right px-6">
                    {activeTab === 'Padal' ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">{t('common.openMenu', 'Open menu')}</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openDetail(tech)}>
                            <Users className="mr-2 h-4 w-4" />
                            Detail Anggota
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => setModalState({ isOpen: true, tech })}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => setActionTarget({ type: 'delete', tech })}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Hapus Permanen
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={activeTab === 'Padal' ? 8 : 5} className="h-56">
                  <Empty
                    className="border-0 shadow-none"
                    variant={EMPTY_STATE_VARIANTS.NO_RESULTS}
                    title={t('manageTechs.emptyTitle', 'No technician data')}
                    description={t('manageTechs.emptyDesc', 'No registered technicians to display yet.')}
                  />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {activeTab === 'Padal' && (
        <AddEditTechnicianModal 
          isOpen={modalState.isOpen} 
          onClose={() => setModalState({ isOpen: false, tech: null })} 
          technician={modalState.tech} 
          onSave={handleSave}
          isLoading={isSaving}
          candidateUsers={candidateUsers}
        />
      )}

      {/* Detail Anggota Dialog */}
      <Dialog open={activeTab === 'Padal' && !!detailTarget} onOpenChange={(open) => !open && setDetailTarget(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Anggota Padal — {detailTarget?.name}
            </DialogTitle>
            <DialogDescription>
              Kelola anggota Teknisi yang tergabung dalam Padal ini.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex gap-2">
              <Select value={selectedTeknisi} onValueChange={setSelectedTeknisi} disabled={isLoadingMembers}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Pilih Teknisi..." />
                </SelectTrigger>
                <SelectContent>
                  {teknisiList
                    .filter((t) => !members.some((m) => m.id === t.id))
                    .map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Button onClick={handleAddMember} disabled={!selectedTeknisi || isAddingMember} className="gap-1">
                {isAddingMember ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                Tambah
              </Button>
            </div>
            <div className="border rounded-lg overflow-hidden">
              {isLoadingMembers ? (
                <div className="p-4 space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
                </div>
              ) : members.length === 0 ? (
                <div className="text-center text-muted-foreground py-8 text-sm">
                  Belum ada anggota. Tambahkan Teknisi di atas.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell className="font-medium text-sm">{m.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{m.email}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleRemoveMember(m.id, m.name)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailTarget(null)}>Tutup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={activeTab === 'Padal' && !!actionTarget.type}
        onOpenChange={(open) => {
          if (!open) setActionTarget({ type: null, tech: null });
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Akun Padal</AlertDialogTitle>
            <AlertDialogDescription>
              PERINGATAN: Yakin ingin menghapus permanen akun &quot;{actionTarget.tech?.name || '-'}&quot;? Semua data terkait akan ikut terhapus.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setActionTarget({ type: null, tech: null })}>Batal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (actionTarget.tech) handlePermanentDelete(actionTarget.tech);
                setActionTarget({ type: null, tech: null });
              }}
            >
              Ya, Hapus Permanen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
