'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import type { Company, CompanyMember, Profile, DbEmployee } from '@/types/database';
import type { Employee, CompanyInfo } from '@/types';

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

  // Supabase 회사정보 → localStorage 동기화 (기존 서류 페이지 호환)
  const syncCompanyToLocal = useCallback((comp: Company) => {
    if (typeof window === 'undefined') return;
    const localInfo: CompanyInfo = {
      name: comp.name,
      ceoName: comp.ceo_name,
      businessNumber: comp.business_number,
      address: comp.address || '',
      phone: comp.phone || '',
    };
    localStorage.setItem('nomu_company_info', JSON.stringify(localInfo));
  }, []);

  // Supabase 직원정보 → localStorage 동기화
  const syncEmployeesToLocal = useCallback(async (companyId: string) => {
    if (typeof window === 'undefined') return;
    const { data: dbEmployees } = await supabase
      .from('employees')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (!dbEmployees) return;

    // DbEmployee → localStorage Employee 형식 변환
    const localEmployees: Employee[] = dbEmployees.map((e: DbEmployee) => ({
      id: e.id,
      info: {
        name: e.name,
        residentNumber: e.resident_number || '',
        address: e.address || '',
        phone: e.phone || '',
      },
      employmentType: e.employment_type,
      status: e.status,
      hireDate: e.hire_date,
      resignDate: e.resign_date || undefined,
      department: e.department || undefined,
      position: e.position || undefined,
      salary: {
        type: e.salary_type,
        baseSalary: e.base_salary,
        hourlyWage: e.hourly_wage || undefined,
        mealAllowance: e.meal_allowance,
        carAllowance: e.car_allowance,
        childcareAllowance: e.childcare_allowance,
        researchAllowance: e.research_allowance,
        otherAllowances: e.other_allowances || [],
        bonusInfo: e.bonus_info || undefined,
      },
      workCondition: {
        weeklyHours: e.weekly_hours,
        workDays: e.work_days || [],
        workStartTime: e.work_start_time,
        workEndTime: e.work_end_time,
        breakTime: e.break_time,
      },
      insurance: {
        national: e.insurance_national,
        health: e.insurance_health,
        employment: e.insurance_employment,
        industrial: e.insurance_industrial,
      },
      taxExemptOptions: {
        hasOwnCar: e.has_own_car,
        hasChildUnder6: e.has_child_under6,
        childrenUnder6Count: e.children_under6_count,
        isResearcher: e.is_researcher,
      },
      createdAt: e.created_at,
      updatedAt: e.updated_at,
      contractId: e.contract_id || undefined,
    }));

    localStorage.setItem('nomu_employees', JSON.stringify(localEmployees));
  }, [supabase]);

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
        const currentCompany = currentMembership.companies as Company;
        setCompany(currentCompany);
        setMembership({
          id: currentMembership.id,
          company_id: currentMembership.company_id,
          user_id: currentMembership.user_id,
          role: currentMembership.role,
          invited_by: currentMembership.invited_by,
          created_at: currentMembership.created_at,
        });

        // localStorage 동기화 (기존 서류 페이지 호환)
        syncCompanyToLocal(currentCompany);
        syncEmployeesToLocal(currentCompany.id);
      }
    } else {
      setCompanies([]);
      setCompany(null);
      setMembership(null);
    }
  }, [supabase, syncCompanyToLocal, syncEmployeesToLocal]);

  const refreshAuth = useCallback(async () => {
    if (user) await loadUserData(user);
  }, [user, loadUserData]);

  const switchCompany = useCallback(async (companyId: string) => {
    if (!user) return;
    await supabase
      .from('profiles')
      .update({ current_company_id: companyId })
      .eq('id', user.id);
    // 사업장 전환 시 localStorage도 갱신
    await loadUserData(user);
  }, [user, supabase, loadUserData]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setCompany(null);
    setMembership(null);
    setCompanies([]);
    // localStorage 정리
    if (typeof window !== 'undefined') {
      localStorage.removeItem('nomu_company_info');
      localStorage.removeItem('nomu_employees');
      localStorage.removeItem('nomu_payment_records');
      localStorage.removeItem('nomu_contracts');
    }
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
