import React, { createContext, useContext, useEffect, useState } from 'react';
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
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) await loadProfile(session.user.id);
      setLoading(false);
    }).catch(() => setLoading(false));

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Set loading=true during SIGNED_IN so AuthGuard doesn't see user+no-profile
      // and trigger a premature signOut before the profile query completes.
      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
        setLoading(true);
      }
      setUser(session?.user ?? null);
      if (session?.user) {
        await loadProfile(session.user.id);
      } else {
        setProfile(null);
        setBranchIds([]);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, branchIds, loading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
