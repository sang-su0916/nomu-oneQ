'use client';
import { useState, useRef, useEffect } from 'react';
import { useReactToPrint } from 'react-to-print';
import { CompanyInfo, Employee } from '@/types';
import { loadCompanyInfo, defaultCompanyInfo, formatDate, getActiveEmployees } from '@/lib/storage';
import { useDocumentSave } from '@/hooks/useDocumentSave';

interface TaskItem { task: string; status: string; notes: string; }
interface Data { company: CompanyInfo; fromName: string; fromDept: string; fromPosition: string; toName: string; toDept: string; toPosition: string; handoverDate: string; reason: string; tasks: TaskItem[]; pendingItems: string; specialNotes: string; issueDate: string; }

function createDefault(): Data { const today = new Date().toISOString().split('T')[0]; return { company: defaultCompanyInfo, fromName: '', fromDept: '', fromPosition: '', toName: '', toDept: '', toPosition: '', handoverDate: today, reason: '', tasks: [{ task: '', status: '진행중', notes: '' }], pendingItems: '', specialNotes: '', issueDate: today }; }

export default function HandoverPage() {
  const [data, setData] = useState<Data>(createDefault);
  const [showPreview, setShowPreview] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const printRef = useRef<HTMLDivElement>(null);
  const { saveDocument, saving, saved } = useDocumentSave();

  useEffect(() => { const s = loadCompanyInfo(); if (s) setData(p => ({ ...p, company: s })); setEmployees(getActiveEmployees()); }, []);
  const handlePrint = useReactToPrint({ contentRef: printRef, documentTitle: `업무인수인계서_${data.fromName}` });
  const handleSave = async () => { await saveDocument({ docType: 'handover', title: `업무인수인계서 - ${data.fromName} → ${data.toName}`, data: data as unknown as Record<string, unknown> }); };

  const addTask = () => setData(p => ({ ...p, tasks: [...p.tasks, { task: '', status: '진행중', notes: '' }] }));
  const removeTask = (i: number) => setData(p => ({ ...p, tasks: p.tasks.filter((_, idx) => idx !== i) }));
  const updateTask = (i: number, field: keyof TaskItem, val: string) => setData(p => ({ ...p, tasks: p.tasks.map((t, idx) => idx === i ? { ...t, [field]: val } : t) }));

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
      <h1 className="heading-lg flex items-center gap-2 mb-2"><span className="icon-box icon-box-primary">🤝</span> 업무인수인계서</h1>
      <p className="text-sm text-[var(--text-muted)] mb-6">퇴사/이동 시 업무 인수인계 기록</p>
      {!showPreview ? (
        <div className="space-y-6">
          <div className="form-section">
            <h3 className="form-section-title">📤 인계자 (보내는 사람)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div><label className="input-label">성명 *</label>
                {employees.length > 0 ? <select className="input-field" value={data.fromName} onChange={e => { const emp = employees.find(em => em.info.name === e.target.value); setData(p => ({ ...p, fromName: e.target.value, fromDept: emp?.department || '', fromPosition: emp?.position || '' })); }}><option value="">직접 입력</option>{employees.map(emp => <option key={emp.id} value={emp.info.name}>{emp.info.name}</option>)}</select> : <input type="text" className="input-field" value={data.fromName} onChange={e => setData(p => ({ ...p, fromName: e.target.value }))} />}
              </div>
              <div><label className="input-label">부서</label><input type="text" className="input-field" value={data.fromDept} onChange={e => setData(p => ({ ...p, fromDept: e.target.value }))} /></div>
              <div><label className="input-label">직위</label><input type="text" className="input-field" value={data.fromPosition} onChange={e => setData(p => ({ ...p, fromPosition: e.target.value }))} /></div>
            </div>
          </div>
          <div className="form-section">
            <h3 className="form-section-title">📥 인수자 (받는 사람)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div><label className="input-label">성명 *</label><input type="text" className="input-field" value={data.toName} onChange={e => setData(p => ({ ...p, toName: e.target.value }))} /></div>
              <div><label className="input-label">부서</label><input type="text" className="input-field" value={data.toDept} onChange={e => setData(p => ({ ...p, toDept: e.target.value }))} /></div>
              <div><label className="input-label">직위</label><input type="text" className="input-field" value={data.toPosition} onChange={e => setData(p => ({ ...p, toPosition: e.target.value }))} /></div>
            </div>
          </div>
          <div className="form-section">
            <h3 className="form-section-title">📋 인계 업무 목록</h3>
            <div><label className="input-label">인계 사유</label><input type="text" className="input-field mb-4" value={data.reason} onChange={e => setData(p => ({ ...p, reason: e.target.value }))} placeholder="예: 퇴사, 부서 이동" /></div>
            {data.tasks.map((t, i) => (
              <div key={i} className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-3">
                <div className="md:col-span-5"><label className="input-label">{i === 0 ? '업무명' : ''}</label><input type="text" className="input-field" placeholder="업무 내용" value={t.task} onChange={e => updateTask(i, 'task', e.target.value)} /></div>
                <div className="md:col-span-2"><label className="input-label">{i === 0 ? '상태' : ''}</label><select className="input-field" value={t.status} onChange={e => updateTask(i, 'status', e.target.value)}><option>진행중</option><option>완료</option><option>보류</option><option>예정</option></select></div>
                <div className="md:col-span-4"><label className="input-label">{i === 0 ? '비고' : ''}</label><input type="text" className="input-field" value={t.notes} onChange={e => updateTask(i, 'notes', e.target.value)} /></div>
                <div className="md:col-span-1 flex items-end"><button onClick={() => removeTask(i)} className="btn btn-secondary text-sm w-full">✕</button></div>
              </div>
            ))}
            <button onClick={addTask} className="btn btn-secondary text-sm">+ 업무 추가</button>
          </div>
          <div className="form-section">
            <h3 className="form-section-title">📝 기타</h3>
            <div><label className="input-label">미완료 사항</label><textarea className="input-field min-h-[60px]" value={data.pendingItems} onChange={e => setData(p => ({ ...p, pendingItems: e.target.value }))} /></div>
            <div className="mt-4"><label className="input-label">특이사항</label><textarea className="input-field min-h-[60px]" value={data.specialNotes} onChange={e => setData(p => ({ ...p, specialNotes: e.target.value }))} /></div>
          </div>
          <button onClick={() => setShowPreview(true)} className="btn btn-primary" disabled={!data.fromName || !data.toName}>미리보기</button>
        </div>
      ) : (
        <div>
          <div className="flex gap-3 mb-6 no-print"><button onClick={() => setShowPreview(false)} className="btn btn-secondary">← 수정</button><button onClick={handlePrint} className="btn btn-primary">🖨️ 인쇄</button><button onClick={handleSave} disabled={saving} className="btn btn-secondary disabled:opacity-50">{saving ? '저장 중...' : saved ? '✓ 저장됨' : '🗄️ 보관함에 저장'}</button></div>
          <div ref={printRef} className="bg-white p-10 max-w-[210mm] mx-auto shadow-sm border print:shadow-none print:border-none" style={{ fontFamily: "'Pretendard', sans-serif" }}>
            <h1 className="text-2xl font-bold text-center mb-8 tracking-widest">업무 인수인계서</h1>
            <div className="text-sm mb-6"><table className="w-full border-collapse"><tbody>
              <tr className="border border-gray-300"><td className="bg-gray-50 px-4 py-2 font-medium w-24 border-r">인계자</td><td className="px-4 py-2 border-r">{data.fromName} ({data.fromDept} {data.fromPosition})</td><td className="bg-gray-50 px-4 py-2 font-medium w-24 border-r">인수자</td><td className="px-4 py-2">{data.toName} ({data.toDept} {data.toPosition})</td></tr>
              <tr className="border border-gray-300 border-t-0"><td className="bg-gray-50 px-4 py-2 font-medium border-r">인계일</td><td className="px-4 py-2 border-r">{formatDate(data.handoverDate)}</td><td className="bg-gray-50 px-4 py-2 font-medium border-r">사 유</td><td className="px-4 py-2">{data.reason}</td></tr>
            </tbody></table></div>
            <p className="font-medium text-sm mb-2">■ 인계 업무 목록</p>
            <table className="w-full border-collapse text-sm mb-6"><thead><tr className="border border-gray-300 bg-gray-50"><th className="px-3 py-2 border-r w-8">No</th><th className="px-3 py-2 border-r">업무내용</th><th className="px-3 py-2 border-r w-20">상태</th><th className="px-3 py-2">비고</th></tr></thead><tbody>
              {data.tasks.filter(t => t.task).map((t, i) => <tr key={i} className="border border-gray-300 border-t-0"><td className="px-3 py-2 border-r text-center">{i + 1}</td><td className="px-3 py-2 border-r">{t.task}</td><td className="px-3 py-2 border-r text-center">{t.status}</td><td className="px-3 py-2">{t.notes}</td></tr>)}
            </tbody></table>
            {data.pendingItems && <div className="text-sm mb-4"><p className="font-medium">■ 미완료 사항</p><p className="whitespace-pre-wrap mt-1">{data.pendingItems}</p></div>}
            {data.specialNotes && <div className="text-sm mb-4"><p className="font-medium">■ 특이사항</p><p className="whitespace-pre-wrap mt-1">{data.specialNotes}</p></div>}
            <p className="text-center text-sm mb-12 mt-8">{formatDate(data.issueDate)}</p>
            <div className="text-sm flex justify-between"><div><p className="mb-4">인계자: {data.fromName} (서명)</p></div><div><p className="mb-4">인수자: {data.toName} (서명)</p></div></div>
            <div className="text-center text-sm mt-4"><p className="font-bold text-lg">{data.company.name}</p></div>
          </div>
        </div>
      )}
    </div>
  );
}
