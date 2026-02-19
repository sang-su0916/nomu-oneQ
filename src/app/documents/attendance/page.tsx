'use client';

import { useState, useRef, useEffect } from 'react';
import { useReactToPrint } from 'react-to-print';
import { CompanyInfo, Employee } from '@/types';
import { loadCompanyInfo, defaultCompanyInfo, getActiveEmployees } from '@/lib/storage';
import HelpGuide from '@/components/HelpGuide';
import { useDocumentSave } from '@/hooks/useDocumentSave';

interface DayRecord {
  day: number;
  startTime: string;
  endTime: string;
  note: string;
}

interface AttendanceData {
  company: CompanyInfo;
  employeeName: string;
  department: string;
  year: number;
  month: number;
  records: DayRecord[];
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function calcWorkHours(start: string, end: string): { work: number; overtime: number; night: number } {
  if (!start || !end) return { work: 0, overtime: 0, night: 0 };
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  let totalMin = (eh * 60 + em) - (sh * 60 + sm);
  if (totalMin < 0) totalMin += 24 * 60;
  const breakMin = totalMin > 480 ? 60 : totalMin > 240 ? 30 : 0;
  const workMin = Math.max(0, totalMin - breakMin);
  const workH = workMin / 60;
  const overtime = Math.max(0, workH - 8);
  // 야간근로: 22:00~06:00 (분 단위로 정확히 계산)
  let nightMin = 0;
  const startMin = sh * 60 + sm;
  const endOnTimeline = startMin + totalMin;
  if (endOnTimeline <= 1440) {
    // 자정 미경과: [0,360) 및 [1320,1440) 구간과 겹치는 부분
    if (startMin < 360) {
      nightMin += Math.min(endOnTimeline, 360) - startMin;
    }
    if (endOnTimeline > 1320) {
      nightMin += Math.min(endOnTimeline, 1440) - Math.max(startMin, 1320);
    }
  } else {
    // 자정 경과: 자정 전 [1320,1440)과 자정 후 [0,360) 구간
    nightMin += 1440 - Math.max(startMin, 1320);
    const postMidnightEnd = endOnTimeline - 1440;
    nightMin += Math.min(postMidnightEnd, 360);
  }
  nightMin = Math.max(0, nightMin);
  return { work: Math.round(workH * 10) / 10, overtime: Math.round(overtime * 10) / 10, night: Math.round(nightMin / 60 * 10) / 10 };
}

function createRecords(year: number, month: number): DayRecord[] {
  const days = getDaysInMonth(year, month);
  return Array.from({ length: days }, (_, i) => ({
    day: i + 1,
    startTime: '',
    endTime: '',
    note: '',
  }));
}

export default function AttendancePage() {
  const [data, setData] = useState<AttendanceData>(() => {
    const now = new Date();
    return {
      company: defaultCompanyInfo,
      employeeName: '',
      department: '',
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      records: createRecords(now.getFullYear(), now.getMonth() + 1),
    };
  });
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
      docType: 'attendance',
      title: `출퇴근기록부 - ${data.employeeName || '이름없음'} ${data.year}년 ${data.month}월`,
      employeeId: selectedEmployeeId || undefined,
      data: data as unknown as Record<string, unknown>,
    });
  };

  const handleYearMonthChange = (year: number, month: number) => {
    setData(prev => ({ ...prev, year, month, records: createRecords(year, month) }));
  };

  const handleEmployeeSelect = (id: string) => {
    setSelectedEmployeeId(id);
    const emp = employees.find(e => e.id === id);
    if (emp) setData(prev => ({ ...prev, employeeName: emp.info.name, department: emp.department || '' }));
  };

  const updateRecord = (dayIndex: number, field: keyof DayRecord, value: string) => {
    setData(prev => {
      const records = [...prev.records];
      records[dayIndex] = { ...records[dayIndex], [field]: value };
      return { ...prev, records };
    });
  };

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `출퇴근기록부_${data.employeeName}_${data.year}년${data.month}월`,
  });

  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">출퇴근기록부</h1>
          <p className="text-gray-500 mt-1">근로기준법 제66조 - 근로시간 기록 의무</p>
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
        pageKey="attendance"
        steps={[
          '직원과 해당 월을 선택하세요.',
          '각 날짜별 출근/퇴근 시간을 입력하세요.',
          '"미리보기"로 확인 후 "인쇄/PDF"로 출력하세요.',
        ]}
      />

      {!showPreview ? (
        <div className="space-y-6 animate-fade-in">
          <div className="form-section">
            <h2 className="form-section-title">기본 정보</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="input-label">연도</label>
                <input type="number" className="input-field" value={data.year}
                  onChange={e => handleYearMonthChange(parseInt(e.target.value) || data.year, data.month)} />
              </div>
              <div>
                <label className="input-label">월</label>
                <select className="input-field" value={data.month}
                  onChange={e => handleYearMonthChange(data.year, parseInt(e.target.value))}>
                  {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}월</option>)}
                </select>
              </div>
              {employees.length > 0 ? (
                <div>
                  <label className="input-label">직원 선택</label>
                  <select className="input-field" value={selectedEmployeeId} onChange={e => handleEmployeeSelect(e.target.value)}>
                    <option value="">선택</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.info.name}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="input-label">직원명</label>
                  <input type="text" className="input-field" value={data.employeeName}
                    onChange={e => setData(prev => ({ ...prev, employeeName: e.target.value }))} />
                </div>
              )}
              <div>
                <label className="input-label">부서</label>
                <input type="text" className="input-field" value={data.department}
                  onChange={e => setData(prev => ({ ...prev, department: e.target.value }))} />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h2 className="form-section-title">근무 기록 ({data.year}년 {data.month}월)</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-3 py-2 text-left font-medium text-gray-600 w-14">일</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-600 w-10">요일</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-600 w-28">출근</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-600 w-28">퇴근</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-600 w-16">근무</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-600 w-16">연장</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-600">비고</th>
                  </tr>
                </thead>
                <tbody>
                  {data.records.map((rec, i) => {
                    const dayOfWeek = new Date(data.year, data.month - 1, rec.day).getDay();
                    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                    const calc = calcWorkHours(rec.startTime, rec.endTime);
                    return (
                      <tr key={i} className={isWeekend ? 'bg-red-50' : i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-3 py-1.5 font-medium">{rec.day}</td>
                        <td className={`px-3 py-1.5 ${isWeekend ? 'text-red-500 font-medium' : 'text-gray-500'}`}>
                          {dayNames[dayOfWeek]}
                        </td>
                        <td className="px-1 py-1">
                          <input type="time" className="input-field text-sm py-1" value={rec.startTime}
                            onChange={e => updateRecord(i, 'startTime', e.target.value)} />
                        </td>
                        <td className="px-1 py-1">
                          <input type="time" className="input-field text-sm py-1" value={rec.endTime}
                            onChange={e => updateRecord(i, 'endTime', e.target.value)} />
                        </td>
                        <td className="px-3 py-1.5 text-right">{calc.work > 0 ? `${calc.work}h` : ''}</td>
                        <td className="px-3 py-1.5 text-right text-red-600">{calc.overtime > 0 ? `${calc.overtime}h` : ''}</td>
                        <td className="px-1 py-1">
                          <input type="text" className="input-field text-sm py-1" placeholder="" value={rec.note}
                            onChange={e => updateRecord(i, 'note', e.target.value)} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-100 font-bold">
                    <td colSpan={4} className="px-3 py-2 text-right">합계</td>
                    <td className="px-3 py-2 text-right">
                      {data.records.reduce((s, r) => s + calcWorkHours(r.startTime, r.endTime).work, 0).toFixed(1)}h
                    </td>
                    <td className="px-3 py-2 text-right text-red-600">
                      {data.records.reduce((s, r) => s + calcWorkHours(r.startTime, r.endTime).overtime, 0).toFixed(1)}h
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg p-8 animate-fade-in overflow-x-auto">
          <AttendancePreview data={data} dayNames={dayNames} />
        </div>
      )}

      <div className="hidden">
        <div ref={printRef}><AttendancePreview data={data} dayNames={dayNames} /></div>
      </div>
    </div>
  );
}

function AttendancePreview({ data, dayNames }: { data: AttendanceData; dayNames: string[] }) {
  const thStyle = { border: '1px solid #333', padding: '6px 8px', backgroundColor: '#f3f4f6', fontWeight: 600, fontSize: '12px', textAlign: 'center' as const };
  const tdStyle = { border: '1px solid #333', padding: '4px 8px', fontSize: '12px', textAlign: 'center' as const };
  const totalWork = data.records.reduce((s, r) => s + calcWorkHours(r.startTime, r.endTime).work, 0);
  const totalOvertime = data.records.reduce((s, r) => s + calcWorkHours(r.startTime, r.endTime).overtime, 0);

  return (
    <div style={{ fontFamily: "'Nanum Gothic', sans-serif", color: '#111', fontSize: '12px' }}>
      <h1 style={{ textAlign: 'center', fontSize: '22px', fontWeight: 700, letterSpacing: '8px', marginBottom: '24px' }}>
        출 퇴 근 기 록 부
      </h1>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '13px' }}>
        <div><strong>대상기간:</strong> {data.year}년 {data.month}월</div>
        <div><strong>성명:</strong> {data.employeeName} ({data.department})</div>
        <div><strong>사업장:</strong> {data.company.name}</div>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
        <thead>
          <tr>
            <th style={thStyle}>일</th>
            <th style={thStyle}>요일</th>
            <th style={thStyle}>출근시간</th>
            <th style={thStyle}>퇴근시간</th>
            <th style={thStyle}>근무시간</th>
            <th style={thStyle}>연장근로</th>
            <th style={thStyle}>야간근로</th>
            <th style={thStyle}>비고</th>
          </tr>
        </thead>
        <tbody>
          {data.records.map((rec, i) => {
            const dow = new Date(data.year, data.month - 1, rec.day).getDay();
            const isWeekend = dow === 0 || dow === 6;
            const calc = calcWorkHours(rec.startTime, rec.endTime);
            return (
              <tr key={i} style={isWeekend ? { backgroundColor: '#fef2f2' } : {}}>
                <td style={tdStyle}>{rec.day}</td>
                <td style={{ ...tdStyle, color: isWeekend ? '#dc2626' : '#111' }}>{dayNames[dow]}</td>
                <td style={tdStyle}>{rec.startTime || ''}</td>
                <td style={tdStyle}>{rec.endTime || ''}</td>
                <td style={tdStyle}>{calc.work > 0 ? calc.work : ''}</td>
                <td style={{ ...tdStyle, color: '#dc2626' }}>{calc.overtime > 0 ? calc.overtime : ''}</td>
                <td style={tdStyle}>{calc.night > 0 ? calc.night : ''}</td>
                <td style={{ ...tdStyle, textAlign: 'left' }}>{rec.note}</td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr style={{ fontWeight: 700, backgroundColor: '#f3f4f6' }}>
            <td colSpan={4} style={{ ...tdStyle, textAlign: 'right' }}>합 계</td>
            <td style={tdStyle}>{totalWork.toFixed(1)}</td>
            <td style={{ ...tdStyle, color: '#dc2626' }}>{totalOvertime.toFixed(1)}</td>
            <td style={tdStyle}>{data.records.reduce((s, r) => s + calcWorkHours(r.startTime, r.endTime).night, 0).toFixed(1)}</td>
            <td style={tdStyle}></td>
          </tr>
        </tfoot>
      </table>

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
