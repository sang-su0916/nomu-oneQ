'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function OnboardingPage() {
  const { user, refreshAuth } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const [form, setForm] = useState({
    name: '',
    ceoName: '',
    businessNumber: '',
    address: '',
    phone: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const formatBizNum = (val: string) => {
    const nums = val.replace(/[^0-9]/g, '').slice(0, 10);
    if (nums.length <= 3) return nums;
    if (nums.length <= 5) return `${nums.slice(0, 3)}-${nums.slice(3)}`;
    return `${nums.slice(0, 3)}-${nums.slice(3, 5)}-${nums.slice(5)}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError('');
    setLoading(true);

    const bizNum = form.businessNumber.replace(/[^0-9]/g, '');
    if (bizNum.length !== 10) {
      setError('사업자등록번호 10자리를 정확히 입력해주세요.');
      setLoading(false);
      return;
    }

    // 1. 사업장 생성
    const { data: company, error: companyErr } = await supabase
      .from('companies')
      .insert({
        name: form.name,
        ceo_name: form.ceoName,
        business_number: bizNum,
        address: form.address || null,
        phone: form.phone || null,
      })
      .select()
      .single();

    if (companyErr) {
      if (companyErr.code === '23505') {
        setError('이미 등록된 사업자등록번호입니다.');
      } else {
        setError(companyErr.message);
      }
      setLoading(false);
      return;
    }

    // 2. admin 멤버 등록
    await supabase
      .from('company_members')
      .insert({
        company_id: company.id,
        user_id: user.id,
        role: 'admin',
      });

    // 3. 프로필에 현재 사업장 설정
    await supabase
      .from('profiles')
      .update({ current_company_id: company.id })
      .eq('id', user.id);

    await refreshAuth();
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] px-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🏢</div>
          <h1 className="text-2xl font-bold text-[var(--text)]">사업장 등록</h1>
          <p className="text-[var(--text-muted)] mt-2">
            노무원큐를 시작하려면 사업장 정보를 등록해주세요.
          </p>
        </div>

        <div className="bg-[var(--bg-card)] rounded-2xl p-8 shadow-sm border border-[var(--border)]">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-1">
                상호명 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full px-4 py-3 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                placeholder="(주)우리회사"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-1">
                대표자명 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.ceoName}
                onChange={e => setForm(f => ({ ...f, ceoName: e.target.value }))}
                className="w-full px-4 py-3 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                placeholder="홍길동"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-1">
                사업자등록번호 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.businessNumber}
                onChange={e => setForm(f => ({ ...f, businessNumber: formatBizNum(e.target.value) }))}
                className="w-full px-4 py-3 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                placeholder="000-00-00000"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-1">주소</label>
              <input
                type="text"
                value={form.address}
                onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                className="w-full px-4 py-3 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                placeholder="서울시 강남구..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-1">전화번호</label>
              <input
                type="tel"
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                className="w-full px-4 py-3 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                placeholder="02-1234-5678"
              />
            </div>

            {error && (
              <div className="text-red-500 text-sm bg-red-50 px-4 py-2 rounded-lg">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[var(--primary)] text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 mt-2"
            >
              {loading ? '등록 중...' : '사업장 등록하고 시작하기'}
            </button>
          </form>

          <p className="text-center text-xs text-[var(--text-muted)] mt-4">
            무료 플랜: 직원 3명, 기본 서류 5종 이용 가능
          </p>
        </div>
      </div>
    </div>
  );
}
