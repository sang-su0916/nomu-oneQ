'use client';

import { useState, useEffect, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { CompanyInfo, EmployeeInfo, Employee } from '@/types';
import { loadCompanyInfo, defaultCompanyInfo, formatCurrency, formatBusinessNumber, loadEmployees, getActiveEmployees } from '@/lib/storage';
import { calculateInsurance, calculateIncomeTax as calcTax, INSURANCE_RATES } from '@/lib/constants';

interface PayslipData {
  company: CompanyInfo;
  employee: EmployeeInfo;
  year: number;
  month: number;
  paymentDate: string;
  earnings: {
    baseSalary: number;
    overtime: number;
    bonus: number;
    mealAllowance: number;
    transportAllowance: number;
    otherAllowance: number;
  };
  deductions: {
    nationalPension: number;
    healthInsurance: number;
    longTermCare: number;
    employmentInsurance: number;
    incomeTax: number;
    localTax: number;
  };
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
  year: today.getFullYear(),
  month: today.getMonth() + 1,
  paymentDate: today.toISOString().split('T')[0],
  earnings: {
    baseSalary: 0,
    overtime: 0,
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
};

export default function PayslipPage() {
  const [payslip, setPayslip] = useState<PayslipData>(defaultPayslip);
  const [showPreview, setShowPreview] = useState(false);
  const [autoCalculate, setAutoCalculate] = useState(true);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedCompany = loadCompanyInfo();
    if (savedCompany) {
      setPayslip(prev => ({ ...prev, company: savedCompany }));
    }
    // 등록된 직원 목록 불러오기
    setEmployees(getActiveEmployees());
  }, []);

  // 직원 선택 시 정보 자동 입력
  const handleEmployeeSelect = (employeeId: string) => {
    setSelectedEmployeeId(employeeId);
    
    if (!employeeId) return;
    
    const employee = employees.find(e => e.id === employeeId);
    if (!employee) return;

    // 직원 정보 및 급여 정보 자동 입력
    setPayslip(prev => ({
      ...prev,
      employee: employee.info,
      earnings: {
        baseSalary: employee.salary.baseSalary,
        overtime: 0,
        bonus: 0,
        mealAllowance: employee.salary.mealAllowance,
        transportAllowance: employee.salary.carAllowance,
        otherAllowance: employee.salary.childcareAllowance,
      },
    }));
  };

  // 4대보험 자동 계산
  useEffect(() => {
    if (!autoCalculate) return;
    
    const totalEarnings = payslip.earnings.baseSalary + payslip.earnings.overtime + payslip.earnings.bonus;
    const taxableIncome = totalEarnings - payslip.earnings.mealAllowance; // 식대는 비과세
    
    setPayslip(prev => ({
      ...prev,
      deductions: {
        nationalPension: Math.round(taxableIncome * 0.045), // 4.5%
        healthInsurance: Math.round(taxableIncome * 0.03545), // 3.545%
        longTermCare: Math.round(taxableIncome * 0.03545 * 0.1295), // 건강보험의 12.95%
        employmentInsurance: Math.round(taxableIncome * 0.009), // 0.9%
        incomeTax: calculateIncomeTax(taxableIncome),
        localTax: Math.round(calculateIncomeTax(taxableIncome) * 0.1), // 소득세의 10%
      }
    }));
  }, [autoCalculate, payslip.earnings]);

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

  const updateEarnings = (field: keyof PayslipData['earnings'], value: number) => {
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

  const totalEarnings = Object.values(payslip.earnings).reduce((sum, val) => sum + val, 0);
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
            
            {/* 직원 선택 (연동) */}
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
                <p className="text-xs text-blue-600 mt-1">
                  💡 직원을 선택하면 급여 정보가 자동으로 입력됩니다.
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          {/* 지급 내역 */}
          <div className="form-section">
            <h2 className="form-section-title">📈 지급 내역</h2>
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
                <label className="input-label">상여금</label>
                <input
                  type="number"
                  className="input-field"
                  value={payslip.earnings.bonus || ''}
                  onChange={(e) => updateEarnings('bonus', parseInt(e.target.value) || 0)}
                />
              </div>
              <div>
                <label className="input-label">식대 (비과세)</label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="200000"
                  value={payslip.earnings.mealAllowance || ''}
                  onChange={(e) => updateEarnings('mealAllowance', parseInt(e.target.value) || 0)}
                />
              </div>
              <div>
                <label className="input-label">교통비</label>
                <input
                  type="number"
                  className="input-field"
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
                <label className="input-label">국민연금 (4.5%)</label>
                <input
                  type="number"
                  className="input-field"
                  value={payslip.deductions.nationalPension || ''}
                  onChange={(e) => updateDeductions('nationalPension', parseInt(e.target.value) || 0)}
                  disabled={autoCalculate}
                />
              </div>
              <div>
                <label className="input-label">건강보험 (3.545%)</label>
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
          <div className="bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl p-6 text-white">
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

// 간이세액표 기반 소득세 계산 (간단화된 버전)
function calculateIncomeTax(monthlyIncome: number): number {
  // 실제로는 간이세액표를 사용해야 하지만, 간단히 계산
  if (monthlyIncome <= 1060000) return 0;
  if (monthlyIncome <= 1500000) return Math.round((monthlyIncome - 1060000) * 0.06);
  if (monthlyIncome <= 3000000) return Math.round(26400 + (monthlyIncome - 1500000) * 0.15);
  if (monthlyIncome <= 4500000) return Math.round(251400 + (monthlyIncome - 3000000) * 0.24);
  if (monthlyIncome <= 8700000) return Math.round(611400 + (monthlyIncome - 4500000) * 0.35);
  return Math.round(2081400 + (monthlyIncome - 8700000) * 0.38);
}

function PayslipPreview({ payslip }: { payslip: PayslipData }) {
  const totalEarnings = Object.values(payslip.earnings).reduce((sum, val) => sum + val, 0);
  const totalDeductions = Object.values(payslip.deductions).reduce((sum, val) => sum + val, 0);
  const netPay = totalEarnings - totalDeductions;

  return (
    <div style={{ fontFamily: "'Nanum Gothic', sans-serif", padding: '20px' }}>
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>급 여 명 세 서</h1>
        <p style={{ color: '#666' }}>{payslip.year}년 {payslip.month}월분</p>
      </div>

      {/* 회사/직원 정보 */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
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
            <th style={{ border: '1px solid #333', padding: '8px', backgroundColor: '#f3f4f6' }}>부서/직책</th>
            <td style={{ border: '1px solid #333', padding: '8px' }}>{payslip.employee.address}</td>
          </tr>
        </tbody>
      </table>

      {/* 지급/공제 내역 */}
      <div style={{ display: 'flex', gap: '20px' }}>
        {/* 지급 */}
        <div style={{ flex: 1 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th colSpan={2} style={{ border: '1px solid #333', padding: '10px', backgroundColor: '#3b82f6', color: 'white' }}>
                  지 급 내 역
                </th>
              </tr>
              <tr>
                <th style={{ border: '1px solid #333', padding: '8px', backgroundColor: '#f3f4f6' }}>항목</th>
                <th style={{ border: '1px solid #333', padding: '8px', backgroundColor: '#f3f4f6' }}>금액</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ border: '1px solid #333', padding: '8px' }}>기본급</td>
                <td style={{ border: '1px solid #333', padding: '8px', textAlign: 'right' }}>{formatCurrency(payslip.earnings.baseSalary)}</td>
              </tr>
              {payslip.earnings.overtime > 0 && (
                <tr>
                  <td style={{ border: '1px solid #333', padding: '8px' }}>연장근로수당</td>
                  <td style={{ border: '1px solid #333', padding: '8px', textAlign: 'right' }}>{formatCurrency(payslip.earnings.overtime)}</td>
                </tr>
              )}
              {payslip.earnings.bonus > 0 && (
                <tr>
                  <td style={{ border: '1px solid #333', padding: '8px' }}>상여금</td>
                  <td style={{ border: '1px solid #333', padding: '8px', textAlign: 'right' }}>{formatCurrency(payslip.earnings.bonus)}</td>
                </tr>
              )}
              {payslip.earnings.mealAllowance > 0 && (
                <tr>
                  <td style={{ border: '1px solid #333', padding: '8px' }}>식대</td>
                  <td style={{ border: '1px solid #333', padding: '8px', textAlign: 'right' }}>{formatCurrency(payslip.earnings.mealAllowance)}</td>
                </tr>
              )}
              {payslip.earnings.transportAllowance > 0 && (
                <tr>
                  <td style={{ border: '1px solid #333', padding: '8px' }}>교통비</td>
                  <td style={{ border: '1px solid #333', padding: '8px', textAlign: 'right' }}>{formatCurrency(payslip.earnings.transportAllowance)}</td>
                </tr>
              )}
              {payslip.earnings.otherAllowance > 0 && (
                <tr>
                  <td style={{ border: '1px solid #333', padding: '8px' }}>기타수당</td>
                  <td style={{ border: '1px solid #333', padding: '8px', textAlign: 'right' }}>{formatCurrency(payslip.earnings.otherAllowance)}</td>
                </tr>
              )}
              <tr>
                <th style={{ border: '1px solid #333', padding: '8px', backgroundColor: '#dbeafe' }}>지급 합계</th>
                <th style={{ border: '1px solid #333', padding: '8px', backgroundColor: '#dbeafe', textAlign: 'right' }}>{formatCurrency(totalEarnings)}</th>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 공제 */}
        <div style={{ flex: 1 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th colSpan={2} style={{ border: '1px solid #333', padding: '10px', backgroundColor: '#ef4444', color: 'white' }}>
                  공 제 내 역
                </th>
              </tr>
              <tr>
                <th style={{ border: '1px solid #333', padding: '8px', backgroundColor: '#f3f4f6' }}>항목</th>
                <th style={{ border: '1px solid #333', padding: '8px', backgroundColor: '#f3f4f6' }}>금액</th>
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
            <th style={{ border: '2px solid #333', padding: '16px', backgroundColor: '#10b981', color: 'white', fontSize: '18px', width: '50%' }}>
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
