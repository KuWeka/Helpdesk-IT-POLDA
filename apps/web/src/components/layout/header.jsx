import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Moon, Sun, Globe, LogOut, Bell } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useLocation } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import api from '@/lib/api';

const toNumber = (value) => Number(value || 0);

const buildNotificationsFromSummary = (summary = {}, role = 'User') => {
  const roleLabel = role === 'Subtekinfo' ? 'Subtekinfo' : role === 'Padal' ? 'Padal' : role === 'Teknisi' ? 'Teknisi' : 'Satker';
  const pending = toNumber(summary.pending);
  const proses = toNumber(summary.proses);
  const urgent = toNumber(summary.urgent_count);
  const aging = toNumber(summary.aging_count);

  return [
    {
      id: 'pending',
      title: 'Tiket Pending',
      detail: `${pending} tiket menunggu tindak lanjut (${roleLabel}).`,
    },
    {
      id: 'proses',
      title: 'Tiket Dalam Proses',
      detail: `${proses} tiket sedang ditangani.`,
    },
    {
      id: 'urgent',
      title: 'Prioritas Tinggi',
      detail: `${urgent} tiket prioritas tinggi perlu perhatian.`,
    },
    {
      id: 'aging',
      title: 'Aging > 3 Hari',
      detail: `${aging} tiket sudah lebih dari 3 hari belum selesai.`,
    },
  ];
};

