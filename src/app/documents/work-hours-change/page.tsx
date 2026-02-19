'use client';
import { useState, useRef, useEffect } from 'react';
import { useReactToPrint } from 'react-to-print';
import { CompanyInfo, Employee } from '@/types';
import { loadCompanyInfo, defaultCompanyInfo, formatDate, getActiveEmployees } from '@/lib/storage';
import { useDocumentSave } from '@/hooks/useDocumentSave';

interface Data { company: CompanyInfo; employeeName: string; department: string; position: string;
  beforeStart: string; beforeEnd: string; beforeDays: string; beforeBreak: number;
  afterStart: string; afterEnd: string; afterDays: string; afterBreak: number;
  effectiveDate: string; reason: string; issueDate: string; }

function createDefault(): Data { const today = new Date().toISOString().split('T')[0]; return { company: defaultCompanyInfo, employeeName: '', department: '', position: '', beforeStart: '09:00', beforeEnd: '18:00', beforeDays: '월~금', beforeBreak: 60, afterStart: '10:00', afterEnd: '19:00', afterDays: '월~금', afterBreak: 60, effectiveDate: today, reason: '', issueDate: today }; }

export default function WorkHoursChangePage() {
  const [data, setData] = useState<Data>(createDefault);
  const [showPreview, setShowPreview] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selId, setSelId] = useState('');
  const printRef = useRef<HTMLDivElement>(null);
  const { saveDocument, saving, saved } = useDocumentSave();

  useEffect(() => { const s = loadCompanyInfo(); if (s) setData(p => ({ ...p, company: s })); setEmployees(getActiveEmployees()); }, []);
  const handleSelect = (id: string) => { setSelId(id); const emp = employees.find(e => e.id === id); if (emp) { setData(p => ({ ...p, employeeName: emp.info.name, department: emp.department || '', position: emp.position || '', beforeStart: emp.workCondition.workStartTime, beforeEnd: emp.workCondition.workEndTime, beforeDays: emp.workCondition.workDays.join(', '), beforeBreak: emp.workCondition.breakTime })); } };
  const handlePrint = useReactToPrint({ contentRef: printRef, documentTitle: `근무시간변경합의서_${data.employeeName}` });
  const handleSave = async () => { await saveDocument({ docType: 'work_hours_change', title: `근무시간변경합의서 - ${data.employeeName}`, employeeId: selId || undefined, data: data as unknown as Record<string, unknown> }); };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
      <h1 className="heading-lg flex items-center gap-2 mb-2"><span className="icon-box icon-box-primary">🕐</span> 근무시간변경합의서</h1>
      <p className="text-sm text-[var(--text-muted)] mb-6">근로기준법 제50조에 따른 근무시간 변경 합의</p>
      {!showPreview ? (
        <div className="space-y-6">
          <div className="form-section">
            <h3 className="form-section-title">👤 대상 직원</h3>
            {employees.length > 0 && <div className="mb-4"><select className="input-field" value={selId} onChange={e => handleSelect(e.target.value)}><option value="">직접 입력</option>{employees.map(emp => <option key={emp.id} value={emp.id}>{emp.info.name}</option>)}</select></div>}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div><label className="input-label">성명 *</label><input type="text" className="input-field" value={data.employeeName} onChange={e => setData(p => ({ ...p, employeeName: e.target.value }))} /></div>
              <div><label className="input-label">부서</label><input type="text" className="input-field" value={data.department} onChange={e => setData(p => ({ ...p, department: e.target.value }))} /></div>
              <div><label className="input-label">직위</label><input type="text" className="input-field" value={data.position} onChange={e => setData(p => ({ ...p, position: e.target.value }))} /></div>
            </div>
          </div>
          <div className="form-section">
            <h3 className="form-section-title">⏰ 변경 전 근무시간</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div><label className="input-label">출근</label><input type="time" className="input-field" value={data.beforeStart} onChange={e => setData(p => ({ ...p, beforeStart: e.target.value }))} /></div>
              <div><label className="input-label">퇴근</label><input type="time" className="input-field" value={data.beforeEnd} onChange={e => setData(p => ({ ...p, beforeEnd: e.target.value }))} /></div>
              <div><label className="input-label">근무요일</label><input type="text" className="input-field" value={data.beforeDays} onChange={e => setData(p => ({ ...p, beforeDays: e.target.value }))} /></div>
              <div><label className="input-label">휴게(분)</label><input type="number" className="input-field" value={data.beforeBreak} onChange={e => setData(p => ({ ...p, beforeBreak: parseInt(e.target.value) || 0 }))} /></div>
            </div>
          </div>
          <div className="form-section">
            <h3 className="form-section-title">🔄 변경 후 근무시간</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div><label className="input-label">출근</label><input type="time" className="input-field" value={data.afterStart} onChange={e => setData(p => ({ ...p, afterStart: e.target.value }))} /></div>
              <div><label className="input-label">퇴근</label><input type="time" className="input-field" value={data.afterEnd} onChange={e => setData(p => ({ ...p, afterEnd: e.target.value }))} /></div>
              <div><label className="input-label">근무요일</label><input type="text" className="input-field" value={data.afterDays} onChange={e => setData(p => ({ ...p, afterDays: e.target.value }))} /></div>
              <div><label className="input-label">휴게(분)</label><input type="number" className="input-field" value={data.afterBreak} onChange={e => setData(p => ({ ...p, afterBreak: parseInt(e.target.value) || 0 }))} /></div>
            </div>
          </div>
          <div className="form-section">
            <h3 className="form-section-title">📝 변경 사유</h3>
            <div><label className="input-label">적용일</label><input type="date" className="input-field max-w-xs" value={data.effectiveDate} onChange={e => setData(p => ({ ...p, effectiveDate: e.target.value }))} /></div>
            <div className="mt-4"><label className="input-label">변경 사유 *</label><textarea className="input-field min-h-[80px]" value={data.reason} onChange={e => setData(p => ({ ...p, reason: e.target.value }))} placeholder="예: 업무 효율화를 위한 탄력근무제 적용" /></div>
          </div>
          <button onClick={() => setShowPreview(true)} className="btn btn-primary" disabled={!data.employeeName || !data.reason}>미리보기</button>
        </div>
      ) : (
        <div>
          <div className="flex gap-3 mb-6 no-print"><button onClick={() => setShowPreview(false)} className="btn btn-secondary">← 수정</button><button onClick={handlePrint} className="btn btn-primary">🖨️ 인쇄</button><button onClick={handleSave} disabled={saving} className="btn btn-secondary disabled:opacity-50">{saving ? '저장 중...' : saved ? '✓ 저장됨' : '🗄️ 보관함에 저장'}</button></div>
          <div ref={printRef} className="bg-white p-10 max-w-[210mm] mx-auto shadow-sm border print:shadow-none print:border-none" style={{ fontFamily: "'Pretendard', sans-serif" }}>
            <h1 className="text-2xl font-bold text-center mb-8 tracking-widest">근무시간 변경 합의서</h1>
            <p className="text-sm mb-6">{data.company.name}(이하 &quot;회사&quot;)와 {data.employeeName}(이하 &quot;근로자&quot;)는 다음과 같이 근무시간 변경에 합의한다.</p>
            <div className="text-sm mb-6"><table className="w-full border-collapse"><thead><tr className="border border-gray-300 bg-gray-50"><th className="px-4 py-2 border-r w-28"></th><th className="px-4 py-2 border-r">변경 전</th><th className="px-4 py-2">변경 후</th></tr></thead><tbody>
              <tr className="border border-gray-300 border-t-0"><td className="bg-gray-50 px-4 py-2 font-medium border-r">근무시간</td><td className="px-4 py-2 border-r">{data.beforeStart} ~ {data.beforeEnd}</td><td className="px-4 py-2 font-bold text-[var(--primary)]">{data.afterStart} ~ {data.afterEnd}</td></tr>
              <tr className="border border-gray-300 border-t-0"><td className="bg-gray-50 px-4 py-2 font-medium border-r">근무요일</td><td className="px-4 py-2 border-r">{data.beforeDays}</td><td className="px-4 py-2">{data.afterDays}</td></tr>
              <tr className="border border-gray-300 border-t-0"><td className="bg-gray-50 px-4 py-2 font-medium border-r">휴게시간</td><td className="px-4 py-2 border-r">{data.beforeBreak}분</td><td className="px-4 py-2">{data.afterBreak}분</td></tr>
            </tbody></table></div>
            <p className="text-sm mb-2">■ 적용일: {formatDate(data.effectiveDate)}</p>
            <div className="text-sm mb-6 p-4 border border-gray-200 rounded bg-gray-50"><p className="font-medium mb-1">■ 변경 사유</p><p className="whitespace-pre-wrap">{data.reason}</p></div>
            <p className="text-sm mb-8">위 내용에 양 당사자가 합의하며, 본 합의서는 2부를 작성하여 각 1부씩 보관한다.</p>
            <p className="text-center text-sm mb-12">{formatDate(data.issueDate)}</p>
            <div className="text-sm flex justify-between"><div><p className="font-bold mb-1">회사</p><p>{data.company.name}</p><p>대표이사 {data.company.ceoName} (인)</p></div><div className="text-right"><p className="font-bold mb-1">근로자</p><p>{data.employeeName} (서명)</p></div></div>
          </div>
        </div>
      )}
    </div>
  );
}
