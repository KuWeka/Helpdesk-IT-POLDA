
import React, { useEffect, useState } from 'react';
import { Route, Routes, BrowserRouter as Router, Navigate } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n/config.js';
import ScrollToTop from '@/components/common/ScrollToTop.jsx';
import { AuthProvider, useAuth } from '@/contexts/AuthContext.jsx';
import ProtectedRoute from '@/components/common/ProtectedRoute.jsx';
import { MainLayout } from '@/components/layout';

import LoginPage from '@/pages/LoginPage.jsx';
import SignupPage from '@/pages/SignupPage.jsx';

// Satker Pages
import UserDashboard from '@/pages/UserDashboard.jsx';
import CreateTicketPage from '@/pages/CreateTicketPage.jsx';
import UserTicketsPage from '@/pages/UserTicketsPage.jsx';
import TicketDetailPage from '@/pages/TicketDetailPage.jsx';
import EditTicketPage from '@/pages/EditTicketPage.jsx';
import UserSettingsPage from '@/pages/UserSettingsPage.jsx';
import RatingPage from '@/pages/RatingPage.jsx';
import MonthlyReportPage from '@/pages/MonthlyReportPage.jsx';
import NotificationsPage from '@/pages/NotificationsPage.jsx';

// Teknisi Pages (read-only)
import TeknisiDashboard from '@/pages/teknisi/TeknisiDashboard.jsx';
import TeknisiTicketsPage from '@/pages/teknisi/TeknisiTicketsPage.jsx';
import TeknisiTicketDetailPage from '@/pages/teknisi/TeknisiTicketDetailPage.jsx';

// Padal Pages
import TechnicianDashboard from '@/pages/technician/TechnicianDashboard.jsx';
import TechnicianQueuePage from '@/pages/technician/TechnicianQueuePage.jsx';
import TechnicianTicketsPage from '@/pages/technician/TechnicianTicketsPage.jsx';
import TechnicianTicketDetailPage from '@/pages/technician/TechnicianTicketDetailPage.jsx';
import PadalMembersPage from '@/pages/technician/PadalMembersPage.jsx';

// Subtekinfo Pages
import AdminDashboard from '@/pages/admin/AdminDashboard.jsx';
import AllTicketsPage from '@/pages/admin/AllTicketsPage.jsx';
import AdminTicketDetailPage from '@/pages/admin/AdminTicketDetailPage.jsx';
import TicketHistoryPage from '@/pages/admin/TicketHistoryPage.jsx';
import ManageUsersPage from '@/pages/admin/ManageUsersPage.jsx';
import ManageTechniciansPage from '@/pages/admin/ManageTechniciansPage.jsx';
import ManageShiftPage from '@/pages/admin/ManageShiftPage.jsx';
import ActivityLogsPage from '@/pages/admin/ActivityLogsPage.jsx';
import SystemSettingsPage from '@/pages/admin/SystemSettingsPage.jsx';

import { Toaster } from '@/components/ui/sonner.jsx';
import ErrorBoundary from '@/components/common/ErrorBoundary.jsx';