export function Header() {
  const { currentUser, setCurrentUser, logout } = useAuth();
  const { i18n, t } = useTranslation();
  const { pathname } = useLocation();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('app_theme');
    const userTheme = currentUser?.theme;
    const initialTheme = saved || userTheme || 'dark';
    document.documentElement.classList.toggle('dark', initialTheme === 'dark');
    if (!saved && !userTheme) {
      localStorage.setItem('app_theme', initialTheme);
    }
    return initialTheme;
  });

  useEffect(() => {
    if (!currentUser) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    const fetchNotifications = async () => {
      try {
        const { data } = await api.get('/tickets/summary');
        const summary = data?.data?.summary || data?.summary || {};
        const items = buildNotificationsFromSummary(summary, currentUser.role).map((item) => ({
          ...item,
          title: t(`header.notifications.${item.id}.title`, item.title),
          detail: t(`header.notifications.${item.id}.detail`, { detail: item.detail, defaultValue: item.detail }),
        }));
        setNotifications(items);

        const totalUnread = toNumber(summary.pending) + toNumber(summary.urgent_count);
        setUnreadCount(totalUnread);
      } catch {
        setNotifications([]);
        setUnreadCount(0);
      }
    };

    fetchNotifications();
    const intervalId = setInterval(fetchNotifications, 60000);
    return () => clearInterval(intervalId);
  }, [currentUser, pathname, t]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
    localStorage.setItem('app_theme', newTheme);

    if (currentUser) {
      const updatedUser = { ...currentUser, theme: newTheme };
      setCurrentUser(updatedUser);
    }
  };

  const changeLanguage = (lang) => {
    const lowerLang = lang.toLowerCase();
    i18n.changeLanguage(lowerLang);
    localStorage.setItem('app_language', lang);
  };

  const breadcrumb = useMemo(() => {
    const segments = pathname.split('/').filter(Boolean);
    const role = segments[0];
    const page = segments[1] || 'dashboard';

    const roleLabel =
      role === 'subtekinfo'
        ? t('roles.subtekinfo', 'Subtekinfo')
        : role === 'padal'
          ? t('roles.padal', 'Padal')
          : role === 'teknisi'
            ? t('roles.technician', 'Teknisi')
            : t('roles.satker', 'Satker');

    const mapByRole = {
      satker: {
        dashboard: t('nav.item.Dashboard', 'Dashboard'),
        'create-ticket': t('nav.item.Buat Permohonan', 'Buat Permohonan'),
        tickets: t('nav.item.Tiket Saya', 'Tiket Saya'),
        reports: t('nav.item.Laporan Bulanan', 'Laporan Bulanan'),
        settings: t('nav.item.Pengaturan', 'Pengaturan'),
      },
      padal: {
        dashboard: t('nav.item.Dashboard', 'Dashboard'),
        queue: t('nav.item.Antrian Tiket', 'Antrian Tiket'),
        tickets: t('nav.item.Tiket Saya', 'Tiket Saya'),
        reports: t('nav.item.Laporan Bulanan', 'Laporan Bulanan'),
      },
      teknisi: {
        tickets: t('nav.item.Semua Tiket', 'Semua Tiket'),
        reports: t('nav.item.Laporan Bulanan', 'Laporan Bulanan'),
      },
      subtekinfo: {
        dashboard: t('nav.item.Dashboard', 'Dashboard'),
        tickets: t('nav.item.Semua Tiket', 'Semua Tiket'),
        'ticket-history': t('nav.item.Riwayat Tiket', 'Riwayat Tiket'),
        users: t('nav.item.Kelola Akun', 'Kelola Akun'),
        technicians: t('nav.item.Kelola Padal', 'Kelola Padal'),
        'padal-shifts': t('nav.item.Shift Padal', 'Shift Padal'),
        'activity-logs': t('nav.item.Log Aktivitas', 'Log Aktivitas'),
        reports: t('nav.item.Laporan Bulanan', 'Laporan Bulanan'),
        settings: t('nav.item.Pengaturan Sistem', 'Pengaturan Sistem'),
      },
    };

    const pageLabel = mapByRole[role]?.[page];
    return {
      role: roleLabel,
      page: pageLabel || page.replaceAll('-', ' '),
    };
  }, [pathname, t]);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="h-6" />

      <nav
        aria-label="Breadcrumb"
        className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground"
      >
        <span className="font-medium text-foreground">{breadcrumb.role}</span>
        <span aria-hidden="true">/</span>
        <span className="truncate">{breadcrumb.page}</span>
      </nav>

      <div className="flex-1" />
      
      <div className="flex items-center gap-2">
        {currentUser && (
          <div className="hidden sm:flex items-center gap-2 mr-2">
            <div className="flex flex-col items-end">
              <span className="text-sm font-medium">{currentUser.name || 'User'}</span>
              <span className="text-xs text-muted-foreground">
                {currentUser.role === 'Subtekinfo'
                  ? t('roles.subtekinfo', 'Subtekinfo')
                  : currentUser.role === 'Padal'
                    ? t('roles.padal', 'Padal')
                    : currentUser.role === 'Teknisi'
                      ? t('roles.technician', 'Teknisi')
                      : t('roles.satker', 'Satker')}
              </span>
            </div>
            <Avatar className="size-8">
              <AvatarImage src={currentUser.avatar} alt={currentUser.name || 'User'} />
              <AvatarFallback>
                {(currentUser.name || 'U').charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
        )}

        {currentUser && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 relative" aria-label="Notifikasi">
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 min-w-5 px-1 text-[10px] leading-none">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>{t('header.notifications.label', 'Notifikasi')}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {notifications.length > 0 ? (
                notifications.map((item) => (
                  <DropdownMenuItem key={item.id} className="cursor-default flex-col items-start gap-1 py-2">
                    <span className="text-sm font-medium text-foreground">{item.title}</span>
                    <span className="text-xs text-muted-foreground">{item.detail}</span>
                  </DropdownMenuItem>
                ))
              ) : (
                <DropdownMenuItem className="cursor-default text-sm text-muted-foreground">
                  {t('header.notifications.empty', 'Tidak ada notifikasi saat ini')}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Globe className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => changeLanguage('ID')}>
              Indonesia (ID)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => changeLanguage('EN')}>
              English (EN)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-8 w-8">
          {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </Button>

        {currentUser && (
          <Button
            variant="ghost"
            size="icon"
            onClick={logout}
            title="Logout"
            className="h-8 w-8"
          >
            <LogOut className="h-4 w-4 text-destructive" />
          </Button>
        )}
      </div>
    </header>
  );
}
