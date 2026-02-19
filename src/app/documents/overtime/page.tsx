'use client';

import { useState, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { CompanyInfo, Employee } from '@/types';
import { loadCompanyInfo, defaultCompanyInfo, formatDate, getActiveEmployees } from '@/lib/storage';
import HelpGuide from '@/components/HelpGuide';
import { useDocumentSave } from '@/hooks/useDocumentSave';

interface OvertimeData {
  company: CompanyInfo;
  employeeName: string;
  department: string;
  position: string;
  periodFrom: string;
  periodTo: string;
  types: { extended: boolean; night: boolean; holiday: boolean };
  extendedHours: number;
  nightHours: number;
  holidayNote: string;
  agreementDate: string;
}

const defaultData: OvertimeData = {
  company: defaultCompanyInfo,
  employeeName: '',
  department: '',
  position: '',
  periodFrom: new Date().toISOString().split('T')[0],
  periodTo: '',
  types: { extended: true, night: false, holiday: false },
  extendedHours: 12,
  nightHours: 0,
  holidayNote: '',
  agreementDate: new Date().toISOString().split('T')[0],
};

export default function OvertimePage() {
  const [data, setData] = useState<OvertimeData>(() => {
    if (typeof window === 'undefined') return defaultData;
    const saved = loadCompanyInfo();
    return saved ? { ...defaultData, company: saved } : defaultData;
  });
  const [showPreview, setShowPreview] = useState(false);
  const [employees] = useState<Employee[]>(() =>
    typeof window !== 'undefined' ? getActiveEmployees() : []
  );
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const printRef = useRef<HTMLDivElement>(null);
  const { saveDocument, saving, saved } = useDocumentSave();

  const handleSaveToArchive = async () => {
    await saveDocument({
      docType: 'overtime',
      title: `시간외근로합의서 - ${data.employeeName || '이름없음'}`,
      employeeId: selectedEmployeeId || undefined,
      data: data as unknown as Record<string, unknown>,
    });
  };

  const handleEmployeeSelect = (id: string) => {
    setSelectedEmployeeId(id);
    const emp = employees.find(e => e.id === id);
    if (emp) {
      setData(prev => ({
        ...prev,
        employeeName: emp.info.name,
        department: emp.department || '',
        position: emp.position || '',
      }));
    }
  };

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `시간외근로합의서_${data.employeeName || '이름없음'}`,
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">시간외근로 합의서</h1>
          <p className="text-gray-500 mt-1">근로기준법 제53조 - 연장/야간/휴일 근로 서면 합의</p>
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
        pageKey="overtime"
        steps={[
          '직원을 선택하고 시간외근로 유형(연장/야간/휴일)을 선택하세요.',
          '근로 시간과 기간을 입력하세요.',
          '"미리보기"로 확인 후 "인쇄/PDF"로 출력하세요.',
        ]}
      />

      {!showPreview ? (
        <div className="space-y-6 animate-fade-in">
          <div className="form-section">
            <h2 className="form-section-title">근로자 정보</h2>
            {employees.length > 0 && (
              <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <label className="input-label text-blue-700">등록된 직원에서 선택</label>
                <select className="input-field mt-1" value={selectedEmployeeId} onChange={e => handleEmployeeSelect(e.target.value)}>
                  <option value="">직접 입력</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.info.name} ({emp.department || '부서없음'})</option>
                  ))}
                </select>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="input-label">성명 *</label>
                <input type="text" className="input-field" value={data.employeeName}
                  onChange={e => setData(prev => ({ ...prev, employeeName: e.target.value }))} />
              </div>
              <div>
                <label className="input-label">부서</label>
                <input type="text" className="input-field" value={data.department}
                  onChange={e => setData(prev => ({ ...prev, department: e.target.value }))} />
              </div>
              <div>
                <label className="input-label">직위</label>
                <input type="text" className="input-field" value={data.position}
                  onChange={e => setData(prev => ({ ...prev, position: e.target.value }))} />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h2 className="form-section-title">합의 기간</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="input-label">시작일 *</label>
                <input type="date" className="input-field" value={data.periodFrom}
                  onChange={e => setData(prev => ({ ...prev, periodFrom: e.target.value }))} />
              </div>
              <div>
                <label className="input-label">종료일 *</label>
                <input type="date" className="input-field" value={data.periodTo}
                  onChange={e => setData(prev => ({ ...prev, periodTo: e.target.value }))} />
              </div>
              <div>
                <label className="input-label">합의일</label>
                <input type="date" className="input-field" value={data.agreementDate}
                  onChange={e => setData(prev => ({ ...prev, agreementDate: e.target.value }))} />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h2 className="form-section-title">시간외근로 유형</h2>
            <div className="space-y-4">
              <label className="flex items-start gap-3 cursor-pointer p-4 bg-gray-50 rounded-lg border">
                <input type="checkbox" checked={data.types.extended} className="w-5 h-5 mt-0.5"
                  onChange={e => setData(prev => ({ ...prev, types: { ...prev.types, extended: e.target.checked } }))} />
                <div className="flex-1">
                  <span className="font-medium">연장근로</span>
                  <p className="text-sm text-gray-500">1주 12시간 한도 (근로기준법 제53조), 통상임금의 50% 가산</p>
                  {data.types.extended && (
                    <div className="mt-2">
                      <label className="input-label">주당 예상 연장근로 시간</label>
                      <input type="number" className="input-field w-32" min={1} max={12} value={data.extendedHours}
                        onChange={e => setData(prev => ({ ...prev, extendedHours: parseInt(e.target.value) || 0 }))} />
                      <span className="text-sm text-gray-500 ml-2">시간 (최대 12시간)</span>
                    </div>
                  )}
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer p-4 bg-gray-50 rounded-lg border">
                <input type="checkbox" checked={data.types.night} className="w-5 h-5 mt-0.5"
                  onChange={e => setData(prev => ({ ...prev, types: { ...prev.types, night: e.target.checked } }))} />
                <div className="flex-1">
                  <span className="font-medium">야간근로</span>
                  <p className="text-sm text-gray-500">22:00~06:00 시간대, 통상임금의 50% 가산</p>
                  {data.types.night && (
                    <div className="mt-2">
                      <label className="input-label">주당 예상 야간근로 시간</label>
                      <input type="number" className="input-field w-32" min={1} value={data.nightHours}
                        onChange={e => setData(prev => ({ ...prev, nightHours: parseInt(e.target.value) || 0 }))} />
                      <span className="text-sm text-gray-500 ml-2">시간</span>
                    </div>
                  )}
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer p-4 bg-gray-50 rounded-lg border">
                <input type="checkbox" checked={data.types.holiday} className="w-5 h-5 mt-0.5"
                  onChange={e => setData(prev => ({ ...prev, types: { ...prev.types, holiday: e.target.checked } }))} />
                <div className="flex-1">
                  <span className="font-medium">휴일근로</span>
                  <p className="text-sm text-gray-500">8시간 이내 50% 가산, 8시간 초과 100% 가산</p>
                  {data.types.holiday && (
                    <div className="mt-2">
                      <label className="input-label">휴일근로 예정일 또는 빈도</label>
                      <input type="text" className="input-field" placeholder="예: 매월 2~3회, 또는 특정 날짜" value={data.holidayNote}
                        onChange={e => setData(prev => ({ ...prev, holidayNote: e.target.value }))} />
                    </div>
                  )}
                </div>
              </label>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg p-8 animate-fade-in">
          <OvertimePreview data={data} />
        </div>
      )}

      <div className="hidden">
        <div ref={printRef}><OvertimePreview data={data} /></div>
      </div>
    </div>
  );
}

