'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Employee, EmploymentType } from '@/types';
import { 
  loadEmployees, 
  addEmployee, 
  updateEmployee, 
  deleteEmployee, 
  generateId,
  formatCurrency,
  formatDateShort,
  formatResidentNumber
} from '@/lib/storage';
import { 
  MINIMUM_WAGE, 
  optimizeSalary, 
  calculateInsurance,
  TAX_EXEMPTION_LIMITS 
} from '@/lib/constants';

const EMPLOYMENT_TYPE_LABELS: Record<EmploymentType, string> = {
  fulltime: '정규직',
  parttime: '파트타임',
  freelancer: '프리랜서',
};

const defaultEmployee: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'> = {
  info: { name: '', residentNumber: '', address: '', phone: '' },
  employmentType: 'fulltime',
  status: 'active',
  hireDate: new Date().toISOString().split('T')[0],
  department: '',
  position: '',
  salary: {
    type: 'monthly',
    baseSalary: 0,
    mealAllowance: 200000,
    carAllowance: 0,
    childcareAllowance: 0,
    otherAllowances: [],
  },
  workCondition: {
    weeklyHours: 40,
    workDays: ['월', '화', '수', '목', '금'],
    workStartTime: '09:00',
    workEndTime: '18:00',
    breakTime: 60,
  },
  insurance: {
    national: true,
    health: true,
    employment: true,
    industrial: true,
  },
  taxExemptOptions: {
    hasOwnCar: false,
    hasChildUnder6: false,
    isResearcher: false,
  },
};

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState(defaultEmployee);
  const [showOptimizer, setShowOptimizer] = useState(false);
  const [totalSalaryInput, setTotalSalaryInput] = useState(0);

  useEffect(() => {
    setEmployees(loadEmployees());
  }, []);

  const handleSave = () => {
    if (!formData.info.name) {
      alert('직원 이름을 입력해주세요.');
      return;
    }

    const now = new Date().toISOString();
    
    if (editingId) {
      updateEmployee(editingId, formData);
    } else {
      const newEmployee: Employee = {
        ...formData,
        id: generateId(),
        createdAt: now,
        updatedAt: now,
      };
      addEmployee(newEmployee);
    }

    setEmployees(loadEmployees());
    resetForm();
  };

  const handleEdit = (employee: Employee) => {
    setFormData(employee);
    setEditingId(employee.id);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('정말 삭제하시겠습니까?')) {
      deleteEmployee(id);
      setEmployees(loadEmployees());
    }
  };

  const resetForm = () => {
    setFormData(defaultEmployee);
    setEditingId(null);
    setShowForm(false);
    setShowOptimizer(false);
  };

  // 급여 최적화 적용
  const applyOptimization = () => {
    if (totalSalaryInput <= 0) {
      alert('총 급여를 입력해주세요.');
      return;
    }

    const result = optimizeSalary(totalSalaryInput, {
      hasOwnCar: formData.taxExemptOptions.hasOwnCar,
      hasChildUnder6: formData.taxExemptOptions.hasChildUnder6,
    });

    setFormData(prev => ({
      ...prev,
      salary: {
        ...prev.salary,
        baseSalary: result.baseSalary,
        mealAllowance: result.mealAllowance,
        carAllowance: result.carAllowance,
        childcareAllowance: result.childcareAllowance,
      },
    }));

    if (result.warnings.length > 0) {
      alert(result.warnings.join('\n'));
    }
  };

  // 현재 급여의 4대보험 계산
  const currentInsurance = calculateInsurance(formData.salary.baseSalary);
  const totalGross = formData.salary.baseSalary + formData.salary.mealAllowance + 
                     formData.salary.carAllowance + formData.salary.childcareAllowance;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="heading-lg flex items-center gap-2">
            <span className="icon-box icon-box-primary">👥</span>
            직원 관리
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">직원 등록 및 계약/급여 연동</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn btn-primary"
        >
          + 직원 등록
        </button>
      </div>

      {/* 직원 목록 */}
      {!showForm && (
        <div className="table-container">
          {employees.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">👤</div>
              <p className="empty-state-title">등록된 직원이 없습니다</p>
              <p className="empty-state-desc">첫 직원을 등록해 주세요</p>
              <button
                onClick={() => setShowForm(true)}
                className="btn btn-primary mt-4"
              >
                직원 등록하기
              </button>
            </div>
          ) : (
            <table className="table-modern">
              <thead>
                <tr>
                  <th>이름</th>
                  <th>고용형태</th>
                  <th>부서/직위</th>
                  <th>입사일</th>
                  <th className="text-right">월 급여</th>
                  <th className="text-center">상태</th>
                  <th className="text-center">관리</th>
                </tr>
              </thead>
              <tbody>
                {employees.map(emp => (
                  <tr key={emp.id}>
                    <td>
                      <div className="font-medium">{emp.info.name}</div>
                      <div className="text-xs text-[var(--text-muted)]">{formatResidentNumber(emp.info.residentNumber)}</div>
                    </td>
                    <td>
                      <span className={`badge ${
                        emp.employmentType === 'fulltime' ? 'badge-primary' :
                        emp.employmentType === 'parttime' ? 'badge-info' :
                        'badge-warning'
                      }`}>
                        {EMPLOYMENT_TYPE_LABELS[emp.employmentType]}
                      </span>
                    </td>
                    <td className="text-[var(--text-muted)]">
                      {emp.department || '-'} / {emp.position || '-'}
                    </td>
                    <td className="text-[var(--text-muted)]">
                      {formatDateShort(emp.hireDate)}
                    </td>
                    <td className="text-right font-medium">
                      {emp.salary.type === 'monthly' 
                        ? formatCurrency(emp.salary.baseSalary + emp.salary.mealAllowance + emp.salary.carAllowance + emp.salary.childcareAllowance)
                        : `시급 ${formatCurrency(emp.salary.hourlyWage || 0)}`
                      }
                    </td>
                    <td className="text-center">
                      <span className={`badge ${
                        emp.status === 'active' ? 'badge-success' :
                        emp.status === 'resigned' ? 'badge-neutral' :
                        'badge-warning'
                      }`}>
                        {emp.status === 'active' ? '재직중' : emp.status === 'resigned' ? '퇴사' : '대기'}
                      </span>
                    </td>
                    <td className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(emp)}
                          className="btn btn-ghost btn-sm"
                        >
                          수정
                        </button>
                        <button
                          onClick={() => handleDelete(emp.id)}
                          className="btn btn-ghost btn-sm text-[var(--danger)]"
                        >
                          삭제
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* 직원 등록/수정 폼 */}
      {showForm && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800">
              {editingId ? '✏️ 직원 정보 수정' : '➕ 새 직원 등록'}
            </h2>
            <button onClick={resetForm} className="text-gray-500 hover:text-gray-700">
              ✕ 닫기
            </button>
          </div>

          {/* 기본 정보 */}
          <div className="form-section">
            <h3 className="form-section-title">👤 기본 정보</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="input-label">성명 *</label>
                <input
                  type="text"
                  className="input-field"
                  value={formData.info.name}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    info: { ...prev.info, name: e.target.value }
                  }))}
                />
              </div>
              <div>
                <label className="input-label">주민등록번호</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="990101-1234567"
                  value={formData.info.residentNumber}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    info: { ...prev.info, residentNumber: e.target.value }
                  }))}
                />
              </div>
              <div>
                <label className="input-label">연락처</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="010-1234-5678"
                  value={formData.info.phone}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    info: { ...prev.info, phone: e.target.value }
                  }))}
                />
              </div>
              <div>
                <label className="input-label">고용형태</label>
                <select
                  className="input-field"
                  value={formData.employmentType}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    employmentType: e.target.value as EmploymentType,
                    salary: {
                      ...prev.salary,
                      type: e.target.value === 'parttime' ? 'hourly' : 'monthly'
                    }
                  }))}
                >
                  <option value="fulltime">정규직</option>
                  <option value="parttime">파트타임</option>
                  <option value="freelancer">프리랜서</option>
                </select>
              </div>
              <div>
                <label className="input-label">부서</label>
                <input
                  type="text"
                  className="input-field"
                  value={formData.department}
                  onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                />
              </div>
              <div>
                <label className="input-label">직위</label>
                <input
                  type="text"
                  className="input-field"
                  value={formData.position}
                  onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                />
              </div>
              <div>
                <label className="input-label">입사일</label>
                <input
                  type="date"
                  className="input-field"
                  value={formData.hireDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, hireDate: e.target.value }))}
                />
              </div>
              <div className="md:col-span-2">
                <label className="input-label">주소</label>
                <input
                  type="text"
                  className="input-field"
                  value={formData.info.address}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    info: { ...prev.info, address: e.target.value }
                  }))}
                />
              </div>
            </div>
          </div>

          {/* 비과세 옵션 */}
          <div className="form-section">
            <h3 className="form-section-title">🎁 비과세 항목 적용 조건</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                <input
                  type="checkbox"
                  className="w-5 h-5 text-blue-600 rounded"
                  checked={formData.taxExemptOptions.hasOwnCar}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    taxExemptOptions: { ...prev.taxExemptOptions, hasOwnCar: e.target.checked }
                  }))}
                />
                <div>
                  <span className="font-medium">🚗 본인 차량 보유</span>
                  <p className="text-xs text-gray-500">자가운전보조금 월 20만원 비과세</p>
                </div>
              </label>
              <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                <input
                  type="checkbox"
                  className="w-5 h-5 text-blue-600 rounded"
                  checked={formData.taxExemptOptions.hasChildUnder6}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    taxExemptOptions: { ...prev.taxExemptOptions, hasChildUnder6: e.target.checked }
                  }))}
                />
                <div>
                  <span className="font-medium">👶 6세 이하 자녀</span>
                  <p className="text-xs text-gray-500">보육수당 월 20만원 비과세</p>
                </div>
              </label>
              <label className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                <input
                  type="checkbox"
                  className="w-5 h-5 text-blue-600 rounded"
                  checked={formData.taxExemptOptions.isResearcher}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    taxExemptOptions: { ...prev.taxExemptOptions, isResearcher: e.target.checked }
                  }))}
                />
                <div>
                  <span className="font-medium">🔬 연구원</span>
                  <p className="text-xs text-gray-500">연구활동비 월 20만원 비과세</p>
                </div>
              </label>
            </div>
          </div>

          {/* 급여 정보 */}
          <div className="form-section">
            <div className="flex items-center justify-between mb-4">
              <h3 className="form-section-title mb-0">💰 급여 정보</h3>
              <button
                type="button"
                onClick={() => setShowOptimizer(!showOptimizer)}
                className="text-sm text-blue-500 hover:text-blue-700 font-medium"
              >
                💡 급여 최적화 추천
              </button>
            </div>

            {/* 급여 최적화 패널 */}
            {showOptimizer && (
              <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                <h4 className="font-bold text-blue-800 mb-3">💡 급여 최적화 추천</h4>
                <p className="text-sm text-gray-600 mb-4">
                  총 급여를 입력하면 비과세 항목을 최대한 활용하여 4대보험료를 절감할 수 있도록 자동 배분합니다.
                </p>
                
                <div className="flex gap-4 items-end">
                  <div className="flex-1">
                    <label className="input-label">총 급여 (월)</label>
                    <input
                      type="number"
                      className="input-field"
                      placeholder="3200000"
                      value={totalSalaryInput || ''}
                      onChange={(e) => setTotalSalaryInput(parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={applyOptimization}
                    className="btn-primary"
                  >
                    🔄 최적화 적용
                  </button>
                </div>

                {totalSalaryInput > 0 && (
                  <div className="mt-4 p-3 bg-white rounded border">
                    <p className="text-sm font-medium text-gray-700 mb-2">적용 가능한 비과세 항목:</p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>✅ 식대: 월 {formatCurrency(TAX_EXEMPTION_LIMITS.meal.monthly)}</li>
                      {formData.taxExemptOptions.hasOwnCar && (
                        <li>✅ 자가운전보조금: 월 {formatCurrency(TAX_EXEMPTION_LIMITS.carAllowance.monthly)}</li>
                      )}
                      {formData.taxExemptOptions.hasChildUnder6 && (
                        <li>✅ 보육수당: 월 {formatCurrency(TAX_EXEMPTION_LIMITS.childcare.monthlyPerChild)}</li>
                      )}
                      {formData.taxExemptOptions.isResearcher && (
                        <li>✅ 연구활동비: 월 {formatCurrency(TAX_EXEMPTION_LIMITS.research.monthly)}</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {formData.employmentType === 'parttime' ? (
              // 파트타임 급여
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="input-label">시급 (원) *</label>
                  <input
                    type="number"
                    className="input-field"
                    value={formData.salary.hourlyWage || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      salary: { ...prev.salary, hourlyWage: parseInt(e.target.value) || 0 }
                    }))}
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    2026년 최저시급: {formatCurrency(MINIMUM_WAGE.hourly)}
                    {(formData.salary.hourlyWage || 0) < MINIMUM_WAGE.hourly && (formData.salary.hourlyWage || 0) > 0 && (
                      <span className="text-red-500 ml-2">⚠️ 최저임금 미달!</span>
                    )}
                  </p>
                </div>
                <div>
                  <label className="input-label">주 소정근로시간</label>
                  <input
                    type="number"
                    className="input-field"
                    value={formData.workCondition.weeklyHours}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      workCondition: { ...prev.workCondition, weeklyHours: parseInt(e.target.value) || 0 }
                    }))}
                  />
                </div>
              </div>
            ) : (
              // 정규직/프리랜서 급여
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="input-label">기본급 (과세)</label>
                  <input
                    type="number"
                    className="input-field"
                    value={formData.salary.baseSalary || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      salary: { ...prev.salary, baseSalary: parseInt(e.target.value) || 0 }
                    }))}
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    4대보험 및 소득세 부과 기준
                  </p>
                </div>
                <div>
                  <label className="input-label">식대 (비과세)</label>
                  <input
                    type="number"
                    className="input-field"
                    value={formData.salary.mealAllowance || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      salary: { ...prev.salary, mealAllowance: parseInt(e.target.value) || 0 }
                    }))}
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    월 20만원 한도 비과세
                  </p>
                </div>
                {formData.taxExemptOptions.hasOwnCar && (
                  <div>
                    <label className="input-label">자가운전보조금 (비과세)</label>
                    <input
                      type="number"
                      className="input-field"
                      value={formData.salary.carAllowance || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        salary: { ...prev.salary, carAllowance: parseInt(e.target.value) || 0 }
                      }))}
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      월 20만원 한도 비과세 (본인 차량 업무용)
                    </p>
                  </div>
                )}
                {formData.taxExemptOptions.hasChildUnder6 && (
                  <div>
                    <label className="input-label">보육수당 (비과세)</label>
                    <input
                      type="number"
                      className="input-field"
                      value={formData.salary.childcareAllowance || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        salary: { ...prev.salary, childcareAllowance: parseInt(e.target.value) || 0 }
                      }))}
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      월 20만원 한도 비과세 (6세 이하 자녀)
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* 급여 요약 */}
            {formData.employmentType !== 'parttime' && formData.salary.baseSalary > 0 && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-700 mb-3">📊 급여 요약</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">총 급여</p>
                    <p className="font-bold text-lg">{formatCurrency(totalGross)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">과세 소득</p>
                    <p className="font-bold text-lg">{formatCurrency(formData.salary.baseSalary)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">비과세 소득</p>
                    <p className="font-bold text-lg text-green-600">
                      {formatCurrency(totalGross - formData.salary.baseSalary)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">4대보험 (근로자)</p>
                    <p className="font-bold text-lg text-red-600">
                      -{formatCurrency(currentInsurance.totalEmployee)}
                    </p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">예상 실수령액</span>
                    <span className="font-bold text-xl text-blue-600">
                      {formatCurrency(totalGross - currentInsurance.totalEmployee)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 4대보험 */}
          <div className="form-section">
            <h3 className="form-section-title">🏥 4대보험 가입</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { key: 'national', label: '국민연금', rate: '4.75%' },
                { key: 'health', label: '건강보험', rate: '3.595%' },
                { key: 'employment', label: '고용보험', rate: '0.9%' },
                { key: 'industrial', label: '산재보험', rate: '사업주 전액' },
              ].map(item => (
                <label key={item.key} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-5 h-5 text-blue-600 rounded"
                    checked={formData.insurance[item.key as keyof typeof formData.insurance]}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      insurance: { ...prev.insurance, [item.key]: e.target.checked }
                    }))}
                  />
                  <div>
                    <span className="font-medium text-gray-700">{item.label}</span>
                    <p className="text-xs text-gray-400">{item.rate}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* 저장 버튼 */}
          <div className="flex gap-3 justify-end">
            <button onClick={resetForm} className="btn btn-secondary">
              취소
            </button>
            <button onClick={handleSave} className="btn btn-primary">
              {editingId ? '수정 완료' : '직원 등록'}
            </button>
          </div>
        </div>
      )}

      {/* 연동 기능 안내 */}
      {!showForm && employees.length > 0 && (
        <div className="mt-6 alert alert-info">
          <span className="text-lg">🔗</span>
          <div>
            <p className="font-medium text-sm mb-2">문서 연동 기능</p>
            <p className="text-sm opacity-80 mb-3">
              등록된 직원 정보로 근로계약서, 급여명세서, 임금대장을 자동으로 작성할 수 있습니다.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/contract/fulltime" className="btn btn-sm btn-secondary">
                📋 근로계약서
              </Link>
              <Link href="/payslip" className="btn btn-sm btn-secondary">
                💵 급여명세서
              </Link>
              <Link href="/wage-ledger" className="btn btn-sm btn-secondary">
                📊 임금대장
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
