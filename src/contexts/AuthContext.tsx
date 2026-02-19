'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import type { Company, CompanyMember, Profile } from '@/types/database';

interface AuthState {
  user: User | null;
  profile: Profile | null;
  company: Company | null;
  membership: CompanyMember | null;
  loading: boolean;
  // 회사 관련
  companies: Company[];
  switchCompany: (companyId: string) => Promise<void>;
  refreshAuth: () => Promise<void>;
  // 인증
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [membership, setMembership] = useState<CompanyMember | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  const loadUserData = useCallback(async (currentUser: User) => {
    // 1. 프로필
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', currentUser.id)
      .single();
    setProfile(profileData);

    // 2. 소속 사업장 목록
    const { data: memberships } = await supabase
      .from('company_members')
      .select('*, companies(*)')
      .eq('user_id', currentUser.id);

    if (memberships && memberships.length > 0) {
      const companyList = memberships.map((m: { companies: Company }) => m.companies);
      setCompanies(companyList);

      // 현재 선택된 사업장
      const currentCompanyId = profileData?.current_company_id || companyList[0]?.id;
      const currentMembership = memberships.find(
        (m: { company_id: string }) => m.company_id === currentCompanyId
      ) || memberships[0];

      if (currentMembership) {
        setCompany(currentMembership.companies as Company);
        setMembership({
          id: currentMembership.id,
          company_id: currentMembership.company_id,
          user_id: currentMembership.user_id,
          role: currentMembership.role,
          invited_by: currentMembership.invited_by,
          created_at: currentMembership.created_at,
        });
      }
    } else {
      setCompanies([]);
      setCompany(null);
      setMembership(null);
    }
  }, [supabase]);

  const refreshAuth = useCallback(async () => {
    if (user) await loadUserData(user);
  }, [user, loadUserData]);

  const switchCompany = useCallback(async (companyId: string) => {
    if (!user) return;
    await supabase
      .from('profiles')
      .update({ current_company_id: companyId })
      .eq('id', user.id);
    await loadUserData(user);
  }, [user, supabase, loadUserData]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setCompany(null);
    setMembership(null);
    setCompanies([]);
  }, [supabase]);

  useEffect(() => {
    // 초기 세션 확인
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      setUser(u);
      if (u) loadUserData(u);
      setLoading(false);
    });

    // 세션 변경 리스너
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const u = session?.user ?? null;
        setUser(u);
        if (u) await loadUserData(u);
        else {
          setProfile(null);
          setCompany(null);
          setMembership(null);
          setCompanies([]);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase, loadUserData]);

  return (
    <AuthContext.Provider value={{
      user, profile, company, membership, loading,
      companies, switchCompany, refreshAuth, signOut,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
