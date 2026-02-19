'use client';

import { useState, useRef, useEffect } from 'react';
import { useReactToPrint } from 'react-to-print';
import { CompanyInfo, Employee } from '@/types';
import { loadCompanyInfo, defaultCompanyInfo, formatDate, getActiveEmployees } from '@/lib/storage';
import HelpGuide from '@/components/HelpGuide';
import { useDocumentSave } from '@/hooks/useDocumentSave';

interface LeaveUsage {
  date: string;
  days: number;
  reason: string;
}

interface AnnualLeaveData {
  company: CompanyInfo;
  employeeName: string;
  department: string;
  position: string;
  hireDate: string;
  year: number;
  totalDays: number;
  usages: LeaveUsage[];
}

function calcAnnualLeave(hireDate: string, year: number): number {
  if (!hireDate) return 15;
  const hire = new Date(hireDate + 'T00:00:00');

  // 조회 시점: 해당 연도의 12월 31일
  const referenceDate = new Date(year, 11, 31);

  // 입사일로부터 조회 시점까지의 경과 일수
  const daysDiff = Math.floor((referenceDate.getTime() - hire.getTime()) / (1000 * 60 * 60 * 24));

  // 입사 1년 미만: 1개월 개근 시 1일 (근로기준법 제60조 제2항, 최대 11일)
  if (daysDiff < 365) {
    const workedMonths = Math.floor(daysDiff / 30);
    return Math.min(11, workedMonths);
  }

  // 1년 이상 근속: 15일 기본 + 2년마다 1일 추가 (최대 25일)
  // 입사일 기준으로 만 근속년수 계산
  const fullYears = Math.floor(daysDiff / 365);
  const extra = Math.max(0, Math.floor((fullYears - 1) / 2));
  return Math.min(25, 15 + extra);
}

function createDefaultData(): AnnualLeaveData {
  return {
    company: defaultCompanyInfo,
    employeeName: '',
    department: '',
    position: '',
    hireDate: '',
    year: new Date().getFullYear(),
    totalDays: 15,
    usages: [],
  };
}

