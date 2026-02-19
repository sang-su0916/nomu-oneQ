'use client';

import { useState, useRef, useEffect } from 'react';
import HelpGuide from '@/components/HelpGuide';
import { CompanyInfo } from '@/types';
import { defaultCompanyInfo, formatBusinessNumber, formatPhoneNumber, exportAllData, importAllData } from '@/lib/storage';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

export default function SettingsPage() {
  const { company, refreshAuth, loading: authLoading } = useAuth();
  const supabase = createClient();

  const [localCompany, setLocalCompany] = useState<CompanyInfo>(defaultCompanyInfo);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [importStatus, setImportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Supabase 회사 정보 → 폼에 로드
  useEffect(() => {
    if (company) {
      setLocalCompany({
        name: company.name,
        ceoName: company.ceo_name,
        businessNumber: company.business_number,
        address: company.address || '',
        phone: company.phone || '',
      });
    }
  }, [company]);

  const handleChange = (field: keyof CompanyInfo, value: string) => {
    setLocalCompany(prev => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    if (!company) return;
    setSaving(true);

    try {
      const { error } = await supabase
        .from('companies')
        .update({
          name: localCompany.name,
          ceo_name: localCompany.ceoName,
          business_number: localCompany.businessNumber.replace(/[^0-9]/g, ''),
          address: localCompany.address || null,
          phone: localCompany.phone || null,
        })
        .eq('id', company.id);

      if (error) throw error;

      // localStorage도 갱신 (서류 페이지 호환)
      localStorage.setItem('nomu_company_info', JSON.stringify(localCompany));
      
      await refreshAuth();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      alert('저장에 실패했습니다: ' + (err instanceof Error ? err.message : '알 수 없는 오류'));
    } finally {
      setSaving(false);
    }
  };

  const handleBusinessNumberChange = (value: string) => {
    const cleaned = value.replace(/[^0-9]/g, '').slice(0, 10);
    handleChange('businessNumber', cleaned);
  };

  const handlePhoneChange = (value: string) => {
    const cleaned = value.replace(/[^0-9]/g, '').slice(0, 11);
    handleChange('phone', cleaned);
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">⚙️ 설정</h1>
      <p className="text-gray-500 mb-8">회사 정보를 입력하면 모든 서류에 자동으로 반영됩니다.</p>

      <HelpGuide
        pageKey="settings"
        steps={[
          '회사 정보 입력: 상호, 대표자, 사업자번호, 주소, 전화번호를 입력하세요.',
          '저장: 정보를 수정한 뒤 "저장하기" 버튼을 눌러주세요.',
          '데이터 백업: "데이터 내보내기"로 JSON 백업, "데이터 가져오기"로 복원할 수 있습니다.',
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
              placeholder="예: 주식회사 노무원큐"
              value={localCompany.name}
              onChange={(e) => handleChange('name', e.target.value)}
            />
          </div>

          <div>
            <label className="input-label">대표자명</label>
            <input
              type="text"
              className="input-field"
              placeholder="예: 홍길동"
              value={localCompany.ceoName}
              onChange={(e) => handleChange('ceoName', e.target.value)}
            />
          </div>

          <div>
            <label className="input-label">사업자등록번호</label>
            <input
              type="text"
              className="input-field"
              placeholder="예: 123-45-67890"
              value={formatBusinessNumber(localCompany.businessNumber)}
              onChange={(e) => handleBusinessNumberChange(e.target.value)}
            />
          </div>

          <div>
            <label className="input-label">사업장 주소</label>
            <input
              type="text"
              className="input-field"
              placeholder="예: 서울시 강남구 테헤란로 123, 4층"
              value={localCompany.address}
              onChange={(e) => handleChange('address', e.target.value)}
            />
          </div>

          <div>
            <label className="input-label">대표 전화번호</label>
            <input
              type="text"
              className="input-field"
              placeholder="예: 02-1234-5678"
              value={formatPhoneNumber(localCompany.phone)}
              onChange={(e) => handlePhoneChange(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary disabled:opacity-50"
        >
          {saving ? '저장 중...' : '💾 저장하기'}
        </button>
        {saved && (
          <span className="text-emerald-600 font-medium animate-pulse">
            ✓ 저장되었습니다!
          </span>
        )}
      </div>

      <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-blue-800 text-sm">
          <strong>☁️ 안내:</strong> 데이터는 클라우드에 안전하게 저장됩니다.
          어디서든 로그인하면 동일한 데이터를 이용할 수 있습니다.
        </p>
      </div>

      {/* 현재 요금제 */}
      {company && (
        <div className="form-section mt-8">
          <h2 className="form-section-title">💎 요금제 정보</h2>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-[var(--text)]">
                {company.plan === 'free' ? '무료 플랜' : company.plan === 'starter' ? '스타터 플랜' : company.plan === 'business' ? '비즈니스 플랜' : '프로 플랜'}
              </p>
              <p className="text-sm text-[var(--text-muted)]">
                최대 직원 {company.max_employees === 999999 ? '무제한' : `${company.max_employees}명`}
              </p>
            </div>
            {company.plan === 'free' && (
              <a href="/pricing" className="text-sm text-[var(--primary)] font-medium hover:underline">
                업그레이드 →
              </a>
            )}
          </div>
        </div>
      )}

      {/* 데이터 백업 */}
      <div className="form-section mt-8">
        <h2 className="form-section-title">💾 데이터 백업</h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => {
              const json = exportAllData();
              const blob = new Blob([json], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `nomu-oneq-backup-${new Date().toISOString().split('T')[0]}.json`;
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
            ✓ 데이터를 성공적으로 가져왔습니다!
          </p>
        )}
        {importStatus === 'error' && (
          <p className="text-red-600 text-sm mt-3 font-medium">
            ✗ 파일 형식이 올바르지 않습니다.
          </p>
        )}
      </div>
    </div>
  );
}
