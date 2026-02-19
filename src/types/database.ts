// Supabase 테이블 타입 정의

export interface Company {
  id: string;
  name: string;
  ceo_name: string;
  business_number: string;
  address: string | null;
  phone: string | null;
  plan: 'free' | 'starter' | 'business' | 'pro';
  plan_started_at: string | null;
  plan_expires_at: string | null;
  max_employees: number;
  created_at: string;
  updated_at: string;
}

export interface CompanyMember {
  id: string;
  company_id: string;
  user_id: string;
  role: 'admin' | 'manager' | 'viewer';
  invited_by: string | null;
  created_at: string;
}

export interface DbEmployee {
  id: string;
  company_id: string;
  name: string;
  resident_number: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  employment_type: 'fulltime' | 'parttime' | 'freelancer';
  status: 'active' | 'resigned' | 'pending';
  hire_date: string;
  resign_date: string | null;
  department: string | null;
  position: string | null;
  salary_type: 'monthly' | 'hourly';
  base_salary: number;
  hourly_wage: number | null;
  meal_allowance: number;
  car_allowance: number;
  childcare_allowance: number;
  research_allowance: number;
  other_allowances: { name: string; amount: number; taxable: boolean }[];
  bonus_info: string | null;
  weekly_hours: number;
  work_days: string[];
  work_start_time: string;
  work_end_time: string;
  break_time: number;
  insurance_national: boolean;
  insurance_health: boolean;
  insurance_employment: boolean;
  insurance_industrial: boolean;
  has_own_car: boolean;
  has_child_under6: boolean;
  children_under6_count: number;
  is_researcher: boolean;
  contract_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbPaymentRecord {
  id: string;
  company_id: string;
  employee_id: string;
  year: number;
  month: number;
  payment_date: string | null;
  earnings: Record<string, number>;
  deductions: Record<string, number>;
  total_earnings: number;
  total_taxable: number;
  total_non_taxable: number;
  total_deductions: number;
  net_pay: number;
  status: 'pending' | 'paid';
  paid_at: string | null;
  created_at: string;
}

export interface DbDocument {
  id: string;
  company_id: string;
  employee_id: string | null;
  doc_type: string;
  title: string;
  data: Record<string, unknown>;
  pdf_url: string | null;
  signed: boolean;
  signed_at: string | null;
  signed_by: string | null;
  signature_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  current_company_id: string | null;
  created_at: string;
  updated_at: string;
}

// 플랜별 제한
export const PLAN_LIMITS = {
  free: { maxEmployees: 3, documents: 5, features: ['basic_contracts', 'payslip', 'resignation'] },
  starter: { maxEmployees: 10, documents: Infinity, features: ['all_documents', 'pdf_download'] },
  business: { maxEmployees: 50, documents: Infinity, features: ['all_documents', 'pdf_download', 'e_signature', 'archive', 'notifications'] },
  pro: { maxEmployees: Infinity, documents: Infinity, features: ['all_documents', 'pdf_download', 'e_signature', 'archive', 'notifications', 'multi_branch', 'expert_consult'] },
} as const;

// 무료 플랜에서 사용 가능한 서류 타입
export const FREE_DOCUMENT_TYPES = [
  'contract_fulltime',
  'contract_parttime',
  'payslip',
  'resignation',
  'certificate',
] as const;
