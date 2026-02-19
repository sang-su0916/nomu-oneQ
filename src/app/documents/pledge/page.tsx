'use client';
import { useState, useRef, useEffect } from 'react';
import { useReactToPrint } from 'react-to-print';
import { CompanyInfo, Employee } from '@/types';
import { loadCompanyInfo, defaultCompanyInfo, formatDate, getActiveEmployees } from '@/lib/storage';
import { useDocumentSave } from '@/hooks/useDocumentSave';

interface Data { company: CompanyInfo; employeeName: string; department: string; position: string; pledgeType: string; content: string; issueDate: string; }

const pledgeTemplates: Record<string, string> = {
  '입사 복무서약': `1. 회사의 취업규칙 및 제반 규정을 성실히 준수하겠습니다.\n2. 직무상 알게 된 회사의 기밀을 재직 중은 물론 퇴직 후에도 누설하지 않겠습니다.\n3. 회사의 승인 없이 다른 직업에 종사하거나 겸업하지 않겠습니다.\n4. 회사의 명예와 신용을 훼손하는 행위를 하지 않겠습니다.\n5. 성실하고 공정하게 직무를 수행하겠습니다.`,
  '정보보안 서약': `1. 업무상 취득한 회사의 기술정보, 영업비밀, 고객정보 등을 외부에 유출하지 않겠습니다.\n2. 회사의 정보보안 정책 및 규정을 준수하겠습니다.\n3. 업무용 단말기 및 시스템의 보안설정을 임의로 변경하지 않겠습니다.\n4. 퇴직 시 업무 관련 자료를 모두 반납하겠습니다.\n5. 위반 시 민형사상 책임을 지겠습니다.`,
  '복직 서약': `1. 복직 후 회사의 취업규칙 및 규정을 성실히 준수하겠습니다.\n2. 배치된 부서의 업무에 적극적으로 임하겠습니다.\n3. 복직 사유와 관련된 문제가 재발하지 않도록 노력하겠습니다.`,
  '직접 입력': '',
};

function createDefault(): Data { const today = new Date().toISOString().split('T')[0]; return { company: defaultCompanyInfo, employeeName: '', department: '', position: '', pledgeType: '입사 복무서약', content: pledgeTemplates['입사 복무서약'], issueDate: today }; }

export default function PledgePage() {
  const [data, setData] = useState<Data>(createDefault);
  const [showPreview, setShowPreview] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selId, setSelId] = useState('');
  const printRef = useRef<HTMLDivElement>(null);
  const { saveDocument, saving, saved } = useDocumentSave();

  useEffect(() => { const s = loadCompanyInfo(); if (s) setData(p => ({ ...p, company: s })); setEmployees(getActiveEmployees()); }, []);
  const handleSelect = (id: string) => { setSelId(id); const emp = employees.find(e => e.id === id); if (emp) setData(p => ({ ...p, employeeName: emp.info.name, department: emp.department || '', position: emp.position || '' })); };
  const handlePrint = useReactToPrint({ contentRef: printRef, documentTitle: `서약서_${data.employeeName}` });
  const handleSave = async () => { await saveDocument({ docType: 'pledge', title: `서약서 - ${data.employeeName} (${data.pledgeType})`, employeeId: selId || undefined, data: data as unknown as Record<string, unknown> }); };

  const handleTypeChange = (type: string) => { setData(p => ({ ...p, pledgeType: type, content: pledgeTemplates[type] || p.content })); };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
      <h1 className="heading-lg flex items-center gap-2 mb-2"><span className="icon-box icon-box-primary">✍️</span> 서약서</h1>
      <p className="text-sm text-[var(--text-muted)] mb-6">입사/복직/보안 등 범용 서약서</p>
      {!showPreview ? (
        <div className="space-y-6">
          <div className="form-section">
            <h3 className="form-section-title">👤 서약자</h3>
            {employees.length > 0 && <div className="mb-4"><select className="input-field" value={selId} onChange={e => handleSelect(e.target.value)}><option value="">직접 입력</option>{employees.map(emp => <option key={emp.id} value={emp.id}>{emp.info.name}</option>)}</select></div>}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div><label className="input-label">성명 *</label><input type="text" className="input-field" value={data.employeeName} onChange={e => setData(p => ({ ...p, employeeName: e.target.value }))} /></div>
              <div><label className="input-label">부서</label><input type="text" className="input-field" value={data.department} onChange={e => setData(p => ({ ...p, department: e.target.value }))} /></div>
              <div><label className="input-label">직위</label><input type="text" className="input-field" value={data.position} onChange={e => setData(p => ({ ...p, position: e.target.value }))} /></div>
            </div>
          </div>
          <div className="form-section">
            <h3 className="form-section-title">📝 서약 내용</h3>
            <div className="mb-4"><label className="input-label">서약 유형</label><select className="input-field max-w-xs" value={data.pledgeType} onChange={e => handleTypeChange(e.target.value)}>{Object.keys(pledgeTemplates).map(t => <option key={t} value={t}>{t}</option>)}</select></div>
            <div><label className="input-label">서약 내용 *</label><textarea className="input-field min-h-[200px] font-mono text-sm" value={data.content} onChange={e => setData(p => ({ ...p, content: e.target.value }))} /></div>
          </div>
          <button onClick={() => setShowPreview(true)} className="btn btn-primary" disabled={!data.employeeName || !data.content}>미리보기</button>
        </div>
      ) : (
        <div>
          <div className="flex gap-3 mb-6 no-print"><button onClick={() => setShowPreview(false)} className="btn btn-secondary">← 수정</button><button onClick={handlePrint} className="btn btn-primary">🖨️ 인쇄</button><button onClick={handleSave} disabled={saving} className="btn btn-secondary disabled:opacity-50">{saving ? '저장 중...' : saved ? '✓ 저장됨' : '🗄️ 보관함에 저장'}</button></div>
          <div ref={printRef} className="bg-white p-10 max-w-[210mm] mx-auto shadow-sm border print:shadow-none print:border-none" style={{ fontFamily: "'Pretendard', sans-serif" }}>
            <h1 className="text-2xl font-bold text-center mb-2 tracking-widest">서 약 서</h1>
            <p className="text-center text-sm text-gray-500 mb-8">({data.pledgeType})</p>
            <div className="text-sm leading-8 mb-8 whitespace-pre-wrap">{data.content}</div>
            <p className="text-sm text-center mb-2 mt-8">위 사항을 성실히 이행할 것을 서약합니다.</p>
            <p className="text-center text-sm mb-12">{formatDate(data.issueDate)}</p>
            <div className="text-sm mb-8 text-center">
              <p>서약자: {data.employeeName}</p>
              {data.department && <p>소 속: {data.department} {data.position}</p>}
              <p className="mt-4">(서명 또는 인)</p>
            </div>
            <div className="text-center text-sm mt-8"><p className="font-bold text-lg">{data.company.name} 귀중</p></div>
          </div>
        </div>
      )}
    </div>
  );
}
