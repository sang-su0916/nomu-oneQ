'use client';
import { useState, useRef, useEffect } from 'react';
import { useReactToPrint } from 'react-to-print';
import { CompanyInfo, Employee } from '@/types';
import { loadCompanyInfo, defaultCompanyInfo, formatDate, getActiveEmployees } from '@/lib/storage';
import { useDocumentSave } from '@/hooks/useDocumentSave';

interface TerminationData {
  company: CompanyInfo;
  employeeName: string; department: string; position: string; hireDate: string;
  terminationType: string; reason: string; effectiveDate: string;
  noticeDate: string; severancePay: string; returnItems: string;
  issueDate: string;
}
const terminationTypes = ['통상해고', '징계해고', '정리해고', '계약만료', '수습기간 해고'];

function createDefault(): TerminationData {
  const today = new Date().toISOString().split('T')[0];
  return { company: defaultCompanyInfo, employeeName: '', department: '', position: '', hireDate: '', terminationType: '통상해고', reason: '', effectiveDate: today, noticeDate: today, severancePay: '', returnItems: '사원증, 노트북, 사무실 열쇠', issueDate: today };
}

export default function TerminationNoticePage() {
  const [data, setData] = useState<TerminationData>(createDefault);
  const [showPreview, setShowPreview] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selId, setSelId] = useState('');
  const printRef = useRef<HTMLDivElement>(null);
  const { saveDocument, saving, saved } = useDocumentSave();

  useEffect(() => { const s = loadCompanyInfo(); if (s) setData(p => ({ ...p, company: s })); setEmployees(getActiveEmployees()); }, []);

  const handleSelect = (id: string) => { setSelId(id); const emp = employees.find(e => e.id === id); if (emp) setData(p => ({ ...p, employeeName: emp.info.name, department: emp.department || '', position: emp.position || '', hireDate: emp.hireDate })); };
  const handlePrint = useReactToPrint({ contentRef: printRef, documentTitle: `해고통보서_${data.employeeName}` });
  const handleSave = async () => { await saveDocument({ docType: 'termination_notice', title: `해고통보서 - ${data.employeeName}`, employeeId: selId || undefined, data: data as unknown as Record<string, unknown> }); };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
      <h1 className="heading-lg flex items-center gap-2 mb-2"><span className="icon-box icon-box-primary">❌</span> 해고통보서</h1>
      <p className="text-sm text-[var(--text-muted)] mb-6">근로기준법 제26조에 따른 해고 예고 통보 (30일 전 서면 통보 의무)</p>

      {!showPreview ? (
        <div className="space-y-6">
          <div className="form-section">
            <h3 className="form-section-title">👤 대상 직원</h3>
            {employees.length > 0 && <div className="mb-4"><select className="input-field" value={selId} onChange={e => handleSelect(e.target.value)}><option value="">직접 입력</option>{employees.map(emp => <option key={emp.id} value={emp.id}>{emp.info.name}</option>)}</select></div>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="input-label">성명 *</label><input type="text" className="input-field" value={data.employeeName} onChange={e => setData(p => ({ ...p, employeeName: e.target.value }))} /></div>
              <div><label className="input-label">부서 / 직위</label><input type="text" className="input-field" value={`${data.department} ${data.position}`} onChange={e => setData(p => ({ ...p, department: e.target.value }))} /></div>
              <div><label className="input-label">입사일</label><input type="date" className="input-field" value={data.hireDate} onChange={e => setData(p => ({ ...p, hireDate: e.target.value }))} /></div>
              <div><label className="input-label">해고 유형</label><select className="input-field" value={data.terminationType} onChange={e => setData(p => ({ ...p, terminationType: e.target.value }))}>{terminationTypes.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
            </div>
          </div>
          <div className="form-section">
            <h3 className="form-section-title">📝 해고 사유</h3>
            <div className="space-y-4">
              <div><label className="input-label">해고 사유 *</label><textarea className="input-field min-h-[120px]" value={data.reason} onChange={e => setData(p => ({ ...p, reason: e.target.value }))} placeholder="구체적인 해고 사유를 기술해주세요." /></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="input-label">통보일</label><input type="date" className="input-field" value={data.noticeDate} onChange={e => setData(p => ({ ...p, noticeDate: e.target.value }))} /></div>
                <div><label className="input-label">해고 효력일</label><input type="date" className="input-field" value={data.effectiveDate} onChange={e => setData(p => ({ ...p, effectiveDate: e.target.value }))} /></div>
              </div>
              <div><label className="input-label">퇴직금 안내</label><input type="text" className="input-field" value={data.severancePay} onChange={e => setData(p => ({ ...p, severancePay: e.target.value }))} placeholder="퇴직금은 퇴직일로부터 14일 이내 지급" /></div>
              <div><label className="input-label">반납 물품</label><input type="text" className="input-field" value={data.returnItems} onChange={e => setData(p => ({ ...p, returnItems: e.target.value }))} /></div>
            </div>
          </div>
          <div className="p-4 bg-red-50 rounded-lg border border-red-200 text-sm text-red-700">
            <strong>⚠️ 유의사항:</strong> 근로기준법 제26조에 따라 해고는 적어도 30일 전에 서면으로 예고하여야 합니다. 30일 전에 예고하지 않은 경우 30일분 이상의 통상임금을 해고예고수당으로 지급해야 합니다.
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
            <h1 className="text-2xl font-bold text-center mb-8 tracking-widest">해 고 통 보 서</h1>
            <div className="mb-6 text-sm">
              <table className="w-full border-collapse"><tbody>
                <tr className="border border-gray-300"><td className="bg-gray-50 px-4 py-2 font-medium w-24 border-r">성 명</td><td className="px-4 py-2 border-r">{data.employeeName}</td><td className="bg-gray-50 px-4 py-2 font-medium w-24 border-r">부서/직위</td><td className="px-4 py-2">{data.department} {data.position}</td></tr>
                <tr className="border border-gray-300 border-t-0"><td className="bg-gray-50 px-4 py-2 font-medium border-r">입사일</td><td className="px-4 py-2 border-r">{formatDate(data.hireDate)}</td><td className="bg-gray-50 px-4 py-2 font-medium border-r">해고유형</td><td className="px-4 py-2 text-red-600 font-bold">{data.terminationType}</td></tr>
                <tr className="border border-gray-300 border-t-0"><td className="bg-gray-50 px-4 py-2 font-medium border-r">통보일</td><td className="px-4 py-2 border-r">{formatDate(data.noticeDate)}</td><td className="bg-gray-50 px-4 py-2 font-medium border-r">효력일</td><td className="px-4 py-2 font-bold">{formatDate(data.effectiveDate)}</td></tr>
              </tbody></table>
            </div>
            <div className="text-sm leading-7 mb-8">
              <div className="p-4 border border-gray-200 rounded bg-gray-50 mb-4"><p className="font-medium mb-2">■ 해고 사유</p><p className="whitespace-pre-wrap">{data.reason}</p></div>
              {data.severancePay && <p className="mb-2">■ 퇴직금 안내: {data.severancePay}</p>}
              {data.returnItems && <p className="mb-2">■ 반납 물품: {data.returnItems}</p>}
              <p className="mt-4">위와 같은 사유로 귀하에 대해 {formatDate(data.effectiveDate)}부로 해고 처분함을 통보합니다.</p>
            </div>
            <p className="text-center text-sm mb-12">{formatDate(data.issueDate)}</p>
            <div className="text-center text-sm"><p className="font-bold text-lg mb-2">{data.company.name}</p><p>대표이사 {data.company.ceoName} (인)</p></div>
          </div>
        </div>
      )}
    </div>
  );
}
