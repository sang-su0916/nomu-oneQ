'use client';
import { useState, useRef, useEffect } from 'react';
import { useReactToPrint } from 'react-to-print';
import { CompanyInfo, Employee } from '@/types';
import { loadCompanyInfo, defaultCompanyInfo, formatDate, getActiveEmployees } from '@/lib/storage';
import { useDocumentSave } from '@/hooks/useDocumentSave';

interface EvalData { company: CompanyInfo; employeeName: string; department: string; position: string; hireDate: string; probationEnd: string; evaluator: string; evaluatorPosition: string;
  scores: { workPerformance: number; attitude: number; teamwork: number; punctuality: number; learning: number; };
  strengths: string; improvements: string; overallComment: string; result: string; issueDate: string; }

function createDefault(): EvalData { const today = new Date().toISOString().split('T')[0]; return { company: defaultCompanyInfo, employeeName: '', department: '', position: '', hireDate: '', probationEnd: '', evaluator: '', evaluatorPosition: '', scores: { workPerformance: 3, attitude: 3, teamwork: 3, punctuality: 3, learning: 3 }, strengths: '', improvements: '', overallComment: '', result: '정규직 전환', issueDate: today }; }

const scoreLabels: Record<string, string> = { workPerformance: '업무수행능력', attitude: '근무태도', teamwork: '협업능력', punctuality: '시간관리', learning: '학습능력' };