function RootRedirect() {
  const { currentUser } = useAuth();
  if (!currentUser) return <Navigate to="/login" replace />;
  const role = currentUser.role === 'Admin' ? 'Subtekinfo' : currentUser.role === 'User' ? 'Satker' : currentUser.role;
  if (role === 'Subtekinfo') return <Navigate to="/subtekinfo/dashboard" replace />;
  if (role === 'Padal') return <Navigate to="/padal/dashboard" replace />;
  if (role === 'Teknisi') return <Navigate to="/teknisi/dashboard" replace />;
  return <Navigate to="/satker/dashboard" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      {/* Satker Routes */}
      <Route path="/satker" element={
        <ProtectedRoute allowedRoles={['Satker']}>
          <MainLayout />
        </ProtectedRoute>
      }>
        <Route path="dashboard" element={<UserDashboard />} />
        <Route path="create-ticket" element={<CreateTicketPage />} />
        <Route path="rating" element={<RatingPage />} />
        <Route path="tickets" element={<UserTicketsPage />} />
        <Route path="tickets/:id" element={<TicketDetailPage />} />
        <Route path="tickets/:id/edit" element={<EditTicketPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="settings" element={<UserSettingsPage />} />
        <Route path="account-settings" element={<UserSettingsPage />} />
        <Route path="reports" element={<MonthlyReportPage />} />
      </Route>

      {/* Teknisi Routes (read-only) */}
      <Route path="/teknisi" element={
        <ProtectedRoute allowedRoles={['Teknisi']}>
          <MainLayout />
        </ProtectedRoute>
      }>
        <Route path="dashboard" element={<TeknisiDashboard />} />
        <Route path="tickets" element={<TeknisiTicketsPage />} />
        <Route path="tickets/:id" element={<TeknisiTicketDetailPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="settings" element={<UserSettingsPage />} />
        <Route path="account-settings" element={<UserSettingsPage />} />
        <Route path="reports" element={<MonthlyReportPage />} />
      </Route>

      {/* Padal Routes */}
      <Route path="/padal" element={
        <ProtectedRoute allowedRoles={['Padal']}>
          <MainLayout />
        </ProtectedRoute>
      }>
        <Route path="dashboard" element={<TechnicianDashboard />} />
        <Route path="tickets" element={<TechnicianTicketsPage />} />
        <Route path="tickets/:ticketId" element={<TechnicianTicketDetailPage />} />
        <Route path="all-tickets" element={<TeknisiTicketsPage />} />
        <Route path="all-tickets/:id" element={<TeknisiTicketDetailPage />} />
        <Route path="reports" element={<MonthlyReportPage />} />
        <Route path="members" element={<PadalMembersPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="settings" element={<UserSettingsPage />} />
        <Route path="account-settings" element={<UserSettingsPage />} />
        <Route path="queue" element={<TechnicianQueuePage />} />
      </Route>

      {/* Subtekinfo Routes */}
      <Route path="/subtekinfo" element={
        <ProtectedRoute allowedRoles={['Subtekinfo']}>
          <MainLayout />
        </ProtectedRoute>
      }>
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="tickets" element={<AllTicketsPage />} />
        <Route path="tickets/:id" element={<AdminTicketDetailPage />} />
        <Route path="padal" element={<ManageTechniciansPage />} />
        <Route path="teknisi" element={<ManageTechniciansPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="ticket-history" element={<TicketHistoryPage />} />
        <Route path="users" element={<ManageUsersPage />} />
        <Route path="technicians" element={<ManageTechniciansPage />} />
        <Route path="padal-shifts" element={<ManageShiftPage />} />
        <Route path="activity-logs" element={<ActivityLogsPage />} />
        <Route path="settings" element={<SystemSettingsPage />} />
        <Route path="account-settings" element={<UserSettingsPage />} />
        <Route path="reports" element={<MonthlyReportPage />} />
      </Route>

      {/* Legacy redirects (backward compat) */}
      <Route path="/user/*" element={<Navigate to="/satker/dashboard" replace />} />
      <Route path="/technician/*" element={<Navigate to="/padal/dashboard" replace />} />
      <Route path="/admin/*" element={<Navigate to="/subtekinfo/dashboard" replace />} />

      <Route path="*" element={
        <div className="flex h-screen items-center justify-center flex-col gap-4">
          <h1 className="text-4xl font-bold">404</h1>
          <p>Halaman tidak ditemukan</p>
          <a href="/" className="text-primary hover:underline">Kembali ke Beranda</a>
        </div>
      } />
    </Routes>
  );
}

function App() {
  const [apiStatus, setApiStatus] = useState({
    offline: false,
    reason: null,
  });

  useEffect(() => {
    const savedLang = localStorage.getItem('app_language');
    if (savedLang) {
      const lowerLang = savedLang.toLowerCase();
      if (i18n && i18n.changeLanguage) {
        i18n.changeLanguage(lowerLang);
      }
    }
  }, []);

  useEffect(() => {
    const savedTheme = localStorage.getItem('app_theme');
    const effectiveTheme = savedTheme || 'dark';
    if (!savedTheme) {
      localStorage.setItem('app_theme', effectiveTheme);
    }
    document.documentElement.classList.toggle('dark', effectiveTheme === 'dark');
  }, []);

  useEffect(() => {
    const handleApiStatus = (event) => {
      const { offline = false, reason = null } = event.detail || {};
      setApiStatus({ offline, reason });
    };

    window.addEventListener('api:status', handleApiStatus);
    return () => window.removeEventListener('api:status', handleApiStatus);
  }, []);

  return (
    <ErrorBoundary>
      <I18nextProvider i18n={i18n}>
        <Router>
          {apiStatus.offline && (
            <div className="sticky top-0 z-[60] w-full bg-destructive text-destructive-foreground px-4 py-2 text-sm text-center shadow-sm">
              Koneksi ke server bermasalah. Beberapa fitur mungkin tidak tersedia.
            </div>
          )}
          <ScrollToTop />
          <AuthProvider>
            <AppRoutes />
            <Toaster position="top-center" />
          </AuthProvider>
        </Router>
      </I18nextProvider>
    </ErrorBoundary>
  );
}

export default App;
