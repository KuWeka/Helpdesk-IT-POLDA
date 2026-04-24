
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api.js';
import socket from '@/lib/socket.js';
import { toast } from 'sonner';

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => {
    const savedUser = localStorage.getItem('helpdesk_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await api.get('/auth/me');
        const user = res.data?.data?.user || null;
        setCurrentUser(user);

        if (user) {
          localStorage.setItem('helpdesk_user', JSON.stringify(user));
        } else {
          localStorage.removeItem('helpdesk_user');
        }
      } catch (err) {
        localStorage.removeItem('helpdesk_user');
        setCurrentUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (identifier, password) => {
    try {
      const res = await api.post('/auth/login', { identifier, password });
      const user = res.data?.data?.user;
      const csrfToken = res.data?.data?.csrfToken;

      if (!user) {
        throw new Error('Data user tidak ditemukan');
      }

      localStorage.setItem('helpdesk_user', JSON.stringify(user));
      if (csrfToken) {
        localStorage.setItem('helpdesk_csrf_token', csrfToken);
      }
      
      setCurrentUser(user);
      
      const role = user.role || 'User';
      if (role === 'Admin') navigate('/admin/dashboard');
      else if (role === 'Teknisi') navigate('/technician/dashboard');
      else navigate('/user/dashboard');
      
      return user;
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
      {!isLoading && children}
    </AuthContext.Provider>
  );
};
