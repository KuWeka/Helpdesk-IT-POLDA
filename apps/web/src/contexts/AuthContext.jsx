
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api.js';
import socket from '@/lib/socket.js';
import { toast } from 'sonner';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

const normalizeRole = (role) => {
  if (!role) return 'Satker';
  if (role === 'Admin' || role === 'admin') return 'Subtekinfo';
  if (role === 'User' || role === 'user') return 'Satker';
  return role;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => {
    const savedUser = localStorage.getItem('helpdesk_user');
    if (!savedUser) return null;
    try {
      return JSON.parse(savedUser);
    } catch (_) {
      localStorage.removeItem('helpdesk_user');
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    const fallbackTimer = setTimeout(() => {
      if (mounted) {
        setIsLoading(false);
      }
    }, 7000);

    const checkAuth = async () => {
      try {
        const res = await api.get('/auth/me', { timeout: 6000 });
        let user = res.data?.data?.user || null;
        let csrfToken = res.data?.data?.csrfToken;

        // If the role stored in the JWT (cached in localStorage) differs from the
        // fresh DB value, force a token refresh so the new JWT carries the correct role.
        const storedUser = (() => {
          try { return JSON.parse(localStorage.getItem('helpdesk_user') || 'null'); } catch { return null; }
        })();
        if (user && storedUser && storedUser.role !== user.role) {
          try {
            const refreshRes = await api.post('/auth/refresh', {});
            const newCsrf = refreshRes.data?.data?.csrfToken;
            if (newCsrf) {
              csrfToken = newCsrf;
              localStorage.setItem('helpdesk_csrf_token', newCsrf);
            }
          } catch (_) {
            // refresh failed — proceed with current token, next request will handle it
          }
        }

        if (!mounted) return;
        const normalizedUser = user ? { ...user, role: normalizeRole(user.role) } : null;
        setCurrentUser(normalizedUser);

        if (normalizedUser) {
          localStorage.setItem('helpdesk_user', JSON.stringify(normalizedUser));
          if (csrfToken) {
            localStorage.setItem('helpdesk_csrf_token', csrfToken);
          }
          // Connect socket dan join room sesuai role
          if (!socket.connected) socket.connect();
          socket.emit('join_user_room', normalizedUser.id);
          if (normalizedUser.role === 'Subtekinfo') socket.emit('join_subtekinfo_room');
        } else {
          localStorage.removeItem('helpdesk_user');
          localStorage.removeItem('helpdesk_csrf_token');
        }
      } catch (err) {
        localStorage.removeItem('helpdesk_user');
        localStorage.removeItem('helpdesk_csrf_token');
        if (mounted) {
          setCurrentUser(null);
        }
      } finally {
        if (mounted) {
          clearTimeout(fallbackTimer);
          setIsLoading(false);
        }
      }
    };

    checkAuth();

    return () => {
      mounted = false;
      clearTimeout(fallbackTimer);
    };
  }, []);

  const login = async (identifier, password) => {
    try {
      const res = await api.post('/auth/login', { identifier, password });
      const user = res.data?.data?.user;
      const csrfToken = res.data?.data?.csrfToken;

      if (!user) {
        throw new Error('Data user tidak ditemukan');
      }

      const normalizedUser = { ...user, role: normalizeRole(user.role) };

      localStorage.setItem('helpdesk_user', JSON.stringify(normalizedUser));
      if (csrfToken) {
        localStorage.setItem('helpdesk_csrf_token', csrfToken);
      }
      
      setCurrentUser(normalizedUser);
      
      const role = normalizedUser.role || 'Satker';
      // Connect socket dan join room sesuai role
      if (!socket.connected) socket.connect();
      socket.emit('join_user_room', normalizedUser.id);
      if (role === 'Subtekinfo') socket.emit('join_subtekinfo_room');

      if (role === 'Subtekinfo') navigate('/subtekinfo/dashboard');
      else if (role === 'Padal') navigate('/padal/dashboard');
      else if (role === 'Teknisi') navigate('/teknisi/dashboard');
      else navigate('/satker/dashboard');
      
      return normalizedUser;
    } catch (error) {
      console.error('Login error:', error);
      throw new Error(error.response?.data?.message || 'Email/Username atau password salah');
    }
  };

  const signup = async (data) => {
    try {
      const res = await api.post('/auth/register', data);
      
      toast.success('Pendaftaran berhasil! Silakan login.');
      navigate('/login');
      return res.data?.data?.user;
    } catch (error) {
      console.error('Signup error:', error);
      const apiMessage = error.response?.data?.message;
      const validationDetails = error.response?.data?.errors;

      const detailsMessage = Array.isArray(validationDetails) && validationDetails.length > 0
        ? validationDetails.map((item) => item.message).join(' | ')
        : null;

      const finalMessage = detailsMessage || apiMessage || error.message || 'Pendaftaran gagal.';

      toast.error(`Pendaftaran gagal. ${finalMessage}`);
      throw new Error(finalMessage);
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (_) {
      // Logout should still clear local state even if API call fails.
    }

    socket.disconnect();
    localStorage.removeItem('helpdesk_user');
    localStorage.removeItem('helpdesk_csrf_token');
    setCurrentUser(null);
    navigate('/login');
    toast.info('Anda telah logout');
  };

  const value = {
    currentUser,
    setCurrentUser, // added to allow persistence changes like language/theme to update React tree
    login,
    signup,
    logout,
    isLoading
  };

  return (
    <AuthContext.Provider value={value}>
      {isLoading ? (
        <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
          <div className="text-sm text-muted-foreground">Memuat sesi...</div>
        </div>
      ) : children}
    </AuthContext.Provider>
  );
};
