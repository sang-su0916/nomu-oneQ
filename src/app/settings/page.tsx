'use client';

import { useState } from 'react';
import HelpGuide from '@/components/HelpGuide';
import { CompanyInfo } from '@/types';
import { saveCompanyInfo, loadCompanyInfo, defaultCompanyInfo, formatBusinessNumber, formatPhoneNumber } from '@/lib/storage';

export default function SettingsPage() {
  const [company, setCompany] = useState<CompanyInfo>(() => {
    if (typeof window === 'undefined') return defaultCompanyInfo;
    return loadCompanyInfo() || defaultCompanyInfo;
  });
  const [saved, setSaved] = useState(false);

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
          '상호, 대표자, 사업자번호 등 회사 정보를 입력하세요.',
          '여기서 입력한 정보는 근로계약서, 급여명세서 등 모든 서류에 자동 반영됩니다.',
          '변경 사항은 "저장" 버튼을 눌러야 적용됩니다.',
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
    </div>
  );
}
