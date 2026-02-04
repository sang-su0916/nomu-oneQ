import { CompanyInfo, Employee, PaymentRecord } from '@/types';

const STORAGE_KEYS = {
  COMPANY_INFO: 'nomu_company_info',
  CONTRACTS: 'nomu_contracts',
  EMPLOYEES: 'nomu_employees',
  PAYMENT_RECORDS: 'nomu_payment_records',
};

// ============================================
// 회사 정보
// ============================================
export const saveCompanyInfo = (info: CompanyInfo): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.COMPANY_INFO, JSON.stringify(info));
  }
};

export const loadCompanyInfo = (): CompanyInfo | null => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_KEYS.COMPANY_INFO);
    return saved ? JSON.parse(saved) : null;
  }
  return null;
};

export const defaultCompanyInfo: CompanyInfo = {
  name: '',
  ceoName: '',
  businessNumber: '',
  address: '',
  phone: '',
};

// ============================================
// 직원 관리
// ============================================
export const saveEmployees = (employees: Employee[]): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(employees));
  }
};

export const loadEmployees = (): Employee[] => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_KEYS.EMPLOYEES);
    return saved ? JSON.parse(saved) : [];
  }
  return [];
};

export const addEmployee = (employee: Employee): void => {
  const employees = loadEmployees();
  employees.push(employee);
  saveEmployees(employees);
};

export const updateEmployee = (id: string, updates: Partial<Employee>): void => {
  const employees = loadEmployees();
  const index = employees.findIndex(e => e.id === id);
  if (index !== -1) {
    employees[index] = { ...employees[index], ...updates, updatedAt: new Date().toISOString() };
    saveEmployees(employees);
  }
};

export const deleteEmployee = (id: string): void => {
  const employees = loadEmployees();
  saveEmployees(employees.filter(e => e.id !== id));
};

export const getEmployeeById = (id: string): Employee | undefined => {
  const employees = loadEmployees();
  return employees.find(e => e.id === id);
};

export const getActiveEmployees = (): Employee[] => {
  const employees = loadEmployees();
  return employees.filter(e => e.status === 'active');
};

// ============================================
// 급여 지급 기록
// ============================================
export const savePaymentRecords = (records: PaymentRecord[]): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.PAYMENT_RECORDS, JSON.stringify(records));
  }
};

export const loadPaymentRecords = (): PaymentRecord[] => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_KEYS.PAYMENT_RECORDS);
    return saved ? JSON.parse(saved) : [];
  }
  return [];
};

export const addPaymentRecord = (record: PaymentRecord): void => {
  const records = loadPaymentRecords();
  records.push(record);
  savePaymentRecords(records);
};

export const getPaymentRecordsByEmployee = (employeeId: string): PaymentRecord[] => {
  const records = loadPaymentRecords();
  return records.filter(r => r.employeeId === employeeId);
};

export const getPaymentRecordsByMonth = (year: number, month: number): PaymentRecord[] => {
  const records = loadPaymentRecords();
  return records.filter(r => r.year === year && r.month === month);
};

export const updatePaymentRecord = (id: string, updates: Partial<PaymentRecord>): void => {
  const records = loadPaymentRecords();
  const index = records.findIndex(r => r.id === id);
  if (index !== -1) {
    records[index] = { ...records[index], ...updates };
    savePaymentRecords(records);
  }
};

// ============================================
// ID 생성
// ============================================
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// ============================================
// 포맷팅 유틸리티
// ============================================
export const formatNumber = (num: number): string => {
  return num.toLocaleString('ko-KR');
};

export const formatCurrency = (amount: number): string => {
  return `${formatNumber(amount)}원`;
};

export const formatDate = (dateStr: string): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
};

export const formatDateShort = (dateStr: string): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
};

export const formatResidentNumber = (num: string, mask = true): string => {
  const cleaned = num.replace(/[^0-9]/g, '');
  if (cleaned.length !== 13) return num;
  if (mask) {
    return `${cleaned.slice(0, 6)}-${cleaned.slice(6, 7)}******`;
  }
  return `${cleaned.slice(0, 6)}-${cleaned.slice(6)}`;
};

export const formatBusinessNumber = (num: string): string => {
  const cleaned = num.replace(/[^0-9]/g, '');
  if (cleaned.length !== 10) return num;
  return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 5)}-${cleaned.slice(5)}`;
};

export const formatPhoneNumber = (num: string): string => {
  const cleaned = num.replace(/[^0-9]/g, '');
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7)}`;
  }
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return num;
};

// ============================================
// 데이터 내보내기/가져오기
// ============================================
export const exportAllData = (): string => {
  const data = {
    company: loadCompanyInfo(),
    employees: loadEmployees(),
    paymentRecords: loadPaymentRecords(),
    exportedAt: new Date().toISOString(),
  };
  return JSON.stringify(data, null, 2);
};

export const importAllData = (jsonString: string): boolean => {
  try {
    const data = JSON.parse(jsonString);
    if (data.company) saveCompanyInfo(data.company);
    if (data.employees) saveEmployees(data.employees);
    if (data.paymentRecords) savePaymentRecords(data.paymentRecords);
    return true;
  } catch {
    return false;
  }
};
