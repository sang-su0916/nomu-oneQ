'use client';
import { useState, useRef, useEffect } from 'react';
import { useReactToPrint } from 'react-to-print';
import { CompanyInfo, Employee } from '@/types';
import { loadCompanyInfo, defaultCompanyInfo, formatDate, getActiveEmployees } from '@/lib/storage';
import { useDocumentSave } from '@/hooks/useDocumentSave';

interface Data { company: CompanyInfo; employeeName: string; department: string; position: string; leaveStartDate: string; leaveEndDate: string; leaveType: string; reinstatementDate: string; returnDepartment: string; returnPosition: string; remarks: string; issueDate: string; }

function createDefault(): Data { const today = new Date().toISOString().split('T')[0]; return { company: defaultCompanyInfo, employeeName: '', department: '', position: '', leaveStartDate: '', leaveEndDate: '', leaveType: '육아휴직', reinstatementDate: today, returnDepartment: '', returnPosition: '', remarks: '', issueDate: today }; }

export default function ReinstatementPage() {
  const [data, setData] = useState<Data>(createDefault);
  const [showPreview, setShowPreview] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selId, setSelId] = useState('');
  const printRef = useRef<HTMLDivElement>(null);
  const { saveDocument, saving, saved } = useDocumentSave();

  useEffect(() => { const s = loadCompanyInfo(); if (s) setData(p => ({ ...p, company: s })); setEmployees(getActiveEmployees()); }, []);
  const handleSelect = (id: string) => { setSelId(id); const emp = employees.find(e => e.id === id); if (emp) setData(p => ({ ...p, employeeName: emp.info.name, department: emp.department || '', position: emp.position || '', returnDepartment: emp.department || '', returnPosition: emp.position || '' })); };
  const handlePrint = useReactToPrint({ contentRef: printRef, documentTitle: `복직신청서_${data.employeeName}` });
  const handleSave = async () => { await saveDocument({ docType: 'reinstatement', title: `복직신청서 - ${data.employeeName}`, employeeId: selId || undefined, data: data as unknown as Record<string, unknown> }); };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
      <h1 className="heading-lg flex items-center gap-2 mb-2"><span className="icon-box icon-box-primary">🔄</span> 복직신청서</h1>
      <p className="text-sm text-[var(--text-muted)] mb-6">휴직 종료 후 복직 신청</p>
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
            <h3 className="form-section-title">📝 복직 정보</h3>
            <div className="space-y-4">
              <div><label className="input-label">휴직 유형</label><input type="text" className="input-field" value={data.leaveType} onChange={e => setData(p => ({ ...p, leaveType: e.target.value }))} /></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><label className="input-label">휴직 시작일</label><input type="date" className="input-field" value={data.leaveStartDate} onChange={e => setData(p => ({ ...p, leaveStartDate: e.target.value }))} /></div>
                <div><label className="input-label">휴직 종료일</label><input type="date" className="input-field" value={data.leaveEndDate} onChange={e => setData(p => ({ ...p, leaveEndDate: e.target.value }))} /></div>
                <div><label className="input-label">복직 희망일 *</label><input type="date" className="input-field" value={data.reinstatementDate} onChange={e => setData(p => ({ ...p, reinstatementDate: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="input-label">복직 부서</label><input type="text" className="input-field" value={data.returnDepartment} onChange={e => setData(p => ({ ...p, returnDepartment: e.target.value }))} /></div>
                <div><label className="input-label">복직 직위</label><input type="text" className="input-field" value={data.returnPosition} onChange={e => setData(p => ({ ...p, returnPosition: e.target.value }))} /></div>
              </div>
              <div><label className="input-label">비고</label><textarea className="input-field min-h-[60px]" value={data.remarks} onChange={e => setData(p => ({ ...p, remarks: e.target.value }))} /></div>
            </div>
          </div>
          <button onClick={() => setShowPreview(true)} className="btn btn-primary" disabled={!data.employeeName}>미리보기</button>
        </div>
      ) : (
        <div>
          <div className="flex gap-3 mb-6 no-print"><button onClick={() => setShowPreview(false)} className="btn btn-secondary">← 수정</button><button onClick={handlePrint} className="btn btn-primary">🖨️ 인쇄</button><button onClick={handleSave} disabled={saving} className="btn btn-secondary disabled:opacity-50">{saving ? '저장 중...' : saved ? '✓ 저장됨' : '🗄️ 보관함에 저장'}</button></div>
          <div ref={printRef} className="bg-white p-10 max-w-[210mm] mx-auto shadow-sm border print:shadow-none print:border-none" style={{ fontFamily: "'Pretendard', sans-serif" }}>
            <h1 className="text-2xl font-bold text-center mb-8 tracking-widest">복 직 신 청 서</h1>
            <div className="text-sm mb-6"><table className="w-full border-collapse"><tbody>
              <tr className="border border-gray-300"><td className="bg-gray-50 px-4 py-2 font-medium w-24 border-r">성 명</td><td className="px-4 py-2 border-r">{data.employeeName}</td><td className="bg-gray-50 px-4 py-2 font-medium w-24 border-r">부서/직위</td><td className="px-4 py-2">{data.department} {data.position}</td></tr>
              <tr className="border border-gray-300 border-t-0"><td className="bg-gray-50 px-4 py-2 font-medium border-r">휴직유형</td><td className="px-4 py-2 border-r">{data.leaveType}</td><td className="bg-gray-50 px-4 py-2 font-medium border-r">휴직기간</td><td className="px-4 py-2">{formatDate(data.leaveStartDate)} ~ {formatDate(data.leaveEndDate)}</td></tr>
              <tr className="border border-gray-300 border-t-0"><td className="bg-gray-50 px-4 py-2 font-medium border-r">복직일</td><td className="px-4 py-2 border-r font-bold">{formatDate(data.reinstatementDate)}</td><td className="bg-gray-50 px-4 py-2 font-medium border-r">복직부서</td><td className="px-4 py-2">{data.returnDepartment} {data.returnPosition}</td></tr>
            </tbody></table></div>
            {data.remarks && <div className="text-sm mb-6 p-4 border border-gray-200 rounded bg-gray-50"><p className="font-medium mb-2">■ 비고</p><p>{data.remarks}</p></div>}
            <p className="text-sm text-center mb-2 mt-8">위와 같이 복직을 신청합니다.</p>
            <p className="text-center text-sm mb-12">{formatDate(data.issueDate)}</p>
            <div className="text-sm mb-8"><p>신청인: {data.employeeName} (서명)</p></div>
            <div className="text-center text-sm"><p className="font-bold text-lg">{data.company.name} 귀중</p></div>
          </div>
        </div>
      )}
    </div>
  );
}
