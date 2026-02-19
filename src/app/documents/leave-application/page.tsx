'use client';
import { useState, useRef, useEffect } from 'react';
import { useReactToPrint } from 'react-to-print';
import { CompanyInfo, Employee } from '@/types';
import { loadCompanyInfo, defaultCompanyInfo, formatDate, getActiveEmployees } from '@/lib/storage';
import { useDocumentSave } from '@/hooks/useDocumentSave';

interface LeaveData { company: CompanyInfo; employeeName: string; department: string; position: string; leaveType: string; startDate: string; endDate: string; reason: string; contactDuring: string; handoverTo: string; handoverDetails: string; issueDate: string; }
const leaveTypes = ['육아휴직', '출산휴가', '병가', '개인사유 휴직', '학업휴직', '가족돌봄휴직'];

function createDefault(): LeaveData { const today = new Date().toISOString().split('T')[0]; return { company: defaultCompanyInfo, employeeName: '', department: '', position: '', leaveType: '육아휴직', startDate: today, endDate: '', reason: '', contactDuring: '', handoverTo: '', handoverDetails: '', issueDate: today }; }

export default function LeaveApplicationPage() {
  const [data, setData] = useState<LeaveData>(createDefault);
  const [showPreview, setShowPreview] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selId, setSelId] = useState('');
  const printRef = useRef<HTMLDivElement>(null);
  const { saveDocument, saving, saved } = useDocumentSave();

  useEffect(() => { const s = loadCompanyInfo(); if (s) setData(p => ({ ...p, company: s })); setEmployees(getActiveEmployees()); }, []);
  const handleSelect = (id: string) => { setSelId(id); const emp = employees.find(e => e.id === id); if (emp) setData(p => ({ ...p, employeeName: emp.info.name, department: emp.department || '', position: emp.position || '' })); };
  const handlePrint = useReactToPrint({ contentRef: printRef, documentTitle: `휴직신청서_${data.employeeName}` });
  const handleSave = async () => { await saveDocument({ docType: 'leave_application', title: `휴직신청서 - ${data.employeeName} (${data.leaveType})`, employeeId: selId || undefined, data: data as unknown as Record<string, unknown> }); };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
      <h1 className="heading-lg flex items-center gap-2 mb-2"><span className="icon-box icon-box-primary">🏖️</span> 휴직신청서</h1>
      <p className="text-sm text-[var(--text-muted)] mb-6">남녀고용평등법, 근로기준법에 따른 휴직 신청</p>
      {!showPreview ? (
        <div className="space-y-6">
          <div className="form-section">
            <h3 className="form-section-title">👤 신청자</h3>
            {employees.length > 0 && <div className="mb-4"><select className="input-field" value={selId} onChange={e => handleSelect(e.target.value)}><option value="">직접 입력</option>{employees.map(emp => <option key={emp.id} value={emp.id}>{emp.info.name}</option>)}</select></div>}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div><label className="input-label">성명 *</label><input type="text" className="input-field" value={data.employeeName} onChange={e => setData(p => ({ ...p, employeeName: e.target.value }))} /></div>
              <div><label className="input-label">부서</label><input type="text" className="input-field" value={data.department} onChange={e => setData(p => ({ ...p, department: e.target.value }))} /></div>
              <div><label className="input-label">직위</label><input type="text" className="input-field" value={data.position} onChange={e => setData(p => ({ ...p, position: e.target.value }))} /></div>
            </div>
          </div>
          <div className="form-section">
            <h3 className="form-section-title">📝 휴직 정보</h3>
            <div className="space-y-4">
              <div><label className="input-label">휴직 유형</label><select className="input-field" value={data.leaveType} onChange={e => setData(p => ({ ...p, leaveType: e.target.value }))}>{leaveTypes.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="input-label">시작일 *</label><input type="date" className="input-field" value={data.startDate} onChange={e => setData(p => ({ ...p, startDate: e.target.value }))} /></div>
                <div><label className="input-label">종료일 *</label><input type="date" className="input-field" value={data.endDate} onChange={e => setData(p => ({ ...p, endDate: e.target.value }))} /></div>
              </div>
              <div><label className="input-label">사유 *</label><textarea className="input-field min-h-[80px]" value={data.reason} onChange={e => setData(p => ({ ...p, reason: e.target.value }))} /></div>
              <div><label className="input-label">휴직 중 연락처</label><input type="text" className="input-field" value={data.contactDuring} onChange={e => setData(p => ({ ...p, contactDuring: e.target.value }))} /></div>
              <div><label className="input-label">업무 인수자</label><input type="text" className="input-field" value={data.handoverTo} onChange={e => setData(p => ({ ...p, handoverTo: e.target.value }))} /></div>
              <div><label className="input-label">인수인계 내용</label><textarea className="input-field min-h-[60px]" value={data.handoverDetails} onChange={e => setData(p => ({ ...p, handoverDetails: e.target.value }))} /></div>
            </div>
          </div>
          <button onClick={() => setShowPreview(true)} className="btn btn-primary" disabled={!data.employeeName || !data.reason}>미리보기</button>
        </div>
      ) : (
        <div>
          <div className="flex gap-3 mb-6 no-print">
            <button onClick={() => setShowPreview(false)} className="btn btn-secondary">← 수정</button>
            <button onClick={handlePrint} className="btn btn-primary">🖨️ 인쇄</button>
            <button onClick={handleSave} disabled={saving} className="btn btn-secondary disabled:opacity-50">{saving ? '저장 중...' : saved ? '✓ 저장됨' : '🗄️ 보관함에 저장'}</button>
          </div>
          <div ref={printRef} className="bg-white p-10 max-w-[210mm] mx-auto shadow-sm border print:shadow-none print:border-none" style={{ fontFamily: "'Pretendard', sans-serif" }}>
            <h1 className="text-2xl font-bold text-center mb-8 tracking-widest">휴 직 신 청 서</h1>
            <div className="text-sm mb-6"><table className="w-full border-collapse"><tbody>
              <tr className="border border-gray-300"><td className="bg-gray-50 px-4 py-2 font-medium w-24 border-r">성 명</td><td className="px-4 py-2 border-r">{data.employeeName}</td><td className="bg-gray-50 px-4 py-2 font-medium w-24 border-r">부서/직위</td><td className="px-4 py-2">{data.department} {data.position}</td></tr>
              <tr className="border border-gray-300 border-t-0"><td className="bg-gray-50 px-4 py-2 font-medium border-r">휴직유형</td><td className="px-4 py-2 border-r font-bold">{data.leaveType}</td><td className="bg-gray-50 px-4 py-2 font-medium border-r">기 간</td><td className="px-4 py-2">{formatDate(data.startDate)} ~ {formatDate(data.endDate)}</td></tr>
            </tbody></table></div>
            <div className="text-sm leading-7 mb-6">
              <div className="p-4 border border-gray-200 rounded bg-gray-50 mb-4"><p className="font-medium mb-2">■ 휴직 사유</p><p className="whitespace-pre-wrap">{data.reason}</p></div>
              {data.contactDuring && <p>■ 휴직 중 연락처: {data.contactDuring}</p>}
              {data.handoverTo && <p>■ 업무 인수자: {data.handoverTo}</p>}
              {data.handoverDetails && <div className="mt-2 p-4 border border-gray-200 rounded bg-gray-50"><p className="font-medium mb-2">■ 인수인계 내용</p><p className="whitespace-pre-wrap">{data.handoverDetails}</p></div>}
            </div>
            <p className="text-sm text-center mb-2 mt-8">위와 같이 휴직을 신청합니다.</p>
            <p className="text-center text-sm mb-12">{formatDate(data.issueDate)}</p>
            <div className="text-sm flex justify-between mb-8"><div><p>신청인: {data.employeeName} (서명)</p></div></div>
            <div className="text-center text-sm"><p className="font-bold text-lg mb-2">{data.company.name} 귀중</p></div>
          </div>
        </div>
      )}
    </div>
  );
}