export default function ProbationEvalPage() {
  const [data, setData] = useState<EvalData>(createDefault);
  const [showPreview, setShowPreview] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selId, setSelId] = useState('');
  const printRef = useRef<HTMLDivElement>(null);
  const { saveDocument, saving, saved } = useDocumentSave();

  useEffect(() => { const s = loadCompanyInfo(); if (s) setData(p => ({ ...p, company: s })); setEmployees(getActiveEmployees()); }, []);
  const handleSelect = (id: string) => { setSelId(id); const emp = employees.find(e => e.id === id); if (emp) setData(p => ({ ...p, employeeName: emp.info.name, department: emp.department || '', position: emp.position || '', hireDate: emp.hireDate })); };
  const handlePrint = useReactToPrint({ contentRef: printRef, documentTitle: `수습평가서_${data.employeeName}` });
  const handleSave = async () => { await saveDocument({ docType: 'probation_eval', title: `수습평가서 - ${data.employeeName} (${data.result})`, employeeId: selId || undefined, data: data as unknown as Record<string, unknown> }); };

  const avgScore = Object.values(data.scores).reduce((a, b) => a + b, 0) / 5;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
      <h1 className="heading-lg flex items-center gap-2 mb-2"><span className="icon-box icon-box-primary">📝</span> 수습평가서</h1>
      <p className="text-sm text-[var(--text-muted)] mb-6">수습기간 종료 시 정규직 전환 여부 평가</p>
      {!showPreview ? (
        <div className="space-y-6">
          <div className="form-section">
            <h3 className="form-section-title">👤 평가 대상</h3>
            {employees.length > 0 && <div className="mb-4"><select className="input-field" value={selId} onChange={e => handleSelect(e.target.value)}><option value="">직접 입력</option>{employees.map(emp => <option key={emp.id} value={emp.id}>{emp.info.name}</option>)}</select></div>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="input-label">성명 *</label><input type="text" className="input-field" value={data.employeeName} onChange={e => setData(p => ({ ...p, employeeName: e.target.value }))} /></div>
              <div><label className="input-label">부서 / 직위</label><input type="text" className="input-field" value={`${data.department} / ${data.position}`} readOnly /></div>
              <div><label className="input-label">입사일</label><input type="date" className="input-field" value={data.hireDate} onChange={e => setData(p => ({ ...p, hireDate: e.target.value }))} /></div>
              <div><label className="input-label">수습 종료일</label><input type="date" className="input-field" value={data.probationEnd} onChange={e => setData(p => ({ ...p, probationEnd: e.target.value }))} /></div>
            </div>
          </div>

          <div className="form-section">
            <h3 className="form-section-title">⭐ 평가 항목 (1~5점)</h3>
            <div className="space-y-4">
              {Object.entries(scoreLabels).map(([key, label]) => (
                <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium text-sm">{label}</span>
                  <div className="flex gap-2">
                    {[1,2,3,4,5].map(n => (
                      <button key={n} onClick={() => setData(p => ({ ...p, scores: { ...p.scores, [key]: n } }))}
                        className={`w-8 h-8 rounded-full text-sm font-bold ${data.scores[key as keyof typeof data.scores] >= n ? 'bg-[var(--primary)] text-white' : 'bg-gray-200 text-gray-500'}`}>{n}</button>
                    ))}
                  </div>
                </div>
              ))}
              <div className="text-right text-sm font-medium text-[var(--primary)]">평균: {avgScore.toFixed(1)}점</div>
            </div>
          </div>

          <div className="form-section">
            <h3 className="form-section-title">💬 평가 의견</h3>
            <div className="space-y-4">
              <div><label className="input-label">강점</label><textarea className="input-field min-h-[60px]" value={data.strengths} onChange={e => setData(p => ({ ...p, strengths: e.target.value }))} /></div>
              <div><label className="input-label">개선 필요 사항</label><textarea className="input-field min-h-[60px]" value={data.improvements} onChange={e => setData(p => ({ ...p, improvements: e.target.value }))} /></div>
              <div><label className="input-label">종합 의견</label><textarea className="input-field min-h-[60px]" value={data.overallComment} onChange={e => setData(p => ({ ...p, overallComment: e.target.value }))} /></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><label className="input-label">판정</label><select className="input-field" value={data.result} onChange={e => setData(p => ({ ...p, result: e.target.value }))}><option value="정규직 전환">정규직 전환</option><option value="수습 연장">수습 연장</option><option value="계약 종료">계약 종료</option></select></div>
                <div><label className="input-label">평가자</label><input type="text" className="input-field" value={data.evaluator} onChange={e => setData(p => ({ ...p, evaluator: e.target.value }))} /></div>
                <div><label className="input-label">평가자 직위</label><input type="text" className="input-field" value={data.evaluatorPosition} onChange={e => setData(p => ({ ...p, evaluatorPosition: e.target.value }))} /></div>
              </div>
            </div>
          </div>
          <button onClick={() => setShowPreview(true)} className="btn btn-primary" disabled={!data.employeeName}>미리보기</button>
        </div>
      ) : (
        <div>
          <div className="flex gap-3 mb-6 no-print">
            <button onClick={() => setShowPreview(false)} className="btn btn-secondary">← 수정</button>
            <button onClick={handlePrint} className="btn btn-primary">🖨️ 인쇄</button>
            <button onClick={handleSave} disabled={saving} className="btn btn-secondary disabled:opacity-50">{saving ? '저장 중...' : saved ? '✓ 저장됨' : '🗄️ 보관함에 저장'}</button>
          </div>
          <div ref={printRef} className="bg-white p-10 max-w-[210mm] mx-auto shadow-sm border print:shadow-none print:border-none" style={{ fontFamily: "'Pretendard', sans-serif" }}>
            <h1 className="text-2xl font-bold text-center mb-8 tracking-widest">수 습 평 가 서</h1>
            <div className="text-sm mb-6"><table className="w-full border-collapse"><tbody>
              <tr className="border border-gray-300"><td className="bg-gray-50 px-4 py-2 font-medium w-24 border-r">성 명</td><td className="px-4 py-2 border-r">{data.employeeName}</td><td className="bg-gray-50 px-4 py-2 font-medium w-24 border-r">부서/직위</td><td className="px-4 py-2">{data.department} / {data.position}</td></tr>
              <tr className="border border-gray-300 border-t-0"><td className="bg-gray-50 px-4 py-2 font-medium border-r">입사일</td><td className="px-4 py-2 border-r">{formatDate(data.hireDate)}</td><td className="bg-gray-50 px-4 py-2 font-medium border-r">수습종료</td><td className="px-4 py-2">{formatDate(data.probationEnd)}</td></tr>
            </tbody></table></div>
            <div className="text-sm mb-6"><table className="w-full border-collapse"><thead><tr className="border border-gray-300 bg-gray-50"><th className="px-4 py-2 text-left">평가항목</th><th className="px-4 py-2 text-center w-20">점수</th></tr></thead><tbody>
              {Object.entries(scoreLabels).map(([key, label]) => <tr key={key} className="border border-gray-300 border-t-0"><td className="px-4 py-2">{label}</td><td className="px-4 py-2 text-center font-bold">{data.scores[key as keyof typeof data.scores]}</td></tr>)}
              <tr className="border border-gray-300 border-t-0 bg-gray-50"><td className="px-4 py-2 font-bold">평균</td><td className="px-4 py-2 text-center font-bold text-[var(--primary)]">{avgScore.toFixed(1)}</td></tr>
            </tbody></table></div>
            {data.strengths && <div className="text-sm mb-3"><span className="font-medium">■ 강점: </span>{data.strengths}</div>}
            {data.improvements && <div className="text-sm mb-3"><span className="font-medium">■ 개선사항: </span>{data.improvements}</div>}
            {data.overallComment && <div className="text-sm mb-3"><span className="font-medium">■ 종합의견: </span>{data.overallComment}</div>}
            <div className="mt-6 p-4 border-2 border-gray-300 rounded text-center"><p className="font-bold text-lg">판정 결과: {data.result}</p></div>
            <div className="mt-8 text-sm flex justify-between"><div><p>평가자: {data.evaluator} ({data.evaluatorPosition})</p></div><div><p>{formatDate(data.issueDate)}</p></div></div>
            <div className="text-center text-sm mt-8"><p className="font-bold text-lg mb-2">{data.company.name}</p><p>대표이사 {data.company.ceoName} (인)</p></div>
          </div>
        </div>
      )}
    </div>
  );
}
