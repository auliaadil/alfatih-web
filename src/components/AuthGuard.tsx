import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const ALLOWED_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS as string | undefined ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

type AuthState = 'loading' | 'allowed' | 'denied' | 'unauthorized';

export const AuthGuard: React.FC = () => {
    const [authState, setAuthState] = useState<AuthState>('loading');

    const resolveSession = async (session: { user: { email?: string } } | null) => {
        if (!session) { setAuthState('denied'); return; }
        const email = session.user.email?.toLowerCase() ?? '';
        if (ALLOWED_EMAILS.length > 0 && !ALLOWED_EMAILS.includes(email)) {
            await supabase.auth.signOut();
            setAuthState('unauthorized');
            return;
        }
        setAuthState('allowed');
    };

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => resolveSession(session));

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            resolveSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    if (authState === 'loading') {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    if (authState === 'unauthorized') {
        return <Navigate to="/admin/login?error=unauthorized" replace />;
    }

    if (authState === 'denied') {
        return <Navigate to="/admin/login" replace />;
    }

    return <Outlet />;
};
