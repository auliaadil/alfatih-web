import React, { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export const AuthGuard: React.FC = () => {
  const { user, profile, loading } = useAuth();

  useEffect(() => {
    if (!loading && user && !profile) {
      supabase.auth.signOut();
    }
  }, [loading, user, profile]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/admin/login" replace />;
  if (!profile) return <Navigate to="/admin/login?error=unauthorized" replace />;

  return <Outlet />;
};
