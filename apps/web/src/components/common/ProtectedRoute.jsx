
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext.jsx';

const normalizeRole = (role) => {
  if (role === 'Admin' || role === 'admin') return 'Subtekinfo';
  if (role === 'User' || role === 'user') return 'Satker';
  return role;
};

export default function ProtectedRoute({ children, allowedRoles }) {
  const { currentUser } = useAuth();
  const location = useLocation();

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const normalizedRole = normalizeRole(currentUser.role);

  if (allowedRoles && !allowedRoles.includes(normalizedRole)) {
    // Redirect to their respective dashboard if they try to access unauthorized route
    const role = normalizedRole;
    if (role === 'Subtekinfo') return <Navigate to="/subtekinfo/dashboard" replace />;
    if (role === 'Padal') return <Navigate to="/padal/dashboard" replace />;
    if (role === 'Teknisi') return <Navigate to="/teknisi/tickets" replace />;
    return <Navigate to="/satker/dashboard" replace />;
  }

  return children;
}
