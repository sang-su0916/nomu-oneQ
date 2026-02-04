'use client';

import { useState, useEffect, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { CompanyInfo } from '@/types';
import { loadCompanyInfo, defaultCompanyInfo } from '@/lib/storage';

interface WorkRulesData {
  company: CompanyInfo;
  // 기본 정보
  industryType: string;
  employeeCount: string;
  effectiveDate: string;
  
  // 근로시간
  workStartTime: string;
  workEndTime: string;
  breakStartTime: string;
  breakEndTime: string;
  breakTime: number;
  workDays: string[];
  weeklyHours: number;
  
  // 임금
  paymentDate: number;
  paymentMethod: string;
  
  // 휴가
  annualLeave: number;
  summerVacationDays: number;
  
  // 인사
  probationPeriod: number;
  retirementAge: number;
  
  // 경조사
  marriageLeave: number;
  parentDeathLeave: number;
  grandparentDeathLeave: number;
  childDeathLeave: number;
  siblingDeathLeave: number;
  
  // 병가
  sickLeaveDays: number;
  
  // 징계
  disciplineTypes: string[];
  
  // ========== 2025년 개정 옵션 ==========
  spouseLeave2025: boolean;
  parentalLeave2025: boolean;
  childcareReduction2025: boolean;
  infertilityLeave2025: boolean;
  
  // ========== 고용지원금 옵션 ==========
  enableRetirementExtension: boolean;
  extendedRetirementAge: number;
  enableReemployment: boolean;
  reemploymentPeriod: number;
  enableWagePeak: boolean;
  wagePeakStartAge: number;
  wagePeakReductionRate: number;
  
  // ========== 유연근무제 옵션 ==========
  enableFlexibleWork: boolean;
  flexibleWorkTypes: string[];
  
  // ========== 교대근로 옵션 ==========
  enableShiftWork: boolean;
  shiftWorkType: string;
  
  // ========== 5인 미만 사업장 옵션 ==========
  isSmallBusiness: boolean;
}

const defaultWorkRules: WorkRulesData = {
  company: defaultCompanyInfo,
  industryType: '서비스업',
  employeeCount: '10인 이상',
  effectiveDate: new Date().toISOString().split('T')[0],
  
  workStartTime: '09:00',
  workEndTime: '18:00',
  breakStartTime: '12:00',
  breakEndTime: '13:00',
  breakTime: 60,
  workDays: ['월', '화', '수', '목', '금'],
  weeklyHours: 40,
  
  paymentDate: 25,
  paymentMethod: '근로자가 지정한 금융기관 계좌',
  
  annualLeave: 15,
  summerVacationDays: 3,
  
  probationPeriod: 3,
  retirementAge: 60,
  
  marriageLeave: 5,
  parentDeathLeave: 5,
  grandparentDeathLeave: 3,
  childDeathLeave: 3,
  siblingDeathLeave: 3,
  
  sickLeaveDays: 60,
  
  disciplineTypes: ['견책', '감봉', '정직', '해고'],
  
  spouseLeave2025: true,
  parentalLeave2025: true,
  childcareReduction2025: true,
  infertilityLeave2025: true,
  
  enableRetirementExtension: false,
  extendedRetirementAge: 65,
  enableReemployment: false,
  reemploymentPeriod: 2,
  enableWagePeak: false,
  wagePeakStartAge: 58,
  wagePeakReductionRate: 10,
  
  enableFlexibleWork: false,
  flexibleWorkTypes: [],
  
  enableShiftWork: false,
  shiftWorkType: '2조2교대',
  
  isSmallBusiness: false,
};

export default function WorkRulesPage() {
  const [rules, setRules] = useState<WorkRulesData>(defaultWorkRules);
  const [showPreview, setShowPreview] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('basic');
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedCompany = loadCompanyInfo();
    if (savedCompany) {
      setRules(prev => ({ ...prev, company: savedCompany }));
    }
  }, []);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `취업규칙_${rules.company.name}`,
  });

  const sections = [
    { id: 'basic', label: '기본 정보', icon: '🏢' },
    { id: 'worktime', label: '근로시간', icon: '⏰' },
    { id: 'wage', label: '임금', icon: '💰' },
    { id: 'leave', label: '휴가', icon: '🏖️' },
    { id: 'law2025', label: '2025 개정', icon: '⭐' },
    { id: 'subsidy', label: '고용지원금', icon: '💵' },
    { id: 'flexible', label: '유연근무', icon: '🏠' },
    { id: 'discipline', label: '상벌', icon: '⚖️' },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">📋 취업규칙</h1>
          <p className="text-gray-500 mt-1">고용노동부 2025.3 표준 취업규칙 (98개 조항)</p>
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

      {/* 안내 배너 */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-blue-800 text-sm">
          <strong>📌 고용노동부 2025.3 표준 취업규칙 완전판</strong><br />
          17개 장, 98개 조항으로 구성된 노동청 신고용 취업규칙입니다. 
          2025.2.23 시행 개정법령(배우자출산휴가 20일, 육아휴직 1년6개월 등)이 반영되었습니다.
        </p>
      </div>

      {!showPreview ? (
        <div className="flex gap-6">
          {/* 사이드 네비게이션 */}
          <div className="w-48 flex-shrink-0">
            <nav className="sticky top-4 space-y-1">
              {sections.map(section => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full text-left px-4 py-2 rounded-lg transition text-sm ${
                    activeSection === section.id
                      ? 'bg-blue-500 text-white'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  {section.icon} {section.label}
                </button>
              ))}
            </nav>
          </div>

          {/* 폼 영역 */}
          <div className="flex-1 space-y-6">
            {activeSection === 'basic' && (
              <div className="form-section">
                <h2 className="form-section-title">🏢 기본 정보</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="input-label">상호 *</label>
                    <input type="text" className="input-field bg-gray-50" value={rules.company.name} readOnly />
                    <p className="text-xs text-gray-500 mt-1">설정에서 변경 가능</p>
                  </div>
                  <div>
                    <label className="input-label">대표자 *</label>
                    <input type="text" className="input-field bg-gray-50" value={rules.company.ceoName} readOnly />
                  </div>
                  <div>
                    <label className="input-label">사업자등록번호</label>
                    <input type="text" className="input-field bg-gray-50" value={rules.company.businessNumber} readOnly />
                  </div>
                  <div>
                    <label className="input-label">업종</label>
                    <select
                      className="input-field"
                      value={rules.industryType}
                      onChange={(e) => setRules(prev => ({ ...prev, industryType: e.target.value }))}
                    >
                      <option value="제조업">제조업</option>
                      <option value="서비스업">서비스업</option>
                      <option value="건설업">건설업</option>
                      <option value="도소매업">도소매업</option>
                      <option value="음식숙박업">음식숙박업</option>
                      <option value="운수업">운수업</option>
                      <option value="정보통신업">정보통신업</option>
                      <option value="금융보험업">금융보험업</option>
                      <option value="기타">기타</option>
                    </select>
                  </div>
                  <div>
                    <label className="input-label">상시 근로자 수</label>
                    <select
                      className="input-field"
                      value={rules.employeeCount}
                      onChange={(e) => {
                        const isSmall = e.target.value === '5인 미만';
                        setRules(prev => ({ ...prev, employeeCount: e.target.value, isSmallBusiness: isSmall }));
                      }}
                    >
                      <option value="5인 미만">5인 미만</option>
                      <option value="5~9인">5~9인</option>
                      <option value="10인 이상">10인 이상</option>
                      <option value="30인 이상">30인 이상</option>
                      <option value="100인 이상">100인 이상</option>
                    </select>
                    {rules.isSmallBusiness && (
                      <p className="text-xs text-amber-600 mt-1">⚠️ 5인 미만 사업장은 일부 조항 적용 제외</p>
                    )}
                  </div>
                  <div>
                    <label className="input-label">수습기간 (개월)</label>
                    <input
                      type="number"
                      className="input-field"
                      value={rules.probationPeriod}
                      onChange={(e) => setRules(prev => ({ ...prev, probationPeriod: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                  <div>
                    <label className="input-label">정년 (세)</label>
                    <input
                      type="number"
                      className="input-field"
                      value={rules.retirementAge}
                      min={60}
                      onChange={(e) => setRules(prev => ({ ...prev, retirementAge: parseInt(e.target.value) || 60 }))}
                    />
                    <p className="text-xs text-gray-500 mt-1">고용상 연령차별금지법: 최소 60세</p>
                  </div>
                  <div>
                    <label className="input-label">시행일</label>
                    <input
                      type="date"
                      className="input-field"
                      value={rules.effectiveDate}
                      onChange={(e) => setRules(prev => ({ ...prev, effectiveDate: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'worktime' && (
              <div className="space-y-6">
                <div className="form-section">
                  <h2 className="form-section-title">⏰ 근로시간 및 휴게</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="input-label">시업 시각</label>
                      <input
                        type="time"
                        className="input-field"
                        value={rules.workStartTime}
                        onChange={(e) => setRules(prev => ({ ...prev, workStartTime: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="input-label">종업 시각</label>
                      <input
                        type="time"
                        className="input-field"
                        value={rules.workEndTime}
                        onChange={(e) => setRules(prev => ({ ...prev, workEndTime: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="input-label">휴게 시작</label>
                      <input
                        type="time"
                        className="input-field"
                        value={rules.breakStartTime}
                        onChange={(e) => setRules(prev => ({ ...prev, breakStartTime: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="input-label">휴게 종료</label>
                      <input
                        type="time"
                        className="input-field"
                        value={rules.breakEndTime}
                        onChange={(e) => setRules(prev => ({ ...prev, breakEndTime: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="input-label">휴게시간 (분)</label>
                      <input
                        type="number"
                        className="input-field"
                        value={rules.breakTime}
                        onChange={(e) => setRules(prev => ({ ...prev, breakTime: parseInt(e.target.value) || 0 }))}
                      />
                    </div>
                    <div>
                      <label className="input-label">주 소정근로시간</label>
                      <input
                        type="number"
                        className="input-field"
                        value={rules.weeklyHours}
                        max={40}
                        onChange={(e) => setRules(prev => ({ ...prev, weeklyHours: parseInt(e.target.value) || 40 }))}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="input-label">근무일</label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {['월', '화', '수', '목', '금', '토', '일'].map(day => (
                          <label key={day} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={rules.workDays.includes(day)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setRules(prev => ({ ...prev, workDays: [...prev.workDays, day] }));
                                } else {
                                  setRules(prev => ({ ...prev, workDays: prev.workDays.filter(d => d !== day) }));
                                }
                              }}
                              className="w-4 h-4"
                            />
                            <span>{day}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 교대근로 옵션 */}
                <div className="form-section">
                  <h2 className="form-section-title">🔄 교대근로 (선택)</h2>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rules.enableShiftWork}
                        onChange={(e) => setRules(prev => ({ ...prev, enableShiftWork: e.target.checked }))}
                        className="w-5 h-5 mt-0.5"
                      />
                      <div className="flex-1">
                        <span className="font-semibold">교대근로제 도입</span>
                        <p className="text-sm text-gray-600 mt-1">제조업 등 교대근무가 필요한 경우</p>
                        {rules.enableShiftWork && (
                          <div className="mt-3">
                            <select
                              className="input-field w-40"
                              value={rules.shiftWorkType}
                              onChange={(e) => setRules(prev => ({ ...prev, shiftWorkType: e.target.value }))}
                            >
                              <option value="2조2교대">2조2교대</option>
                              <option value="3조2교대">3조2교대</option>
                              <option value="3조3교대">3조3교대</option>
                              <option value="4조3교대">4조3교대</option>
                            </select>
                          </div>
                        )}
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'wage' && (
              <div className="form-section">
                <h2 className="form-section-title">💰 임금</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="input-label">급여 지급일</label>
                    <select
                      className="input-field"
                      value={rules.paymentDate}
                      onChange={(e) => setRules(prev => ({ ...prev, paymentDate: parseInt(e.target.value) }))}
                    >
                      {Array.from({ length: 28 }, (_, i) => i + 1).map(day => (
                        <option key={day} value={day}>매월 {day}일</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="input-label">지급 방법</label>
                    <select
                      className="input-field"
                      value={rules.paymentMethod}
                      onChange={(e) => setRules(prev => ({ ...prev, paymentMethod: e.target.value }))}
                    >
                      <option value="근로자가 지정한 금융기관 계좌">계좌이체</option>
                      <option value="현금">현금 지급</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'leave' && (
              <div className="space-y-6">
                <div className="form-section">
                  <h2 className="form-section-title">🏖️ 연차휴가</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="input-label">연차휴가 (일) - 1년 80% 출근 시</label>
                      <input
                        type="number"
                        className="input-field"
                        value={rules.annualLeave}
                        onChange={(e) => setRules(prev => ({ ...prev, annualLeave: parseInt(e.target.value) || 0 }))}
                      />
                    </div>
                    <div>
                      <label className="input-label">하기휴가 (일) - 선택</label>
                      <input
                        type="number"
                        className="input-field"
                        value={rules.summerVacationDays}
                        onChange={(e) => setRules(prev => ({ ...prev, summerVacationDays: parseInt(e.target.value) || 0 }))}
                      />
                    </div>
                    <div>
                      <label className="input-label">병가 (일/년) - 무급</label>
                      <input
                        type="number"
                        className="input-field"
                        value={rules.sickLeaveDays}
                        onChange={(e) => setRules(prev => ({ ...prev, sickLeaveDays: parseInt(e.target.value) || 0 }))}
                      />
                    </div>
                  </div>
                </div>

                <div className="form-section">
                  <h2 className="form-section-title">🎊 경조사 휴가</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="input-label">본인 결혼 (일)</label>
                      <input
                        type="number"
                        className="input-field"
                        value={rules.marriageLeave}
                        onChange={(e) => setRules(prev => ({ ...prev, marriageLeave: parseInt(e.target.value) || 0 }))}
                      />
                    </div>
                    <div>
                      <label className="input-label">부모/배우자 사망 (일)</label>
                      <input
                        type="number"
                        className="input-field"
                        value={rules.parentDeathLeave}
                        onChange={(e) => setRules(prev => ({ ...prev, parentDeathLeave: parseInt(e.target.value) || 0 }))}
                      />
                    </div>
                    <div>
                      <label className="input-label">조부모/외조부모 사망 (일)</label>
                      <input
                        type="number"
                        className="input-field"
                        value={rules.grandparentDeathLeave}
                        onChange={(e) => setRules(prev => ({ ...prev, grandparentDeathLeave: parseInt(e.target.value) || 0 }))}
                      />
                    </div>
                    <div>
                      <label className="input-label">자녀/자녀배우자 사망 (일)</label>
                      <input
                        type="number"
                        className="input-field"
                        value={rules.childDeathLeave}
                        onChange={(e) => setRules(prev => ({ ...prev, childDeathLeave: parseInt(e.target.value) || 0 }))}
                      />
                    </div>
                    <div>
                      <label className="input-label">형제자매 사망 (일)</label>
                      <input
                        type="number"
                        className="input-field"
                        value={rules.siblingDeathLeave}
                        onChange={(e) => setRules(prev => ({ ...prev, siblingDeathLeave: parseInt(e.target.value) || 0 }))}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ========== 2025년 개정사항 ========== */}
            {activeSection === 'law2025' && (
              <div className="space-y-6">
                <div className="form-section">
                  <h2 className="form-section-title">⭐ 2025년 법령 개정사항</h2>
                  <p className="text-sm text-gray-600 mb-4">2025.2.23 시행 개정 법령을 반영합니다. 옵션을 끄면 기존(2024년) 기준이 적용됩니다.</p>
                  
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={rules.spouseLeave2025}
                          onChange={(e) => setRules(prev => ({ ...prev, spouseLeave2025: e.target.checked }))}
                          className="w-5 h-5 mt-0.5"
                        />
                        <div>
                          <span className="font-semibold">배우자 출산휴가 확대</span>
                          <p className="text-sm text-gray-600 mt-1">
                            {rules.spouseLeave2025 
                              ? '✅ 20일 (120일 이내 청구, 3회 분할 가능)' 
                              : '❌ 10일 (90일 이내 청구, 1회 분할)'}
                          </p>
                        </div>
                      </label>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-lg">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={rules.parentalLeave2025}
                          onChange={(e) => setRules(prev => ({ ...prev, parentalLeave2025: e.target.checked }))}
                          className="w-5 h-5 mt-0.5"
                        />
                        <div>
                          <span className="font-semibold">육아휴직 기간 확대</span>
                          <p className="text-sm text-gray-600 mt-1">
                            {rules.parentalLeave2025 
                              ? '✅ 1년 6개월 (부모 각 3개월 이상 사용 시, 한부모, 중증장애아동 부모), 분할 4회' 
                              : '❌ 1년, 분할 2회'}
                          </p>
                        </div>
                      </label>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-lg">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={rules.childcareReduction2025}
                          onChange={(e) => setRules(prev => ({ ...prev, childcareReduction2025: e.target.checked }))}
                          className="w-5 h-5 mt-0.5"
                        />
                        <div>
                          <span className="font-semibold">육아기 근로시간 단축 확대</span>
                          <p className="text-sm text-gray-600 mt-1">
                            {rules.childcareReduction2025 
                              ? '✅ 대상: 12세 이하 (초등 6학년), 최소 1개월 분할, 최대 3년' 
                              : '❌ 대상: 8세 이하 (초등 2학년), 최소 3개월 분할'}
                          </p>
                        </div>
                      </label>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-lg">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={rules.infertilityLeave2025}
                          onChange={(e) => setRules(prev => ({ ...prev, infertilityLeave2025: e.target.checked }))}
                          className="w-5 h-5 mt-0.5"
                        />
                        <div>
                          <span className="font-semibold">난임치료휴가 확대</span>
                          <p className="text-sm text-gray-600 mt-1">
                            {rules.infertilityLeave2025 
                              ? '✅ 연 6일 (유급 2일)' 
                              : '❌ 연 3일 (유급 1일)'}
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ========== 고용지원금 옵션 ========== */}
            {activeSection === 'subsidy' && (
              <div className="space-y-6">
                <div className="form-section">
                  <h2 className="form-section-title">💵 고용지원금 관련 조항</h2>
                  <p className="text-sm text-gray-600 mb-4">
                    고령자 계속고용장려금, 정년연장 지원금 등을 받기 위해 필요한 취업규칙 조항입니다.
                  </p>

                  <div className="p-4 bg-green-50 rounded-lg border border-green-200 mb-4">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rules.enableRetirementExtension}
                        onChange={(e) => setRules(prev => ({ ...prev, enableRetirementExtension: e.target.checked }))}
                        className="w-5 h-5 mt-0.5"
                      />
                      <div className="flex-1">
                        <span className="font-semibold text-green-800">🎯 정년연장 (계속고용장려금)</span>
                        <p className="text-sm text-green-700 mt-1">법정 정년(60세)을 초과하여 정년을 연장합니다.</p>
                        {rules.enableRetirementExtension && (
                          <div className="mt-3 flex items-center gap-2">
                            <label className="text-sm">연장 정년:</label>
                            <select
                              className="input-field w-24"
                              value={rules.extendedRetirementAge}
                              onChange={(e) => setRules(prev => ({ ...prev, extendedRetirementAge: parseInt(e.target.value) }))}
                            >
                              <option value={62}>62세</option>
                              <option value={63}>63세</option>
                              <option value={64}>64세</option>
                              <option value={65}>65세</option>
                              <option value={70}>70세</option>
                            </select>
                          </div>
                        )}
                      </div>
                    </label>
                  </div>

                  <div className="p-4 bg-green-50 rounded-lg border border-green-200 mb-4">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rules.enableReemployment}
                        onChange={(e) => setRules(prev => ({ ...prev, enableReemployment: e.target.checked }))}
                        className="w-5 h-5 mt-0.5"
                      />
                      <div className="flex-1">
                        <span className="font-semibold text-green-800">🎯 정년 후 재고용 (촉탁직 전환)</span>
                        <p className="text-sm text-green-700 mt-1">정년퇴직자를 촉탁직으로 재고용하는 제도를 운영합니다.</p>
                        {rules.enableReemployment && (
                          <div className="mt-3 flex items-center gap-2">
                            <label className="text-sm">재고용 기간:</label>
                            <select
                              className="input-field w-24"
                              value={rules.reemploymentPeriod}
                              onChange={(e) => setRules(prev => ({ ...prev, reemploymentPeriod: parseInt(e.target.value) }))}
                            >
                              <option value={1}>1년</option>
                              <option value={2}>2년</option>
                              <option value={3}>3년</option>
                              <option value={5}>5년</option>
                            </select>
                          </div>
                        )}
                      </div>
                    </label>
                  </div>

                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rules.enableWagePeak}
                        onChange={(e) => setRules(prev => ({ ...prev, enableWagePeak: e.target.checked }))}
                        className="w-5 h-5 mt-0.5"
                      />
                      <div className="flex-1">
                        <span className="font-semibold text-green-800">🎯 임금피크제</span>
                        <p className="text-sm text-green-700 mt-1">정년연장/재고용과 연계하여 일정 연령 이후 임금을 조정합니다.</p>
                        {rules.enableWagePeak && (
                          <div className="mt-3 grid grid-cols-2 gap-2">
                            <div className="flex items-center gap-2">
                              <label className="text-sm">적용 시작:</label>
                              <select
                                className="input-field w-20"
                                value={rules.wagePeakStartAge}
                                onChange={(e) => setRules(prev => ({ ...prev, wagePeakStartAge: parseInt(e.target.value) }))}
                              >
                                {[55,56,57,58,59,60].map(age => <option key={age} value={age}>{age}세</option>)}
                              </select>
                            </div>
                            <div className="flex items-center gap-2">
                              <label className="text-sm">감액률:</label>
                              <select
                                className="input-field w-20"
                                value={rules.wagePeakReductionRate}
                                onChange={(e) => setRules(prev => ({ ...prev, wagePeakReductionRate: parseInt(e.target.value) }))}
                              >
                                {[10,15,20,25,30].map(rate => <option key={rate} value={rate}>{rate}%</option>)}
                              </select>
                            </div>
                          </div>
                        )}
                      </div>
                    </label>
                  </div>

                  <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-800">
                      <strong>💰 고령자 계속고용장려금:</strong> 월 30만원/인 (최대 2년)<br />
                      <strong>조건:</strong> 정년 60세 이상 + 계속고용 + 취업규칙 명시 필수
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ========== 유연근무제 ========== */}
            {activeSection === 'flexible' && (
              <div className="form-section">
                <h2 className="form-section-title">🏠 유연근무제 (선택)</h2>
                <p className="text-sm text-gray-600 mb-4">유연근무제를 도입할 경우 취업규칙에 명시가 필요합니다.</p>

                <div className="p-4 bg-gray-50 rounded-lg mb-4">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rules.enableFlexibleWork}
                      onChange={(e) => setRules(prev => ({ ...prev, enableFlexibleWork: e.target.checked }))}
                      className="w-5 h-5 mt-0.5"
                    />
                    <div>
                      <span className="font-semibold">유연근무제 도입</span>
                      <p className="text-sm text-gray-600 mt-1">선택 시 유연근무제 관련 조항이 취업규칙에 추가됩니다.</p>
                    </div>
                  </label>
                </div>

                {rules.enableFlexibleWork && (
                  <div className="space-y-3">
                    <p className="text-sm font-medium">도입할 유연근무제 유형 선택:</p>
                    {[
                      { id: '탄력적근로시간제', desc: '2주/3개월 단위로 평균 주40시간 운영' },
                      { id: '선택적근로시간제', desc: '출퇴근 시간을 근로자가 자유롭게 결정' },
                      { id: '재량근로시간제', desc: '연구개발, 디자인 등 재량업무' },
                      { id: '시차출퇴근제', desc: '출근시간대를 선택 (예: 8시/9시/10시)' },
                      { id: '재택근무제', desc: '자택 또는 지정된 장소에서 근무' },
                    ].map(type => (
                      <label key={type.id} className="flex items-start gap-3 cursor-pointer p-3 border rounded-lg hover:bg-gray-50">
                        <input
                          type="checkbox"
                          checked={rules.flexibleWorkTypes.includes(type.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setRules(prev => ({ ...prev, flexibleWorkTypes: [...prev.flexibleWorkTypes, type.id] }));
                            } else {
                              setRules(prev => ({ ...prev, flexibleWorkTypes: prev.flexibleWorkTypes.filter(t => t !== type.id) }));
                            }
                          }}
                          className="w-4 h-4 mt-0.5"
                        />
                        <div>
                          <span className="font-medium">{type.id}</span>
                          <p className="text-sm text-gray-500">{type.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeSection === 'discipline' && (
              <div className="form-section">
                <h2 className="form-section-title">⚖️ 징계</h2>
                <div className="space-y-4">
                  <div>
                    <label className="input-label">징계 종류 (선택)</label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {['견책', '감봉', '정직', '강등', '해고'].map(type => (
                        <label key={type} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={rules.disciplineTypes.includes(type)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setRules(prev => ({ ...prev, disciplineTypes: [...prev.disciplineTypes, type] }));
                              } else {
                                setRules(prev => ({ ...prev, disciplineTypes: prev.disciplineTypes.filter(d => d !== type) }));
                              }
                            }}
                            className="w-4 h-4"
                          />
                          <span>{type}</span>
                        </label>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      • 견책: 시말서 제출, 훈계<br />
                      • 감봉: 1회 평균임금 1일분의 1/2, 총액 임금의 1/10 이내<br />
                      • 정직: 1개월 이내 출근정지, 무급<br />
                      • 해고: 근로계약 해지
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg p-8 overflow-auto max-h-[80vh]">
          <WorkRulesPreview rules={rules} />
        </div>
      )}

      {/* 인쇄용 숨김 영역 */}
      <div className="hidden">
        <div ref={printRef} className="p-8">
          <WorkRulesPreview rules={rules} />
        </div>
      </div>
    </div>
  );
}

function WorkRulesPreview({ rules }: { rules: WorkRulesData }) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
  };

  // 2025년 개정 적용 값
  const spouseLeave = rules.spouseLeave2025 ? 20 : 10;
  const spouseLeaveDays = rules.spouseLeave2025 ? 120 : 90;
  const spouseLeaveSplit = rules.spouseLeave2025 ? 3 : 1;
  const parentalLeaveMonths = rules.parentalLeave2025 ? '1년 6개월' : '1년';
  const parentalLeaveSplit = rules.parentalLeave2025 ? 4 : 2;
  const childcareAge = rules.childcareReduction2025 ? 12 : 8;
  const childcareGrade = rules.childcareReduction2025 ? 6 : 2;
  const childcareMinMonths = rules.childcareReduction2025 ? 1 : 3;
  const infertilityDays = rules.infertilityLeave2025 ? 6 : 3;
  const infertilityPaid = rules.infertilityLeave2025 ? 2 : 1;

  const css = {
    section: { fontSize: '13px', fontWeight: 'bold' as const, marginTop: '24px', marginBottom: '12px', borderBottom: '2px solid #333', paddingBottom: '4px' },
    subSection: { fontSize: '12px', fontWeight: 'bold' as const, marginTop: '16px', marginBottom: '8px', color: '#444' },
    article: { marginBottom: '12px', lineHeight: '1.8', fontSize: '10.5pt' },
    title: { fontWeight: 'bold' as const },
    indent: { paddingLeft: '18px' },
  };

  return (
    <div style={{ fontFamily: "'Nanum Gothic', 'Malgun Gothic', sans-serif", fontSize: '10.5pt', lineHeight: '1.7', color: '#111' }}>
      {/* 제목 */}
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', textAlign: 'center', marginBottom: '30px', letterSpacing: '6px' }}>
        취 업 규 칙
      </h1>

      <p style={{ textAlign: 'right', marginBottom: '20px' }}>{rules.company.name || '○○주식회사'}</p>

      {/* 안내문 */}
      <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#f5f5f5', fontSize: '9pt', lineHeight: '1.6' }}>
        <p>◈ 이 취업규칙은 고용노동부 2025.3 표준 취업규칙을 기반으로 작성되었습니다.</p>
        <p>◈ 사업장 규모나 업종에 따라 내용을 변형하여 사용할 수 있습니다.</p>
        <p>◈ 취업규칙 변경 시 근로자 과반수의 의견 청취(불이익 변경 시 동의)가 필요합니다.</p>
      </div>

      {/* ==================== 제1장 총칙 ==================== */}
      <h2 style={css.section}>제1장 총칙</h2>

      <div style={css.article}>
        <p><span style={css.title}>제1조(목적)</span> 이 취업규칙은 {rules.company.name || '○○주식회사'} 사원의 채용·복무 및 근로조건 등에 관한 사항을 정함을 목적으로 한다.</p>
      </div>

      <div style={css.article}>
        <p><span style={css.title}>제2조(적용범위)</span> ① 이 취업규칙(이하 "규칙"이라 한다)은 {rules.company.name || '○○주식회사'}(이하 "회사"라 한다)에 근무하는 사원에게 적용한다.</p>
        <p>② 사원의 복무 및 근로조건에 관하여 법령, 단체협약 또는 이 규칙 이외의 다른 회사 규정에 별도로 정한 경우를 제외하고는 이 규칙이 정하는 바에 따른다.</p>
      </div>

      <div style={css.article}>
        <p><span style={css.title}>제3조(사원의 정의)</span> 이 규칙에서 "사원"이라 함은 회사와 근로계약을 체결한 무기계약사원과 기간제사원을 말하며, 단시간사원은 제외한다.</p>
      </div>

      <div style={css.article}>
        <p><span style={css.title}>제4조(차별금지)</span> 회사는 사원의 모집·채용, 임금·복리후생, 교육·훈련, 배치·전보·승진, 퇴직·해고·정년에 있어서 합리적인 이유 없이 성별, 연령, 신앙, 사회적 신분, 고용형태, 장애, 출신지역, 학력, 출신학교, 혼인‧임신‧출산 또는 병력(病歷) 등을 이유로 차별하지 않는다.</p>
      </div>

      {/* ==================== 제2장 채용 및 근로계약 ==================== */}
      <h2 style={css.section}>제2장 채용 및 근로계약</h2>

      <div style={css.article}>
        <p><span style={css.title}>제5조(채용)</span> ① 회사에 입사를 지원하는 자는 다음 각 호의 서류를 제출하여야 한다.</p>
        <p style={css.indent}>1. 이력서 1통</p>
        <p style={css.indent}>2. 자기소개서 1통</p>
        <p>② 회사는 입사를 지원하는 자에게 신체적 조건(용모‧키‧체중 등), 출신지역‧혼인여부‧재산, 직계존비속 및 형제자매의 학력‧직업‧재산 등 직무수행에 필요하지 아니한 사항은 채용심사 등의 자료로 요구하지 않는다.</p>
      </div>

      <div style={css.article}>
        <p><span style={css.title}>제6조(근로계약)</span> ① 회사는 채용이 확정된 자와 근로계약을 체결할 때에는 다음 각 호의 내용을 해당자에게 명확히 제시한다.</p>
        <p style={css.indent}>1. 임금</p>
        <p style={css.indent}>2. 소정근로시간, 휴게시간</p>
        <p style={css.indent}>3. 휴일</p>
        <p style={css.indent}>4. 연차유급휴가</p>
        <p style={css.indent}>5. 취업의 장소 및 종사하여야 할 업무에 관한 사항</p>
        <p style={css.indent}>6. 근로개시일, 근로계약기간(기간제사원에 한정한다)</p>
        <p style={css.indent}>7. 「근로기준법」 제93조제1호부터 제12호까지에 해당하는 내용</p>
        <p>② 회사는 근로계약을 체결함과 동시에 위 각 호의 내용을 적은 근로계약서 1부를 근로계약을 체결한 사원에게 교부한다. 이 경우 회사는 전자문서로 교부할 수 있다.</p>
      </div>

      <div style={css.article}>
        <p><span style={css.title}>제7조(수습기간)</span> ① 신규로 채용된 자는 최초로 근무를 개시한 날부터 {rules.probationPeriod}개월간을 수습기간으로 한다.</p>
        <p>② 제1항의 수습기간은 근속년수에 포함하되, 수습을 시작한 날부터 3개월 이내의 기간은 평균임금산정기간에는 포함하지 아니한다.</p>
      </div>

      {/* ==================== 제3장 복무 ==================== */}
      <h2 style={css.section}>제3장 복무</h2>

      <div style={css.article}>
        <p><span style={css.title}>제8조(복무의무)</span> 사원은 다음 각 호의 사항을 준수하여야 한다.</p>
        <p style={css.indent}>1. 사원은 맡은바 직무를 충실히 수행하여야 한다.</p>
        <p style={css.indent}>2. 사원은 직무상 지득한 비밀을 엄수하고 회사기밀을 누설해서는 아니 된다. 다만, 「공익신고자 보호법」상의 '공익신고'에 해당하는 경우에는 적용되지 아니한다.</p>
        <p style={css.indent}>3. 사원은 회사의 제반규정을 준수하고 상사의 정당한 직무상 지시에 따라야 한다.</p>
        <p style={css.indent}>4. 사원은 사원으로서 품위를 손상하거나 회사의 명예를 실추시키는 행위를 하여서는 아니 된다.</p>
        <p style={css.indent}>5. 사원은 그 밖에 제2호와 제4호 규정에 준하는 행위를 하여서는 아니 된다.</p>
      </div>

      <div style={css.article}>
        <p><span style={css.title}>제9조(출근, 결근)</span> ① 사원은 업무시간 시작 전까지 출근하여 업무에 임할 준비를 하여 정상적인 업무수행에 차질이 없도록 하여야 한다.</p>
        <p>② 질병이나 그 밖의 부득이한 사유로 결근하고자 하는 경우에는 사전에 소속부서의 장의 승인을 받아야 한다. 다만, 불가피한 사유로 사전에 승인을 받을 수 없는 경우에는 결근 당일에라도 그 사유를 명확히 하여 사후 승인을 받아야 하며 정당한 이유 없이 이러한 절차를 이행하지 아니한 경우 무단결근을 한 것으로 본다.</p>
      </div>

      <div style={css.article}>
        <p><span style={css.title}>제10조(지각·조퇴 및 외출)</span> ① 사원은 질병 그 밖의 부득이한 사유로 지각하게 되는 경우에는 사전에 부서의 장 또는 직근 상급자에게 알려야 하며, 부득이한 사정으로 사전에 알릴 수 없는 경우에는 사후에라도 지체 없이 이 사실을 알려야 한다.</p>
        <p>② 사원은 근로시간 중에는 사적인 용무를 이유로 근무 장소를 이탈할 수 없다. 다만, 질병이나 그 밖의 부득이한 사유가 있는 경우에는 소속 부서의 장의 승인을 받아 조퇴 또는 외출할 수 있다.</p>
        <p>③ 사원이 지각, 조퇴 또는 외출한 시간은 무급으로 처리함을 원칙으로 한다.</p>
      </div>

      <div style={css.article}>
        <p><span style={css.title}>제11조(공민권행사 및 공의 직무 수행)</span> ① 회사는 사원이 근무시간 중 선거권, 그 밖의 공민권을 행사하거나 공(公)의 직무를 수행하기 위하여 필요한 시간을 청구할 경우 이를 거부할 수 없다.</p>
        <p>② 회사는 제1항의 권리 행사나 공(公)의 직무를 수행하는데 지장이 없는 범위 내에서 사원이 청구한 시간을 변경할 수 있다.</p>
      </div>

      <div style={css.article}>
        <p><span style={css.title}>제12조(출장)</span> ① 회사는 업무수행을 위하여 필요한 경우 사원에게 출장을 명할 수 있다.</p>
        <p>② 회사는 행선지별 여비, 숙박비, 현지교통비 등 출장 비용을 실비 범위 내에서 지급한다.</p>
      </div>

      {/* ==================== 제4장 인사 ==================== */}
      <h2 style={css.section}>제4장 인사</h2>
      <h3 style={css.subSection}>제1절 인사위원회</h3>

      <div style={css.article}>
        <p><span style={css.title}>제13조(인사위원회의 구성)</span> ① 인사위원회는 대표이사를 포함하여 부서장(또는 그에 준하는 직급의 사원)과 근로자위원 등 사원의 이해관계를 대변할 수 있는 사원 중에서 대표이사가 임명하는 자로 총 5명 이내로 구성한다.</p>
        <p>② 위원회의 위원장은 대표이사 또는 대표이사가 위임한 자로 한다.</p>
        <p>③ 위원회에는 인사(총무)담당자 1명을 간사로 둔다.</p>
      </div>

      <div style={css.article}>
        <p><span style={css.title}>제14조(위원회의 기능)</span> 위원회는 다음 각 호의 사항을 의결한다.</p>
        <p style={css.indent}>1. 사원의 표창에 관한 사항</p>
        <p style={css.indent}>2. 사원의 징계에 관한 사항</p>
        <p style={css.indent}>3. 그 밖에 사원의 인사에 관하여 위원회의 의결이 필요한 사항</p>
      </div>

      <div style={css.article}>
        <p><span style={css.title}>제15조(위원회의 소집 및 운영)</span> ① 위원회는 제14조에 따른 의결사항이 있을 경우 위원장이 소집한다.</p>
        <p>② 위원장은 회의를 소집하고자 하는 경우 원칙적으로 회의 개최 7일 전에 회의일시, 장소, 의제 등을 각 위원에게 통보한다.</p>
        <p>③ 위원회는 재적위원 과반수의 출석과 출석위원 과반수의 찬성으로 의결한다. 다만, 징계에 관한 사항은 재적위원 3분의 2 이상의 찬성으로 의결한다.</p>
        <p>④ 위원장은 표결권을 가지며 가부동수일 때에는 결정권을 가진다.</p>
        <p>⑤ 위원회의 회의는 공개하지 아니하며 회의내용과 관련된 사항은 누설하여서는 아니 된다.</p>
      </div>

      <h3 style={css.subSection}>제2절 배치·전직 및 승진</h3>

      <div style={css.article}>
        <p><span style={css.title}>제16조(배치, 전직, 승진)</span> ① 회사는 사원의 능력, 적성, 경력 등을 고려하여 부서의 배치, 전직, 승진 등 인사발령을 하며, 사원은 정당한 사유 없이 이를 거부할 수 없다.</p>
        <p>② 회사는 제1항에 따른 인사발령을 할 때 합리적인 이유 없이 성별, 장애, 연령, 고용형태 등을 이유로 차별하지 아니한다.</p>
      </div>

      <h3 style={css.subSection}>제3절 휴직 및 복직</h3>

      <div style={css.article}>
        <p><span style={css.title}>제17조(휴직사유 및 기간)</span> 사원은 다음 각 호의 어느 하나에 해당하는 사유로 휴직을 원하는 경우 다음 각 호의 구분에 따른 기간을 고려하여 휴직을 시작하려는 날의 30일 전까지 회사에 휴직원을 제출하여야 한다. 이 경우 제3호에 따른 휴직 외에는 무급을 원칙으로 한다.</p>
        <p style={css.indent}>1. 업무 외 질병, 부상, 장애 등으로 장기 요양이 필요할 때: 1년의 범위 내에서 요양에 필요한 기간</p>
        <p style={css.indent}>2. 「병역법」에 따른 병역 복무를 마치기 위하여 징집 또는 소집된 경우: 징집 또는 소집기간</p>
        <p style={css.indent}>3. 회사가 지정하는 국내‧외 연구기관 또는 교육기관 등에서 연수, 직무훈련 등을 하게 된 경우: 1년의 범위 내에서 연수 등에 필요한 기간</p>
        <p style={css.indent}>4. 임신 중인 여성 사원이 모성을 보호하거나 만 8세 이하 또는 초등학교 2학년 이하의 자녀를 가진 사원이 그 자녀의 양육을 위하여 필요한 경우(이하 "육아휴직"): {parentalLeaveMonths} 이내</p>
        {rules.parentalLeave2025 && (
          <p style={{ ...css.indent, color: '#0066cc', fontSize: '9.5pt' }}>※ 부모가 각각 3개월 이상 사용 시, 한부모, 중증장애아동 부모의 경우 6개월 추가 가능</p>
        )}
        <p style={css.indent}>5. 사원이 조부모, 부모, 배우자, 배우자의 부모, 자녀 또는 손자녀의 질병, 사고, 노령으로 인하여 그 가족을 돌보기 위하여 필요한 경우(이하 "가족돌봄휴직"): 연간 90일 이내, 1회 30일 이상</p>
      </div>

      <div style={css.article}>
        <p><span style={css.title}>제18조(휴직명령)</span> ① 회사는 사원이 휴직원을 제출하면 이를 심사하여 휴직명령 여부를 결정하여 사원에게 서면(전자문서를 포함한다)으로 통보한다.</p>
        <p>② 회사는 휴직사유가 제17조제4호에 해당하는 경우라도 육아휴직을 시작하려는 날의 전날까지 계속 근로한 기간이 6개월 미만인 경우에는 휴직명령을 하지 않을 수 있다.</p>
      </div>

      <div style={css.article}>
        <p><span style={css.title}>제19조(준수사항)</span> ① 휴직자는 휴직기간 중 거주지의 변동 등의 사유가 있을 때에는 지체 없이 회사에 그 사실을 알려야 한다.</p>
        <p>② 회사는 사원이 육아휴직하는 경우 고용보험법령이 정하는 육아휴직급여를 받을 수 있도록 증빙서류를 제공하는 등 적극 협조한다.</p>
      </div>

      <div style={css.article}>
        <p><span style={css.title}>제20조(복직)</span> ① 사원은 휴직기간 만료일 7일 전까지 복직원을 제출하여야 한다.</p>
        <p>② 사원은 휴직기간 중 휴직사유가 소멸되었을 때에는 지체없이 복직원을 제출해야 한다.</p>
        <p>③ 회사는 휴직 중인 사원으로부터 복직원을 제출 받은 경우에는 최대한 빠른 시일 내에 휴직 전의 직무에 복직시키도록 노력한다.</p>
      </div>

      <div style={css.article}>
        <p><span style={css.title}>제21조(근속기간의 계산 등)</span> 휴직기간은 근속기간에 산입하되, 「근로기준법」 제2조제1항제6호에 따른 평균임금 산정기준이 되는 기간에서는 제외한다.</p>
      </div>

      {/* ==================== 제5장 근로시간 ==================== */}
      <h2 style={css.section}>제5장 근로시간</h2>

      {rules.enableShiftWork && (
        <div style={css.article}>
          <p><span style={css.title}>제22조(교대근로)</span> 각 사원의 근무형태는 {rules.shiftWorkType}로 한다.</p>
        </div>
      )}

      <div style={css.article}>
        <p><span style={css.title}>제{rules.enableShiftWork ? 23 : 22}조(근로시간)</span> ① 근로시간 산정을 위한 기준이 되는 1주는 유급주휴일을 포함하여 월요일부터 일요일까지 7일로 하고, 이 중 근무일은 {rules.workDays.join('요일, ')}요일이며, 나머지는 휴무일로 한다.</p>
        <p>② 1주간의 근로시간은 휴게시간을 제외하고 {rules.weeklyHours}시간으로 한다. 다만, 18세 미만인 사원의 경우 1주간의 근로시간은 휴게시간을 제외하고 35시간으로 한다.</p>
        <p>③ 1일의 근로시간은 휴게시간을 제외하고 {rules.workStartTime}부터 {rules.workEndTime}까지 8시간으로 한다. 다만, 18세 미만 사원의 경우 1일의 근로시간은 휴게시간을 제외하고 7시간으로 한다.</p>
      </div>

      <div style={css.article}>
        <p><span style={css.title}>제{rules.enableShiftWork ? 24 : 23}조(휴게)</span> ① 휴게시간은 근로시간 중 {rules.breakStartTime}부터 {rules.breakEndTime}까지 {rules.breakTime}분으로 한다. 다만, 업무 사정에 따라 휴게시간을 달리 정하여 운영할 수 있다.</p>
        <p>② 제1항 단서에 따라 휴게시간을 달리 정할 경우 회사는 해당되는 사원에게 미리 공지한다.</p>
      </div>

      {rules.enableFlexibleWork && rules.flexibleWorkTypes.includes('탄력적근로시간제') && (
        <div style={css.article}>
          <p><span style={css.title}>제{rules.enableShiftWork ? 25 : 24}조(탄력적 근로시간제)</span> ① 회사는 근로자대표와의 서면합의에 따라 2주 또는 3개월 단위의 탄력적 근로시간제를 시행할 수 있다.</p>
          <p>② 탄력적 근로시간제를 시행하는 경우 단위기간을 평균하여 1주간의 근로시간이 40시간을 초과하지 않는 범위에서 특정일 8시간, 특정 주 40시간을 초과하여 근로하게 할 수 있다.</p>
          <p>③ 15세 이상 18세 미만의 사원과 임신 중인 여성사원은 탄력적 근로시간제를 적용하지 아니한다.</p>
        </div>
      )}

      {rules.enableFlexibleWork && rules.flexibleWorkTypes.includes('선택적근로시간제') && (
        <div style={css.article}>
          <p><span style={css.title}>제{rules.enableShiftWork ? 26 : 25}조(선택적 근로시간제)</span> ① 회사는 업무의 시작 및 종료 시각을 사원의 결정에 맡기기로 한 사원에 대하여 「근로기준법」상 근로자대표와 서면으로 합의한 내용에 따라 선택적 근로시간제를 시행할 수 있다.</p>
          <p>② 선택적 근로시간제를 시행하는 경우 정산기간을 평균하여 1주간의 근로시간이 40시간을 초과하지 아니하는 범위에서 1주에 40시간, 1일에 8시간을 초과하여 근로하게 할 수 있다.</p>
          <p>③ 15세 이상 18세 미만의 사원은 선택적 근로시간제를 적용하지 아니한다.</p>
        </div>
      )}

      {rules.enableFlexibleWork && rules.flexibleWorkTypes.includes('재량근로시간제') && (
        <div style={css.article}>
          <p><span style={css.title}>제{rules.enableShiftWork ? 27 : 26}조(재량근로)</span> 업무의 성질에 비추어 업무 수행 방법을 사원의 재량에 위임할 필요가 있는 업무로서 「근로기준법 시행령」에서 규정된 업무는 근로자대표와 서면 합의로 정한 시간을 근로한 것으로 본다.</p>
        </div>
      )}

      <div style={css.article}>
        <p><span style={css.title}>제{rules.enableShiftWork ? 28 : 27}조(연장·야간 및 휴일근로)</span> ① 연장근로는 1주간 12시간을 한도로 사원의 동의하에 실시할 수 있다. 다만, 18세 미만 사원은 1일 1시간, 1주일에 5시간을 한도로 사원의 동의하에 실시할 수 있고, 산후 1년이 지나지 아니한 여성사원에 대하여는 1일 2시간, 1주 6시간, 1년 150시간을 한도로 사원의 동의하에 실시할 수 있으며, 임신 중인 여성사원은 연장근로를 실시할 수 없다.</p>
        <p>② 연장근로에 대하여는 통상임금의 100분의 50 이상을 가산하여 지급한다.</p>
        <p>③ 휴일근로에 대하여는 8시간 이내의 경우 통상임금의 100분의 50, 8시간을 초과한 경우 통상임금의 100분의 100을 가산하여 지급한다.</p>
        <p>④ 야간근로(오후 10시부터 다음 날 오전 6시 사이의 근로)에 대하여는 통상임금의 100분의 50 이상을 가산하여 지급한다.</p>
        <p>⑤ 회사는 근로자대표와 서면 합의하여 연장·야간 및 휴일근로에 대하여 임금을 지급하는 것을 대신하여 휴가를 줄 수 있다.</p>
      </div>

      <div style={css.article}>
        <p><span style={css.title}>제{rules.enableShiftWork ? 29 : 28}조(야간 및 휴일근로의 제한)</span> ① 18세 이상의 여성 사원을 오후 10시부터 오전 6시까지 근로하게 하거나 휴일에 근로를 시킬 경우 당해 사원의 동의를 얻어 실시한다.</p>
        <p>② 임산부와 18세 미만인 사원에 대하여는 오후 10시부터 오전 6시까지의 시간 및 휴일에 근로를 시키지 않는 것을 원칙으로 한다. 다만, 해당 사원의 동의 또는 명시적 청구가 있고 고용노동부장관의 인가를 받은 경우에는 야간 및 휴일근로를 실시할 수 있다.</p>
      </div>

      <div style={css.article}>
        <p><span style={css.title}>제{rules.enableShiftWork ? 30 : 29}조(근로시간 및 휴게·휴일의 적용제외)</span> ① 다음 각 호의 어느 하나에 해당하는 사원에 대하여는 1주 40시간, 1일 8시간을 초과하여 연장근로하거나 휴일에 근로하더라도 연장근로 및 휴일근로 가산임금을 지급하지 않는다.</p>
        <p style={css.indent}>1. 감시·단속적 업무로서 고용노동부장관의 승인을 받은 경우</p>
        <p style={css.indent}>2. 관리·감독 업무 또는 기밀취급 업무에 종사하는 경우</p>
        <p>② 제1항의 각 호에 해당하는 사원이 야간에 근로한 경우 통상임금의 100분의 50 이상을 가산하여 지급한다.</p>
      </div>

      {/* ==================== 제6장 휴일·휴가 ==================== */}
      <h2 style={css.section}>제6장 휴일·휴가</h2>

      <div style={css.article}>
        <p><span style={css.title}>제{rules.enableShiftWork ? 31 : 30}조(유급휴일)</span> ① 모든 사원의 주휴일은 매주 일요일로 한다. 다만, 개별 사원과 합의로 주휴일을 다른 날로 변경할 수 있다.</p>
        <p>② 1주 동안 소정근로일을 개근한(결근이 없는) 사원에 대하여는 유급주휴일로 부여한다.</p>
        <p>③ 근로자의 날(5월 1일)은 유급휴일로 한다.</p>
        <p>④ 「관공서의 공휴일에 관한 규정」에 따른 공휴일(일요일 제외) 및 대체공휴일은 유급휴일로 한다. 다만, 근로자대표와 서면 합의한 경우 특정한 근로일로 대체할 수 있다.</p>
      </div>

      <div style={css.article}>
        <p><span style={css.title}>제{rules.enableShiftWork ? 32 : 31}조(연차유급휴가)</span> ① 1년간 80퍼센트 이상 출근한 사원에게는 {rules.annualLeave}일의 유급휴가를 준다.</p>
        <p>② 계속하여 근로한 기간이 1년 미만인 사원 또는 1년간 80퍼센트 미만 출근한 사원에게 1개월 개근 시 1일의 유급휴가를 준다.</p>
        <p>③ 3년 이상 근속한 사원에 대하여는 제1항 규정에 따른 휴가에 최초 1년을 초과하는 계속 근로연수 매 2년에 대하여 1일을 가산한 유급휴가를 주며, 가산휴가를 포함한 총 휴가일수는 25일을 한도로 한다.</p>
        <p>④ 제1항 및 제2항을 적용하는 경우 다음 각 호의 어느 하나에 해당하는 기간은 출근한 것으로 본다.</p>
        <p style={css.indent}>1. 사원이 업무상의 부상 또는 질병으로 휴업한 기간</p>
        <p style={css.indent}>2. 임신 중의 여성이 출산전후휴가로 휴업한 기간</p>
        <p style={css.indent}>3. 육아휴직으로 휴업한 기간</p>
        <p style={css.indent}>4. 육아기 근로시간 단축을 사용하여 단축된 근로시간</p>
        <p style={css.indent}>5. 임신기 근로시간 단축을 사용하여 단축된 근로시간</p>
      </div>

      <div style={css.article}>
        <p><span style={css.title}>제{rules.enableShiftWork ? 33 : 32}조(연차유급휴가의 사용)</span> ① 연차유급휴가는 사원이 청구한 시기에 주어야 한다. 다만, 청구한 시기에 휴가를 주는 것이 사업 운영에 막대한 지장이 있는 경우 그 시기를 변경할 수 있다.</p>
        <p>② 사원의 연차유급휴가는 1년간 사용할 수 있다. 다만, 회사의 귀책사유로 사용하지 못한 경우에는 그러하지 아니하다.</p>
      </div>

      <div style={css.article}>
        <p><span style={css.title}>제{rules.enableShiftWork ? 34 : 33}조(연차유급휴가의 사용촉진)</span> ① 회사는 연차유급휴가의 사용을 촉진하기 위하여 다음 각 호의 조치를 취할 수 있다. 회사의 사용촉진조치에도 불구하고 사원이 사용하지 아니한 연차유급휴가에 대하여는 금전으로 보상하지 아니한다.</p>
        <p style={css.indent}>1. 연차유급휴가 사용기간이 끝나기 6개월 전을 기준으로 10일 이내에 사원별로 사용하지 않은 휴가일수를 알려주고, 사원이 그 사용 시기를 정하여 회사에 통보하도록 서면으로 촉구할 것</p>
        <p style={css.indent}>2. 제1호에 따른 촉구에도 불구하고 사원이 촉구를 받은 때부터 10일 이내에 사용 시기를 정하여 회사에 통보하지 않은 부분에 대하여 연차유급휴가 사용기간이 끝나기 2개월 전까지 회사가 사용 시기를 정하여 사원에게 서면으로 통지할 것</p>
      </div>

      <div style={css.article}>
        <p><span style={css.title}>제{rules.enableShiftWork ? 35 : 34}조(연차유급휴가의 대체)</span> 회사는 근로자대표와의 서면합의에 의하여 연차유급휴가일을 갈음하여 특정한 근로일에 사원을 휴무시킬 수 있다.</p>
      </div>

      {rules.summerVacationDays > 0 && (
        <div style={css.article}>
          <p><span style={css.title}>제{rules.enableShiftWork ? 36 : 35}조(하기휴가)</span> 사원은 7월 1일부터 8월 31일까지 사이에 {rules.summerVacationDays}일의 하기(夏期)휴가를 사용할 수 있다. 이 경우 휴가개시일 3일 전에 부서의 장에게 승인을 받아야 한다.</p>
        </div>
      )}

      <div style={css.article}>
        <p><span style={css.title}>제{rules.enableShiftWork ? 37 : 36}조(경조사 휴가)</span> 회사는 다음 각 호의 어느 하나에 해당하는 범위에서 사원의 신청에 따라 유급의 경조사휴가를 부여한다.</p>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '8px', marginBottom: '8px', fontSize: '10pt' }}>
          <thead>
            <tr style={{ backgroundColor: '#f5f5f5' }}>
              <th style={{ border: '1px solid #333', padding: '6px' }}>구분</th>
              <th style={{ border: '1px solid #333', padding: '6px' }}>일수</th>
            </tr>
          </thead>
          <tbody>
            <tr><td style={{ border: '1px solid #333', padding: '6px' }}>본인 결혼</td><td style={{ border: '1px solid #333', padding: '6px', textAlign: 'center' }}>{rules.marriageLeave}일</td></tr>
            <tr><td style={{ border: '1px solid #333', padding: '6px' }}>본인·배우자의 부모 또는 배우자 사망</td><td style={{ border: '1px solid #333', padding: '6px', textAlign: 'center' }}>{rules.parentDeathLeave}일</td></tr>
            <tr><td style={{ border: '1px solid #333', padding: '6px' }}>본인·배우자의 조부모 또는 외조부모 사망</td><td style={{ border: '1px solid #333', padding: '6px', textAlign: 'center' }}>{rules.grandparentDeathLeave}일</td></tr>
            <tr><td style={{ border: '1px solid #333', padding: '6px' }}>자녀 또는 그 자녀의 배우자 사망</td><td style={{ border: '1px solid #333', padding: '6px', textAlign: 'center' }}>{rules.childDeathLeave}일</td></tr>
            <tr><td style={{ border: '1px solid #333', padding: '6px' }}>본인·배우자의 형제·자매 사망</td><td style={{ border: '1px solid #333', padding: '6px', textAlign: 'center' }}>{rules.siblingDeathLeave}일</td></tr>
          </tbody>
        </table>
      </div>

      <div style={css.article}>
        <p><span style={css.title}>제{rules.enableShiftWork ? 38 : 37}조(배우자 출산휴가)</span> ① 회사는 사원이 배우자의 출산을 이유로 휴가를 청구하는 경우에 근무일 기준으로 <strong>{spouseLeave}일</strong>의 유급휴가를 부여한다.</p>
        <p>② 제1항에 따른 휴가는 사원의 배우자가 출산한 날로부터 {spouseLeaveDays}일이 지나면 사용할 수 없다.</p>
        <p>③ 제1항에 따른 휴가는 {spouseLeaveSplit}회에 한하여 나누어 사용할 수 있다.</p>
        {rules.spouseLeave2025 && (
          <p style={{ color: '#0066cc', fontSize: '9.5pt' }}>※ 2025.2.23. 시행 개정법 적용</p>
        )}
      </div>

      <div style={css.article}>
        <p><span style={css.title}>제{rules.enableShiftWork ? 39 : 38}조(생리휴가)</span> 회사는 여성 사원이 청구하는 경우 월 1일의 무급생리휴가를 부여한다.</p>
      </div>

      <div style={css.article}>
        <p><span style={css.title}>제{rules.enableShiftWork ? 40 : 39}조(병가)</span> ① 회사는 사원이 업무 외 질병·부상 등으로 병가를 신청하는 경우에는 연간 {rules.sickLeaveDays}일을 초과하지 않는 범위 내에서 병가를 허가할 수 있다. 이 경우 병가기간은 무급으로 한다.</p>
        <p>② 상해나 질병 등으로 1주 이상 계속 결근 시에는 검진의사의 진단서를 첨부하여야 한다.</p>
      </div>

      <div style={css.article}>
        <p><span style={css.title}>제{rules.enableShiftWork ? 41 : 40}조(난임치료휴가)</span> ① 회사는 사원이 인공수정 또는 체외수정 등 난임치료를 받기 위하여 휴가를 청구하는 경우에 연간 <strong>{infertilityDays}일</strong> 이내의 휴가를 주어야 하며, 이 경우 최초 {infertilityPaid}일은 유급으로 한다.</p>
        <p>② 난임치료휴가를 신청하려는 사원은 난임치료휴가를 사용하려는 날, 난임치료휴가 신청 연월일 등에 대한 사항을 적은 문서(전자문서를 포함한다)를 회사에 제출해야 한다.</p>
        <p>③ 회사는 난임치료휴가를 신청한 사원에게 난임치료를 받을 사실을 증명할 수 있는 서류의 제출을 요구할 수 있다.</p>
      </div>

      <div style={css.article}>
        <p><span style={css.title}>제{rules.enableShiftWork ? 42 : 41}조(가족돌봄휴가)</span> ① 회사는 사원이 가족의 질병, 사고, 노령 또는 자녀의 양육으로 인하여 긴급하게 그 가족을 돌보기 위한 휴가를 신청하는 경우 이를 허용하여야 한다.</p>
        <p>② 가족돌봄휴가 기간은 연간 최장 10일로 한다. 다만, 가족돌봄휴가 기간은 가족돌봄휴직 기간에 포함된다.</p>
      </div>

      {/* ==================== 제7장 모성보호 ==================== */}
      <h2 style={css.section}>제7장 모성보호 및 일·가정 양립 지원</h2>

      <div style={css.article}>
        <p><span style={css.title}>제{rules.enableShiftWork ? 43 : 42}조(임산부의 보호)</span> ① 임신 중의 여성 사원에게는 출산 전과 출산 후를 통하여 90일(미숙아를 출산한 경우에는 100일, 한 번에 둘 이상 자녀를 임신한 경우에는 120일)의 출산전후휴가를 준다. 이 경우 반드시 출산 후에 45일(한 번에 둘 이상 자녀를 임신한 경우에는 60일) 이상 부여한다.</p>
        <p>② 제1항에 따른 휴가 기간 중 최초 60일(한 번에 둘 이상 자녀를 임신한 경우는 최초 75일)은 유급으로 부여한다.</p>
        <p>③ 임신 중인 여성 사원이 유산 또는 사산한 경우로서 해당 사원이 청구하는 경우에는 다음 각 호에 따른 휴가를 부여한다.</p>
        <p style={css.indent}>1. 임신기간이 11주 이내인 경우: 유산 또는 사산한 날로부터 5일까지</p>
        <p style={css.indent}>2. 임신기간이 12주 이상 15주 이내인 경우: 유산 또는 사산한 날로부터 10일까지</p>
        <p style={css.indent}>3. 임신기간이 16주 이상 21주 이내인 경우: 유산 또는 사산한 날로부터 30일까지</p>
        <p style={css.indent}>4. 임신기간이 22주 이상 27주 이내인 경우: 유산 또는 사산한 날로부터 60일까지</p>
        <p style={css.indent}>5. 임신기간이 28주 이상인 경우: 유산 또는 사산한 날로부터 90일까지</p>
        <p>④ 임신 중의 여성 사원에게 연장근로를 시키지 아니하며, 그 사원의 요구가 있는 경우에는 쉬운 종류의 근로로 전환한다.</p>
        <p>⑤ 임신 후 12주 이내 또는 <strong>32주 이후</strong>에 있는 여성 사원이 1일 2시간의 근로시간 단축을 신청하는 경우 이를 허용한다. 다만, 1일 근로시간이 8시간 미만인 경우에는 1일 근로시간이 6시간이 되도록 근로시간 단축을 허용할 수 있다.</p>
        <p>⑥ 고위험 임산부(조기 진통, 다태아 임신 등)의 경우 의사의 진단에 따라 임신 전 기간에 대해 근로시간 단축을 허용한다.</p>
        <p>⑦ 회사는 제5항에 따른 근로시간 단축을 이유로 해당 사원의 임금을 삭감하지 아니한다.</p>
      </div>

      <div style={css.article}>
        <p><span style={css.title}>제{rules.enableShiftWork ? 44 : 43}조(태아검진 시간의 허용 등)</span> 회사는 임신한 여성 사원이 「모자보건법」 제10조에 따른 임산부 정기건강진단을 받는데 필요한 시간을 청구하는 경우 이를 허용하고, 이를 이유로 그 사원의 임금을 삭감하지 아니한다.</p>
      </div>

      <div style={css.article}>
        <p><span style={css.title}>제{rules.enableShiftWork ? 45 : 44}조(육아기 근로시간 단축)</span> ① 회사는 만 {childcareAge}세 이하 또는 초등학교 {childcareGrade}학년 이하의 자녀를 양육하기 위하여 근로시간의 단축을 신청하는 경우에 이를 허용하여야 한다.</p>
        <p>② 육아기 근로시간 단축을 분할하여 사용하는 경우 1회 사용 시 최소 {childcareMinMonths}개월 이상이어야 한다.</p>
        <p>③ 육아기 근로시간 단축을 한 경우에 단축 후 근로시간은 주당 15시간 이상이어야 하고 35시간을 넘어서는 아니 된다.</p>
        {rules.childcareReduction2025 && (
          <p style={{ color: '#0066cc', fontSize: '9.5pt' }}>※ 육아휴직 미사용기간을 2배 가산하여 최대 3년까지 사용 가능 (2025.2.23. 시행)</p>
        )}
      </div>

      <div style={css.article}>
        <p><span style={css.title}>제{rules.enableShiftWork ? 46 : 45}조(육아기 근로시간 단축 중 근로조건 등)</span> ① 회사는 육아기 근로시간 단축을 하고 있는 사원에 대하여 근로시간에 비례하여 적용하는 경우 외에는 육아기 근로시간 단축을 이유로 그 사원의 임금을 삭감하지 아니한다.</p>
        <p>② 회사는 육아기 근로시간 단축을 하고 있는 사원에게 단축된 근로시간 외에 연장근로를 요구할 수 없다. 다만, 그 사원이 명시적으로 청구하는 경우에는 주 12시간 이내에서 연장근로를 시킬 수 있다.</p>
      </div>

      <div style={css.article}>
        <p><span style={css.title}>제{rules.enableShiftWork ? 47 : 46}조(육아휴직과 육아기 근로시간 단축의 사용형태)</span> 사원이 육아휴직이나 육아기 근로시간 단축을 사용하려는 경우에는 다음 각 호의 방법 중 하나를 선택하여 사용할 수 있다. 다만, 어느 방법을 사용하든지 육아휴직과 육아기 근로시간 단축의 사용 횟수는 합하여 {parentalLeaveSplit}회를 넘을 수 없다.</p>
        <p style={css.indent}>1. 육아휴직의 1회 사용</p>
        <p style={css.indent}>2. 육아기 근로시간 단축의 1회 사용</p>
        <p style={css.indent}>3. 육아휴직의 분할 사용(1회만 할 수 있다)</p>
        <p style={css.indent}>4. 육아기 근로시간 단축의 분할 사용(1회만 할 수 있다)</p>
        <p style={css.indent}>5. 육아휴직의 1회 사용과 육아기 근로시간 단축의 1회 사용</p>
      </div>

      <div style={css.article}>
        <p><span style={css.title}>제{rules.enableShiftWork ? 48 : 47}조(육아시간)</span> 회사는 생후 1년 미만의 유아(乳兒)를 가진 여성 사원이 청구하면 1일 2회 각각 30분 이상의 유급 수유 시간을 준다.</p>
      </div>

      <div style={css.article}>
        <p><span style={css.title}>제{rules.enableShiftWork ? 49 : 48}조(가족돌봄 등을 위한 근로시간 단축)</span> ① 회사는 사원이 다음 각 호의 어느 하나에 해당하는 사유로 근로시간의 단축을 신청하는 경우에 이를 허용하여야 한다.</p>
        <p style={css.indent}>1. 사원이 가족의 질병, 사고, 노령으로 인하여 그 가족을 돌보기 위한 경우</p>
        <p style={css.indent}>2. 사원 자신의 질병이나 부상으로 인한 건강 이유로 근로시간 단축이 필요한 경우</p>
        <p style={css.indent}>3. 55세 이상의 사원이 은퇴를 준비하기 위한 경우</p>
        <p style={css.indent}>4. 사원의 학업을 위한 경우</p>
        <p>② 가족돌봄 등을 위한 근로시간 단축의 기간은 1년 이내로 한다.</p>
      </div>

      {/* ==================== 제8장 임금 ==================== */}
      <h2 style={css.section}>제8장 임금</h2>

      <div style={css.article}>
        <p><span style={css.title}>제{rules.enableShiftWork ? 50 : 49}조(임금의 구성항목)</span> 임금의 구성항목은 다음과 같다.</p>
        <p style={css.indent}>1. 기본급</p>
        <p style={css.indent}>2. 수당(연장근로수당, 야간근로수당, 휴일근로수당, 연차수당 등)</p>
        <p style={css.indent}>3. 상여금(지급 시)</p>
      </div>

      <div style={css.article}>
        <p><span style={css.title}>제{rules.enableShiftWork ? 51 : 50}조(임금의 계산 및 지급방법)</span> ① 임금은 매월 1일부터 말일까지 1개월 단위로 산정한다.</p>
        <p>② 임금은 매월 {rules.paymentDate}일에 {rules.paymentMethod}로 직접 지급한다. 다만, 지급일이 휴일인 경우에는 그 전일에 지급한다.</p>
        <p>③ 임금에서 법령 또는 단체협약에 특별한 규정이 있는 경우에는 임금의 일부를 공제하거나 통화 이외의 것으로 지급할 수 있다.</p>
        <p>④ 회사는 임금을 지급하는 때에 임금명세서를 사원에게 교부한다.</p>
      </div>

      <div style={css.article}>
        <p><span style={css.title}>제{rules.enableShiftWork ? 52 : 51}조(비상시 지급)</span> 사원이 출산, 질병, 재해 그 밖에 비상한 경우의 비용에 충당하기 위하여 임금지급을 청구하는 경우에는 지급기일 전이라도 이미 근무한 부분에 대해서 지급한다.</p>
      </div>

      <div style={css.article}>
        <p><span style={css.title}>제{rules.enableShiftWork ? 53 : 52}조(휴업수당)</span> 회사의 귀책사유로 휴업하는 경우에는 휴업기간 동안 그 사원에게 평균임금의 100분의 70 이상의 수당을 지급한다. 다만, 평균임금의 100분의 70에 해당하는 금액이 통상임금을 초과하는 경우에는 통상임금을 휴업수당으로 지급할 수 있다.</p>
      </div>

      <div style={css.article}>
        <p><span style={css.title}>제{rules.enableShiftWork ? 54 : 53}조(상여금 지급)</span> 상여금은 지급 여부, 지급기준, 지급시기 등에 대해 별도의 규정으로 정할 수 있다.</p>
      </div>

      {/* ========== 임금피크제 (선택) ========== */}
      {rules.enableWagePeak && (
        <div style={css.article}>
          <p><span style={{ ...css.title, color: '#008000' }}>제{rules.enableShiftWork ? 55 : 54}조(임금피크제)</span></p>
          <p style={{ color: '#008000' }}>① 회사는 정년연장 및 고령자 고용 안정을 위하여 다음과 같이 임금피크제를 시행한다.</p>
          <p style={{ color: '#008000' }}>② 만 {rules.wagePeakStartAge}세가 도래한 다음 달부터 기본급의 {rules.wagePeakReductionRate}%를 감액한다.</p>
          <p style={{ color: '#008000' }}>③ 감액률은 연령에 따라 단계적으로 적용할 수 있으며, 구체적인 사항은 별도 내규로 정한다.</p>
          <p style={{ color: '#008000' }}>④ 임금피크제 대상자에게는 감액된 임금에 상응하는 직무 조정 또는 근로시간 단축 등을 부여할 수 있다.</p>
        </div>
      )}

      {/* ==================== 제9장 퇴직·해고 등 ==================== */}
      <h2 style={css.section}>제9장 퇴직·해고 등</h2>

      <div style={css.article}>
        <p><span style={css.title}>제{rules.enableShiftWork ? 56 : 55}조(퇴직 및 퇴직일)</span> ① 사원이 다음 각 호의 어느 하나에 해당하는 경우에는 퇴직한 것으로 본다.</p>
        <p style={css.indent}>1. 본인이 퇴직을 원하는 경우</p>
        <p style={css.indent}>2. 사망한 경우</p>
        <p style={css.indent}>3. 정년에 도달한 경우</p>
        <p style={css.indent}>4. 근로계약기간이 만료된 경우</p>
        <p>② 퇴직일은 제1항 각 호에 따라 다음과 같다.</p>
        <p style={css.indent}>1. 제1호의 경우 퇴직원에 기재된 일자</p>
        <p style={css.indent}>2. 제2호의 경우 사망일</p>
        <p style={css.indent}>3. 제3호의 경우 정년에 도달한 날이 속하는 달의 말일</p>
        <p style={css.indent}>4. 제4호의 경우 근로계약기간의 마지막 날</p>
      </div>

      <div style={css.article}>
        <p><span style={css.title}>제{rules.enableShiftWork ? 57 : 56}조(해고)</span> ① 회사는 사원이 다음 각 호의 어느 하나에 해당하는 경우에는 해고할 수 있다.</p>
        <p style={css.indent}>1. 신체 또는 정신상의 장애로 직무를 감당할 수 없다고 인정되는 경우</p>
        <p style={css.indent}>2. 직무수행 능력이 현저히 부족하여 정상적인 업무를 감당할 수 없다고 인정되는 경우</p>
        <p style={css.indent}>3. 고의 또는 중과실로 회사에 손해를 끼친 경우</p>
        <p style={css.indent}>4. 정당한 사유 없이 계속하여 5일 이상 결근하였을 때</p>
        <p style={css.indent}>5. 이 규칙 또는 그 밖의 사규를 위반하여 사원으로서의 의무를 이행하지 아니한 경우</p>
        <p style={css.indent}>6. 형사사건으로 유죄판결을 받은 경우</p>
        <p>② 회사는 제1항에 따른 해고 시 근로기준법 등 관계법령에서 정한 절차를 준수한다.</p>
      </div>

      <div style={css.article}>
        <p><span style={css.title}>제{rules.enableShiftWork ? 58 : 57}조(해고의 제한)</span> ① 회사는 사원이 업무상 부상 또는 질병의 요양을 위하여 휴업한 기간과 그 후 30일 동안 또는 산전·산후의 여성 사원이 「근로기준법」에 따라 휴업한 기간과 그 후 30일 동안은 해고하지 못한다.</p>
        <p>② 회사는 「근로기준법」 제23조에서 정한 정당한 이유 없이 사원을 해고하지 아니한다.</p>
      </div>

      <div style={css.article}>
        <p><span style={css.title}>제{rules.enableShiftWork ? 59 : 58}조(해고의 통지)</span> ① 회사는 사원을 해고하고자 하는 경우에는 적어도 30일 전에 해고예고를 하여야 하고, 30일 전에 해고예고를 하지 아니하였을 때에는 30일분 이상의 통상임금을 지급한다.</p>
        <p>② 회사는 사원을 해고하는 경우에는 해고사유와 해고시기를 서면으로 통지한다.</p>
      </div>

      <div style={css.article}>
        <p><span style={css.title}>제{rules.enableShiftWork ? 60 : 59}조(정년)</span> ① 사원의 정년은 만 {rules.retirementAge}세로 하고, 정년에 도달한 날이 속하는 달의 말일에 퇴직한다.</p>
        {rules.enableRetirementExtension && (
          <>
            <p style={{ color: '#008000', fontWeight: 'bold' }}>② 회사는 고령자 고용 촉진을 위하여 정년을 만 {rules.extendedRetirementAge}세까지 연장할 수 있다.</p>
            <p style={{ ...css.indent, color: '#008000', fontSize: '9pt' }}>※ 고령자 계속고용장려금 수령을 위한 정년연장 조항</p>
          </>
        )}
      </div>

      {/* ========== 정년 후 재고용 (선택) ========== */}
      {rules.enableReemployment && (
        <div style={css.article}>
          <p><span style={{ ...css.title, color: '#008000' }}>제{rules.enableShiftWork ? 61 : 60}조(정년 후 재고용)</span></p>
          <p style={{ color: '#008000' }}>① 회사는 정년에 도달한 사원 중 재고용을 희망하고 일정 자격을 갖춘 자를 촉탁직 사원으로 재고용할 수 있다.</p>
          <p style={{ color: '#008000' }}>② 재고용 기간은 {rules.reemploymentPeriod}년 이내로 하며, 근무실적 등을 고려하여 연장할 수 있다.</p>
          <p style={{ color: '#008000' }}>③ 재고용 사원의 근로조건은 별도의 근로계약으로 정한다.</p>
          <p style={{ ...css.indent, color: '#008000', fontSize: '9pt' }}>※ 고령자 계속고용장려금 수령을 위한 재고용 조항</p>
        </div>
      )}

      {/* ==================== 제10장 퇴직급여 ==================== */}
      <h2 style={css.section}>제10장 퇴직급여</h2>

      <div style={css.article}>
        <p><span style={css.title}>제{rules.enableShiftWork ? 62 : 61}조(퇴직급여제도의 설정)</span> ① 회사는 1년 이상 계속 근로한 사원에 대하여 「근로자퇴직급여 보장법」에 따라 퇴직급여제도를 설정한다.</p>
        <p>② 퇴직급여제도는 다음 각 호 중 하나 이상의 제도를 설정하여야 한다.</p>
        <p style={css.indent}>1. 퇴직금제도</p>
        <p style={css.indent}>2. 확정급여형퇴직연금제도(DB)</p>
        <p style={css.indent}>3. 확정기여형퇴직연금제도(DC)</p>
      </div>

      <div style={css.article}>
        <p><span style={css.title}>제{rules.enableShiftWork ? 63 : 62}조(퇴직급여의 지급)</span> ① 퇴직금제도를 설정한 경우 퇴직하는 사원에게 계속근로기간 1년에 대하여 30일분 이상의 평균임금을 퇴직금으로 지급한다.</p>
        <p>② 회사는 사원이 퇴직한 경우에는 그 지급사유가 발생한 날부터 14일 이내에 퇴직금을 지급한다. 다만, 특별한 사정이 있는 경우에는 당사자 간의 합의에 의하여 지급기일을 연장할 수 있다.</p>
      </div>

      {/* ==================== 제11장 표창 및 징계 ==================== */}
      <h2 style={css.section}>제11장 표창 및 징계</h2>

      <div style={css.article}>
        <p><span style={css.title}>제{rules.enableShiftWork ? 64 : 63}조(표창)</span> 회사는 사원으로서 다른 사원의 모범이 되거나 회사의 발전에 공로가 있다고 인정되는 사원에게 표창 또는 포상을 실시할 수 있다.</p>
      </div>

      <div style={css.article}>
        <p><span style={css.title}>제{rules.enableShiftWork ? 65 : 64}조(징계)</span> 회사는 사원에게 다음 각 호의 어느 하나에 해당하는 행위가 있을 경우 인사위원회의 심의·의결을 거쳐 징계할 수 있다.</p>
        <p style={css.indent}>1. 정당한 사유 없이 무단결근, 지각, 조퇴를 하거나 근무 중 이탈한 경우</p>
        <p style={css.indent}>2. 업무상의 지시나 명령에 정당한 사유 없이 불복종한 경우</p>
        <p style={css.indent}>3. 회사의 기밀을 누설하거나 회사의 명예를 훼손한 경우</p>
        <p style={css.indent}>4. 회사의 재산을 횡령·유용하거나 고의로 손실을 끼친 경우</p>
        <p style={css.indent}>5. 직무와 관련하여 금품을 수수하거나 부당한 이익을 취한 경우</p>
        <p style={css.indent}>6. 직장 내 성희롱 또는 직장 내 괴롭힘 행위를 한 경우</p>
        <p style={css.indent}>7. 근무 중 음주, 도박 또는 폭언, 폭력 등으로 직장 내 질서를 문란하게 한 경우</p>
        <p style={css.indent}>8. 고의 또는 중대한 과실로 업무상 재해나 안전사고를 발생시킨 경우</p>
        <p style={css.indent}>9. 이 규칙 또는 그 밖의 사규를 위반한 경우</p>
      </div>

      <div style={css.article}>
        <p><span style={css.title}>제{rules.enableShiftWork ? 66 : 65}조(징계의 종류)</span> 징계의 종류는 다음 각 호와 같다.</p>
        {rules.disciplineTypes.includes('견책') && (
          <p style={css.indent}>1. 견책: 시말서를 제출받고 훈계한다.</p>
        )}
        {rules.disciplineTypes.includes('감봉') && (
          <p style={css.indent}>2. 감봉: 1회의 금액이 평균임금 1일분의 2분의 1을, 총액이 1임금지급기 임금 총액의 10분의 1을 초과하지 않는 범위에서 임금을 감액한다.</p>
        )}
        {rules.disciplineTypes.includes('정직') && (
          <p style={css.indent}>3. 정직: 1개월 이내의 기간을 정하여 출근을 정지하고 그 기간 중 임금을 지급하지 아니한다.</p>
        )}
        {rules.disciplineTypes.includes('강등') && (
          <p style={css.indent}>4. 강등: 직위를 강등한다.</p>
        )}
        {rules.disciplineTypes.includes('해고') && (
          <p style={css.indent}>5. 해고: 근로계약을 해지한다.</p>
        )}
      </div>

      <div style={css.article}>
        <p><span style={css.title}>제{rules.enableShiftWork ? 67 : 66}조(징계심의)</span> ① 회사가 사원을 징계하고자 하는 경우에는 인사위원회를 소집하여 징계의결을 구하여야 한다.</p>
        <p>② 인사위원회는 징계대상자에게 출석하여 진술할 기회를 부여하여야 한다. 다만, 징계대상자가 정당한 사유 없이 인사위원회에 2회 이상 출석하지 아니한 경우에는 진술 없이 징계의결을 할 수 있다.</p>
        <p>③ 징계대상자가 출석하지 못할 사정이 있는 경우에는 서면으로 진술하게 할 수 있다.</p>
      </div>

      <div style={css.article}>
        <p><span style={css.title}>제{rules.enableShiftWork ? 68 : 67}조(징계결과 통보)</span> 인사위원회에서 징계가 의결되면 회사는 지체 없이 그 결과를 서면으로 징계대상자에게 통보한다.</p>
      </div>

      <div style={css.article}>
        <p><span style={css.title}>제{rules.enableShiftWork ? 69 : 68}조(재심절차)</span> ① 사원이 징계에 대하여 이의가 있는 경우에는 징계결과를 통보받은 날로부터 7일 이내에 인사위원회에 재심을 청구할 수 있다.</p>
        <p>② 재심청구가 있는 경우에는 인사위원회를 재소집하여 재심의결을 하여야 한다.</p>
      </div>

      {/* ==================== 제12장 교육 ==================== */}
      <h2 style={css.section}>제12장 교육</h2>

      <div style={css.article}>
        <p><span style={css.title}>제{rules.enableShiftWork ? 70 : 69}조(교육시간)</span> 회사는 사원에게 업무에 필요한 교육을 실시할 수 있으며, 사원은 교육에 성실히 참가하여야 한다.</p>
      </div>

      <div style={css.article}>
        <p><span style={css.title}>제{rules.enableShiftWork ? 71 : 70}조(직무교육)</span> 회사는 사원에게 다음 각 호의 직무교육을 실시할 수 있다.</p>
        <p style={css.indent}>1. 신입사원 교육</p>
        <p style={css.indent}>2. 직무능력향상 교육</p>
        <p style={css.indent}>3. 관리자 교육</p>
        <p style={css.indent}>4. 그 밖에 업무수행에 필요한 교육</p>
      </div>

      <div style={css.article}>
        <p><span style={css.title}>제{rules.enableShiftWork ? 72 : 71}조(법정의무교육)</span> 회사는 다음 각 호의 법정의무교육을 실시한다.</p>
        <p style={css.indent}>1. 직장 내 성희롱 예방교육: 연 1회</p>
        <p style={css.indent}>2. 직장 내 괴롭힘 예방교육: 연 1회</p>
        <p style={css.indent}>3. 개인정보보호 교육: 연 1회</p>
        <p style={css.indent}>4. 산업안전보건교육: 분기별</p>
        <p style={css.indent}>5. 퇴직연금 교육: 연 1회</p>
        <p style={css.indent}>6. 장애인 인식개선 교육: 연 1회</p>
      </div>

      {/* ==================== 제13장 직장 내 괴롭힘 ==================== */}
      <h2 style={css.section}>제13장 직장 내 괴롭힘의 금지</h2>

      <div style={css.article}>
        <p><span style={css.title}>제{rules.enableShiftWork ? 73 : 72}조(직장 내 괴롭힘 행위의 금지)</span> 회사의 사용자 또는 사원은 직장에서의 지위 또는 관계 등의 우위를 이용하여 업무상 적정범위를 넘어 다른 사원에게 신체적·정신적 고통을 주거나 근무환경을 악화시키는 행위(이하 "직장 내 괴롭힘"이라 한다)를 하여서는 아니 된다.</p>
      </div>

      <div style={css.article}>
        <p><span style={css.title}>제{rules.enableShiftWork ? 74 : 73}조(금지되는 직장 내 괴롭힘 행위)</span> 직장 내 괴롭힘 행위의 유형은 다음 각 호와 같다.</p>
        <p style={css.indent}>1. 신체에 대하여 폭행하거나 협박하는 행위</p>
        <p style={css.indent}>2. 지속·반복적인 욕설이나 폭언</p>
        <p style={css.indent}>3. 다른 사원들 앞에서 또는 온라인상에서 모욕감을 주거나 개인사에 대한 소문을 퍼뜨리는 행위</p>
        <p style={css.indent}>4. 합리적 이유 없이 반복적으로 개인 심부름 등 사적인 용무를 지시하는 행위</p>
        <p style={css.indent}>5. 합리적 이유 없이 업무능력이나 성과를 인정하지 않거나 조롱하는 행위</p>
        <p style={css.indent}>6. 집단적으로 따돌리거나 정당한 이유 없이 업무와 관련된 중요한 정보 또는 의사결정 과정에서 배제하는 행위</p>
        <p style={css.indent}>7. 정당한 이유 없이 상당 기간 동안 근로계약서 등에 명시되어 있는 업무와 무관한 일을 지시하거나 허드렛일만 시키는 행위</p>
        <p style={css.indent}>8. 정당한 이유 없이 상당 기간 동안 일을 거의 주지 않는 행위</p>
      </div>

      <div style={css.article}>
        <p><span style={css.title}>제{rules.enableShiftWork ? 75 : 74}조(직장 내 괴롭힘 예방교육)</span> 회사는 직장 내 괴롭힘 예방을 위한 교육을 연 1회 이상 실시한다.</p>
      </div>

      <div style={css.article}>
        <p><span style={css.title}>제{rules.enableShiftWork ? 76 : 75}조(직장 내 괴롭힘 예방·대응 조직)</span> ① 회사는 직장 내 괴롭힘 예방·대응 업무를 담당하는 조직을 지정한다.</p>
        <p>② 담당 조직은 직장 내 괴롭힘 예방·대응 업무를 총괄하며 상담, 조사, 조치 등 관련 업무를 담당한다.</p>
      </div>

      <div style={css.article}>
        <p><span style={css.title}>제{rules.enableShiftWork ? 77 : 76}조(사건의 접수)</span> ① 누구든지 직장 내 괴롭힘 발생 사실을 알게 된 경우 회사에 신고할 수 있다.</p>
        <p>② 회사는 직장 내 괴롭힘 신고를 접수하는 담당자 또는 부서를 지정하고 사원들에게 안내한다.</p>
      </div>

      <div style={css.article}>
        <p><span style={css.title}>제{rules.enableShiftWork ? 78 : 77}조(사건의 조사)</span> 회사는 신고를 접수하거나 직장 내 괴롭힘 발생 사실을 인지한 경우 지체 없이 사실 확인을 위한 조사를 실시한다.</p>
      </div>

      <div style={css.article}>
        <p><span style={css.title}>제{rules.enableShiftWork ? 79 : 78}조(피해자의 보호)</span> ① 회사는 조사 기간 동안 피해자 보호를 위해 필요한 경우 근무장소의 변경, 유급휴가 명령 등 적절한 조치를 한다.</p>
        <p>② 회사는 피해자의 의사에 반하여 조치를 하여서는 아니 된다.</p>
      </div>

      <div style={css.article}>
        <p><span style={css.title}>제{rules.enableShiftWork ? 80 : 79}조(직장 내 괴롭힘 사실의 확인 및 조치)</span> ① 회사는 조사 결과 직장 내 괴롭힘 발생 사실이 확인된 때에는 피해 사원이 요청하면 근무장소의 변경, 배치전환, 유급휴가 명령 등 적절한 조치를 한다.</p>
        <p>② 회사는 직장 내 괴롭힘 발생 사실이 확인된 때에는 지체 없이 행위자에 대하여 징계, 근무장소의 변경 등 필요한 조치를 한다.</p>
        <p>③ 회사는 직장 내 괴롭힘 발생 사실을 신고한 사원 및 피해 사원에게 해고나 그 밖의 불리한 처우를 하여서는 아니 된다.</p>
      </div>

      <div style={css.article}>
        <p><span style={css.title}>제{rules.enableShiftWork ? 81 : 80}조(고객의 폭언 등에 대한 조치)</span> ① 회사는 고객 등 제3자의 폭언, 폭행, 그 밖에 이에 준하는 행위로 인하여 사원에게 건강장해가 발생하거나 발생할 현저한 우려가 있는 경우에는 업무의 일시적 중단 또는 전환 등의 필요한 조치를 하여야 한다.</p>
        <p>② 회사는 사원이 제1항의 피해를 입은 경우 관계법령에 따라 산재신청 등 필요한 조치를 한다.</p>
      </div>

      {/* ==================== 제14장 직장 내 성희롱 ==================== */}
      <h2 style={css.section}>제14장 직장 내 성희롱의 금지 및 예방</h2>

      <div style={css.article}>
        <p><span style={css.title}>제{rules.enableShiftWork ? 82 : 81}조(직장 내 성희롱의 금지)</span> 회사의 사용자, 상급자 또는 사원은 직장 내 성희롱을 하여서는 아니 된다.</p>
      </div>

      <div style={css.article}>
        <p><span style={css.title}>제{rules.enableShiftWork ? 83 : 82}조(직장 내 성희롱 예방교육)</span> ① 회사는 직장 내 성희롱 예방을 위한 교육을 연 1회 이상 실시한다.</p>
        <p>② 성희롱 예방교육의 내용에는 다음 각 호의 사항이 포함되어야 한다.</p>
        <p style={css.indent}>1. 직장 내 성희롱에 관한 법령</p>
        <p style={css.indent}>2. 해당 사업장의 직장 내 성희롱 발생 시 처리절차와 조치기준</p>
        <p style={css.indent}>3. 해당 사업장의 직장 내 성희롱 피해 사원의 고충상담 및 구제절차</p>
        <p style={css.indent}>4. 그 밖에 직장 내 성희롱 예방에 필요한 사항</p>
      </div>

      <div style={css.article}>
        <p><span style={css.title}>제{rules.enableShiftWork ? 84 : 83}조(직장 내 성희롱 예방지침)</span> 회사는 직장 내 성희롱의 예방 및 근로자 보호 등을 위하여 다음 각 호의 사항을 포함하는 예방지침을 마련한다.</p>
        <p style={css.indent}>1. 직장 내 성희롱 관련 상담 및 고충 처리에 필요한 사항</p>
        <p style={css.indent}>2. 직장 내 성희롱 조사절차</p>
        <p style={css.indent}>3. 직장 내 성희롱 발생 시 피해 사원 보호절차</p>
        <p style={css.indent}>4. 직장 내 성희롱 행위자 징계절차 및 징계 수준</p>
        <p style={css.indent}>5. 그 밖에 직장 내 성희롱 예방 및 근로자 보호를 위하여 필요한 사항</p>
      </div>

      <div style={css.article}>
        <p><span style={css.title}>제{rules.enableShiftWork ? 85 : 84}조(직장 내 성희롱 발생 시 조치)</span> ① 회사는 직장 내 성희롱 발생 사실을 알게 된 경우 지체 없이 사실 확인을 위한 조사를 실시한다.</p>
        <p>② 회사는 조사 기간 동안 피해 사원을 보호하기 위하여 필요한 경우 해당 피해 사원에 대하여 근무장소의 변경, 유급휴가 명령 등 적절한 조치를 한다.</p>
        <p>③ 회사는 조사 결과 직장 내 성희롱 발생 사실이 확인된 때에는 지체 없이 직장 내 성희롱 행위자에 대하여 징계나 그 밖에 이에 준하는 조치를 한다.</p>
        <p>④ 회사는 직장 내 성희롱 발생 사실을 신고한 사원 및 피해 사원에게 해고나 그 밖의 불리한 처우를 하여서는 아니 된다.</p>
      </div>

      <div style={css.article}>
        <p><span style={css.title}>제{rules.enableShiftWork ? 86 : 85}조(고객 등에 의한 성희롱 방지)</span> ① 회사는 고객 등 업무와 밀접한 관련이 있는 자가 업무수행 과정에서 성적인 언동 등을 통하여 사원에게 성적 굴욕감 또는 혐오감 등을 느끼게 하여 해당 사원이 그로 인한 고충 해소를 요청할 경우 근무 장소 변경, 배치전환, 유급휴가의 명령 등 적절한 조치를 취하여야 한다.</p>
        <p>② 회사는 사원이 제1항에 따른 피해를 주장하거나 고객 등으로부터의 성적 요구 등에 불응한 것을 이유로 해고나 그 밖의 불이익한 조치를 하여서는 아니 된다.</p>
      </div>

      {/* ==================== 제15장 안전보건 ==================== */}
      <h2 style={css.section}>제15장 안전보건</h2>

      <div style={css.article}>
        <p><span style={css.title}>제{rules.enableShiftWork ? 87 : 86}조(안전보건관리규정)</span> 회사는 산업안전보건법에 따라 사업장의 안전·보건에 관한 사항을 정한 안전보건관리규정을 작성하여 시행한다.</p>
      </div>

      <div style={css.article}>
        <p><span style={css.title}>제{rules.enableShiftWork ? 88 : 87}조(안전보건 교육)</span> ① 회사는 산업안전보건법에 따라 사원에게 안전보건교육을 실시한다.</p>
        <p>② 사원은 안전보건교육에 성실히 참여하여야 한다.</p>
      </div>

      <div style={css.article}>
        <p><span style={css.title}>제{rules.enableShiftWork ? 89 : 88}조(위험기계·기구의 방호조치)</span> 회사는 산업안전보건법에서 정하는 위험기계·기구에 대하여 필요한 방호조치를 한다.</p>
      </div>

      <div style={css.article}>
        <p><span style={css.title}>제{rules.enableShiftWork ? 90 : 89}조(보호구의 지급 및 착용)</span> ① 회사는 안전과 보건을 위하여 필요한 보호구를 사원에게 지급한다.</p>
        <p>② 사원은 지급받은 보호구를 착용하고 작업하여야 한다.</p>
      </div>

      <div style={css.article}>
        <p><span style={css.title}>제{rules.enableShiftWork ? 91 : 90}조(작업환경측정)</span> 회사는 산업안전보건법에서 정하는 바에 따라 작업환경측정을 실시하고 그 결과를 사원에게 알린다.</p>
      </div>

      <div style={css.article}>
        <p><span style={css.title}>제{rules.enableShiftWork ? 92 : 91}조(건강진단)</span> ① 회사는 사원에 대하여 1년에 1회 이상 정기 건강진단을 실시한다.</p>
        <p>② 사원은 정당한 사유 없이 건강진단을 거부하여서는 아니 된다.</p>
      </div>

      <div style={css.article}>
        <p><span style={css.title}>제{rules.enableShiftWork ? 93 : 92}조(산업안전보건법 준수)</span> 회사와 사원은 산업안전보건법 및 관련 법령에서 정한 안전·보건에 관한 사항을 준수한다.</p>
      </div>

      {/* ==================== 제16장 재해보상 ==================== */}
      <h2 style={css.section}>제16장 재해보상</h2>

      <div style={css.article}>
        <p><span style={css.title}>제{rules.enableShiftWork ? 94 : 93}조(재해보상)</span> 사원의 업무상 재해에 대하여는 「산업재해보상보험법」에 따라 보상한다.</p>
      </div>

      {/* ==================== 제17장 보칙 ==================== */}
      <h2 style={css.section}>제17장 보칙</h2>

      <div style={css.article}>
        <p><span style={css.title}>제{rules.enableShiftWork ? 95 : 94}조(취업규칙의 비치)</span> 회사는 이 규칙을 사원이 자유롭게 열람할 수 있는 장소에 항상 게시하거나 비치한다.</p>
      </div>

      <div style={css.article}>
        <p><span style={css.title}>제{rules.enableShiftWork ? 96 : 95}조(취업규칙의 변경)</span> ① 이 규칙을 변경할 경우에는 근로자 과반수의 의견을 들어야 한다.</p>
        <p>② 취업규칙을 근로자에게 불리하게 변경하는 경우에는 근로자 과반수의 동의를 받아야 한다.</p>
      </div>

      {/* ==================== 부칙 ==================== */}
      <h2 style={css.section}>부칙</h2>

      <div style={css.article}>
        <p><span style={css.title}>제1조(시행일)</span> 이 규칙은 {formatDate(rules.effectiveDate)}부터 시행한다.</p>
      </div>

      <div style={css.article}>
        <p><span style={css.title}>제2조(경과조치)</span> 이 규칙 시행 전에 종전의 규정에 따라 행한 행위는 이 규칙에 따라 행한 것으로 본다.</p>
      </div>

      {/* 서명란 */}
      <div style={{ marginTop: '50px', textAlign: 'center' }}>
        <p style={{ marginBottom: '30px' }}>{formatDate(rules.effectiveDate)}</p>
        <p style={{ fontWeight: 'bold', fontSize: '12pt', marginBottom: '6px' }}>{rules.company.name || '○○주식회사'}</p>
        <p>대표이사 {rules.company.ceoName || '(성명)'} (인)</p>
      </div>

      {/* 신고 안내 */}
      <div style={{ marginTop: '40px', padding: '14px', backgroundColor: '#f5f5f5', fontSize: '9pt', lineHeight: '1.6' }}>
        <p><strong>※ 취업규칙 신고 안내</strong></p>
        <p>• 상시 10인 이상 사업장은 취업규칙을 작성하여 관할 노동관서에 신고하여야 합니다. (근로기준법 제93조)</p>
        <p>• 취업규칙을 변경하는 경우에도 변경 후 신고하여야 합니다.</p>
        <p>• 문의: 고용노동부 고객상담센터 ☎ 1350</p>
        {(rules.enableRetirementExtension || rules.enableReemployment) && (
          <>
            <p style={{ marginTop: '10px' }}><strong>※ 고용지원금 안내</strong></p>
            <p>• 고령자 계속고용장려금: 정년 60세 이상 + 계속고용 시 월 30만원/인 (최대 2년)</p>
            <p>• 신청: 고용보험 홈페이지 또는 고용센터</p>
          </>
        )}
      </div>
    </div>
  );
}