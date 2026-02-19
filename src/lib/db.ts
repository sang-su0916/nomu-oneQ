/**
 * Supabase DB 액세스 레이어
 * 기존 localStorage 기반 storage.ts를 대체
 */
import { createClient } from '@/lib/supabase/client';
import type { DbEmployee, DbPaymentRecord, DbDocument, Company } from '@/types/database';

const supabase = createClient();

// ============================================
// 직원 관리
// ============================================
export async function getEmployees(companyId: string): Promise<DbEmployee[]> {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getActiveEmployees(companyId: string): Promise<DbEmployee[]> {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('company_id', companyId)
    .eq('status', 'active')
    .order('name');
  if (error) throw error;
  return data || [];
}

export async function getEmployeeById(employeeId: string): Promise<DbEmployee | null> {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('id', employeeId)
    .single();
  if (error) return null;
  return data;
}

export async function createEmployee(employee: Omit<DbEmployee, 'id' | 'created_at' | 'updated_at'>): Promise<DbEmployee> {
  const { data, error } = await supabase
    .from('employees')
    .insert(employee)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateEmployee(id: string, updates: Partial<DbEmployee>): Promise<DbEmployee> {
  const { data, error } = await supabase
    .from('employees')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteEmployee(id: string): Promise<void> {
  const { error } = await supabase
    .from('employees')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// ============================================
// 급여 기록
// ============================================
export async function getPaymentRecords(companyId: string, year?: number, month?: number): Promise<DbPaymentRecord[]> {
  let query = supabase
    .from('payment_records')
    .select('*')
    .eq('company_id', companyId);
  if (year) query = query.eq('year', year);
  if (month) query = query.eq('month', month);
  const { data, error } = await query.order('year', { ascending: false }).order('month', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function getEmployeePayments(employeeId: string): Promise<DbPaymentRecord[]> {
  const { data, error } = await supabase
    .from('payment_records')
    .select('*')
    .eq('employee_id', employeeId)
    .order('year', { ascending: false })
    .order('month', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createPaymentRecord(record: Omit<DbPaymentRecord, 'id' | 'created_at'>): Promise<DbPaymentRecord> {
  const { data, error } = await supabase
    .from('payment_records')
    .insert(record)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updatePaymentRecord(id: string, updates: Partial<DbPaymentRecord>): Promise<void> {
  const { error } = await supabase
    .from('payment_records')
    .update(updates)
    .eq('id', id);
  if (error) throw error;
}

// ============================================
// 서류 보관함
// ============================================
export async function getDocuments(companyId: string, docType?: string): Promise<DbDocument[]> {
  let query = supabase
    .from('documents')
    .select('*')
    .eq('company_id', companyId);
  if (docType) query = query.eq('doc_type', docType);
  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function saveDocument(doc: Omit<DbDocument, 'id' | 'created_at' | 'updated_at'>): Promise<DbDocument> {
  const { data, error } = await supabase
    .from('documents')
    .insert(doc)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getDocumentById(id: string): Promise<DbDocument | null> {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('id', id)
    .single();
  if (error) return null;
  return data;
}

// ============================================
// 회사 정보
// ============================================
export async function getCompany(companyId: string): Promise<Company | null> {
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .eq('id', companyId)
    .single();
  if (error) return null;
  return data;
}

export async function updateCompany(companyId: string, updates: Partial<Company>): Promise<void> {
  const { error } = await supabase
    .from('companies')
    .update(updates)
    .eq('id', companyId);
  if (error) throw error;
}

// ============================================
// 멤버 관리
// ============================================
export async function inviteMember(companyId: string, userId: string, role: 'manager' | 'viewer', invitedBy: string): Promise<void> {
  const { error } = await supabase
    .from('company_members')
    .insert({
      company_id: companyId,
      user_id: userId,
      role,
      invited_by: invitedBy,
    });
  if (error) throw error;
}

export async function getCompanyMembers(companyId: string) {
  const { data, error } = await supabase
    .from('company_members')
    .select('*, profiles(full_name, avatar_url)')
    .eq('company_id', companyId);
  if (error) throw error;
  return data || [];
}

export async function removeMember(memberId: string): Promise<void> {
  const { error } = await supabase
    .from('company_members')
    .delete()
    .eq('id', memberId);
  if (error) throw error;
}

// ============================================
// 직원 수 체크 (플랜 제한)
// ============================================
export async function getActiveEmployeeCount(companyId: string): Promise<number> {
  const { count, error } = await supabase
    .from('employees')
    .select('id', { count: 'exact', head: true })
    .eq('company_id', companyId)
    .eq('status', 'active');
  if (error) throw error;
  return count || 0;
}
