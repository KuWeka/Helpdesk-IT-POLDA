
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '@/lib/api.js';
import { Card, CardContent } from '@/components/ui/card.jsx';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Skeleton } from '@/components/ui/skeleton.jsx';
import { Empty, EMPTY_STATE_VARIANTS } from '@/components/ui/empty.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';
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
import { PlusCircle, Edit, Trash2, Users, RotateCcw, MoreHorizontal } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import UserEditModal from '@/components/modals/UserEditModal.jsx';
import { ROLES } from '@/lib/constants.js';
import SectionHeader from '@/components/common/SectionHeader.jsx';

const extractItems = (payload) => {
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload)) return payload;
  return [];
};

const safeFormatDate = (value, pattern = 'dd MMM yyyy') => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return format(date, pattern);
};

export default function ManageUsersPage() {
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalState, setModalState] = useState({ isOpen: false, user: null });
  const [isSaving, setIsSaving] = useState(false);
  const [roleFilter, setRoleFilter] = useState('Semua');
  const [actionTarget, setActionTarget] = useState({ type: null, user: null });

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const { data } = await api.get('/users', {
        params: {
          sort: 'created_at',
          order: 'desc'
        }
      });
      const records = extractItems(data);
      setUsers(records);
      applyFilter(records, roleFilter);
    } catch (err) {
      console.error('Error fetching users:', err);
      toast.error(t('manageUsers.loadFailed', 'Failed to load user data'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const applyFilter = (data, filterVal) => {
    if (filterVal === 'Semua') {
      setFilteredUsers(data);
    } else {
      setFilteredUsers(data.filter(u => u.role === filterVal));
    }
  };

  useEffect(() => {
    applyFilter(users, roleFilter);
  }, [roleFilter, users]);

  const handleSave = async (data) => {
    setIsSaving(true);
    try {
      if (modalState.user) {
        await api.patch(`/users/${modalState.user.id}`, data);
        toast.success(t('manageUsers.updateSuccess', 'User updated successfully'));
      } else {
        await api.post('/users', {
          ...data, emailVisibility: true, verified: true
        });
        toast.success(t('manageUsers.addSuccess', 'User added successfully'));
      }
      setModalState({ isOpen: false, user: null });
      fetchUsers();
    } catch (error) {
      console.error('Save user error:', error);
      toast.error(error.response?.data?.message || t('manageUsers.saveFailed', 'Failed to save data'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/users/${id}`);
      toast.success(t('manageUsers.deleteSuccess', 'User deleted successfully'));
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error(error.response?.message || t('manageUsers.deleteFailed', 'Failed to delete user'));
    }
  };

  const handleResetRole = async (user) => {
    try {
      await api.patch(`/users/${user.id}`, { role: ROLES.USER });
      toast.success(`Role ${user.name} berhasil direset menjadi User`);
      fetchUsers();
    } catch (error) {
      console.error('Error resetting role:', error);
      toast.error(error.response?.data?.message || 'Gagal mereset role pengguna.');
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case ROLES.ADMIN:
        return <Badge variant="destructive" className="bg-red-100 text-red-700 hover:bg-red-100 border-red-200">{t('roles.admin', 'Admin')}</Badge>;
      case ROLES.TECHNICIAN:
        return <Badge variant="default" className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200">{t('roles.technician', 'Teknisi')}</Badge>;
      default:
        return <Badge variant="secondary" className="bg-gray-100 text-gray-700 hover:bg-gray-100 border-gray-200">{t('roles.user', 'User')}</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <SectionHeader
            title={t('admin.manage_users', 'Kelola Pengguna')}
            subtitle={t('admin.total_users', { count: filteredUsers.length, defaultValue: `Total: ${filteredUsers.length} pengguna` })}
          />
        </div>
        <div className="flex items-center gap-3">
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[180px] bg-background">
              <SelectValue placeholder={t('manageUsers.roleFilter', 'Role Filter')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Semua">{t('manageUsers.allRoles', 'All Roles')}</SelectItem>
              <SelectItem value="Admin">Admin</SelectItem>
              <SelectItem value="Teknisi">Teknisi</SelectItem>
              <SelectItem value="User">User</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => setModalState({ isOpen: true, user: null })} className="gap-2 shrink-0">
            <PlusCircle className="h-4 w-4" /> {t('manageUsers.addUser', 'Add User')}
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
            <Table className="min-w-full">
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="px-6">{t('manageUsers.nameEmail', 'Name & Email')}</TableHead>
                  <TableHead>{t('manageUsers.phone', 'Phone')}</TableHead>
                  <TableHead>{t('common.division', 'Division')}</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>{t('common.status', 'Status')}</TableHead>
                  <TableHead>{t('manageUsers.registerDate', 'Register Date')}</TableHead>
                  <TableHead className="text-right px-6">{t('common.actions', 'Actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array(5).fill(0).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell className="px-6"><Skeleton className="h-10 w-48" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                      <TableCell className="text-right px-6"><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredUsers.length > 0 ? (
                  filteredUsers.map((u) => (
                    <TableRow key={u.id} className="hover:bg-muted/30">
                      <TableCell className="px-6 py-3">
                        <div className="font-medium text-foreground">{u.name}</div>
                        <div className="text-sm text-muted-foreground">{u.email}</div>
                      </TableCell>
                      <TableCell className="text-sm">{u.phone || '-'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {u.division_name || '-'}
                      </TableCell>
                      <TableCell>{getRoleBadge(u.role)}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={u.is_active ? 'bg-green-500/10 text-green-600' : 'bg-muted text-muted-foreground'}>
                          {u.is_active ? t('manageUsers.active', 'Active') : t('manageUsers.inactive', 'Inactive')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{safeFormatDate(u.created_at || u.created)}</TableCell>
                      <TableCell className="text-right px-6">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">{t('common.openMenu', 'Open menu')}</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setModalState({ isOpen: true, user: u })}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            {u.role === ROLES.TECHNICIAN && (
                              <DropdownMenuItem onClick={() => setActionTarget({ type: 'reset', user: u })}>
                                <RotateCcw className="mr-2 h-4 w-4" />
                                Reset ke User
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setActionTarget({ type: 'delete', user: u })}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Hapus
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-48 text-center">
                      <Empty
                        variant={EMPTY_STATE_VARIANTS.NO_RESULTS}
                        title={t('manageUsers.emptyTitle', 'No users')}
                        description="Belum ada pengguna yang sesuai dengan filter saat ini."
                      />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

      <UserEditModal 
        isOpen={modalState.isOpen} 
        onClose={() => setModalState({ isOpen: false, user: null })} 
        user={modalState.user} 
        onSave={handleSave}
        isLoading={isSaving}
      />

      <AlertDialog
        open={!!actionTarget.type}
        onOpenChange={(open) => {
          if (!open) setActionTarget({ type: null, user: null });
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionTarget.type === 'reset' ? 'Reset Role Pengguna' : 'Hapus Pengguna'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionTarget.type === 'reset'
                ? `Kembalikan role ${actionTarget.user?.name || '-'} menjadi User biasa?`
                : 'Yakin ingin menghapus pengguna ini? Tindakan ini tidak dapat dibatalkan.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setActionTarget({ type: null, user: null })}>Batal</AlertDialogCancel>
            <AlertDialogAction
              className={actionTarget.type === 'delete' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
              onClick={() => {
                if (actionTarget.type === 'reset' && actionTarget.user) {
                  handleResetRole(actionTarget.user);
                }
                if (actionTarget.type === 'delete' && actionTarget.user) {
                  handleDelete(actionTarget.user.id);
                }
                setActionTarget({ type: null, user: null });
              }}
            >
              {actionTarget.type === 'reset' ? 'Ya, Reset Role' : 'Ya, Hapus'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
