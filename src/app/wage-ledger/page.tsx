'use client';

import { useState, useEffect, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { CompanyInfo, Employee as RegisteredEmployee } from '@/types';
import { loadCompanyInfo, defaultCompanyInfo, formatCurrency, formatBusinessNumber, getActiveEmployees } from '@/lib/storage';
import { calculateInsurance, INSURANCE_RATES } from '@/lib/constants';

interface LedgerEmployee {
  id: string;
  registeredId?: string; // 연동된 직원 ID
  name: string;
  position: string;
  baseSalary: number;
  overtime: number;
  nightWork: number;
  holidayWork: number;
  bonus: number;
  mealAllowance: number;
  carAllowance: number;
  otherAllowance: number;
  nationalPension: number;
  healthInsurance: number;
  longTermCare: number;
  employmentInsurance: number;
  incomeTax: number;
  localTax: number;
}

interface WageLedgerData {
  company: CompanyInfo;
  year: number;
  month: number;
  employees: LedgerEmployee[];
}

const createEmptyEmployee = (): LedgerEmployee => ({
  id: Date.now().toString(),
  name: '',
  position: '',
  baseSalary: 0,
  overtime: 0,
  nightWork: 0,
  holidayWork: 0,
  bonus: 0,
  mealAllowance: 0,
  carAllowance: 0,
  otherAllowance: 0,
  nationalPension: 0,
  healthInsurance: 0,
  longTermCare: 0,
  employmentInsurance: 0,
  incomeTax: 0,
  localTax: 0,
});

const today = new Date();

export default function WageLedgerPage() {
  const [data, setData] = useState<WageLedgerData>({
    company: defaultCompanyInfo,
    year: today.getFullYear(),
    month: today.getMonth() + 1,
    employees: [],
  });
  const [registeredEmployees, setRegisteredEmployees] = useState<RegisteredEmployee[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [autoCalc, setAutoCalc] = useState(true);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedCompany = loadCompanyInfo();
    if (savedCompany) {
      setData(prev => ({ ...prev, company: savedCompany }));
    }
    // 등록된 직원 불러오기
    setRegisteredEmployees(getActiveEmployees());
  }, []);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `임금대장_${data.year}년${data.month}월`,
  });

  // 등록된 직원 전체 추가
  const addAllRegisteredEmployees = () => {
    const newEmployees = registeredEmployees.map(emp => {
      const insurance = calculateInsurance(emp.salary.baseSalary);
      return {
        id: `${Date.now()}-${emp.id}`,
        registeredId: emp.id,
        name: emp.info.name,
        position: emp.position || '',
        baseSalary: emp.salary.baseSalary,
        overtime: 0,
        nightWork: 0,
        holidayWork: 0,
        bonus: 0,
        mealAllowance: emp.salary.mealAllowance,
        carAllowance: emp.salary.carAllowance,
        otherAllowance: emp.salary.childcareAllowance,
        nationalPension: insurance.nationalPension,
        healthInsurance: insurance.healthInsurance,
        longTermCare: insurance.longTermCare,
        employmentInsurance: insurance.employmentInsurance,
        incomeTax: 0,
        localTax: 0,
      };
    });
    setData(prev => ({ ...prev, employees: newEmployees }));
  };

  // 직원 추가 (수동)
  const addEmployee = () => {
    setData(prev => ({
      ...prev,
      employees: [...prev.employees, createEmptyEmployee()]
    }));
  };

  // 직원 제거
  const removeEmployee = (id: string) => {
    setData(prev => ({
      ...prev,
      employees: prev.employees.filter(e => e.id !== id)
    }));
  };

  // 직원 정보 업데이트
  const updateEmployee = (id: string, field: keyof LedgerEmployee, value: string | number) => {
    setData(prev => ({
      ...prev,
      employees: prev.employees.map(e => 
        e.id === id ? { ...e, [field]: value } : e
      )
    }));
  };

  // 4대보험 자동 계산
  const autoCalculateDeductions = (id: string) => {
    setData(prev => ({
      ...prev,
      employees: prev.employees.map(e => {
        if (e.id !== id) return e;
        const taxable = e.baseSalary + e.overtime + e.nightWork + e.holidayWork + e.bonus;
        const insurance = calculateInsurance(taxable);
        return {
          ...e,
          nationalPension: insurance.nationalPension,
          healthInsurance: insurance.healthInsurance,
          longTermCare: insurance.longTermCare,
          employmentInsurance: insurance.employmentInsurance,
        };
      })
    }));
  };

  // 전체 자동 계산
  const autoCalculateAll = () => {
    setData(prev => ({
      ...prev,
      employees: prev.employees.map(e => {
        const taxable = e.baseSalary + e.overtime + e.nightWork + e.holidayWork + e.bonus;
        const insurance = calculateInsurance(taxable);
        return {
          ...e,
          nationalPension: insurance.nationalPension,
          healthInsurance: insurance.healthInsurance,
          longTermCare: insurance.longTermCare,
          employmentInsurance: insurance.employmentInsurance,
        };
      })
    }));
  };

  // 합계 계산
  const totals = data.employees.reduce((acc, e) => ({
    baseSalary: acc.baseSalary + e.baseSalary,
    overtime: acc.overtime + e.overtime,
    nightWork: acc.nightWork + e.nightWork,
    holidayWork: acc.holidayWork + e.holidayWork,
    bonus: acc.bonus + e.bonus,
    mealAllowance: acc.mealAllowance + e.mealAllowance,
    carAllowance: acc.carAllowance + e.carAllowance,
    otherAllowance: acc.otherAllowance + e.otherAllowance,
    nationalPension: acc.nationalPension + e.nationalPension,
    healthInsurance: acc.healthInsurance + e.healthInsurance,
    longTermCare: acc.longTermCare + e.longTermCare,
    employmentInsurance: acc.employmentInsurance + e.employmentInsurance,
    incomeTax: acc.incomeTax + e.incomeTax,
    localTax: acc.localTax + e.localTax,
  }), {
    baseSalary: 0, overtime: 0, nightWork: 0, holidayWork: 0, bonus: 0,
    mealAllowance: 0, carAllowance: 0, otherAllowance: 0,
    nationalPension: 0, healthInsurance: 0, longTermCare: 0, employmentInsurance: 0,
    incomeTax: 0, localTax: 0,
  });

  const getTotalEarnings = (e: LedgerEmployee) => 
    e.baseSalary + e.overtime + e.nightWork + e.holidayWork + e.bonus + 
    e.mealAllowance + e.carAllowance + e.otherAllowance;

  const getTotalDeductions = (e: LedgerEmployee) =>
    e.nationalPension + e.healthInsurance + e.longTermCare + 
    e.employmentInsurance + e.incomeTax + e.localTax;

  const getNetPay = (e: LedgerEmployee) => getTotalEarnings(e) - getTotalDeductions(e);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">📊 임금대장</h1>
          <p className="text-gray-500 mt-1">월별 임금대장을 작성합니다.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="btn-secondary"
          >
            {showPreview ? '✏️ 수정' : '👁️ 미리보기'}
          </button>
          <button onClick={() => handlePrint()} className="btn-primary">
            🖨️ 인쇄/PDF
          </button>
        </div>
      </div>

      {!showPreview ? (
        <div className="space-y-6">
          {/* 기간 설정 */}
          <div className="form-section">
            <h2 className="form-section-title">📅 귀속 기간</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="input-label">연도</label>
                <select
                  className="input-field"
                  value={data.year}
                  onChange={(e) => setData(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                >
                  {[2024, 2025, 2026, 2027].map(year => (
                    <option key={year} value={year}>{year}년</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="input-label">월</label>
                <select
                  className="input-field"
                  value={data.month}
                  onChange={(e) => setData(prev => ({ ...prev, month: parseInt(e.target.value) }))}
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                    <option key={month} value={month}>{month}월</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 직원 연동 */}
          {registeredEmployees.length > 0 && (
            <div className="form-section">
              <div className="flex items-center justify-between">
                <h2 className="form-section-title mb-0">🔗 직원 연동</h2>
                <button
                  onClick={addAllRegisteredEmployees}
                  className="btn-primary text-sm"
                >
                  👥 등록된 직원 전체 추가 ({registeredEmployees.length}명)
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                등록된 직원의 급여 정보를 자동으로 불러옵니다. 연장/야간/휴일 근로수당은 별도 입력하세요.
              </p>
            </div>
          )}

          {/* 직원 목록 */}
          <div className="form-section">
            <div className="flex items-center justify-between mb-4">
              <h2 className="form-section-title mb-0">👥 직원별 급여 내역</h2>
              <div className="flex gap-2">
                <button onClick={autoCalculateAll} className="btn-secondary text-sm">
                  🔄 4대보험 일괄 계산
                </button>
                <button onClick={addEmployee} className="btn-secondary text-sm">
                  ➕ 직원 추가
                </button>
              </div>
            </div>

            {data.employees.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p className="text-4xl mb-4">📋</p>
                <p>직원이 없습니다.</p>
                <p className="text-sm mt-2">
                  위의 "등록된 직원 전체 추가" 버튼을 누르거나, "직원 추가" 버튼을 눌러주세요.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {data.employees.map((emp, index) => (
                  <div key={emp.id} className="border rounded-lg p-4 bg-white">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-gray-700">
                        #{index + 1} {emp.name || '(이름 입력)'}
                        {emp.registeredId && (
                          <span className="ml-2 text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded">연동됨</span>
                        )}
                      </h3>
                      <div className="flex gap-2">
                        <button
                          onClick={() => autoCalculateDeductions(emp.id)}
                          className="text-blue-500 text-sm hover:underline"
                        >
                          🔄 자동계산
                        </button>
                        <button
                          onClick={() => removeEmployee(emp.id)}
                          className="text-red-500 text-sm hover:underline"
                        >
                          삭제
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 text-sm">
                      {/* 기본 정보 */}
                      <div>
                        <label className="text-gray-500 text-xs">이름</label>
                        <input
                          type="text"
                          className="input-field py-1"
                          value={emp.name}
                          onChange={(e) => updateEmployee(emp.id, 'name', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-gray-500 text-xs">직위</label>
                        <input
                          type="text"
                          className="input-field py-1"
                          value={emp.position}
                          onChange={(e) => updateEmployee(emp.id, 'position', e.target.value)}
                        />
                      </div>

                      {/* 지급 항목 */}
                      <div>
                        <label className="text-gray-500 text-xs">기본급</label>
                        <input
                          type="number"
                          className="input-field py-1"
                          value={emp.baseSalary || ''}
                          onChange={(e) => updateEmployee(emp.id, 'baseSalary', parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <div>
                        <label className="text-gray-500 text-xs">연장수당</label>
                        <input
                          type="number"
                          className="input-field py-1"
                          value={emp.overtime || ''}
                          onChange={(e) => updateEmployee(emp.id, 'overtime', parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <div>
                        <label className="text-gray-500 text-xs">야간수당</label>
                        <input
                          type="number"
                          className="input-field py-1"
                          value={emp.nightWork || ''}
                          onChange={(e) => updateEmployee(emp.id, 'nightWork', parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <div>
                        <label className="text-gray-500 text-xs">휴일수당</label>
                        <input
                          type="number"
                          className="input-field py-1"
                          value={emp.holidayWork || ''}
                          onChange={(e) => updateEmployee(emp.id, 'holidayWork', parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <div>
                        <label className="text-gray-500 text-xs">상여금</label>
                        <input
                          type="number"
                          className="input-field py-1"
                          value={emp.bonus || ''}
                          onChange={(e) => updateEmployee(emp.id, 'bonus', parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <div>
                        <label className="text-gray-500 text-xs">식대</label>
                        <input
                          type="number"
                          className="input-field py-1"
                          value={emp.mealAllowance || ''}
                          onChange={(e) => updateEmployee(emp.id, 'mealAllowance', parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <div>
                        <label className="text-gray-500 text-xs">차량유지비</label>
                        <input
                          type="number"
                          className="input-field py-1"
                          value={emp.carAllowance || ''}
                          onChange={(e) => updateEmployee(emp.id, 'carAllowance', parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <div>
                        <label className="text-gray-500 text-xs">기타수당</label>
                        <input
                          type="number"
                          className="input-field py-1"
                          value={emp.otherAllowance || ''}
                          onChange={(e) => updateEmployee(emp.id, 'otherAllowance', parseInt(e.target.value) || 0)}
                        />
                      </div>

                      {/* 공제 항목 */}
                      <div>
                        <label className="text-gray-500 text-xs">국민연금</label>
                        <input
                          type="number"
                          className="input-field py-1 bg-red-50"
                          value={emp.nationalPension || ''}
                          onChange={(e) => updateEmployee(emp.id, 'nationalPension', parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <div>
                        <label className="text-gray-500 text-xs">건강보험</label>
                        <input
                          type="number"
                          className="input-field py-1 bg-red-50"
                          value={emp.healthInsurance || ''}
                          onChange={(e) => updateEmployee(emp.id, 'healthInsurance', parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <div>
                        <label className="text-gray-500 text-xs">장기요양</label>
                        <input
                          type="number"
                          className="input-field py-1 bg-red-50"
                          value={emp.longTermCare || ''}
                          onChange={(e) => updateEmployee(emp.id, 'longTermCare', parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <div>
                        <label className="text-gray-500 text-xs">고용보험</label>
                        <input
                          type="number"
                          className="input-field py-1 bg-red-50"
                          value={emp.employmentInsurance || ''}
                          onChange={(e) => updateEmployee(emp.id, 'employmentInsurance', parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <div>
                        <label className="text-gray-500 text-xs">소득세</label>
                        <input
                          type="number"
                          className="input-field py-1 bg-red-50"
                          value={emp.incomeTax || ''}
                          onChange={(e) => updateEmployee(emp.id, 'incomeTax', parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <div>
                        <label className="text-gray-500 text-xs">지방소득세</label>
                        <input
                          type="number"
                          className="input-field py-1 bg-red-50"
                          value={emp.localTax || ''}
                          onChange={(e) => updateEmployee(emp.id, 'localTax', parseInt(e.target.value) || 0)}
                        />
                      </div>
                    </div>

                    {/* 합계 */}
                    <div className="mt-4 pt-3 border-t flex justify-between text-sm">
                      <div>
                        <span className="text-gray-500">지급 합계:</span>
                        <span className="font-bold text-green-600 ml-2">{formatCurrency(getTotalEarnings(emp))}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">공제 합계:</span>
                        <span className="font-bold text-red-600 ml-2">{formatCurrency(getTotalDeductions(emp))}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">실수령액:</span>
                        <span className="font-bold text-blue-600 ml-2">{formatCurrency(getNetPay(emp))}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 전체 합계 */}
          {data.employees.length > 0 && (
            <div className="form-section bg-gray-50">
              <h2 className="form-section-title">📊 전체 합계</h2>
              <div className="grid grid-cols-3 gap-6 text-center">
                <div>
                  <p className="text-gray-500 text-sm">총 지급액</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(
                      totals.baseSalary + totals.overtime + totals.nightWork + totals.holidayWork +
                      totals.bonus + totals.mealAllowance + totals.carAllowance + totals.otherAllowance
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">총 공제액</p>
                  <p className="text-2xl font-bold text-red-600">
                    {formatCurrency(
                      totals.nationalPension + totals.healthInsurance + totals.longTermCare +
                      totals.employmentInsurance + totals.incomeTax + totals.localTax
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">총 실지급액</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatCurrency(
                      data.employees.reduce((sum, e) => sum + getNetPay(e), 0)
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* 미리보기 */
        <div className="bg-white rounded-xl shadow-lg p-8 overflow-x-auto">
          <WageLedgerPreview data={data} />
        </div>
      )}

      {/* 인쇄용 */}
      <div className="hidden">
        <div ref={printRef}>
          <WageLedgerPreview data={data} />
        </div>
      </div>
    </div>
  );
}

function WageLedgerPreview({ data }: { data: WageLedgerData }) {
  const getTotalEarnings = (e: LedgerEmployee) => 
    e.baseSalary + e.overtime + e.nightWork + e.holidayWork + e.bonus + 
    e.mealAllowance + e.carAllowance + e.otherAllowance;

  const getTotalDeductions = (e: LedgerEmployee) =>
    e.nationalPension + e.healthInsurance + e.longTermCare + 
    e.employmentInsurance + e.incomeTax + e.localTax;

  const cellStyle = { border: '1px solid #d1d5db', padding: '8px', textAlign: 'center' as const, fontSize: '11px' };
  const headerStyle = { ...cellStyle, backgroundColor: '#1e40af', color: 'white', fontWeight: 600 };
  const subHeaderStyle = { ...cellStyle, backgroundColor: '#dbeafe', fontWeight: 500 };

  return (
    <div style={{ fontFamily: "'Pretendard', 'Nanum Gothic', sans-serif" }}>
      {/* 헤더 */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, marginBottom: '8px' }}>
          임 금 대 장
        </h1>
        <p style={{ fontSize: '14px', color: '#666' }}>
          {data.year}년 {data.month}월분
        </p>
      </div>

      {/* 회사 정보 */}
      <div style={{ marginBottom: '16px', fontSize: '13px' }}>
        <p><strong>사업장:</strong> {data.company.name}</p>
        <p><strong>사업자번호:</strong> {formatBusinessNumber(data.company.businessNumber)}</p>
      </div>

      {/* 테이블 */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
        <thead>
          <tr>
            <th rowSpan={2} style={headerStyle}>No</th>
            <th rowSpan={2} style={headerStyle}>성명</th>
            <th rowSpan={2} style={headerStyle}>직위</th>
            <th colSpan={8} style={headerStyle}>지급 항목</th>
            <th colSpan={6} style={headerStyle}>공제 항목</th>
            <th rowSpan={2} style={headerStyle}>실지급액</th>
          </tr>
          <tr>
            <th style={subHeaderStyle}>기본급</th>
            <th style={subHeaderStyle}>연장</th>
            <th style={subHeaderStyle}>야간</th>
            <th style={subHeaderStyle}>휴일</th>
            <th style={subHeaderStyle}>상여</th>
            <th style={subHeaderStyle}>식대</th>
            <th style={subHeaderStyle}>차량</th>
            <th style={subHeaderStyle}>기타</th>
            <th style={{ ...subHeaderStyle, backgroundColor: '#fee2e2' }}>국민</th>
            <th style={{ ...subHeaderStyle, backgroundColor: '#fee2e2' }}>건강</th>
            <th style={{ ...subHeaderStyle, backgroundColor: '#fee2e2' }}>장기</th>
            <th style={{ ...subHeaderStyle, backgroundColor: '#fee2e2' }}>고용</th>
            <th style={{ ...subHeaderStyle, backgroundColor: '#fee2e2' }}>소득세</th>
            <th style={{ ...subHeaderStyle, backgroundColor: '#fee2e2' }}>지방세</th>
          </tr>
        </thead>
        <tbody>
          {data.employees.map((emp, idx) => (
            <tr key={emp.id}>
              <td style={cellStyle}>{idx + 1}</td>
              <td style={cellStyle}>{emp.name}</td>
              <td style={cellStyle}>{emp.position}</td>
              <td style={cellStyle}>{emp.baseSalary.toLocaleString()}</td>
              <td style={cellStyle}>{emp.overtime.toLocaleString()}</td>
              <td style={cellStyle}>{emp.nightWork.toLocaleString()}</td>
              <td style={cellStyle}>{emp.holidayWork.toLocaleString()}</td>
              <td style={cellStyle}>{emp.bonus.toLocaleString()}</td>
              <td style={cellStyle}>{emp.mealAllowance.toLocaleString()}</td>
              <td style={cellStyle}>{emp.carAllowance.toLocaleString()}</td>
              <td style={cellStyle}>{emp.otherAllowance.toLocaleString()}</td>
              <td style={{ ...cellStyle, backgroundColor: '#fef2f2' }}>{emp.nationalPension.toLocaleString()}</td>
              <td style={{ ...cellStyle, backgroundColor: '#fef2f2' }}>{emp.healthInsurance.toLocaleString()}</td>
              <td style={{ ...cellStyle, backgroundColor: '#fef2f2' }}>{emp.longTermCare.toLocaleString()}</td>
              <td style={{ ...cellStyle, backgroundColor: '#fef2f2' }}>{emp.employmentInsurance.toLocaleString()}</td>
              <td style={{ ...cellStyle, backgroundColor: '#fef2f2' }}>{emp.incomeTax.toLocaleString()}</td>
              <td style={{ ...cellStyle, backgroundColor: '#fef2f2' }}>{emp.localTax.toLocaleString()}</td>
              <td style={{ ...cellStyle, fontWeight: 600, color: '#1e40af' }}>
                {(getTotalEarnings(emp) - getTotalDeductions(emp)).toLocaleString()}
              </td>
            </tr>
          ))}
          {/* 합계 행 */}
          <tr style={{ backgroundColor: '#f3f4f6', fontWeight: 600 }}>
            <td colSpan={3} style={cellStyle}>합 계</td>
            <td style={cellStyle}>{data.employees.reduce((s, e) => s + e.baseSalary, 0).toLocaleString()}</td>
            <td style={cellStyle}>{data.employees.reduce((s, e) => s + e.overtime, 0).toLocaleString()}</td>
            <td style={cellStyle}>{data.employees.reduce((s, e) => s + e.nightWork, 0).toLocaleString()}</td>
            <td style={cellStyle}>{data.employees.reduce((s, e) => s + e.holidayWork, 0).toLocaleString()}</td>
            <td style={cellStyle}>{data.employees.reduce((s, e) => s + e.bonus, 0).toLocaleString()}</td>
            <td style={cellStyle}>{data.employees.reduce((s, e) => s + e.mealAllowance, 0).toLocaleString()}</td>
            <td style={cellStyle}>{data.employees.reduce((s, e) => s + e.carAllowance, 0).toLocaleString()}</td>
            <td style={cellStyle}>{data.employees.reduce((s, e) => s + e.otherAllowance, 0).toLocaleString()}</td>
            <td style={{ ...cellStyle, backgroundColor: '#fef2f2' }}>{data.employees.reduce((s, e) => s + e.nationalPension, 0).toLocaleString()}</td>
            <td style={{ ...cellStyle, backgroundColor: '#fef2f2' }}>{data.employees.reduce((s, e) => s + e.healthInsurance, 0).toLocaleString()}</td>
            <td style={{ ...cellStyle, backgroundColor: '#fef2f2' }}>{data.employees.reduce((s, e) => s + e.longTermCare, 0).toLocaleString()}</td>
            <td style={{ ...cellStyle, backgroundColor: '#fef2f2' }}>{data.employees.reduce((s, e) => s + e.employmentInsurance, 0).toLocaleString()}</td>
            <td style={{ ...cellStyle, backgroundColor: '#fef2f2' }}>{data.employees.reduce((s, e) => s + e.incomeTax, 0).toLocaleString()}</td>
            <td style={{ ...cellStyle, backgroundColor: '#fef2f2' }}>{data.employees.reduce((s, e) => s + e.localTax, 0).toLocaleString()}</td>
            <td style={{ ...cellStyle, fontWeight: 700, color: '#1e40af' }}>
              {data.employees.reduce((s, e) => s + getTotalEarnings(e) - getTotalDeductions(e), 0).toLocaleString()}
            </td>
          </tr>
        </tbody>
      </table>

      {/* 푸터 */}
      <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end', gap: '48px' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '12px', color: '#666', marginBottom: '24px' }}>작성자</p>
          <p style={{ borderTop: '1px solid #333', paddingTop: '8px', width: '120px' }}>(인)</p>
        </div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '12px', color: '#666', marginBottom: '24px' }}>확인자</p>
          <p style={{ borderTop: '1px solid #333', paddingTop: '8px', width: '120px' }}>(인)</p>
        </div>
      </div>
    </div>
  );
}
