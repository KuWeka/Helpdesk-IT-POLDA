// Sidebar configuration data for all roles
import {
  LayoutDashboard,
  Ticket,
  PlusCircle,
  ListOrdered,
  Users,
  UserCog,
  BarChart2,
  Bell,
  Settings,
} from 'lucide-react';

// Menu untuk role: SATKER
export const userSidebarData = {
  navGroups: [
    {
      title: 'Menu Utama',
      items: [
        { title: 'Dashboard', url: '/satker/dashboard', icon: LayoutDashboard },
        { title: 'Buat Permohonan', url: '/satker/create-ticket', icon: PlusCircle },
        { title: 'Permohonan Saya', url: '/satker/tickets', icon: Ticket },
        { title: 'Notifikasi', url: '/satker/notifications', icon: Bell },
        { title: 'Pengaturan Akun', url: '/satker/account-settings', icon: Settings },
      ],
    },
  ],
};

// Menu untuk role: TEKNISI (read-only)
export const teknisiSidebarData = {
  navGroups: [
    {
      title: 'Menu Teknisi',
      items: [
        { title: 'Dashboard', url: '/teknisi/dashboard', icon: LayoutDashboard },
        { title: 'Semua Permohonan', url: '/teknisi/tickets', icon: Ticket },
        { title: 'Laporan Bulanan', url: '/teknisi/reports', icon: BarChart2 },
        { title: 'Notifikasi', url: '/teknisi/notifications', icon: Bell },
        { title: 'Pengaturan Akun', url: '/teknisi/account-settings', icon: Settings },
      ],
    },
  ],
};

// Menu untuk role: PADAL
export const technicianSidebarData = {
  navGroups: [
    {
      title: 'Menu Padal',
      items: [
        { title: 'Dashboard', url: '/padal/dashboard', icon: LayoutDashboard },
        { title: 'Antrian Permohonan', url: '/padal/queue', icon: ListOrdered },
        { title: 'Tiket Saya', url: '/padal/tickets', icon: Ticket },
        { title: 'Semua Tiket', url: '/padal/all-tickets', icon: ListOrdered },
        { title: 'Laporan Bulanan', url: '/padal/reports', icon: BarChart2 },
        { title: 'Anggota Teknisi', url: '/padal/members', icon: Users },
        { title: 'Notifikasi', url: '/padal/notifications', icon: Bell },
        { title: 'Pengaturan Akun', url: '/padal/account-settings', icon: Settings },
      ],
    },
  ],
};

// Menu untuk role: SUBTEKINFO
export const adminSidebarData = {
  navGroups: [
    {
      title: 'Menu Utama',
      items: [
        { title: 'Dashboard', url: '/subtekinfo/dashboard', icon: LayoutDashboard },
        { title: 'Semua Tiket', url: '/subtekinfo/tickets', icon: Ticket },
        { title: 'Kelola Staff', url: '/subtekinfo/padal', icon: Users },
        { title: 'Laporan Bulanan', url: '/subtekinfo/reports', icon: BarChart2 },
        { title: 'Kelola Satker', url: '/subtekinfo/users', icon: UserCog },
        { title: 'Notifikasi', url: '/subtekinfo/notifications', icon: Bell },
        { title: 'Pengaturan Akun', url: '/subtekinfo/account-settings', icon: Settings },
      ],
    },
  ],
};

// Helper function to get sidebar data based on role
export function getSidebarData(role) {
  switch (role) {
    case 'Subtekinfo':
      return adminSidebarData;
    case 'Padal':
      return technicianSidebarData;
    case 'Teknisi':
      return teknisiSidebarData;
    default:
      return userSidebarData;
  }
}