export default function AnnualLeavePage() {
  const [data, setData] = useState<AnnualLeaveData>(createDefaultData);
  const [showPreview, setShowPreview] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');

  // 클라이언트에서만 데이터 로드
  useEffect(() => {
    const saved = loadCompanyInfo();
    if (saved) {
      setData(prev => ({ ...prev, company: saved }));
    }
    setEmployees(getActiveEmployees());
  }, []);
  const printRef = useRef<HTMLDivElement>(null);
  const { saveDocument, saving, saved } = useDocumentSave();

  const handleSaveToArchive = async () => {
    await saveDocument({
      docType: 'annual_leave',
      title: `연차관리대장 - ${data.employeeName || '이름없음'} ${data.year}년`,
      employeeId: selectedEmployeeId || undefined,
      data: data as unknown as Record<string, unknown>,
    });
  };

  const handleEmployeeSelect = (id: string) => {
    setSelectedEmployeeId(id);
    const emp = employees.find(e => e.id === id);
    if (emp) {
      const total = calcAnnualLeave(emp.hireDate, data.year);
      setData(prev => ({
        ...prev,
        employeeName: emp.info.name,
        department: emp.department || '',
        position: emp.position || '',
        hireDate: emp.hireDate || '',
        totalDays: total,
      }));
    }
  };

  const addUsage = () => {
    setData(prev => ({
      ...prev,
      usages: [...prev.usages, { date: '', days: 1, reason: '' }],
    }));
  };

  const removeUsage = (index: number) => {
    setData(prev => ({ ...prev, usages: prev.usages.filter((_, i) => i !== index) }));
  };

  const updateUsage = (index: number, field: keyof LeaveUsage, value: string | number) => {
    setData(prev => {
      const usages = [...prev.usages];
      usages[index] = { ...usages[index], [field]: value };
      return { ...prev, usages };
    });
  };

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `연차관리대장_${data.employeeName}_${data.year}년`,
  });

  const usedDays = data.usages.reduce((s, u) => s + u.days, 0);
  const remainDays = data.totalDays - usedDays;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">연차관리대장</h1>
          <p className="text-gray-500 mt-1">근로기준법 제60조 - 연차유급휴가 관리</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowPreview(!showPreview)} className="btn btn-secondary">
            {showPreview ? '수정' : '미리보기'}
          </button>
          {showPreview && (
            <button
              onClick={handleSaveToArchive}
              disabled={saving}
              className="btn btn-secondary disabled:opacity-50"
            >
              {saving ? '저장 중...' : saved ? '✓ 저장됨' : '🗄️ 보관함에 저장'}
            </button>
          )}
          <button onClick={() => handlePrint()} className="btn btn-primary" disabled={!data.employeeName}>
            인쇄/PDF
          </button>
        </div>
      </div>

      <HelpGuide
        pageKey="annual-leave"
        steps={[
          '직원을 선택하고 연차 기준 기간을 설정하세요.',
          '발생 연차, 사용 내역, 잔여 일수를 입력하세요.',
          '"미리보기"로 확인 후 "인쇄/PDF"로 출력하세요.',
        ]}
      />

      {!showPreview ? (
        <div className="space-y-6 animate-fade-in">
          <div className="form-section">
            <h2 className="form-section-title">기본 정보</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="input-label">관리 연도</label>
                <input type="number" className="input-field" value={data.year}
                  onChange={e => {
                    const y = parseInt(e.target.value) || new Date().getFullYear();
                    setData(prev => ({ ...prev, year: y, totalDays: calcAnnualLeave(prev.hireDate, y) }));
                  }} />
              </div>
              {employees.length > 0 && (
                <div>
                  <label className="input-label">직원 선택</label>
                  <select className="input-field" value={selectedEmployeeId} onChange={e => handleEmployeeSelect(e.target.value)}>
                    <option value="">선택</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.info.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="input-label">성명</label>
                <input type="text" className="input-field" value={data.employeeName}
                  onChange={e => setData(prev => ({ ...prev, employeeName: e.target.value }))} />
              </div>
              <div>
                <label className="input-label">입사일</label>
                <input type="date" className="input-field" value={data.hireDate}
                  onChange={e => {
                    const hd = e.target.value;
                    setData(prev => ({ ...prev, hireDate: hd, totalDays: calcAnnualLeave(hd, prev.year) }));
                  }} />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h2 className="form-section-title">연차 현황</h2>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="p-4 bg-blue-50 rounded-lg text-center">
                <p className="text-sm text-gray-500">발생일수</p>
                <div className="flex items-center justify-center gap-2">
                  <input type="number" className="input-field w-20 text-center text-xl font-bold" value={data.totalDays}
                    onChange={e => setData(prev => ({ ...prev, totalDays: parseInt(e.target.value) || 0 }))} />
                  <span className="text-lg">일</span>
                </div>
              </div>
              <div className="p-4 bg-amber-50 rounded-lg text-center">
                <p className="text-sm text-gray-500">사용일수</p>
                <p className="text-2xl font-bold text-amber-600">{usedDays}일</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg text-center">
                <p className="text-sm text-gray-500">잔여일수</p>
                <p className={`text-2xl font-bold ${remainDays <= 0 ? 'text-red-600' : 'text-green-600'}`}>{remainDays}일</p>
              </div>
            </div>
          </div>

          <div className="form-section">
            <div className="flex items-center justify-between mb-4">
              <h2 className="form-section-title mb-0">연차 사용 내역</h2>
              <button onClick={addUsage} className="btn btn-primary btn-sm">+ 사용 추가</button>
            </div>
            {data.usages.length === 0 ? (
              <p className="text-center text-gray-400 py-8">연차 사용 내역이 없습니다. &quot;+ 사용 추가&quot; 버튼을 눌러 추가하세요.</p>
            ) : (
              <div className="space-y-3">
                {data.usages.map((usage, i) => {
                  const remaining = data.totalDays - data.usages.slice(0, i + 1).reduce((s, u) => s + u.days, 0);
                  return (
                    <div key={i} className="grid grid-cols-12 gap-2 items-end p-3 bg-gray-50 rounded-lg">
                      <div className="col-span-3">
                        <label className="input-label">사용일자</label>
                        <input type="date" className="input-field text-sm" value={usage.date}
                          onChange={e => updateUsage(i, 'date', e.target.value)} />
                      </div>
                      <div className="col-span-2">
                        <label className="input-label">일수</label>
                        <input type="number" className="input-field text-sm" min={0.5} step={0.5} value={usage.days}
                          onChange={e => updateUsage(i, 'days', parseFloat(e.target.value) || 0)} />
                      </div>
                      <div className="col-span-4">
                        <label className="input-label">사유</label>
                        <input type="text" className="input-field text-sm" placeholder="개인 사유" value={usage.reason}
                          onChange={e => updateUsage(i, 'reason', e.target.value)} />
                      </div>
                      <div className="col-span-2 text-center">
                        <label className="input-label">잔여</label>
                        <p className={`text-sm font-bold ${remaining <= 0 ? 'text-red-600' : ''}`}>{remaining}일</p>
                      </div>
                      <div className="col-span-1">
                        <button onClick={() => removeUsage(i)} className="btn btn-ghost btn-sm text-red-500">X</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg p-8 animate-fade-in">
          <AnnualLeavePreview data={data} usedDays={usedDays} remainDays={remainDays} />
        </div>
      )}

      <div className="hidden">
        <div ref={printRef}><AnnualLeavePreview data={data} usedDays={usedDays} remainDays={remainDays} /></div>
      </div>
    </div>
  );
}

function AnnualLeavePreview({ data, usedDays, remainDays }: { data: AnnualLeaveData; usedDays: number; remainDays: number }) {
  const thStyle = { border: '1px solid #333', padding: '8px 12px', backgroundColor: '#f3f4f6', fontWeight: 600, fontSize: '13px', textAlign: 'center' as const };
  const tdStyle = { border: '1px solid #333', padding: '8px 12px', fontSize: '13px' };

  return (
    <div style={{ fontFamily: "'Nanum Gothic', sans-serif", color: '#111', lineHeight: 1.8 }}>
      <h1 style={{ textAlign: 'center', fontSize: '24px', fontWeight: 700, letterSpacing: '8px', marginBottom: '24px' }}>
        연 차 관 리 대 장
      </h1>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', fontSize: '14px' }}>
        <span><strong>관리기간:</strong> {data.year}년</span>
        <span><strong>사업장:</strong> {data.company.name}</span>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
        <tbody>
          <tr>
            <th style={{ ...thStyle, width: '100px' }}>성 명</th>
            <td style={tdStyle}>{data.employeeName}</td>
            <th style={{ ...thStyle, width: '100px' }}>부 서</th>
            <td style={tdStyle}>{data.department}</td>
          </tr>
          <tr>
            <th style={thStyle}>입사일</th>
            <td style={tdStyle}>{formatDate(data.hireDate)}</td>
            <th style={thStyle}>직 위</th>
            <td style={tdStyle}>{data.position}</td>
          </tr>
        </tbody>
      </table>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
        <tbody>
          <tr>
            <th style={thStyle}>발생일수</th>
            <th style={thStyle}>사용일수</th>
            <th style={thStyle}>잔여일수</th>
          </tr>
          <tr>
            <td style={{ ...tdStyle, textAlign: 'center', fontSize: '18px', fontWeight: 700 }}>{data.totalDays}일</td>
            <td style={{ ...tdStyle, textAlign: 'center', fontSize: '18px', fontWeight: 700, color: '#d97706' }}>{usedDays}일</td>
            <td style={{ ...tdStyle, textAlign: 'center', fontSize: '18px', fontWeight: 700, color: remainDays <= 0 ? '#dc2626' : '#059669' }}>{remainDays}일</td>
          </tr>
        </tbody>
      </table>

      <h2 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '12px' }}>사용 내역</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '32px' }}>
        <thead>
          <tr>
            <th style={{ ...thStyle, width: '40px' }}>No.</th>
            <th style={thStyle}>사용일자</th>
            <th style={{ ...thStyle, width: '60px' }}>일수</th>
            <th style={thStyle}>사유</th>
            <th style={{ ...thStyle, width: '70px' }}>잔여</th>
          </tr>
        </thead>
        <tbody>
          {data.usages.length > 0 ? data.usages.map((u, i) => {
            const rem = data.totalDays - data.usages.slice(0, i + 1).reduce((s, uu) => s + uu.days, 0);
            return (
              <tr key={i}>
                <td style={{ ...tdStyle, textAlign: 'center' }}>{i + 1}</td>
                <td style={{ ...tdStyle, textAlign: 'center' }}>{formatDate(u.date)}</td>
                <td style={{ ...tdStyle, textAlign: 'center' }}>{u.days}</td>
                <td style={tdStyle}>{u.reason}</td>
                <td style={{ ...tdStyle, textAlign: 'center', fontWeight: 600 }}>{rem}</td>
              </tr>
            );
          }) : (
            <tr><td colSpan={5} style={{ ...tdStyle, textAlign: 'center', color: '#999' }}>사용 내역 없음</td></tr>
          )}
        </tbody>
      </table>

      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '32px' }}>
        <p>* 근로기준법 제60조에 따라 입사일 기준으로 연차유급휴가를 산정합니다.</p>
        <p>* 1년 미만 근로자: 매월 1일 발생 (최대 11일), 1년 이상: 15일, 3년 이상: 2년마다 1일 추가 (최대 25일)</p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '40px' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '13px', marginBottom: '40px' }}>확인자 (대표)</p>
          <div style={{ borderBottom: '1px solid #333', width: '200px', margin: '0 auto' }}></div>
          <p style={{ fontSize: '12px', color: '#555', marginTop: '4px' }}>{data.company.ceoName}</p>
        </div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '13px', marginBottom: '40px' }}>근로자</p>
          <div style={{ borderBottom: '1px solid #333', width: '200px', margin: '0 auto' }}></div>
          <p style={{ fontSize: '12px', color: '#555', marginTop: '4px' }}>{data.employeeName}</p>
        </div>
      </div>
    </div>
  );
}
