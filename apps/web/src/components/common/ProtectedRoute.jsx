
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext.jsx';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { currentUser } = useAuth();
  const location = useLocation();

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    // Redirect to their respective dashboard if they try to access unauthorized route
    const role = currentUser.role;
    if (role === 'Admin') return <Navigate to="/admin/dashboard" replace />;
    if (role === 'Teknisi') return <Navigate to="/technician/dashboard" replace />;
    return <Navigate to="/user/dashboard" replace />;
  }

  return children;
}
