'use client';

/**
 * Supabase + localStorage 양방향 직원 관리 훅
 * - Supabase가 source of truth
 * - localStorage는 기존 서류 페이지 호환용 캐시
 */
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import type { Employee, EmploymentType } from '@/types';
import type { DbEmployee } from '@/types/database';
import { generateId } from '@/lib/storage';

// DbEmployee → localStorage Employee 변환
function dbToLocal(e: DbEmployee): Employee {
  return {
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
  };
}

// localStorage Employee → Supabase insert 형식
function localToDbInsert(emp: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>, companyId: string): Record<string, unknown> {
  return {
    company_id: companyId,
    name: emp.info.name,
    resident_number: emp.info.residentNumber || null,
    address: emp.info.address || null,
    phone: emp.info.phone || null,
    email: null,
    employment_type: emp.employmentType,
    status: emp.status,
    hire_date: emp.hireDate,
    resign_date: emp.resignDate || null,
    department: emp.department || null,
    position: emp.position || null,
    salary_type: emp.salary.type,
    base_salary: emp.salary.baseSalary,
    hourly_wage: emp.salary.hourlyWage || null,
    meal_allowance: emp.salary.mealAllowance,
    car_allowance: emp.salary.carAllowance,
    childcare_allowance: emp.salary.childcareAllowance,
    research_allowance: emp.salary.researchAllowance,
    other_allowances: emp.salary.otherAllowances || [],
    bonus_info: emp.salary.bonusInfo || null,
    weekly_hours: emp.workCondition.weeklyHours,
    work_days: emp.workCondition.workDays,
    work_start_time: emp.workCondition.workStartTime,
    work_end_time: emp.workCondition.workEndTime,
    break_time: emp.workCondition.breakTime,
    insurance_national: emp.insurance.national,
    insurance_health: emp.insurance.health,
    insurance_employment: emp.insurance.employment,
    insurance_industrial: emp.insurance.industrial,
    has_own_car: emp.taxExemptOptions.hasOwnCar,
    has_child_under6: emp.taxExemptOptions.hasChildUnder6,
    children_under6_count: emp.taxExemptOptions.childrenUnder6Count || 0,
    is_researcher: emp.taxExemptOptions.isResearcher,
    contract_id: null,
  };
}

// localStorage 캐시 갱신
function syncToLocalStorage(employees: Employee[]) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('nomu_employees', JSON.stringify(employees));
  }
}

export function useEmployees() {
  const { company } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  // Supabase에서 직원 목록 로드
  const loadEmployees = useCallback(async () => {
    if (!company) {
      setEmployees([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('company_id', company.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('직원 로드 실패:', error);
      setLoading(false);
      return;
    }

    const localEmps = (data || []).map(dbToLocal);
    setEmployees(localEmps);
    syncToLocalStorage(localEmps);
    setLoading(false);
  }, [company, supabase]);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  // 직원 추가
  const addEmployee = useCallback(async (emp: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!company) throw new Error('사업장을 먼저 등록해주세요.');

    const insertData = localToDbInsert(emp, company.id);
    const { data, error } = await supabase
      .from('employees')
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;

    const newEmp = dbToLocal(data);
    setEmployees(prev => {
      const updated = [newEmp, ...prev];
      syncToLocalStorage(updated);
      return updated;
    });

    return newEmp;
  }, [company, supabase]);

  // 직원 수정
  const updateEmployee = useCallback(async (id: string, updates: Partial<Employee>) => {
    // Partial<Employee> → Supabase 컬럼 매핑
    const dbUpdates: Record<string, unknown> = {};
    if (updates.info) {
      if (updates.info.name !== undefined) dbUpdates.name = updates.info.name;
      if (updates.info.residentNumber !== undefined) dbUpdates.resident_number = updates.info.residentNumber || null;
      if (updates.info.address !== undefined) dbUpdates.address = updates.info.address || null;
      if (updates.info.phone !== undefined) dbUpdates.phone = updates.info.phone || null;
    }
    if (updates.employmentType !== undefined) dbUpdates.employment_type = updates.employmentType;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.hireDate !== undefined) dbUpdates.hire_date = updates.hireDate;
    if (updates.resignDate !== undefined) dbUpdates.resign_date = updates.resignDate || null;
    if (updates.department !== undefined) dbUpdates.department = updates.department || null;
    if (updates.position !== undefined) dbUpdates.position = updates.position || null;
    if (updates.salary) {
      dbUpdates.salary_type = updates.salary.type;
      dbUpdates.base_salary = updates.salary.baseSalary;
      dbUpdates.hourly_wage = updates.salary.hourlyWage || null;
      dbUpdates.meal_allowance = updates.salary.mealAllowance;
      dbUpdates.car_allowance = updates.salary.carAllowance;
      dbUpdates.childcare_allowance = updates.salary.childcareAllowance;
      dbUpdates.research_allowance = updates.salary.researchAllowance;
      dbUpdates.other_allowances = updates.salary.otherAllowances || [];
      dbUpdates.bonus_info = updates.salary.bonusInfo || null;
    }
    if (updates.workCondition) {
      dbUpdates.weekly_hours = updates.workCondition.weeklyHours;
      dbUpdates.work_days = updates.workCondition.workDays;
      dbUpdates.work_start_time = updates.workCondition.workStartTime;
      dbUpdates.work_end_time = updates.workCondition.workEndTime;
      dbUpdates.break_time = updates.workCondition.breakTime;
    }
    if (updates.insurance) {
      dbUpdates.insurance_national = updates.insurance.national;
      dbUpdates.insurance_health = updates.insurance.health;
      dbUpdates.insurance_employment = updates.insurance.employment;
      dbUpdates.insurance_industrial = updates.insurance.industrial;
    }
    if (updates.taxExemptOptions) {
      dbUpdates.has_own_car = updates.taxExemptOptions.hasOwnCar;
      dbUpdates.has_child_under6 = updates.taxExemptOptions.hasChildUnder6;
      dbUpdates.children_under6_count = updates.taxExemptOptions.childrenUnder6Count || 0;
      dbUpdates.is_researcher = updates.taxExemptOptions.isResearcher;
    }

    const { data, error } = await supabase
      .from('employees')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    const updatedEmp = dbToLocal(data);
    setEmployees(prev => {
      const updated = prev.map(e => e.id === id ? updatedEmp : e);
      syncToLocalStorage(updated);
      return updated;
    });
  }, [supabase]);

  // 직원 삭제
  const deleteEmployee = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('employees')
      .delete()
      .eq('id', id);

    if (error) throw error;

    setEmployees(prev => {
      const updated = prev.filter(e => e.id !== id);
      syncToLocalStorage(updated);
      return updated;
    });
  }, [supabase]);

  return {
    employees,
    loading,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    refreshEmployees: loadEmployees,
  };
}
