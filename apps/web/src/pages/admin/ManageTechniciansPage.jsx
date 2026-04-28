
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '@/lib/api.js';
import { Card, CardContent } from '@/components/ui/card.jsx';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Skeleton } from '@/components/ui/skeleton.jsx';
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
import { PlusCircle, Edit, Trash2, ArrowDown, MoreHorizontal, Inbox } from 'lucide-react';
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

export default function ManageTechniciansPage() {
  const { t } = useTranslation();
  const [technicians, setTechnicians] = useState([]);
  const [candidateUsers, setCandidateUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalState, setModalState] = useState({ isOpen: false, tech: null });
  const [isSaving, setIsSaving] = useState(false);
  const [actionTarget, setActionTarget] = useState({ type: null, tech: null });

  const fetchTechnicians = async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get('/technicians');
      setTechnicians(extractTechnicians(data));
    } catch (err) {
      toast.error(t('manageTechs.loadFailed', 'Failed to load technicians'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchTechnicians(); }, []);

  const fetchCandidateUsers = async () => {
    try {
      const { data } = await api.get('/users', {
        params: {
          role: ROLES.USER,
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
          name: data.name, email: data.email, phone: data.phone, is_active: data.is_active, role: ROLES.TECHNICIAN
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
      fetchTechnicians();
    } catch (error) {
      toast.error(error.response?.message || t('manageTechs.saveFailed', 'Failed to save technician'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDowngrade = async (tech) => {
    try {
      await api.patch(`/technicians/${tech.id}/downgrade`);
      
      toast.success(t('manageTechs.downgradeSuccess', 'Technician role downgraded to user'));
      fetchTechnicians();
    } catch (err) {
      toast.error(t('manageTechs.downgradeFailed', 'Failed to downgrade technician role'));
    }
  };

  const handlePermanentDelete = async (tech) => {
    try {
      await api.delete(`/users/${tech.id}`);
      toast.success(t('manageTechs.deleteSuccess', 'Technician account deleted permanently'));
      fetchTechnicians();
    } catch (err) {
      toast.error(t('manageTechs.deleteFailed', 'Failed to delete technician account'));
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <SectionHeader
            title={t('admin.manage_techs', 'Kelola Teknisi')}
            subtitle={t('admin.total_techs', { count: technicians.length, defaultValue: `Total: ${technicians.length} teknisi` })}
          />
        </div>
        <Button onClick={() => setModalState({ isOpen: true, tech: null })} className="gap-2 shrink-0">
          <PlusCircle className="h-4 w-4" /> {t('manageTechs.addTechnician', 'Add Technician')}
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
            <Table className="min-w-full">
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="px-6">{t('manageTechs.nameInfo', 'Name & Info')}</TableHead>
                  <TableHead>{t('common.division', 'Division')}</TableHead>
                  <TableHead>{t('manageTechs.contact', 'Contact')}</TableHead>
                  <TableHead>{t('common.status', 'Status')}</TableHead>
                  <TableHead className="text-right px-6">{t('common.actions', 'Actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell className="px-6"><Skeleton className="h-10 w-48" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                      <TableCell className="text-right px-6"><Skeleton className="h-8 w-8 ml-auto rounded-md" /></TableCell>
                    </TableRow>
                  ))
                ) : technicians.length > 0 ? (
                  technicians.map((tech) => (
                    <TableRow key={tech.id} className="hover:bg-muted/30">
                      <TableCell className="px-6 py-3">
                        <div className="font-medium text-foreground">{tech.name}</div>
                        <div className="text-sm text-muted-foreground">{tech.email}</div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {tech.division_name || '-'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {tech.phone || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={tech.is_active ? 'bg-green-500/10 text-green-600' : 'bg-muted text-muted-foreground'}>
                          {tech.is_active ? t('manageTechs.active', 'Active') : t('manageTechs.offDuty', 'Off Duty')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right px-6">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">{t('common.openMenu', 'Open menu')}</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setModalState({ isOpen: true, tech })}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setActionTarget({ type: 'downgrade', tech })}>
                              <ArrowDown className="mr-2 h-4 w-4" />
                              Turunkan ke User
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
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-56">
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

      <AddEditTechnicianModal 
        isOpen={modalState.isOpen} 
        onClose={() => setModalState({ isOpen: false, tech: null })} 
        technician={modalState.tech} 
        onSave={handleSave}
        isLoading={isSaving}
        candidateUsers={candidateUsers}
      />

      <AlertDialog
        open={!!actionTarget.type}
        onOpenChange={(open) => {
          if (!open) setActionTarget({ type: null, tech: null });
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionTarget.type === 'downgrade' ? 'Turunkan Role Teknisi' : 'Hapus Akun Teknisi'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionTarget.type === 'downgrade'
                ? `Yakin ingin mengubah role "${actionTarget.tech?.name || '-'}" menjadi User biasa? Akun tidak akan dihapus.`
                : `PERINGATAN: Yakin ingin menghapus permanen akun "${actionTarget.tech?.name || '-'}"? Semua data teknisi terkait akan ikut terhapus.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setActionTarget({ type: null, tech: null })}>Batal</AlertDialogCancel>
            <AlertDialogAction
              className={actionTarget.type === 'delete' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
              onClick={() => {
                if (actionTarget.type === 'downgrade' && actionTarget.tech) {
                  handleDowngrade(actionTarget.tech);
                }
                if (actionTarget.type === 'delete' && actionTarget.tech) {
                  handlePermanentDelete(actionTarget.tech);
                }
                setActionTarget({ type: null, tech: null });
              }}
            >
              {actionTarget.type === 'downgrade' ? 'Ya, Turunkan Role' : 'Ya, Hapus Permanen'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
