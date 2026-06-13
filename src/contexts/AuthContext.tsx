import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export type UserRole = 'superadmin' | 'admin' | 'branch_admin';

export interface UserProfile {
  role: UserRole;
  display_name: string;
  email: string;
}

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  branchIds: string[];
  loading: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  branchIds: [],
  loading: true,
  refreshProfile: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser]       = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [branchIds, setBranchIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const currentUserIdRef = useRef<string | null>(null);

  const loadProfile = async (userId: string) => {
    const { data } = await supabase
      .from('user_profiles')
      .select('role, display_name, email')
      .eq('id', userId)
      .single();

    if (!data) {
      setProfile(null);
      setBranchIds([]);
      return;
    }

    setProfile({ role: data.role as UserRole, display_name: data.display_name, email: data.email });

    if (data.role === 'branch_admin') {
      const { data: ub } = await supabase
        .from('user_branches')
        .select('branch_id')
        .eq('user_id', userId);
      setBranchIds(ub?.map((r) => r.branch_id) ?? []);
    } else {
      setBranchIds([]);
    }
  };

  const refreshProfile = async () => {
    const { data: { user: u } } = await supabase.auth.getUser();
    if (u) await loadProfile(u.id);
  };

  useEffect(() => {
    let active = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const isNewUser = session?.user?.id !== currentUserIdRef.current;

      // Show spinner only on initial load or a genuine new login (different user).
      // Token refreshes (TOKEN_REFRESHED, or SIGNED_IN for the same user) run
      // silently in the background without re-triggering the loading spinner.
      if (event === 'INITIAL_SESSION' || (event === 'SIGNED_IN' && isNewUser)) {
        setLoading(true);
      }

      currentUserIdRef.current = session?.user?.id ?? null;
      setUser(session?.user ?? null);

      // CRITICAL: do NOT await Supabase calls directly inside this callback.
      // onAuthStateChange runs while GoTrue holds its internal auth lock, and the
      // SDK awaits this callback before releasing it. Any supabase.from()/getSession()
      // call here would try to re-acquire that same (non-reentrant) lock and
      // deadlock — which is exactly what froze every page on the spinner after
      // idle / token refresh. setTimeout(…, 0) defers the DB work until after the
      // callback returns and the lock is released. (Documented Supabase gotcha.)
      setTimeout(async () => {
        if (!active) return;
        try {
          if (session?.user) {
            await loadProfile(session.user.id);
          } else {
            setProfile(null);
            setBranchIds([]);
          }
        } finally {
          if (active) setLoading(false);
        }
      }, 0);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, branchIds, loading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
