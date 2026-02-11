'use client';

import { useState, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { CompanyInfo, EmployeeInfo, Employee } from '@/types';
import { loadCompanyInfo, defaultCompanyInfo, formatDate, formatCurrency, formatBusinessNumber, formatResidentNumber, getActiveEmployees } from '@/lib/storage';
import { MINIMUM_WAGE } from '@/lib/constants';
import HelpGuide from '@/components/HelpGuide';

interface ContractData {
  company: CompanyInfo;
  employee: EmployeeInfo;
  contractDate: string;
  startDate: string;
  workplace: string;
  jobDescription: string;
  position: string;
  department: string;
  workStartTime: string;
  workEndTime: string;
  breakTime: number;
  workDays: string[];
  weeklyHoliday: string;
  baseSalary: number;
  annualSalary: number;
  salaryType: string;
  paymentMethod: string;
  bonusInfo: string;
  mealAllowance: number;
  transportAllowance: number;
  childcareAllowance: number;
  researchAllowance: number;
  vehicleAllowance: number;
  otherAllowance: string;
  otherAllowanceAmount: number;
  paymentDate: number;
  annualLeave: number;
  annualLeaveType: 'hireDate' | 'fiscalYear';
  probationPeriod: number;
  probationSalaryRate: number;
  insurance: {
    national: boolean;
    health: boolean;
    employment: boolean;
    industrial: boolean;
  };
  specialTerms: string;
}

const defaultEmployee: EmployeeInfo = {
  name: '',
  residentNumber: '',
  address: '',
  phone: '',
};

const defaultContract: ContractData = {
  company: defaultCompanyInfo,
  employee: defaultEmployee,
  contractDate: new Date().toISOString().split('T')[0],
  startDate: '',
  workplace: '',
  jobDescription: '',
  position: '',
  department: '',
  workStartTime: '09:00',
  workEndTime: '18:00',
  breakTime: 60,
  workDays: ['월', '화', '수', '목', '금'],
  weeklyHoliday: '매주 토요일, 일요일',
  baseSalary: 0,
  annualSalary: 0,
  salaryType: '월급',
  paymentMethod: '근로자 명의 예금통장에 입금',
  bonusInfo: '',
  mealAllowance: 200000,
  transportAllowance: 0,
  childcareAllowance: 0,
  researchAllowance: 0,
  vehicleAllowance: 0,
  otherAllowance: '',
  otherAllowanceAmount: 0,
  paymentDate: 25,
  annualLeave: 15,
  annualLeaveType: 'hireDate',
  probationPeriod: 3,
  probationSalaryRate: 100,
  insurance: {
    national: true,
    health: true,
    employment: true,
    industrial: true,
  },
  specialTerms: '',
};

const WEEKDAYS = ['월', '화', '수', '목', '금', '토', '일'];

export default function FulltimeContractPage() {
  const [contract, setContract] = useState<ContractData>(() => {
    if (typeof window === 'undefined') return defaultContract;
    const saved = loadCompanyInfo();
    return saved ? { ...defaultContract, company: saved, workplace: saved.address } : defaultContract;
  });
  const [showPreview, setShowPreview] = useState(false);
  // 등록된 정규직 직원 목록
  const [employees] = useState<Employee[]>(() =>
    typeof window !== 'undefined' ? getActiveEmployees().filter(e => e.employmentType === 'fulltime') : []
  );
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const printRef = useRef<HTMLDivElement>(null);

  // 직원 선택 시 정보 자동 입력
  const handleEmployeeSelect = (employeeId: string) => {
    setSelectedEmployeeId(employeeId);
    if (!employeeId) return;
    
    const emp = employees.find(e => e.id === employeeId);
    if (!emp) return;

    setContract(prev => ({
      ...prev,
      employee: emp.info,
      startDate: emp.hireDate,
      department: emp.department || '',
      position: emp.position || '',
      workStartTime: emp.workCondition.workStartTime,
      workEndTime: emp.workCondition.workEndTime,
      breakTime: emp.workCondition.breakTime,
      workDays: emp.workCondition.workDays,
      baseSalary: emp.salary.baseSalary,
      annualSalary: emp.salary.baseSalary * 12,
      mealAllowance: emp.salary.mealAllowance,
      transportAllowance: emp.salary.carAllowance,
      insurance: emp.insurance,
    }));
  };

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `정규직_근로계약서_${contract.employee.name || '이름없음'}`,
  });

  // 연봉 ↔ 월급 자동 계산 포함
  const updateContract = (field: string, value: unknown) => {
    setContract(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'annualSalary' && typeof value === 'number' && value > 0 && prev.baseSalary === 0) {
        next.baseSalary = Math.round(value / 12);
      }
      return next;
    });
  };

  const updateEmployee = (field: keyof EmployeeInfo, value: string) => {
    setContract(prev => ({
      ...prev,
      employee: { ...prev.employee, [field]: value }
    }));
  };

  const toggleWorkDay = (day: string) => {
    setContract(prev => ({
      ...prev,
      workDays: prev.workDays.includes(day)
        ? prev.workDays.filter(d => d !== day)
        : [...prev.workDays, day]
    }));
  };

  const toggleInsurance = (key: keyof typeof contract.insurance) => {
    setContract(prev => ({
      ...prev,
      insurance: { ...prev.insurance, [key]: !prev.insurance[key] }
    }));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">📄 정규직 근로계약서</h1>
          <p className="text-gray-500 mt-1">고용노동부 표준 양식 기반 + 실무 강화</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="btn-secondary"
          >
            {showPreview ? '✏️ 수정' : '👁️ 미리보기'}
          </button>
          <button
            onClick={() => handlePrint()}
            className="btn-primary"
            disabled={!contract.employee.name}
          >
            🖨️ 인쇄/PDF
          </button>
        </div>
      </div>

      <HelpGuide
        pageKey="contract-fulltime"
        steps={[
          '상단 "직원 선택"에서 등록된 직원을 선택하면 정보가 자동 입력됩니다.',
          '근무 조건(근무시간, 급여 등)을 확인하고 필요시 수정하세요.',
          '"미리보기"로 완성된 계약서를 확인한 뒤 "인쇄/PDF"로 출력하세요.',
        ]}
      />

      {!showPreview ? (
        <div className="space-y-6">
          {/* 회사 정보 */}
          <div className="form-section">
            <h2 className="form-section-title">🏢 사용자(회사) 정보</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="input-label">회사명</label>
                <input
                  type="text"
                  className="input-field bg-gray-50"
                  value={contract.company.name}
                  readOnly
                />
              </div>
              <div>
                <label className="input-label">사업자등록번호</label>
                <input
                  type="text"
                  className="input-field bg-gray-50"
                  value={formatBusinessNumber(contract.company.businessNumber)}
                  readOnly
                />
              </div>
              <div className="md:col-span-2">
                <label className="input-label">주소</label>
                <input
                  type="text"
                  className="input-field bg-gray-50"
                  value={contract.company.address}
                  readOnly
                />
              </div>
              <div>
                <label className="input-label">대표자</label>
                <input
                  type="text"
                  className="input-field bg-gray-50"
                  value={contract.company.ceoName}
                  readOnly
                />
              </div>
              <div>
                <label className="input-label">연락처</label>
                <input
                  type="text"
                  className="input-field bg-gray-50"
                  value={contract.company.phone}
                  readOnly
                />
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">* 회사 정보는 설정에서 수정할 수 있습니다.</p>
          </div>

          {/* 근로자 정보 */}
          <div className="form-section">
            <h2 className="form-section-title">👤 근로자 정보</h2>
            
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
                  💡 직원을 선택하면 모든 정보가 자동으로 입력됩니다.
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
                  value={contract.employee.name}
                  onChange={(e) => updateEmployee('name', e.target.value)}
                />
              </div>
              <div>
                <label className="input-label">주민등록번호 *</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="990101-1234567"
                  value={contract.employee.residentNumber}
                  onChange={(e) => updateEmployee('residentNumber', e.target.value.replace(/[^0-9-]/g, '').slice(0, 14))}
                />
              </div>
              <div className="md:col-span-2">
                <label className="input-label">주소 *</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="서울시 강남구 테헤란로 123"
                  value={contract.employee.address}
                  onChange={(e) => updateEmployee('address', e.target.value)}
                />
              </div>
              <div>
                <label className="input-label">연락처 *</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="010-1234-5678"
                  value={contract.employee.phone}
                  onChange={(e) => updateEmployee('phone', e.target.value.replace(/[^0-9-]/g, '').slice(0, 13))}
                />
              </div>
            </div>
          </div>

          {/* 계약 정보 */}
          <div className="form-section">
            <h2 className="form-section-title">📅 계약 정보</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="input-label">계약 체결일 *</label>
                <input
                  type="date"
                  className="input-field"
                  value={contract.contractDate}
                  onChange={(e) => updateContract('contractDate', e.target.value)}
                />
              </div>
              <div>
                <label className="input-label">근무 시작일 *</label>
                <input
                  type="date"
                  className="input-field"
                  value={contract.startDate}
                  onChange={(e) => updateContract('startDate', e.target.value)}
                />
              </div>
              <div>
                <label className="input-label">부서</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="예: 개발팀, 영업부"
                  value={contract.department}
                  onChange={(e) => updateContract('department', e.target.value)}
                />
              </div>
              <div>
                <label className="input-label">직위/직책</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="예: 사원, 대리, 과장"
                  value={contract.position}
                  onChange={(e) => updateContract('position', e.target.value)}
                />
              </div>
              <div className="md:col-span-2">
                <label className="input-label">근무 장소 *</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="본사 사무실"
                  value={contract.workplace}
                  onChange={(e) => updateContract('workplace', e.target.value)}
                />
              </div>
              <div className="md:col-span-2">
                <label className="input-label">업무 내용 *</label>
                <textarea
                  className="input-field min-h-[80px]"
                  placeholder="예: 소프트웨어 개발 및 유지보수, 고객 상담 업무 등"
                  value={contract.jobDescription}
                  onChange={(e) => updateContract('jobDescription', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* 수습기간 */}
          <div className="form-section">
            <h2 className="form-section-title">📝 수습기간</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="input-label">수습기간 (개월)</label>
                <select
                  className="input-field"
                  value={contract.probationPeriod}
                  onChange={(e) => updateContract('probationPeriod', parseInt(e.target.value))}
                >
                  <option value={0}>없음</option>
                  <option value={1}>1개월</option>
                  <option value={2}>2개월</option>
                  <option value={3}>3개월</option>
                  <option value={6}>6개월</option>
                </select>
              </div>
              <div>
                <label className="input-label">수습기간 급여 비율 (%)</label>
                <select
                  className="input-field"
                  value={contract.probationSalaryRate}
                  onChange={(e) => updateContract('probationSalaryRate', parseInt(e.target.value))}
                >
                  <option value={100}>100% (동일)</option>
                  <option value={90}>90%</option>
                  <option value={80}>80%</option>
                </select>
                <p className="text-xs text-gray-400 mt-1">* 최저임금 미만 불가</p>
                {contract.probationSalaryRate < 100 && contract.baseSalary > 0 && (() => {
                  const probationMonthly = Math.round(contract.baseSalary * contract.probationSalaryRate / 100);
                  const minProbationMonthly = Math.round(MINIMUM_WAGE.monthly * 0.9);
                  return probationMonthly < minProbationMonthly ? (
                    <p className="text-red-500 text-xs mt-1 font-medium">
                      ⚠️ 수습 월급 {formatCurrency(probationMonthly)}이 최저임금 90%({formatCurrency(minProbationMonthly)})에 미달합니다.
                    </p>
                  ) : null;
                })()}
              </div>
            </div>
          </div>

          {/* 근로시간 */}
          <div className="form-section">
            <h2 className="form-section-title">⏰ 근로시간</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="input-label">시작 시간</label>
                <input
                  type="time"
                  className="input-field"
                  value={contract.workStartTime}
                  onChange={(e) => updateContract('workStartTime', e.target.value)}
                />
              </div>
              <div>
                <label className="input-label">종료 시간</label>
                <input
                  type="time"
                  className="input-field"
                  value={contract.workEndTime}
                  onChange={(e) => updateContract('workEndTime', e.target.value)}
                />
              </div>
              <div>
                <label className="input-label">휴게시간 (분)</label>
                <input
                  type="number"
                  className="input-field"
                  value={contract.breakTime}
                  onChange={(e) => updateContract('breakTime', parseInt(e.target.value) || 0)}
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="input-label">근무 요일</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {WEEKDAYS.map(day => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleWorkDay(day)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      contract.workDays.includes(day)
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-4">
              <label className="input-label">주휴일 *</label>
              <select
                className="input-field"
                value={contract.weeklyHoliday}
                onChange={(e) => updateContract('weeklyHoliday', e.target.value)}
              >
                <option value="매주 일요일">매주 일요일</option>
                <option value="매주 토요일">매주 토요일</option>
                <option value="매주 토요일, 일요일">매주 토요일, 일요일</option>
                <option value="주 1회 (별도 지정)">주 1회 (별도 지정)</option>
              </select>
              <p className="text-xs text-gray-400 mt-1">
                근로기준법 제55조 - 1주 1회 이상 유급휴일 필수
              </p>
            </div>
          </div>

          {/* 급여 */}
          <div className="form-section">
            <h2 className="form-section-title">💰 임금 (근로기준법 제17조 필수)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="input-label">급여 형태 *</label>
                <select
                  className="input-field"
                  value={contract.salaryType}
                  onChange={(e) => updateContract('salaryType', e.target.value)}
                >
                  <option value="월급">월급제</option>
                  <option value="연봉">연봉제</option>
                </select>
              </div>
              <div>
                <label className="input-label">연봉 (원)</label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="36000000"
                  value={contract.annualSalary || ''}
                  onChange={(e) => {
                    const annual = parseInt(e.target.value) || 0;
                    setContract(prev => ({
                      ...prev,
                      annualSalary: annual,
                      baseSalary: Math.round(annual / 12)
                    }));
                  }}
                />
                <p className="text-xs text-gray-400 mt-1">
                  {contract.annualSalary > 0 && `= ${formatCurrency(contract.annualSalary)}`}
                </p>
              </div>
              <div>
                <label className="input-label">월 기본급 (원) *</label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="3000000"
                  value={contract.baseSalary || ''}
                  onChange={(e) => {
                    const monthly = parseInt(e.target.value) || 0;
                    setContract(prev => ({
                      ...prev,
                      baseSalary: monthly,
                      annualSalary: monthly * 12,
                    }));
                  }}
                />
                <p className="text-xs text-gray-400 mt-1">
                  {contract.baseSalary > 0 && `= ${formatCurrency(contract.baseSalary)} (세전)`}
                </p>
              </div>
              <div>
                <label className="input-label">지급방법 *</label>
                <select
                  className="input-field"
                  value={contract.paymentMethod}
                  onChange={(e) => updateContract('paymentMethod', e.target.value)}
                >
                  <option value="근로자 명의 예금통장에 입금">근로자 명의 예금통장 입금</option>
                  <option value="현금 직접 지급">현금 직접 지급</option>
                </select>
              </div>
              <div>
                <label className="input-label">급여 지급일</label>
                <select
                  className="input-field"
                  value={contract.paymentDate}
                  onChange={(e) => updateContract('paymentDate', parseInt(e.target.value))}
                >
                  {Array.from({ length: 28 }, (_, i) => i + 1).map(day => (
                    <option key={day} value={day}>매월 {day}일</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="input-label">상여금</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="예: 연 400% (설/추석 각 100%, 하계/연말 각 100%)"
                  value={contract.bonusInfo}
                  onChange={(e) => updateContract('bonusInfo', e.target.value)}
                />
              </div>
              <div>
                <label className="input-label">식대 (비과세, 월)</label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="200000"
                  value={contract.mealAllowance || ''}
                  onChange={(e) => updateContract('mealAllowance', parseInt(e.target.value) || 0)}
                />
                <p className="text-xs text-gray-400 mt-1">월 20만원까지 비과세</p>
              </div>
              <div>
                <label className="input-label">교통비 (월)</label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="100000"
                  value={contract.transportAllowance || ''}
                  onChange={(e) => updateContract('transportAllowance', parseInt(e.target.value) || 0)}
                />
              </div>
              <div>
                <label className="input-label">자가운전보조금 (비과세, 월)</label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="200000"
                  value={contract.vehicleAllowance || ''}
                  onChange={(e) => updateContract('vehicleAllowance', parseInt(e.target.value) || 0)}
                />
                <p className="text-xs text-gray-400 mt-1">본인 차량 업무사용 시 월 20만원 비과세</p>
              </div>
              <div>
                <label className="input-label">보육수당 (비과세, 월)</label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="200000"
                  value={contract.childcareAllowance || ''}
                  onChange={(e) => updateContract('childcareAllowance', parseInt(e.target.value) || 0)}
                />
                <p className="text-xs text-gray-400 mt-1">6세 이하 자녀 보육 시 월 20만원 비과세</p>
              </div>
              <div>
                <label className="input-label">연구보조비 (비과세, 월)</label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="200000"
                  value={contract.researchAllowance || ''}
                  onChange={(e) => updateContract('researchAllowance', parseInt(e.target.value) || 0)}
                />
                <p className="text-xs text-gray-400 mt-1">연구활동종사자 월 20만원 비과세</p>
              </div>
              <div>
                <label className="input-label">기타 수당 내역</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="예: 직책수당, 자격수당"
                  value={contract.otherAllowance}
                  onChange={(e) => updateContract('otherAllowance', e.target.value)}
                />
              </div>
              <div>
                <label className="input-label">기타 수당 금액 (월)</label>
                <input
                  type="number"
                  className="input-field"
                  placeholder="300000"
                  value={contract.otherAllowanceAmount || ''}
                  onChange={(e) => updateContract('otherAllowanceAmount', parseInt(e.target.value) || 0)}
                />
                {contract.otherAllowanceAmount > 0 && (
                  <p className="text-xs text-gray-400 mt-1">= {formatCurrency(contract.otherAllowanceAmount)}</p>
                )}
              </div>
              <div>
                <label className="input-label">연차휴가 (일)</label>
                <input
                  type="number"
                  className="input-field"
                  value={contract.annualLeave}
                  onChange={(e) => updateContract('annualLeave', parseInt(e.target.value) || 0)}
                />
                <p className="text-xs text-gray-400 mt-1">근로기준법 제60조 (1년 근속 시 15일)</p>
              </div>
              <div>
                <label className="input-label">연차휴가 산정기준</label>
                <select
                  className="input-field"
                  value={contract.annualLeaveType}
                  onChange={(e) => updateContract('annualLeaveType', e.target.value)}
                >
                  <option value="hireDate">입사일 기준</option>
                  <option value="fiscalYear">회계연도 기준</option>
                </select>
                <p className="text-xs text-gray-400 mt-1">
                  {contract.annualLeaveType === 'hireDate'
                    ? '입사일로부터 1년 단위로 연차 발생'
                    : '매년 1/1~12/31 기준으로 연차 발생 (비례부여)'}
                </p>
              </div>
            </div>
          </div>

          {/* 4대보험 */}
          <div className="form-section">
            <h2 className="form-section-title">🏥 사회보험 가입 <span className="text-xs font-normal text-zinc-400">2026년 기준</span></h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { key: 'national', label: '국민연금', rate: '4.75%' },
                { key: 'health', label: '건강보험', rate: '3.595%' },
                { key: 'employment', label: '고용보험', rate: '0.9%' },
                { key: 'industrial', label: '산재보험', rate: '전액 사업주' },
              ].map(item => (
                <label key={item.key} className="flex items-center gap-2 cursor-pointer p-3 bg-gray-50 rounded-lg">
                  <input
                    type="checkbox"
                    checked={contract.insurance[item.key as keyof typeof contract.insurance]}
                    onChange={() => toggleInsurance(item.key as keyof typeof contract.insurance)}
                    className="w-5 h-5 text-blue-600 rounded"
                  />
                  <div>
                    <span className="text-gray-700 font-medium">{item.label}</span>
                    <p className="text-xs text-gray-400">{item.rate}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* 특약사항 */}
          <div className="form-section">
            <h2 className="form-section-title">📋 특약사항</h2>
            <textarea
              className="input-field min-h-[100px]"
              placeholder="예: 비밀유지 의무, 경업금지 조항, 특별 복리후생 등"
              value={contract.specialTerms}
              onChange={(e) => updateContract('specialTerms', e.target.value)}
            />
          </div>
        </div>
      ) : (
        /* 미리보기 */
        <div className="bg-white rounded-xl shadow-lg p-8">
          <ContractPreview contract={contract} />
        </div>
      )}

      {/* 인쇄용 (숨겨진 영역) */}
      <div className="hidden">
        <div ref={printRef}>
          <ContractPreview contract={contract} />
        </div>
      </div>
    </div>
  );
}

function ContractPreview({ contract }: { contract: ContractData }) {
  const insuranceList = [];
  if (contract.insurance.national) insuranceList.push('국민연금');
  if (contract.insurance.health) insuranceList.push('건강보험');
  if (contract.insurance.employment) insuranceList.push('고용보험');
  if (contract.insurance.industrial) insuranceList.push('산재보험');

  // 소정근로시간 계산
  const startHour = parseInt(contract.workStartTime.split(':')[0]);
  const startMin = parseInt(contract.workStartTime.split(':')[1]);
  const endHour = parseInt(contract.workEndTime.split(':')[0]);
  const endMin = parseInt(contract.workEndTime.split(':')[1]);
  const totalMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin) - contract.breakTime;
  const dailyHours = Math.floor(totalMinutes / 60);
  const dailyMins = totalMinutes % 60;
  const rawWeeklyHours = totalMinutes * contract.workDays.length / 60;
  // 근로기준법 제50조: 주 소정근로시간은 40시간 상한
  const weeklyPrescribedHours = Math.min(rawWeeklyHours, 40);
  const weeklyOvertimeHours = Math.max(rawWeeklyHours - 40, 0);

  // 월 소정근로시간 동적 계산: (주 소정근로시간 + 유급주휴시간) × (365/12/7)
  const dailyPrescribedHours = contract.workDays.length > 0 ? weeklyPrescribedHours / contract.workDays.length : 8;
  const monthlyPrescribedHours = Math.round((weeklyPrescribedHours + dailyPrescribedHours) * 365 / 12 / 7);

  // 총 월급 계산 (기타수당 금액 포함)
  const totalMonthlySalary = contract.baseSalary + (contract.mealAllowance || 0) + (contract.transportAllowance || 0) + (contract.childcareAllowance || 0) + (contract.researchAllowance || 0) + (contract.vehicleAllowance || 0) + (contract.otherAllowanceAmount || 0);

  const cellStyle = { border: '1px solid #d1d5db', padding: '10px 14px', verticalAlign: 'top' as const };
  const headerStyle = { ...cellStyle, backgroundColor: '#f8fafc', fontWeight: 600, width: '140px', color: '#374151' };
  const sectionHeaderStyle = { 
    backgroundColor: '#1e40af', 
    color: 'white', 
    padding: '10px 14px', 
    fontWeight: 600,
    fontSize: '13px',
    letterSpacing: '0.5px'
  };

  return (
    <div className="contract-document" style={{ fontFamily: "'Pretendard', 'Nanum Gothic', sans-serif", color: '#1f2937', lineHeight: 1.6 }}>
      {/* 헤더 */}
      <div style={{ textAlign: 'center', marginBottom: '32px', borderBottom: '3px solid #1e40af', paddingBottom: '20px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#1e40af', marginBottom: '8px', letterSpacing: '2px' }}>
          근 로 계 약 서
        </h1>
        <p style={{ fontSize: '13px', color: '#6b7280' }}>
          Standard Employment Contract
        </p>
      </div>

      {/* 서문 */}
      <div style={{ backgroundColor: '#f8fafc', padding: '16px 20px', borderRadius: '8px', marginBottom: '24px', border: '1px solid #e5e7eb' }}>
        <p style={{ fontSize: '14px', lineHeight: 1.8 }}>
          <strong style={{ color: '#1e40af' }}>{contract.company.name}</strong> (이하 {'"'}사용자{'"'}라 함)과
          <strong style={{ color: '#1e40af' }}> {contract.employee.name}</strong> (이하 {'"'}근로자{'"'}라 함)은 
          다음과 같이 근로계약을 체결하고, 이를 성실히 이행할 것을 약정한다.
        </p>
      </div>

      {/* 제1조 계약기간 및 근무 */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
        <thead>
          <tr>
            <th colSpan={2} style={sectionHeaderStyle}>제1조 [계약기간 및 근무]</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th style={headerStyle}>계약기간</th>
            <td style={cellStyle}>
              <strong>{formatDate(contract.startDate)}</strong> 부터 <strong>정함이 없음</strong> (정규직)
              {contract.probationPeriod > 0 && (
                <><br /><span style={{ color: '#6b7280', fontSize: '13px' }}>
                  ※ 수습기간: 입사일로부터 {contract.probationPeriod}개월 (급여 {contract.probationSalaryRate}%)
                </span></>
              )}
            </td>
          </tr>
          <tr>
            <th style={headerStyle}>근무장소</th>
            <td style={cellStyle}>{contract.workplace}</td>
          </tr>
          <tr>
            <th style={headerStyle}>소속부서</th>
            <td style={cellStyle}>{contract.department || '추후 지정'}</td>
          </tr>
          <tr>
            <th style={headerStyle}>직위/직책</th>
            <td style={cellStyle}>{contract.position || '사원'}</td>
          </tr>
          <tr>
            <th style={headerStyle}>담당업무</th>
            <td style={cellStyle}>{contract.jobDescription}</td>
          </tr>
        </tbody>
      </table>

      {/* 제2조 근로시간 및 휴게 */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
        <thead>
          <tr>
            <th colSpan={2} style={sectionHeaderStyle}>제2조 [근로시간 및 휴게]</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th style={headerStyle}>근로시간</th>
            <td style={cellStyle}>
              <strong>{contract.workStartTime}</strong> ~ <strong>{contract.workEndTime}</strong><br />
              <span style={{ color: '#6b7280', fontSize: '13px' }}>
                (1일 소정근로시간: {dailyHours}시간 {dailyMins > 0 ? `${dailyMins}분` : ''},
                주 소정근로시간: {weeklyPrescribedHours}시간)
              </span>
              {weeklyOvertimeHours > 0 && (
                <>
                  <br />
                  <span style={{ color: '#dc2626', fontSize: '13px', fontWeight: 600 }}>
                    ※ 주 연장근로시간: {weeklyOvertimeHours}시간 (통상임금의 50% 가산)
                  </span>
                </>
              )}
            </td>
          </tr>
          <tr>
            <th style={headerStyle}>휴게시간</th>
            <td style={cellStyle}>{contract.breakTime}분 (근로시간 도중 자유롭게 이용)</td>
          </tr>
          <tr>
            <th style={headerStyle}>근무요일</th>
            <td style={cellStyle}>{contract.workDays.join(', ')} (주 {contract.workDays.length}일)</td>
          </tr>
          <tr>
            <th style={headerStyle}>연장근로</th>
            <td style={cellStyle}>
              당사자 합의에 의해 1주 12시간 한도 내에서 연장근로 가능<br />
              <span style={{ color: '#6b7280', fontSize: '13px' }}>
                ※ 연장·야간·휴일 근로 시 통상임금의 50% 가산 지급 (근로기준법 제56조)
              </span>
            </td>
          </tr>
        </tbody>
      </table>

      {/* 제3조 휴일 및 휴가 */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
        <thead>
          <tr>
            <th colSpan={2} style={sectionHeaderStyle}>제3조 [휴일 및 휴가] (근로기준법 제55조, 제60조)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th style={headerStyle}>주휴일</th>
            <td style={cellStyle}>
              <strong>{contract.weeklyHoliday}</strong> (유급)
            </td>
          </tr>
          <tr>
            <th style={headerStyle}>유급휴일</th>
            <td style={cellStyle}>
              • 근로자의 날 (5월 1일)<br />
              • 관공서 공휴일에 관한 규정에 따른 공휴일 및 대체공휴일
            </td>
          </tr>
          <tr>
            <th style={headerStyle}>연차유급휴가</th>
            <td style={cellStyle}>
              연간 <strong>{contract.annualLeave}일</strong> ({contract.annualLeaveType === 'hireDate' ? '입사일 기준' : '회계연도 기준'}으로 발생)<br />
              <span style={{ color: '#6b7280', fontSize: '13px' }}>
                {contract.annualLeaveType === 'hireDate' ? (
                  <>
                    ※ 입사일로부터 1년 단위로 연차 산정 (근로기준법 제60조)<br />
                    ※ 1년 미만 근로자: 1개월 개근 시 1일 발생<br />
                    ※ 3년 이상 계속 근로 시 2년마다 1일 추가 (최대 25일)
                  </>
                ) : (
                  <>
                    ※ 매년 1월 1일 ~ 12월 31일 기준으로 연차 산정<br />
                    ※ 입사 첫해: 근무 개월 수에 비례하여 부여<br />
                    ※ 3년 이상 계속 근로 시 2년마다 1일 추가 (최대 25일)
                  </>
                )}
              </span>
            </td>
          </tr>
        </tbody>
      </table>

      {/* 제4조 임금 */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
        <thead>
          <tr>
            <th colSpan={2} style={sectionHeaderStyle}>제4조 [임금] (근로기준법 제17조 필수 명시사항)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th style={headerStyle}>임금형태</th>
            <td style={cellStyle}><strong>{contract.salaryType}제</strong></td>
          </tr>
          <tr>
            <th style={headerStyle}>임금구성</th>
            <td style={cellStyle}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  <tr>
                    <td style={{ padding: '4px 0', width: '120px' }}>기본급</td>
                    <td style={{ padding: '4px 0', textAlign: 'right' }}>{formatCurrency(contract.baseSalary)}</td>
                  </tr>
                  {contract.mealAllowance > 0 && (
                    <tr>
                      <td style={{ padding: '4px 0' }}>식대 (비과세)</td>
                      <td style={{ padding: '4px 0', textAlign: 'right' }}>{formatCurrency(contract.mealAllowance)}</td>
                    </tr>
                  )}
                  {contract.transportAllowance > 0 && (
                    <tr>
                      <td style={{ padding: '4px 0' }}>교통비</td>
                      <td style={{ padding: '4px 0', textAlign: 'right' }}>{formatCurrency(contract.transportAllowance)}</td>
                    </tr>
                  )}
                  {contract.vehicleAllowance > 0 && (
                    <tr>
                      <td style={{ padding: '4px 0' }}>자가운전보조금 (비과세)</td>
                      <td style={{ padding: '4px 0', textAlign: 'right' }}>{formatCurrency(contract.vehicleAllowance)}</td>
                    </tr>
                  )}
                  {contract.childcareAllowance > 0 && (
                    <tr>
                      <td style={{ padding: '4px 0' }}>보육수당 (비과세)</td>
                      <td style={{ padding: '4px 0', textAlign: 'right' }}>{formatCurrency(contract.childcareAllowance)}</td>
                    </tr>
                  )}
                  {contract.researchAllowance > 0 && (
                    <tr>
                      <td style={{ padding: '4px 0' }}>연구보조비 (비과세)</td>
                      <td style={{ padding: '4px 0', textAlign: 'right' }}>{formatCurrency(contract.researchAllowance)}</td>
                    </tr>
                  )}
                  {(contract.otherAllowance || contract.otherAllowanceAmount > 0) && (
                    <tr>
                      <td style={{ padding: '4px 0' }}>기타수당{contract.otherAllowance ? ` (${contract.otherAllowance})` : ''}</td>
                      <td style={{ padding: '4px 0', textAlign: 'right' }}>{formatCurrency(contract.otherAllowanceAmount)}</td>
                    </tr>
                  )}
                  <tr style={{ borderTop: '1px solid #d1d5db', fontWeight: 600 }}>
                    <td style={{ padding: '8px 0' }}>월 합계</td>
                    <td style={{ padding: '8px 0', textAlign: 'right', color: '#1e40af' }}>{formatCurrency(totalMonthlySalary)}</td>
                  </tr>
                </tbody>
              </table>
              {contract.annualSalary > 0 && (
                <p style={{ color: '#6b7280', fontSize: '13px', marginTop: '8px' }}>
                  ※ 연봉 환산: {formatCurrency(contract.annualSalary)} (세전)
                </p>
              )}
            </td>
          </tr>
          {contract.bonusInfo && (
            <tr>
              <th style={headerStyle}>상여금</th>
              <td style={cellStyle}>{contract.bonusInfo}</td>
            </tr>
          )}
          <tr>
            <th style={headerStyle}>임금지급일</th>
            <td style={cellStyle}>
              매월 <strong>{contract.paymentDate}일</strong> (휴일인 경우 그 전일 지급)
            </td>
          </tr>
          <tr>
            <th style={headerStyle}>지급방법</th>
            <td style={cellStyle}>{contract.paymentMethod}</td>
          </tr>
          <tr>
            <th style={headerStyle}>임금계산</th>
            <td style={cellStyle}>
              <span style={{ color: '#6b7280', fontSize: '13px' }}>
                • 통상시급 = 월 기본급 ÷ {monthlyPrescribedHours}시간 (월 소정근로시간){contract.baseSalary > 0 && <><br />  → {formatCurrency(Math.round(contract.baseSalary / monthlyPrescribedHours))}/시간</>}<br />
                • 초과근로 시 통상임금의 50% 가산 (근로기준법 제56조)
              </span>
            </td>
          </tr>
        </tbody>
      </table>

      {/* 제5조 사회보험 */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
        <thead>
          <tr>
            <th colSpan={2} style={sectionHeaderStyle}>제5조 [사회보험]</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th style={headerStyle}>가입보험</th>
            <td style={cellStyle}>
              {insuranceList.length > 0 ? (
                <>
                  <strong>{insuranceList.join(', ')}</strong> 가입<br />
                  <span style={{ color: '#6b7280', fontSize: '13px' }}>
                    ※ 근로자 부담분은 급여에서 원천공제
                  </span>
                </>
              ) : '해당 없음'}
            </td>
          </tr>
        </tbody>
      </table>

      {/* 제6조 근로계약의 해지 */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
        <thead>
          <tr>
            <th colSpan={2} style={sectionHeaderStyle}>제6조 [근로계약의 해지]</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th style={headerStyle}>해고예고</th>
            <td style={cellStyle}>
              사용자가 근로자를 해고하고자 할 때에는 30일 전에 예고하거나, 
              30일분 이상의 통상임금을 지급하여야 한다. (근로기준법 제26조)<br />
              <span style={{ color: '#6b7280', fontSize: '13px' }}>
                ※ 단, 수습기간 3개월 이내 또는 천재·사변 등 불가피한 사유는 예외
              </span>
            </td>
          </tr>
          <tr>
            <th style={headerStyle}>자발적 퇴직</th>
            <td style={cellStyle}>
              근로자가 퇴직하고자 할 때에는 30일 전에 사용자에게 통보하여야 한다.
            </td>
          </tr>
          <tr>
            <th style={headerStyle}>퇴직금</th>
            <td style={cellStyle}>
              계속근로기간 1년 이상인 경우 퇴직금 지급<br />
              <span style={{ color: '#6b7280', fontSize: '13px' }}>
                ※ 퇴직금 = 30일분 평균임금 × 계속근로년수 (근로자퇴직급여보장법 제8조)
              </span>
            </td>
          </tr>
        </tbody>
      </table>

      {/* 제7조 기타 의무 */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
        <thead>
          <tr>
            <th colSpan={2} style={sectionHeaderStyle}>제7조 [기타 의무]</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th style={headerStyle}>비밀유지</th>
            <td style={cellStyle}>
              근로자는 재직 중 및 퇴직 후에도 업무상 알게 된 회사의 영업비밀 및 
              기밀사항을 누설하여서는 아니 된다.
            </td>
          </tr>
          <tr>
            <th style={headerStyle}>겸업금지</th>
            <td style={cellStyle}>
              근로자는 회사의 사전 서면 동의 없이 타 업체에 취업하거나 
              자영업을 영위하여서는 아니 된다.
            </td>
          </tr>
        </tbody>
      </table>

      {/* 특약사항 */}
      {contract.specialTerms && (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
          <thead>
            <tr>
              <th colSpan={2} style={sectionHeaderStyle}>제8조 [특약사항]</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={2} style={{ ...cellStyle, whiteSpace: 'pre-wrap' }}>
                {contract.specialTerms}
              </td>
            </tr>
          </tbody>
        </table>
      )}

      {/* 제9조 계약서 교부 */}
      <div style={{ backgroundColor: '#fef3c7', border: '1px solid #f59e0b', borderRadius: '8px', padding: '16px', marginBottom: '24px' }}>
        <p style={{ fontSize: '13px', margin: 0 }}>
          <strong style={{ color: '#92400e' }}>📋 근로계약서 교부 (근로기준법 제17조)</strong><br />
          사용자는 근로계약을 체결함과 동시에 본 계약서를 사본하여 근로자의 교부 요구와 
          관계없이 근로자에게 교부하여야 한다. 본 계약서는 2부를 작성하여 사용자와 근로자가 
          각 1부씩 보관한다.
        </p>
      </div>

      {/* 기타 조항 */}
      <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '32px' }}>
        <p style={{ marginBottom: '8px' }}>
          • 본 계약에 명시되지 않은 사항은 근로기준법 및 관계 법령, 취업규칙에 따른다.
        </p>
        <p style={{ marginBottom: '8px' }}>
          • 사용자와 근로자는 본 계약의 내용을 성실히 이행하여야 한다.
        </p>
        <p>
          • 본 계약 내용 중 근로기준법 등 관계 법령에 미달하는 부분은 해당 법령에 따른다.
        </p>
      </div>

      {/* 계약 체결일 */}
      <p style={{ textAlign: 'center', fontSize: '15px', fontWeight: 600, marginBottom: '40px' }}>
        {formatDate(contract.contractDate)}
      </p>

      {/* 서명란 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '40px' }}>
        {/* 사용자 */}
        <div style={{ flex: 1, border: '1px solid #d1d5db', borderRadius: '8px', padding: '20px' }}>
          <p style={{ fontWeight: 700, color: '#1e40af', marginBottom: '16px', fontSize: '15px', borderBottom: '2px solid #1e40af', paddingBottom: '8px' }}>
            [ 사용자 ]
          </p>
          <table style={{ width: '100%' }}>
            <tbody>
              <tr>
                <td style={{ padding: '6px 0', width: '100px', color: '#6b7280' }}>사업체명</td>
                <td style={{ padding: '6px 0', fontWeight: 500 }}>{contract.company.name}</td>
              </tr>
              <tr>
                <td style={{ padding: '6px 0', color: '#6b7280' }}>사업자번호</td>
                <td style={{ padding: '6px 0' }}>{formatBusinessNumber(contract.company.businessNumber)}</td>
              </tr>
              <tr>
                <td style={{ padding: '6px 0', color: '#6b7280' }}>소재지</td>
                <td style={{ padding: '6px 0' }}>{contract.company.address}</td>
              </tr>
              <tr>
                <td style={{ padding: '6px 0', color: '#6b7280' }}>연락처</td>
                <td style={{ padding: '6px 0' }}>{contract.company.phone}</td>
              </tr>
              <tr>
                <td style={{ padding: '10px 0', color: '#6b7280' }}>대표자</td>
                <td style={{ padding: '10px 0', fontWeight: 600 }}>
                  {contract.company.ceoName} 
                  <span style={{ color: '#9ca3af', marginLeft: '20px' }}>(서명 또는 인)</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 근로자 */}
        <div style={{ flex: 1, border: '1px solid #d1d5db', borderRadius: '8px', padding: '20px' }}>
          <p style={{ fontWeight: 700, color: '#1e40af', marginBottom: '16px', fontSize: '15px', borderBottom: '2px solid #1e40af', paddingBottom: '8px' }}>
            [ 근로자 ]
          </p>
          <table style={{ width: '100%' }}>
            <tbody>
              <tr>
                <td style={{ padding: '6px 0', width: '100px', color: '#6b7280' }}>성명</td>
                <td style={{ padding: '6px 0', fontWeight: 500 }}>{contract.employee.name}</td>
              </tr>
              <tr>
                <td style={{ padding: '6px 0', color: '#6b7280' }}>주민등록번호</td>
                <td style={{ padding: '6px 0' }}>{formatResidentNumber(contract.employee.residentNumber)}</td>
              </tr>
              <tr>
                <td style={{ padding: '6px 0', color: '#6b7280' }}>주소</td>
                <td style={{ padding: '6px 0' }}>{contract.employee.address}</td>
              </tr>
              <tr>
                <td style={{ padding: '6px 0', color: '#6b7280' }}>연락처</td>
                <td style={{ padding: '6px 0' }}>{contract.employee.phone}</td>
              </tr>
              <tr>
                <td style={{ padding: '10px 0', color: '#6b7280' }}>서명</td>
                <td style={{ padding: '10px 0', fontWeight: 600 }}>
                  {contract.employee.name}
                  <span style={{ color: '#9ca3af', marginLeft: '20px' }}>(서명 또는 인)</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
