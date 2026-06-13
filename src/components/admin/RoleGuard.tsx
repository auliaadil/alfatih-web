import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth, UserRole } from '../../contexts/AuthContext';

interface RoleGuardProps {
  roles: UserRole[];
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ roles }) => {
  const { profile } = useAuth();
  if (!profile || !roles.includes(profile.role)) {
    return <Navigate to="/admin" replace />;
  }
  return <Outlet />;
};
