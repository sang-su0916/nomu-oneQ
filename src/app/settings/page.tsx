'use client';

import { useState, useRef } from 'react';
import HelpGuide from '@/components/HelpGuide';
import { CompanyInfo } from '@/types';
import { saveCompanyInfo, loadCompanyInfo, defaultCompanyInfo, formatBusinessNumber, formatPhoneNumber, exportAllData, importAllData } from '@/lib/storage';

export default function SettingsPage() {
  const [company, setCompany] = useState<CompanyInfo>(() => {
    if (typeof window === 'undefined') return defaultCompanyInfo;
    return loadCompanyInfo() || defaultCompanyInfo;
  });
  const [saved, setSaved] = useState(false);
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (field: keyof CompanyInfo, value: string) => {
    setCompany(prev => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    saveCompanyInfo(company);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleBusinessNumberChange = (value: string) => {
    const cleaned = value.replace(/[^0-9]/g, '').slice(0, 10);
    handleChange('businessNumber', cleaned);
  };

  const handlePhoneChange = (value: string) => {
    const cleaned = value.replace(/[^0-9]/g, '').slice(0, 11);
    handleChange('phone', cleaned);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">⚙️ 설정</h1>
      <p className="text-gray-500 mb-8">회사 정보를 입력하면 모든 서류에 자동으로 반영됩니다.</p>

      <HelpGuide
        pageKey="settings"
        steps={[
          '회사 정보 입력: 상호, 대표자, 사업자번호, 주소, 전화번호를 입력하세요. 이 정보는 근로계약서, 급여명세서 등 모든 서류에 자동으로 들어갑니다.',
          '저장: 정보를 수정한 뒤 반드시 "저장하기" 버튼을 눌러주세요. 버튼을 누르지 않으면 변경 사항이 반영되지 않습니다.',
          '데이터 백업: 페이지 하단의 "데이터 내보내기"를 누르면 모든 데이터(회사정보, 직원, 급여기록)가 파일로 저장됩니다. 다른 기기에서 "데이터 가져오기"로 복원할 수 있습니다.',
          '주의: 모든 데이터는 현재 브라우저에만 저장됩니다. 브라우저 데이터를 삭제하면 사라지므로, 중요한 데이터는 꼭 백업해두세요.',
        ]}
      />

      <div className="form-section">
        <h2 className="form-section-title">🏢 회사 정보</h2>
        
        <div className="space-y-4">
          <div>
            <label className="input-label">상호 (회사명)</label>
            <input
              type="text"
              className="input-field"
              placeholder="예: 주식회사 노무뚝딱"
              value={company.name}
              onChange={(e) => handleChange('name', e.target.value)}
            />
          </div>

          <div>
            <label className="input-label">대표자명</label>
            <input
              type="text"
              className="input-field"
              placeholder="예: 홍길동"
              value={company.ceoName}
              onChange={(e) => handleChange('ceoName', e.target.value)}
            />
          </div>

          <div>
            <label className="input-label">사업자등록번호</label>
            <input
              type="text"
              className="input-field"
              placeholder="예: 123-45-67890"
              value={formatBusinessNumber(company.businessNumber)}
              onChange={(e) => handleBusinessNumberChange(e.target.value)}
            />
          </div>

          <div>
            <label className="input-label">사업장 주소</label>
            <input
              type="text"
              className="input-field"
              placeholder="예: 서울시 강남구 테헤란로 123, 4층"
              value={company.address}
              onChange={(e) => handleChange('address', e.target.value)}
            />
          </div>

          <div>
            <label className="input-label">대표 전화번호</label>
            <input
              type="text"
              className="input-field"
              placeholder="예: 02-1234-5678"
              value={formatPhoneNumber(company.phone)}
              onChange={(e) => handlePhoneChange(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          className="btn-primary"
        >
          💾 저장하기
        </button>
        {saved && (
          <span className="text-emerald-600 font-medium animate-pulse">
            ✓ 저장되었습니다!
          </span>
        )}
      </div>

      <div className="mt-8 p-4 bg-amber-50 rounded-lg border border-amber-200">
        <p className="text-amber-800 text-sm">
          <strong>💡 안내:</strong> 입력한 정보는 이 브라우저의 로컬 저장소에 저장됩니다.
          다른 브라우저나 기기에서는 다시 입력해야 합니다.
        </p>
      </div>

      {/* 데이터 백업 */}
      <div className="form-section mt-8">
        <h2 className="form-section-title">💾 데이터 백업</h2>
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 mb-4">
          <p className="text-blue-800 text-sm font-medium mb-1">사용 방법</p>
          <ol className="text-blue-700 text-sm list-decimal list-inside space-y-0.5">
            <li><strong>내보내기</strong>: 버튼을 누르면 백업 파일이 자동으로 다운로드됩니다.</li>
            <li><strong>가져오기</strong>: 다른 기기나 브라우저에서 버튼을 누르고, 저장해둔 백업 파일을 선택하면 복원됩니다.</li>
          </ol>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => {
              const json = exportAllData();
              const blob = new Blob([json], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `nomu-ttuktak-backup-${new Date().toISOString().split('T')[0]}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="btn-secondary"
          >
            📤 데이터 내보내기
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn-secondary"
          >
            📥 데이터 가져오기
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              if (!confirm('기존 데이터를 덮어씁니다. 계속하시겠습니까?')) {
                e.target.value = '';
                return;
              }
              const reader = new FileReader();
              reader.onload = (event) => {
                const result = importAllData(event.target?.result as string);
                if (result) {
                  setImportStatus('success');
                  setTimeout(() => window.location.reload(), 1000);
                } else {
                  setImportStatus('error');
                  setTimeout(() => setImportStatus('idle'), 3000);
                }
              };
              reader.readAsText(file);
              e.target.value = '';
            }}
          />
        </div>
        {importStatus === 'success' && (
          <p className="text-emerald-600 text-sm mt-3 font-medium animate-pulse">
            ✓ 데이터를 성공적으로 가져왔습니다! 페이지를 새로고침합니다...
          </p>
        )}
        {importStatus === 'error' && (
          <p className="text-red-600 text-sm mt-3 font-medium">
            ✗ 파일 형식이 올바르지 않습니다. 노무뚝딱에서 내보낸 JSON 파일인지 확인해주세요.
          </p>
        )}
      </div>
    </div>
  );
}
