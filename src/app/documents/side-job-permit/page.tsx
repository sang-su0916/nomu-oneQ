'use client';
import { useState, useRef, useEffect } from 'react';
import { useReactToPrint } from 'react-to-print';
import { CompanyInfo, Employee } from '@/types';
import { loadCompanyInfo, defaultCompanyInfo, formatDate, getActiveEmployees } from '@/lib/storage';
import { useDocumentSave } from '@/hooks/useDocumentSave';

interface Data { company: CompanyInfo; employeeName: string; department: string; position: string; sideCompany: string; sideWork: string; sideStartDate: string; sideEndDate: string; weeklyHours: number; hasConflict: string; pledge: string; issueDate: string; }

function createDefault(): Data { const today = new Date().toISOString().split('T')[0]; return { company: defaultCompanyInfo, employeeName: '', department: '', position: '', sideCompany: '', sideWork: '', sideStartDate: today, sideEndDate: '', weeklyHours: 0, hasConflict: '없음', pledge: '겸업으로 인해 본업에 지장을 초래하지 않을 것을 서약하며, 회사의 영업비밀 및 경쟁업체 관련 활동은 하지 않을 것을 확약합니다.', issueDate: today }; }

export default function SideJobPermitPage() {
  const [data, setData] = useState<Data>(createDefault);
  const [showPreview, setShowPreview] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selId, setSelId] = useState('');
  const printRef = useRef<HTMLDivElement>(null);
  const { saveDocument, saving, saved } = useDocumentSave();

  useEffect(() => { const s = loadCompanyInfo(); if (s) setData(p => ({ ...p, company: s })); setEmployees(getActiveEmployees()); }, []);
  const handleSelect = (id: string) => { setSelId(id); const emp = employees.find(e => e.id === id); if (emp) setData(p => ({ ...p, employeeName: emp.info.name, department: emp.department || '', position: emp.position || '' })); };
  const handlePrint = useReactToPrint({ contentRef: printRef, documentTitle: `겸업허가신청서_${data.employeeName}` });
  const handleSave = async () => { await saveDocument({ docType: 'side_job_permit', title: `겸업허가신청서 - ${data.employeeName} (${data.sideCompany})`, employeeId: selId || undefined, data: data as unknown as Record<string, unknown> }); };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
      <h1 className="heading-lg flex items-center gap-2 mb-2"><span className="icon-box icon-box-primary">📄</span> 겸업허가신청서</h1>
      <p className="text-sm text-[var(--text-muted)] mb-6">취업규칙에 따른 겸업(겸직) 허가 신청</p>
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
            <h3 className="form-section-title">💼 겸업 정보</h3>
            <div className="space-y-4">
              <div><label className="input-label">겸직 업체명 *</label><input type="text" className="input-field" value={data.sideCompany} onChange={e => setData(p => ({ ...p, sideCompany: e.target.value }))} /></div>
              <div><label className="input-label">업무 내용 *</label><textarea className="input-field min-h-[60px]" value={data.sideWork} onChange={e => setData(p => ({ ...p, sideWork: e.target.value }))} /></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><label className="input-label">시작일</label><input type="date" className="input-field" value={data.sideStartDate} onChange={e => setData(p => ({ ...p, sideStartDate: e.target.value }))} /></div>
                <div><label className="input-label">종료일</label><input type="date" className="input-field" value={data.sideEndDate} onChange={e => setData(p => ({ ...p, sideEndDate: e.target.value }))} /></div>
                <div><label className="input-label">주당 시간</label><input type="number" className="input-field" value={data.weeklyHours} onChange={e => setData(p => ({ ...p, weeklyHours: parseInt(e.target.value) || 0 }))} /></div>
              </div>
              <div><label className="input-label">이해충돌 여부</label><select className="input-field max-w-xs" value={data.hasConflict} onChange={e => setData(p => ({ ...p, hasConflict: e.target.value }))}><option value="없음">없음</option><option value="있음 (아래 기재)">있음</option></select></div>
              <div><label className="input-label">서약 내용</label><textarea className="input-field min-h-[60px]" value={data.pledge} onChange={e => setData(p => ({ ...p, pledge: e.target.value }))} /></div>
            </div>
          </div>
          <button onClick={() => setShowPreview(true)} className="btn btn-primary" disabled={!data.employeeName || !data.sideCompany}>미리보기</button>
        </div>
      ) : (
        <div>
          <div className="flex gap-3 mb-6 no-print"><button onClick={() => setShowPreview(false)} className="btn btn-secondary">← 수정</button><button onClick={handlePrint} className="btn btn-primary">🖨️ 인쇄</button><button onClick={handleSave} disabled={saving} className="btn btn-secondary disabled:opacity-50">{saving ? '저장 중...' : saved ? '✓ 저장됨' : '🗄️ 보관함에 저장'}</button></div>
          <div ref={printRef} className="bg-white p-10 max-w-[210mm] mx-auto shadow-sm border print:shadow-none print:border-none" style={{ fontFamily: "'Pretendard', sans-serif" }}>
            <h1 className="text-2xl font-bold text-center mb-8 tracking-widest">겸 업 허 가 신 청 서</h1>
            <div className="text-sm mb-6"><table className="w-full border-collapse"><tbody>
              <tr className="border border-gray-300"><td className="bg-gray-50 px-4 py-2 font-medium w-24 border-r">성 명</td><td className="px-4 py-2 border-r">{data.employeeName}</td><td className="bg-gray-50 px-4 py-2 font-medium w-24 border-r">부서/직위</td><td className="px-4 py-2">{data.department} {data.position}</td></tr>
              <tr className="border border-gray-300 border-t-0"><td className="bg-gray-50 px-4 py-2 font-medium border-r">업체명</td><td className="px-4 py-2 border-r font-bold">{data.sideCompany}</td><td className="bg-gray-50 px-4 py-2 font-medium border-r">주당 시간</td><td className="px-4 py-2">{data.weeklyHours}시간</td></tr>
              <tr className="border border-gray-300 border-t-0"><td className="bg-gray-50 px-4 py-2 font-medium border-r">기 간</td><td className="px-4 py-2 border-r" colSpan={3}>{formatDate(data.sideStartDate)} ~ {data.sideEndDate ? formatDate(data.sideEndDate) : '미정'}</td></tr>
            </tbody></table></div>
            <div className="text-sm leading-7 mb-6">
              <div className="p-4 border border-gray-200 rounded bg-gray-50 mb-4"><p className="font-medium mb-1">■ 업무 내용</p><p className="whitespace-pre-wrap">{data.sideWork}</p></div>
              <p className="mb-2">■ 이해충돌 여부: {data.hasConflict}</p>
              <div className="mt-4 p-4 border-2 border-gray-300 rounded"><p className="font-medium mb-1">■ 서약</p><p>{data.pledge}</p></div>
            </div>
            <p className="text-center text-sm mb-12 mt-8">{formatDate(data.issueDate)}</p>
            <div className="text-sm mb-8"><p>신청인: {data.employeeName} (서명)</p></div>
            <div className="text-center text-sm"><p className="font-bold text-lg">{data.company.name} 귀중</p></div>
          </div>
        </div>
      )}
    </div>
  );
}