function OvertimePreview({ data }: { data: OvertimeData }) {
  const cellStyle = { border: '1px solid #d1d5db', padding: '10px 14px', verticalAlign: 'top' as const };
  const headerStyle = { ...cellStyle, backgroundColor: '#f8fafc', fontWeight: 600, width: '140px', color: '#374151' };

  return (
    <div className="contract-document" style={{ fontFamily: "'Pretendard', 'Nanum Gothic', sans-serif", color: '#1f2937', lineHeight: 1.8 }}>
      <div style={{ textAlign: 'center', marginBottom: '32px', borderBottom: '3px solid #1e3a5f', paddingBottom: '20px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#1e3a5f', letterSpacing: '4px' }}>시간외근로 합의서</h1>
        <p style={{ fontSize: '13px', color: '#6b7280' }}>근로기준법 제53조에 의한 서면 합의</p>
      </div>

      <p style={{ fontSize: '14px', marginBottom: '24px' }}>
        <strong>{data.company.name}</strong> (이하 &quot;사용자&quot;)과 근로자 <strong>{data.employeeName}</strong> (이하 &quot;근로자&quot;)는
        아래와 같이 시간외근로에 대하여 합의합니다.
      </p>

      <h2 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '12px', color: '#1e3a5f' }}>제1조 (합의 당사자)</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
        <tbody>
          <tr><th style={headerStyle}>사용자</th><td style={cellStyle}>{data.company.name} (대표: {data.company.ceoName})</td></tr>
          <tr><th style={headerStyle}>근로자</th><td style={cellStyle}>{data.employeeName} ({data.department} / {data.position})</td></tr>
        </tbody>
      </table>

      <h2 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '12px', color: '#1e3a5f' }}>제2조 (합의 기간)</h2>
      <p style={{ fontSize: '14px', marginBottom: '20px' }}>
        {formatDate(data.periodFrom)} ~ {formatDate(data.periodTo)}
      </p>

      <h2 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '12px', color: '#1e3a5f' }}>제3조 (시간외근로 내용)</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
        <thead>
          <tr>
            <th style={{ ...headerStyle, width: '100px' }}>유형</th>
            <th style={{ ...headerStyle, width: '80px' }}>해당</th>
            <th style={headerStyle}>세부 내용</th>
            <th style={{ ...headerStyle, width: '120px' }}>가산율</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th style={headerStyle}>연장근로</th>
            <td style={{ ...cellStyle, textAlign: 'center' }}>{data.types.extended ? 'O' : 'X'}</td>
            <td style={cellStyle}>{data.types.extended ? `주당 ${data.extendedHours}시간 이내 (1주 12시간 한도)` : '-'}</td>
            <td style={{ ...cellStyle, textAlign: 'center' }}>50%</td>
          </tr>
          <tr>
            <th style={headerStyle}>야간근로</th>
            <td style={{ ...cellStyle, textAlign: 'center' }}>{data.types.night ? 'O' : 'X'}</td>
            <td style={cellStyle}>{data.types.night ? `22:00~06:00 시간대, 주당 약 ${data.nightHours}시간` : '-'}</td>
            <td style={{ ...cellStyle, textAlign: 'center' }}>50%</td>
          </tr>
          <tr>
            <th style={headerStyle}>휴일근로</th>
            <td style={{ ...cellStyle, textAlign: 'center' }}>{data.types.holiday ? 'O' : 'X'}</td>
            <td style={cellStyle}>{data.types.holiday ? (data.holidayNote || '해당 시') : '-'}</td>
            <td style={{ ...cellStyle, textAlign: 'center' }}>50%/100%</td>
          </tr>
        </tbody>
      </table>

      <h2 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '12px', color: '#1e3a5f' }}>제4조 (가산수당)</h2>
      <div style={{ fontSize: '14px', marginBottom: '20px' }}>
        <p style={{ marginBottom: '4px' }}>1. 연장근로: 통상임금의 50% 가산 지급</p>
        <p style={{ marginBottom: '4px' }}>2. 야간근로(22:00~06:00): 통상임금의 50% 가산 지급</p>
        <p>3. 휴일근로: 8시간 이내 통상임금의 50%, 8시간 초과 통상임금의 100% 가산 지급</p>
      </div>

      <h2 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '12px', color: '#1e3a5f' }}>제5조 (건강보호)</h2>
      <div style={{ fontSize: '14px', marginBottom: '20px' }}>
        <p style={{ marginBottom: '4px' }}>1. 사용자는 시간외근로로 인한 근로자의 건강 장해를 예방하기 위하여 필요한 조치를 취한다.</p>
        <p>2. 근로자는 건강상 이유로 시간외근로가 어려운 경우 사전에 사용자에게 통보한다.</p>
      </div>

      <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', marginBottom: '32px', fontSize: '13px', color: '#6b7280' }}>
        <p style={{ marginBottom: '4px' }}><strong>관련 법조항:</strong></p>
        <p>- 근로기준법 제53조 (연장 근로의 제한): 당사자 간 합의하면 1주간 12시간을 한도로 연장 가능</p>
        <p>- 근로기준법 제56조 (연장·야간 및 휴일 근로): 가산임금 지급 의무</p>
      </div>

      <p style={{ textAlign: 'center', fontSize: '15px', fontWeight: 600, marginBottom: '40px' }}>
        {formatDate(data.agreementDate)}
      </p>

      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '40px' }}>
        <div style={{ flex: 1, border: '1px solid #d1d5db', borderRadius: '8px', padding: '20px' }}>
          <p style={{ fontWeight: 700, color: '#1e3a5f', marginBottom: '12px', borderBottom: '2px solid #1e3a5f', paddingBottom: '8px' }}>[ 사용자 ]</p>
          <table style={{ width: '100%' }}>
            <tbody>
              <tr><td style={{ padding: '4px 0', color: '#6b7280', width: '60px' }}>상호</td><td>{data.company.name}</td></tr>
              <tr><td style={{ padding: '4px 0', color: '#6b7280' }}>대표</td><td>{data.company.ceoName} <span style={{ color: '#9ca3af', marginLeft: '16px' }}>(인)</span></td></tr>
            </tbody>
          </table>
        </div>
        <div style={{ flex: 1, border: '1px solid #d1d5db', borderRadius: '8px', padding: '20px' }}>
          <p style={{ fontWeight: 700, color: '#1e3a5f', marginBottom: '12px', borderBottom: '2px solid #1e3a5f', paddingBottom: '8px' }}>[ 근로자 ]</p>
          <table style={{ width: '100%' }}>
            <tbody>
              <tr><td style={{ padding: '4px 0', color: '#6b7280', width: '60px' }}>소속</td><td>{data.department}</td></tr>
              <tr><td style={{ padding: '4px 0', color: '#6b7280' }}>성명</td><td>{data.employeeName} <span style={{ color: '#9ca3af', marginLeft: '16px' }}>(서명 또는 인)</span></td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
