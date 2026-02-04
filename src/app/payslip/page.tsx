'use client';

import { useState, useEffect, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { CompanyInfo, EmployeeInfo, Employee } from '@/types';
import { loadCompanyInfo, defaultCompanyInfo, formatCurrency, formatBusinessNumber, getActiveEmployees } from '@/lib/storage';

// 추가 가능한 지급 항목 목록 (2026년 기준)
const ADDITIONAL_EARNINGS = [
  { key: 'fuelAllowance', label: '유류비', taxable: false, description: '업무용 차량 유류비 (비과세, 월 20만원 한도)' },
  { key: 'carMaintenanceAllowance', label: '차량유지비', taxable: false, description: '업무용 차량 유지보수비 (비과세)' },
  { key: 'childEducationAllowance', label: '자녀학자금', taxable: true, description: '자녀 교육비 지원' },
  { key: 'childcareAllowance', label: '보육수당', taxable: false, description: '6세 이하 자녀 1인당 월 20만원 (2026년~)' },
  { key: 'birthSupportAllowance', label: '출산지원금', taxable: false, description: '출산 후 2년 내 지급 시 전액 비과세' },
  { key: 'positionAllowance', label: '직책수당', taxable: true, description: '직급/직책에 따른 수당' },
  { key: 'tenureAllowance', label: '근속수당', taxable: true, description: '장기근속 보상' },
  { key: 'familyAllowance', label: '가족수당', taxable: true, description: '부양가족 수당' },
  { key: 'housingAllowance', label: '주택수당', taxable: true, description: '주거 지원비' },
  { key: 'nightWorkAllowance', label: '야간근로수당', taxable: true, description: '22시~06시 근무' },
  { key: 'holidayWorkAllowance', label: '휴일근로수당', taxable: true, description: '휴일 근무 수당' },
  { key: 'researchAllowance', label: '연구활동비', taxable: false, description: '연구원 한정 (비과세, 월 20만원 한도)' },
  { key: 'communicationAllowance', label: '통신비', taxable: true, description: '업무용 통신비 지원' },
  { key: 'welfareAllowance', label: '복리후생비', taxable: true, description: '기타 복리후생' },
] as const;

type AdditionalEarningKey = typeof ADDITIONAL_EARNINGS[number]['key'];

interface PayslipData {
  company: CompanyInfo;
  employee: EmployeeInfo;
  employeeId: string;  // 사원번호 (필수)
  year: number;
  month: number;
  paymentDate: string;
  
  // 📋 법적 필수 기재사항 (근로기준법 시행령 제27조의2)
  workInfo: {
    workDays: number;           // 근로일수 (필수)
    totalWorkHours: number;     // 총 근로시간수 (필수)
    overtimeHours: number;      // 연장근로시간
    nightHours: number;         // 야간근로시간 (22시~06시)
    holidayHours: number;       // 휴일근로시간
    salaryType: 'monthly' | 'hourly';  // 임금계산방법
    hourlyWage?: number;        // 시급 (시급제인 경우)
  };
  
  earnings: {
    baseSalary: number;
    overtime: number;
    nightWork: number;
    holidayWork: number;
    bonus: number;
    mealAllowance: number;
    transportAllowance: number;
    otherAllowance: number;
    [key: string]: number;
  };
  deductions: {
    nationalPension: number;
    healthInsurance: number;
    longTermCare: number;
    employmentInsurance: number;
    incomeTax: number;
    localTax: number;
  };
  enabledAdditionalEarnings: AdditionalEarningKey[];
}

const defaultEmployee: EmployeeInfo = {
  name: '',
  residentNumber: '',
  address: '',
  phone: '',
};

const today = new Date();

const defaultPayslip: PayslipData = {
  company: defaultCompanyInfo,
  employee: defaultEmployee,
  employeeId: '',
  year: today.getFullYear(),
  month: today.getMonth() + 1,
  paymentDate: today.toISOString().split('T')[0],
  workInfo: {
    workDays: 0,
    totalWorkHours: 0,
    overtimeHours: 0,
    nightHours: 0,
    holidayHours: 0,
    salaryType: 'monthly',
  },
  earnings: {
    baseSalary: 0,
    overtime: 0,
    nightWork: 0,
    holidayWork: 0,
    bonus: 0,
    mealAllowance: 0,
    transportAllowance: 0,
    otherAllowance: 0,
  },
  deductions: {
    nationalPension: 0,
    healthInsurance: 0,
    longTermCare: 0,
    employmentInsurance: 0,
    incomeTax: 0,
    localTax: 0,
  },
  enabledAdditionalEarnings: [],
};

export default function PayslipPage() {
  const [payslip, setPayslip] = useState<PayslipData>(defaultPayslip);
  const [showPreview, setShowPreview] = useState(false);
  const [autoCalculate, setAutoCalculate] = useState(true);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [showAdditionalOptions, setShowAdditionalOptions] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedCompany = loadCompanyInfo();
    if (savedCompany) {
      setPayslip(prev => ({ ...prev, company: savedCompany }));
    }
    setEmployees(getActiveEmployees());
  }, []);

  // 직원 선택 시 정보 자동 입력
  const handleEmployeeSelect = (employeeId: string) => {
    setSelectedEmployeeId(employeeId);
    
    if (!employeeId) return;
    
    const employee = employees.find(e => e.id === employeeId);
    if (!employee) return;

    const deptPosition = [employee.department, employee.position].filter(Boolean).join(' / ') || '';
    
    setPayslip(prev => ({
      ...prev,
      employee: {
        ...employee.info,
        address: deptPosition,
      },
      earnings: {
        ...prev.earnings,
        baseSalary: employee.salary.baseSalary,
        mealAllowance: employee.salary.mealAllowance,
        transportAllowance: employee.salary.carAllowance,
        childcareAllowance: employee.salary.childcareAllowance,
      },
      enabledAdditionalEarnings: employee.salary.childcareAllowance > 0 
        ? [...prev.enabledAdditionalEarnings, 'childcareAllowance'] 
        : prev.enabledAdditionalEarnings,
    }));
  };

  // 추가 항목 토글
  const toggleAdditionalEarning = (key: AdditionalEarningKey) => {
    setPayslip(prev => {
      const isEnabled = prev.enabledAdditionalEarnings.includes(key);
      return {
        ...prev,
        enabledAdditionalEarnings: isEnabled
          ? prev.enabledAdditionalEarnings.filter(k => k !== key)
          : [...prev.enabledAdditionalEarnings, key],
        earnings: isEnabled
          ? { ...prev.earnings, [key]: 0 }
          : prev.earnings,
      };
    });
  };

  // 4대보험 자동 계산
  useEffect(() => {
    if (!autoCalculate) return;
    
    // 과세소득 계산 (비과세 항목 제외)
    const nonTaxableKeys = ADDITIONAL_EARNINGS.filter(e => !e.taxable).map(e => e.key);
    const baseNonTaxable = ['mealAllowance', 'transportAllowance']; // 식대, 자가운전보조금
    
    let taxableIncome = payslip.earnings.baseSalary + payslip.earnings.overtime + payslip.earnings.bonus;
    
    // 기타수당은 과세
    taxableIncome += payslip.earnings.otherAllowance;
    
    // 추가 항목 중 과세 항목만 합산
    payslip.enabledAdditionalEarnings.forEach(key => {
      const item = ADDITIONAL_EARNINGS.find(e => e.key === key);
      if (item?.taxable) {
        taxableIncome += payslip.earnings[key] || 0;
      }
    });
    
    // 2026년 4대보험료율 적용
    // 국민연금: 9.5% (근로자 4.75%), 건강보험: 7.19% (근로자 3.595%)
    // 장기요양: 건강보험료의 12.95%, 고용보험: 1.8% (근로자 0.9%)
    const nationalPensionBase = Math.min(Math.max(taxableIncome, 400000), 6370000); // 상한 637만, 하한 40만
    
    setPayslip(prev => ({
      ...prev,
      deductions: {
        nationalPension: Math.round(nationalPensionBase * 0.0475),  // 4.75%
        healthInsurance: Math.round(taxableIncome * 0.03595),       // 3.595%
        longTermCare: Math.round(taxableIncome * 0.03595 * 0.1295), // 건강보험료의 12.95%
        employmentInsurance: Math.round(taxableIncome * 0.009),     // 0.9%
        incomeTax: calculateIncomeTax(taxableIncome),
        localTax: Math.round(calculateIncomeTax(taxableIncome) * 0.1),
      }
    }));
  }, [autoCalculate, payslip.earnings, payslip.enabledAdditionalEarnings]);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `급여명세서_${payslip.employee.name}_${payslip.year}년${payslip.month}월`,
  });

  const updateEmployee = (field: keyof EmployeeInfo, value: string) => {
    setPayslip(prev => ({
      ...prev,
      employee: { ...prev.employee, [field]: value }
    }));
  };

  const updateEarnings = (field: string, value: number) => {
    setPayslip(prev => ({
      ...prev,
      earnings: { ...prev.earnings, [field]: value }
    }));
  };

  const updateDeductions = (field: keyof PayslipData['deductions'], value: number) => {
    setPayslip(prev => ({
      ...prev,
      deductions: { ...prev.deductions, [field]: value }
    }));
  };

  // 총 지급액 계산
  const totalEarnings = 
    payslip.earnings.baseSalary +
    payslip.earnings.overtime +
    (payslip.earnings.nightWork || 0) +
    (payslip.earnings.holidayWork || 0) +
    payslip.earnings.bonus +
    payslip.earnings.mealAllowance +
    payslip.earnings.transportAllowance +
    payslip.earnings.otherAllowance +
    payslip.enabledAdditionalEarnings.reduce((sum, key) => sum + (payslip.earnings[key] || 0), 0);

  const totalDeductions = Object.values(payslip.deductions).reduce((sum, val) => sum + val, 0);
  const netPay = totalEarnings - totalDeductions;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">💰 급여명세서</h1>
          <p className="text-gray-500 mt-1">개인별 급여명세서를 작성합니다.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="btn-secondary"
          >
            {showPreview ? '✏️ 수정하기' : '👁️ 미리보기'}
          </button>
          <button onClick={() => handlePrint()} className="btn-primary">
            🖨️ 인쇄/PDF
          </button>
        </div>
      </div>

      {!showPreview ? (
        <div className="space-y-6">
          {/* 기본 정보 */}
          <div className="form-section">
            <h2 className="form-section-title">📅 귀속 기간</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="input-label">연도</label>
                <select
                  className="input-field"
                  value={payslip.year}
                  onChange={(e) => setPayslip(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                >
                  {[2024, 2025, 2026].map(year => (
                    <option key={year} value={year}>{year}년</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="input-label">월</label>
                <select
                  className="input-field"
                  value={payslip.month}
                  onChange={(e) => setPayslip(prev => ({ ...prev, month: parseInt(e.target.value) }))}
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                    <option key={month} value={month}>{month}월</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="input-label">지급일</label>
                <input
                  type="date"
                  className="input-field"
                  value={payslip.paymentDate}
                  onChange={(e) => setPayslip(prev => ({ ...prev, paymentDate: e.target.value }))}
                />
              </div>
            </div>
          </div>

          {/* 직원 정보 */}
          <div className="form-section">
            <h2 className="form-section-title">👤 직원 정보</h2>
            
            {employees.length > 0 && (
              <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <label className="input-label text-blue-700">🔗 등록된 직원에서 선택</label>
                <select
                  className="input-field mt-1"
                  value={selectedEmployeeId}
                  onChange={(e) => handleEmployeeSelect(e.target.value)}
                >
                  <option value="">직접 입력</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.info.name} ({emp.department || '부서없음'} / {emp.position || '직위없음'})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="input-label">성명 *</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="홍길동"
                  value={payslip.employee.name}
                  onChange={(e) => updateEmployee('name', e.target.value)}
                />
              </div>
              <div>
                <label className="input-label">사원번호 *</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="EMP-001"
                  value={payslip.employeeId}
                  onChange={(e) => setPayslip(prev => ({ ...prev, employeeId: e.target.value }))}
                />
              </div>
              <div>
                <label className="input-label">부서/직책</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="개발팀 / 대리"
                  value={payslip.employee.address}
                  onChange={(e) => updateEmployee('address', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* 📋 근로시간 정보 (법적 필수) */}
          <div className="form-section">
            <h2 className="form-section-title">
              ⏱️ 근로시간 정보
              <span className="ml-2 text-xs font-normal text-red-500">(법적 필수)</span>
            </h2>
            <p className="text-xs text-zinc-500 mb-4">
              근로기준법 시행령 제27조의2에 따라 반드시 기재해야 합니다.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="input-label">임금계산방법 *</label>
                <select
                  className="input-field"
                  value={payslip.workInfo.salaryType}
                  onChange={(e) => setPayslip(prev => ({ 
                    ...prev, 
                    workInfo: { ...prev.workInfo, salaryType: e.target.value as 'monthly' | 'hourly' }
                  }))}
                >
                  <option value="monthly">월급제</option>
                  <option value="hourly">시급제</option>
                </select>
              </div>
              <div>
                <label className="input-label">근로일수 *</label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="22"
                  value={payslip.workInfo.workDays || ''}
                  onChange={(e) => setPayslip(prev => ({ 
                    ...prev, 
                    workInfo: { ...prev.workInfo, workDays: parseInt(e.target.value) || 0 }
                  }))}
                />
              </div>
              <div>
                <label className="input-label">총 근로시간 *</label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="176"
                  value={payslip.workInfo.totalWorkHours || ''}
                  onChange={(e) => setPayslip(prev => ({ 
                    ...prev, 
                    workInfo: { ...prev.workInfo, totalWorkHours: parseInt(e.target.value) || 0 }
                  }))}
                />
              </div>
              {payslip.workInfo.salaryType === 'hourly' && (
                <div>
                  <label className="input-label">시급 (원)</label>
                  <input
                    type="number"
                    className="input-field"
                    placeholder="10320"
                    value={payslip.workInfo.hourlyWage || ''}
                    onChange={(e) => setPayslip(prev => ({ 
                      ...prev, 
                      workInfo: { ...prev.workInfo, hourlyWage: parseInt(e.target.value) || 0 }
                    }))}
                  />
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div>
                <label className="input-label">연장근로시간</label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="0"
                  value={payslip.workInfo.overtimeHours || ''}
                  onChange={(e) => setPayslip(prev => ({ 
                    ...prev, 
                    workInfo: { ...prev.workInfo, overtimeHours: parseInt(e.target.value) || 0 }
                  }))}
                />
                <p className="text-xs text-zinc-400 mt-1">주 40시간 초과분</p>
              </div>
              <div>
                <label className="input-label">야간근로시간</label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="0"
                  value={payslip.workInfo.nightHours || ''}
                  onChange={(e) => setPayslip(prev => ({ 
                    ...prev, 
                    workInfo: { ...prev.workInfo, nightHours: parseInt(e.target.value) || 0 }
                  }))}
                />
                <p className="text-xs text-zinc-400 mt-1">22시~06시</p>
              </div>
              <div>
                <label className="input-label">휴일근로시간</label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="0"
                  value={payslip.workInfo.holidayHours || ''}
                  onChange={(e) => setPayslip(prev => ({ 
                    ...prev, 
                    workInfo: { ...prev.workInfo, holidayHours: parseInt(e.target.value) || 0 }
                  }))}
                />
                <p className="text-xs text-zinc-400 mt-1">휴일 근무</p>
              </div>
            </div>
          </div>

          {/* 지급 내역 - 기본 항목 */}
          <div className="form-section">
            <h2 className="form-section-title">📈 지급 내역 (기본)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="input-label">기본급 *</label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="3000000"
                  value={payslip.earnings.baseSalary || ''}
                  onChange={(e) => updateEarnings('baseSalary', parseInt(e.target.value) || 0)}
                />
              </div>
              <div>
                <label className="input-label">연장근로수당</label>
                <input
                  type="number"
                  className="input-field"
                  value={payslip.earnings.overtime || ''}
                  onChange={(e) => updateEarnings('overtime', parseInt(e.target.value) || 0)}
                />
              </div>
              <div>
                <label className="input-label">야간근로수당</label>
                <input
                  type="number"
                  className="input-field"
                  value={payslip.earnings.nightWork || ''}
                  onChange={(e) => updateEarnings('nightWork', parseInt(e.target.value) || 0)}
                />
              </div>
              <div>
                <label className="input-label">휴일근로수당</label>
                <input
                  type="number"
                  className="input-field"
                  value={payslip.earnings.holidayWork || ''}
                  onChange={(e) => updateEarnings('holidayWork', parseInt(e.target.value) || 0)}
                />
              </div>
              <div>
                <label className="input-label">상여금</label>
                <input
                  type="number"
                  className="input-field"
                  value={payslip.earnings.bonus || ''}
                  onChange={(e) => updateEarnings('bonus', parseInt(e.target.value) || 0)}
                />
              </div>
              <div>
                <label className="input-label">
                  식대 
                  <span className="ml-1 text-xs text-emerald-600 font-normal">(비과세)</span>
                </label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="200000"
                  value={payslip.earnings.mealAllowance || ''}
                  onChange={(e) => updateEarnings('mealAllowance', parseInt(e.target.value) || 0)}
                />
              </div>
              <div>
                <label className="input-label">
                  자가운전보조금
                  <span className="ml-1 text-xs text-emerald-600 font-normal">(비과세)</span>
                </label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="200000"
                  value={payslip.earnings.transportAllowance || ''}
                  onChange={(e) => updateEarnings('transportAllowance', parseInt(e.target.value) || 0)}
                />
              </div>
              <div>
                <label className="input-label">기타수당</label>
                <input
                  type="number"
                  className="input-field"
                  value={payslip.earnings.otherAllowance || ''}
                  onChange={(e) => updateEarnings('otherAllowance', parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
          </div>

          {/* 추가 지급 항목 옵션 */}
          <div className="form-section">
            <div className="flex items-center justify-between mb-4">
              <h2 className="form-section-title mb-0">➕ 추가 지급 항목</h2>
              <button
                type="button"
                onClick={() => setShowAdditionalOptions(!showAdditionalOptions)}
                className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
              >
                {showAdditionalOptions ? '접기 ▲' : '항목 선택 ▼'}
              </button>
            </div>

            {showAdditionalOptions && (
              <div className="mb-6 p-4 bg-zinc-50 rounded-lg border border-zinc-200">
                <p className="text-xs text-zinc-500 mb-3">필요한 항목을 선택하세요. 선택한 항목만 입력란이 표시됩니다.</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {ADDITIONAL_EARNINGS.map(item => (
                    <label 
                      key={item.key} 
                      className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                        payslip.enabledAdditionalEarnings.includes(item.key)
                          ? 'bg-blue-50 border border-blue-200'
                          : 'hover:bg-zinc-100'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={payslip.enabledAdditionalEarnings.includes(item.key)}
                        onChange={() => toggleAdditionalEarning(item.key)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">
                        {item.label}
                        {!item.taxable && (
                          <span className="ml-1 text-xs text-emerald-600">✓</span>
                        )}
                      </span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-zinc-400 mt-3">
                  <span className="text-emerald-600">✓</span> = 비과세 항목 (4대보험 기준소득 제외)
                </p>
              </div>
            )}

            {/* 선택된 추가 항목 입력 */}
            {payslip.enabledAdditionalEarnings.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {payslip.enabledAdditionalEarnings.map(key => {
                  const item = ADDITIONAL_EARNINGS.find(e => e.key === key);
                  if (!item) return null;
                  return (
                    <div key={key}>
                      <label className="input-label">
                        {item.label}
                        {!item.taxable && (
                          <span className="ml-1 text-xs text-emerald-600 font-normal">(비과세)</span>
                        )}
                      </label>
                      <input
                        type="number"
                        className="input-field"
                        placeholder={item.description}
                        value={payslip.earnings[key] || ''}
                        onChange={(e) => updateEarnings(key, parseInt(e.target.value) || 0)}
                      />
                    </div>
                  );
                })}
              </div>
            )}

            {payslip.enabledAdditionalEarnings.length === 0 && !showAdditionalOptions && (
              <p className="text-sm text-zinc-400">선택된 추가 항목이 없습니다. "항목 선택"을 클릭해 추가하세요.</p>
            )}

            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-blue-800 font-medium">
                지급 합계: {formatCurrency(totalEarnings)}
              </p>
            </div>
          </div>

          {/* 공제 내역 */}
          <div className="form-section">
            <h2 className="form-section-title">📉 공제 내역</h2>
            <div className="flex items-center gap-2 mb-4">
              <input
                type="checkbox"
                id="autoCalc"
                checked={autoCalculate}
                onChange={(e) => setAutoCalculate(e.target.checked)}
                className="w-4 h-4"
              />
              <label htmlFor="autoCalc" className="text-sm text-gray-600">
                4대보험/세금 자동 계산
              </label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="input-label">국민연금 (4.75%) <span className="text-xs text-zinc-400">2026</span></label>
                <input
                  type="number"
                  className="input-field"
                  value={payslip.deductions.nationalPension || ''}
                  onChange={(e) => updateDeductions('nationalPension', parseInt(e.target.value) || 0)}
                  disabled={autoCalculate}
                />
              </div>
              <div>
                <label className="input-label">건강보험 (3.595%) <span className="text-xs text-zinc-400">2026</span></label>
                <input
                  type="number"
                  className="input-field"
                  value={payslip.deductions.healthInsurance || ''}
                  onChange={(e) => updateDeductions('healthInsurance', parseInt(e.target.value) || 0)}
                  disabled={autoCalculate}
                />
              </div>
              <div>
                <label className="input-label">장기요양 (12.95%)</label>
                <input
                  type="number"
                  className="input-field"
                  value={payslip.deductions.longTermCare || ''}
                  onChange={(e) => updateDeductions('longTermCare', parseInt(e.target.value) || 0)}
                  disabled={autoCalculate}
                />
              </div>
              <div>
                <label className="input-label">고용보험 (0.9%)</label>
                <input
                  type="number"
                  className="input-field"
                  value={payslip.deductions.employmentInsurance || ''}
                  onChange={(e) => updateDeductions('employmentInsurance', parseInt(e.target.value) || 0)}
                  disabled={autoCalculate}
                />
              </div>
              <div>
                <label className="input-label">소득세</label>
                <input
                  type="number"
                  className="input-field"
                  value={payslip.deductions.incomeTax || ''}
                  onChange={(e) => updateDeductions('incomeTax', parseInt(e.target.value) || 0)}
                  disabled={autoCalculate}
                />
              </div>
              <div>
                <label className="input-label">지방소득세 (10%)</label>
                <input
                  type="number"
                  className="input-field"
                  value={payslip.deductions.localTax || ''}
                  onChange={(e) => updateDeductions('localTax', parseInt(e.target.value) || 0)}
                  disabled={autoCalculate}
                />
              </div>
            </div>
            <div className="mt-4 p-4 bg-red-50 rounded-lg">
              <p className="text-red-800 font-medium">
                공제 합계: {formatCurrency(totalDeductions)}
              </p>
            </div>
          </div>

          {/* 실수령액 */}
          <div className="bg-gradient-to-r from-zinc-800 to-zinc-900 rounded-xl p-6 text-white">
            <p className="text-lg opacity-90">실수령액</p>
            <p className="text-4xl font-bold mt-2">{formatCurrency(netPay)}</p>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg p-8">
          <PayslipPreview payslip={payslip} />
        </div>
      )}

      <div className="hidden">
        <div ref={printRef}>
          <PayslipPreview payslip={payslip} />
        </div>
      </div>
    </div>
  );
}

// 간이세액표 기반 소득세 계산
function calculateIncomeTax(monthlyIncome: number): number {
  if (monthlyIncome <= 1060000) return 0;
  if (monthlyIncome <= 1500000) return Math.round((monthlyIncome - 1060000) * 0.06);
  if (monthlyIncome <= 3000000) return Math.round(26400 + (monthlyIncome - 1500000) * 0.15);
  if (monthlyIncome <= 4500000) return Math.round(251400 + (monthlyIncome - 3000000) * 0.24);
  if (monthlyIncome <= 8700000) return Math.round(611400 + (monthlyIncome - 4500000) * 0.35);
  return Math.round(2081400 + (monthlyIncome - 8700000) * 0.38);
}

function PayslipPreview({ payslip }: { payslip: PayslipData }) {
  // 총액 계산
  const additionalTotal = payslip.enabledAdditionalEarnings.reduce(
    (sum, key) => sum + (payslip.earnings[key] || 0), 0
  );
  const totalEarnings = 
    payslip.earnings.baseSalary +
    payslip.earnings.overtime +
    (payslip.earnings.nightWork || 0) +
    (payslip.earnings.holidayWork || 0) +
    payslip.earnings.bonus +
    payslip.earnings.mealAllowance +
    payslip.earnings.transportAllowance +
    payslip.earnings.otherAllowance +
    additionalTotal;
  const totalDeductions = Object.values(payslip.deductions).reduce((sum, val) => sum + val, 0);
  const netPay = totalEarnings - totalDeductions;

  // 지급 항목 목록 생성 (계산방법 포함)
  const earningItems: { label: string; amount: number; taxFree?: boolean; calcMethod?: string }[] = [
    { 
      label: '기본급', 
      amount: payslip.earnings.baseSalary,
      calcMethod: payslip.workInfo.salaryType === 'monthly' 
        ? '월급제' 
        : `시급 ${formatCurrency(payslip.workInfo.hourlyWage || 0)} × ${payslip.workInfo.totalWorkHours}h`
    },
  ];
  if (payslip.earnings.overtime > 0) {
    earningItems.push({ 
      label: '연장근로수당', 
      amount: payslip.earnings.overtime,
      calcMethod: `${payslip.workInfo.overtimeHours}시간 × 통상시급 × 1.5`
    });
  }
  if (payslip.earnings.nightWork && payslip.earnings.nightWork > 0) {
    earningItems.push({ 
      label: '야간근로수당', 
      amount: payslip.earnings.nightWork,
      calcMethod: `${payslip.workInfo.nightHours}시간 × 통상시급 × 0.5`
    });
  }
  if (payslip.earnings.holidayWork && payslip.earnings.holidayWork > 0) {
    earningItems.push({ 
      label: '휴일근로수당', 
      amount: payslip.earnings.holidayWork,
      calcMethod: `${payslip.workInfo.holidayHours}시간 × 통상시급 × 1.5`
    });
  }
  if (payslip.earnings.bonus > 0) {
    earningItems.push({ label: '상여금', amount: payslip.earnings.bonus });
  }
  if (payslip.earnings.mealAllowance > 0) {
    earningItems.push({ label: '식대', amount: payslip.earnings.mealAllowance, taxFree: true });
  }
  if (payslip.earnings.transportAllowance > 0) {
    earningItems.push({ label: '자가운전보조금', amount: payslip.earnings.transportAllowance, taxFree: true });
  }
  
  // 추가 항목
  payslip.enabledAdditionalEarnings.forEach(key => {
    const item = ADDITIONAL_EARNINGS.find(e => e.key === key);
    const amount = payslip.earnings[key] || 0;
    if (item && amount > 0) {
      earningItems.push({ label: item.label, amount, taxFree: !item.taxable });
    }
  });

  if (payslip.earnings.otherAllowance > 0) {
    earningItems.push({ label: '기타수당', amount: payslip.earnings.otherAllowance });
  }

  return (
    <div style={{ fontFamily: "'Nanum Gothic', sans-serif", padding: '20px' }}>
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>급 여 명 세 서</h1>
        <p style={{ color: '#666' }}>{payslip.year}년 {payslip.month}월분</p>
      </div>

      {/* 회사/직원 정보 (법적 필수) */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px' }}>
        <tbody>
          <tr>
            <th style={{ border: '1px solid #333', padding: '8px', backgroundColor: '#f3f4f6', width: '15%' }}>회사명</th>
            <td style={{ border: '1px solid #333', padding: '8px', width: '35%' }}>{payslip.company.name}</td>
            <th style={{ border: '1px solid #333', padding: '8px', backgroundColor: '#f3f4f6', width: '15%' }}>성명</th>
            <td style={{ border: '1px solid #333', padding: '8px', width: '35%' }}>{payslip.employee.name}</td>
          </tr>
          <tr>
            <th style={{ border: '1px solid #333', padding: '8px', backgroundColor: '#f3f4f6' }}>사업자번호</th>
            <td style={{ border: '1px solid #333', padding: '8px' }}>{formatBusinessNumber(payslip.company.businessNumber)}</td>
            <th style={{ border: '1px solid #333', padding: '8px', backgroundColor: '#f3f4f6' }}>사원번호</th>
            <td style={{ border: '1px solid #333', padding: '8px' }}>{payslip.employeeId || '-'}</td>
          </tr>
          <tr>
            <th style={{ border: '1px solid #333', padding: '8px', backgroundColor: '#f3f4f6' }}>부서/직책</th>
            <td style={{ border: '1px solid #333', padding: '8px' }}>{payslip.employee.address || '-'}</td>
            <th style={{ border: '1px solid #333', padding: '8px', backgroundColor: '#f3f4f6' }}>지급일</th>
            <td style={{ border: '1px solid #333', padding: '8px' }}>{payslip.paymentDate}</td>
          </tr>
        </tbody>
      </table>

      {/* 📋 근로시간 정보 (법적 필수) */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px' }}>
        <thead>
          <tr>
            <th colSpan={6} style={{ border: '1px solid #333', padding: '8px', backgroundColor: '#1e3a5f', color: 'white', fontSize: '13px' }}>
              근로시간 정보 (근로기준법 시행령 제27조의2)
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th style={{ border: '1px solid #333', padding: '6px', backgroundColor: '#f3f4f6', width: '16%', fontSize: '12px' }}>근로일수</th>
            <td style={{ border: '1px solid #333', padding: '6px', textAlign: 'center', fontSize: '12px' }}>{payslip.workInfo.workDays}일</td>
            <th style={{ border: '1px solid #333', padding: '6px', backgroundColor: '#f3f4f6', width: '16%', fontSize: '12px' }}>총 근로시간</th>
            <td style={{ border: '1px solid #333', padding: '6px', textAlign: 'center', fontSize: '12px' }}>{payslip.workInfo.totalWorkHours}시간</td>
            <th style={{ border: '1px solid #333', padding: '6px', backgroundColor: '#f3f4f6', width: '16%', fontSize: '12px' }}>임금계산</th>
            <td style={{ border: '1px solid #333', padding: '6px', textAlign: 'center', fontSize: '12px' }}>
              {payslip.workInfo.salaryType === 'monthly' ? '월급제' : `시급제 (${formatCurrency(payslip.workInfo.hourlyWage || 0)})`}
            </td>
          </tr>
          <tr>
            <th style={{ border: '1px solid #333', padding: '6px', backgroundColor: '#f3f4f6', fontSize: '12px' }}>연장근로</th>
            <td style={{ border: '1px solid #333', padding: '6px', textAlign: 'center', fontSize: '12px' }}>{payslip.workInfo.overtimeHours || 0}시간</td>
            <th style={{ border: '1px solid #333', padding: '6px', backgroundColor: '#f3f4f6', fontSize: '12px' }}>야간근로</th>
            <td style={{ border: '1px solid #333', padding: '6px', textAlign: 'center', fontSize: '12px' }}>{payslip.workInfo.nightHours || 0}시간</td>
            <th style={{ border: '1px solid #333', padding: '6px', backgroundColor: '#f3f4f6', fontSize: '12px' }}>휴일근로</th>
            <td style={{ border: '1px solid #333', padding: '6px', textAlign: 'center', fontSize: '12px' }}>{payslip.workInfo.holidayHours || 0}시간</td>
          </tr>
        </tbody>
      </table>

      {/* 지급/공제 내역 */}
      <div style={{ display: 'flex', gap: '20px' }}>
        {/* 지급 */}
        <div style={{ flex: 1.2 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th colSpan={3} style={{ border: '1px solid #333', padding: '10px', backgroundColor: '#18181b', color: 'white' }}>
                  지 급 내 역
                </th>
              </tr>
              <tr>
                <th style={{ border: '1px solid #333', padding: '6px', backgroundColor: '#f3f4f6', width: '30%', fontSize: '12px' }}>항목</th>
                <th style={{ border: '1px solid #333', padding: '6px', backgroundColor: '#f3f4f6', width: '40%', fontSize: '12px' }}>계산방법</th>
                <th style={{ border: '1px solid #333', padding: '6px', backgroundColor: '#f3f4f6', width: '30%', fontSize: '12px' }}>금액</th>
              </tr>
            </thead>
            <tbody>
              {earningItems.map((item, idx) => (
                <tr key={idx}>
                  <td style={{ border: '1px solid #333', padding: '6px', fontSize: '12px' }}>
                    {item.label}
                    {item.taxFree && <span style={{ color: '#059669', fontSize: '10px', marginLeft: '2px' }}>(비)</span>}
                  </td>
                  <td style={{ border: '1px solid #333', padding: '6px', fontSize: '11px', color: '#666' }}>
                    {item.calcMethod || '-'}
                  </td>
                  <td style={{ border: '1px solid #333', padding: '6px', textAlign: 'right', fontSize: '12px' }}>{formatCurrency(item.amount)}</td>
                </tr>
              ))}
              <tr>
                <th colSpan={2} style={{ border: '1px solid #333', padding: '8px', backgroundColor: '#e5e5e5', fontSize: '12px' }}>지급 합계</th>
                <th style={{ border: '1px solid #333', padding: '8px', backgroundColor: '#e5e5e5', textAlign: 'right', fontSize: '13px' }}>{formatCurrency(totalEarnings)}</th>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 공제 */}
        <div style={{ flex: 1 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th colSpan={2} style={{ border: '1px solid #333', padding: '10px', backgroundColor: '#dc2626', color: 'white' }}>
                  공 제 내 역
                </th>
              </tr>
              <tr>
                <th style={{ border: '1px solid #333', padding: '8px', backgroundColor: '#f3f4f6', width: '50%' }}>항목</th>
                <th style={{ border: '1px solid #333', padding: '8px', backgroundColor: '#f3f4f6', width: '50%' }}>금액</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ border: '1px solid #333', padding: '8px' }}>국민연금</td>
                <td style={{ border: '1px solid #333', padding: '8px', textAlign: 'right' }}>{formatCurrency(payslip.deductions.nationalPension)}</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #333', padding: '8px' }}>건강보험</td>
                <td style={{ border: '1px solid #333', padding: '8px', textAlign: 'right' }}>{formatCurrency(payslip.deductions.healthInsurance)}</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #333', padding: '8px' }}>장기요양</td>
                <td style={{ border: '1px solid #333', padding: '8px', textAlign: 'right' }}>{formatCurrency(payslip.deductions.longTermCare)}</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #333', padding: '8px' }}>고용보험</td>
                <td style={{ border: '1px solid #333', padding: '8px', textAlign: 'right' }}>{formatCurrency(payslip.deductions.employmentInsurance)}</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #333', padding: '8px' }}>소득세</td>
                <td style={{ border: '1px solid #333', padding: '8px', textAlign: 'right' }}>{formatCurrency(payslip.deductions.incomeTax)}</td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #333', padding: '8px' }}>지방소득세</td>
                <td style={{ border: '1px solid #333', padding: '8px', textAlign: 'right' }}>{formatCurrency(payslip.deductions.localTax)}</td>
              </tr>
              <tr>
                <th style={{ border: '1px solid #333', padding: '8px', backgroundColor: '#fecaca' }}>공제 합계</th>
                <th style={{ border: '1px solid #333', padding: '8px', backgroundColor: '#fecaca', textAlign: 'right' }}>{formatCurrency(totalDeductions)}</th>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 실수령액 */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
        <tbody>
          <tr>
            <th style={{ border: '2px solid #333', padding: '16px', backgroundColor: '#18181b', color: 'white', fontSize: '18px', width: '50%' }}>
              실 수 령 액
            </th>
            <td style={{ border: '2px solid #333', padding: '16px', textAlign: 'right', fontSize: '24px', fontWeight: 'bold' }}>
              {formatCurrency(netPay)}
            </td>
          </tr>
        </tbody>
      </table>

      <p style={{ textAlign: 'center', marginTop: '24px', color: '#666', fontSize: '12px' }}>
        지급일: {payslip.paymentDate} | {payslip.company.name}
      </p>
    </div>
  );
}
