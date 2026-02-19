'use client';

import { useState, useRef, useEffect } from 'react';
import { useReactToPrint } from 'react-to-print';
import { CompanyInfo, Employee } from '@/types';
import { loadCompanyInfo, defaultCompanyInfo, formatDate, getActiveEmployees } from '@/lib/storage';
import HelpGuide from '@/components/HelpGuide';
import { useDocumentSave } from '@/hooks/useDocumentSave';

interface ResignationData {
  company: CompanyInfo;
  employeeName: string;
  department: string;
  position: string;
  hireDate: string;
  resignDate: string;
  reasonCategory: string;
  reasonDetail: string;
  submitDate: string;
}

const reasonCategories = ['개인 사유', '건강 사유', '가정 사유', '이직', '학업', '기타'];

function createDefaultData(): ResignationData {
  return {
    company: defaultCompanyInfo,
    employeeName: '',
    department: '',
    position: '',
    hireDate: '',
    resignDate: '',
    reasonCategory: '개인 사유',
    reasonDetail: '',
    submitDate: new Date().toISOString().split('T')[0],
  };
}

export default function ResignationPage() {
  const [data, setData] = useState<ResignationData>(createDefaultData);
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
      docType: 'resignation',
      title: `사직서 - ${data.employeeName || '이름없음'}`,
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
        hireDate: emp.hireDate || '',
      }));
    }
  };

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `사직서_${data.employeeName || '이름없음'}`,
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">사직서</h1>
          <p className="text-gray-500 mt-1">자발적 퇴사 시 제출하는 사직서</p>
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
        pageKey="resignation"
        steps={[
          '직원을 선택하면 기본 정보가 자동 입력됩니다.',
          '사직 사유와 희망 퇴사일을 입력하세요.',
          '"미리보기"로 확인 후 "인쇄/PDF"로 출력하세요.',
        ]}
      />

      {!showPreview ? (
        <div className="space-y-6 animate-fade-in">
          <div className="form-section">
            <h2 className="form-section-title">사직자 정보</h2>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <div>
                <label className="input-label">입사일</label>
                <input type="date" className="input-field" value={data.hireDate}
                  onChange={e => setData(prev => ({ ...prev, hireDate: e.target.value }))} />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h2 className="form-section-title">사직 정보</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="input-label">사직 희망일 *</label>
                <input type="date" className="input-field" value={data.resignDate}
                  onChange={e => setData(prev => ({ ...prev, resignDate: e.target.value }))} />
              </div>
              <div>
                <label className="input-label">제출일</label>
                <input type="date" className="input-field" value={data.submitDate}
                  onChange={e => setData(prev => ({ ...prev, submitDate: e.target.value }))} />
              </div>
              <div>
                <label className="input-label">사직 사유</label>
                <select className="input-field" value={data.reasonCategory}
                  onChange={e => setData(prev => ({ ...prev, reasonCategory: e.target.value }))}>
                  {reasonCategories.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="input-label">상세 사유</label>
                <textarea className="input-field" rows={3} placeholder="구체적인 사직 사유를 입력하세요 (선택사항)"
                  value={data.reasonDetail}
                  onChange={e => setData(prev => ({ ...prev, reasonDetail: e.target.value }))} />
              </div>
            </div>
          </div>

          <div className="alert alert-warning">
            <div className="text-sm">
              <p className="font-medium">참고사항</p>
              <p className="opacity-80 mt-1">근로기준법 제26조에 따라 근로자가 해고되는 경우 30일 전에 예고해야 합니다. 근로자의 자발적 사직의 경우에도 원활한 업무 인수인계를 위해 최소 30일 전 제출을 권장합니다.</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg p-8 animate-fade-in">
          <ResignPreview data={data} />
        </div>
      )}

      <div className="hidden">
        <div ref={printRef}><ResignPreview data={data} /></div>
      </div>
    </div>
  );
}

function ResignPreview({ data }: { data: ResignationData }) {
  const cellStyle = { border: '1px solid #333', padding: '12px 16px', verticalAlign: 'middle' as const };
  const headerStyle = { ...cellStyle, backgroundColor: '#f3f4f6', fontWeight: 600, width: '120px', textAlign: 'center' as const };

  return (
    <div className="contract-document" style={{ fontFamily: "'Nanum Gothic', sans-serif", color: '#111', lineHeight: 1.8 }}>
      <h1 style={{ textAlign: 'center', fontSize: '28px', fontWeight: 700, letterSpacing: '12px', marginBottom: '40px', marginTop: '20px' }}>
        사 직 서
      </h1>

      <p style={{ fontSize: '15px', marginBottom: '32px', lineHeight: 2 }}>
        본인은 아래와 같은 사유로 <strong>{formatDate(data.resignDate)}</strong>부로 사직하고자 하오니 허락하여 주시기 바랍니다.
      </p>

      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '40px' }}>
        <tbody>
          <tr>
            <th style={headerStyle}>소 속</th>
            <td style={cellStyle}>{data.department}</td>
          </tr>
          <tr>
            <th style={headerStyle}>직 위</th>
            <td style={cellStyle}>{data.position}</td>
          </tr>
          <tr>
            <th style={headerStyle}>성 명</th>
            <td style={cellStyle}>{data.employeeName}</td>
          </tr>
          <tr>
            <th style={headerStyle}>입 사 일</th>
            <td style={cellStyle}>{formatDate(data.hireDate)}</td>
          </tr>
          <tr>
            <th style={headerStyle}>사직 희망일</th>
            <td style={cellStyle}>{formatDate(data.resignDate)}</td>
          </tr>
          <tr>
            <th style={headerStyle}>사직 사유</th>
            <td style={cellStyle}>
              {data.reasonCategory}
              {data.reasonDetail && <><br />{data.reasonDetail}</>}
            </td>
          </tr>
        </tbody>
      </table>

      <p style={{ textAlign: 'center', fontSize: '15px', fontWeight: 600, marginBottom: '60px' }}>
        {formatDate(data.submitDate)}
      </p>

      <div style={{ maxWidth: '350px', margin: '0 auto 60px', textAlign: 'center' }}>
        <table style={{ width: '100%' }}>
          <tbody>
            <tr>
              <td style={{ padding: '8px 0', color: '#555', width: '80px' }}>사직자</td>
              <td style={{ padding: '8px 0', fontWeight: 600, fontSize: '16px' }}>
                {data.employeeName} <span style={{ color: '#999', fontSize: '14px', marginLeft: '16px' }}>(서명 또는 인)</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={{ borderTop: '2px solid #333', paddingTop: '24px' }}>
        <p style={{ fontWeight: 600, marginBottom: '16px' }}>[ 수리란 ]</p>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <th style={headerStyle}>수리자</th>
              <td style={cellStyle}>{data.company.ceoName}</td>
              <th style={headerStyle}>수리일자</th>
              <td style={cellStyle}></td>
            </tr>
          </tbody>
        </table>
        <p style={{ textAlign: 'right', marginTop: '16px', fontSize: '14px' }}>
          <strong>{data.company.name}</strong> 대표 {data.company.ceoName} 귀하
        </p>
      </div>
    </div>
  );
}
