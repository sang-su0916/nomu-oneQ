'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

interface LicenseCode {
  id: string;
  code: string;
  plan: string;
  duration_days: number;
  used_by: string | null;
  used_at: string | null;
  created_at: string;
  expires_at: string | null;
}

const ADMIN_PASSWORD = 'nomuoneq2026';

const PLAN_OPTIONS = [
  { value: 'starter', label: '스타터' },
  { value: 'business', label: '비즈니스' },
  { value: 'pro', label: '프로' },
];

const DURATION_OPTIONS = [
  { value: 30, label: '30일 (1개월)' },
  { value: 90, label: '90일 (3개월)' },
  { value: 365, label: '365일 (1년)' },
];

function generateRandomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 혼동 문자 제외 (0/O, 1/I)
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export default function AdminCodesPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState(false);

  const [codes, setCodes] = useState<LicenseCode[]>([]);
  const [loadingCodes, setLoadingCodes] = useState(false);
  const [generating, setGenerating] = useState(false);

  const [selectedPlan, setSelectedPlan] = useState('starter');
  const [selectedDuration, setSelectedDuration] = useState(30);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);

  const [filter, setFilter] = useState<'all' | 'unused' | 'used'>('all');

  const supabase = createClient();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setAuthenticated(true);
      setPasswordError(false);
    } else {
      setPasswordError(true);
    }
  };

  const loadCodes = useCallback(async () => {
    setLoadingCodes(true);
    const { data, error } = await supabase
      .from('license_codes')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setCodes(data);
    }
    setLoadingCodes(false);
  }, [supabase]);

  useEffect(() => {
    if (authenticated) loadCodes();
  }, [authenticated, loadCodes]);

  const handleGenerate = async () => {
    setGenerating(true);
    setGeneratedCode(null);

    const code = generateRandomCode();

    const { error } = await supabase
      .from('license_codes')
      .insert({
        code,
        plan: selectedPlan,
        duration_days: selectedDuration,
      });

    if (error) {
      alert('코드 생성 실패: ' + error.message);
    } else {
      setGeneratedCode(code);
      await loadCodes();
    }

    setGenerating(false);
  };

  const filteredCodes = codes.filter(c => {
    if (filter === 'unused') return !c.used_by;
    if (filter === 'used') return !!c.used_by;
    return true;
  });

  // 비밀번호 입력 화면
  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-8 max-w-sm w-full">
          <div className="text-center mb-6">
            <div className="text-3xl mb-3">🔐</div>
            <h1 className="text-xl font-bold text-[var(--text)]">관리자 인증</h1>
            <p className="text-sm text-[var(--text-muted)] mt-1">인증코드 관리 페이지입니다.</p>
          </div>

          <form onSubmit={handleLogin}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="관리자 비밀번호"
              className="w-full px-4 py-3 border border-[var(--border)] rounded-lg bg-[var(--bg-card)] text-[var(--text)] focus:border-[var(--primary)] focus:outline-none mb-3"
            />
            {passwordError && (
              <p className="text-red-500 text-xs mb-3">비밀번호가 올바르지 않습니다.</p>
            )}
            <button
              type="submit"
              className="w-full py-3 bg-[var(--primary)] text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              확인
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-[var(--text)] mb-2">🔑 인증코드 관리</h1>
      <p className="text-[var(--text-muted)] text-sm mb-8">인증코드를 생성하고 사용 현황을 확인합니다.</p>

      {/* 코드 생성 섹션 */}
      <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-6 mb-8">
        <h2 className="text-lg font-bold text-[var(--text)] mb-4">새 인증코드 생성</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">플랜</label>
            <select
              value={selectedPlan}
              onChange={(e) => setSelectedPlan(e.target.value)}
              className="w-full px-4 py-3 border border-[var(--border)] rounded-lg bg-[var(--bg-card)] text-[var(--text)] focus:border-[var(--primary)] focus:outline-none"
            >
              {PLAN_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-muted)] mb-1">유효기간</label>
            <select
              value={selectedDuration}
              onChange={(e) => setSelectedDuration(Number(e.target.value))}
              className="w-full px-4 py-3 border border-[var(--border)] rounded-lg bg-[var(--bg-card)] text-[var(--text)] focus:border-[var(--primary)] focus:outline-none"
            >
              {DURATION_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="w-full py-3 bg-[var(--primary)] text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {generating ? '생성 중...' : '🎲 코드 생성'}
            </button>
          </div>
        </div>

        {generatedCode && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
            <p className="text-sm text-green-700 mb-2">✅ 코드가 생성되었습니다!</p>
            <div className="text-3xl font-mono font-bold tracking-[0.3em] text-green-800">
              {generatedCode}
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(generatedCode);
                alert('복사되었습니다!');
              }}
              className="mt-2 text-sm text-green-600 hover:text-green-800 underline"
            >
              📋 복사하기
            </button>
          </div>
        )}
      </div>

      {/* 코드 목록 */}
      <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-[var(--text)]">생성된 코드 목록</h2>

          <div className="flex gap-2">
            {(['all', 'unused', 'used'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  filter === f
                    ? 'bg-[var(--primary)] text-white'
                    : 'bg-gray-100 text-[var(--text-muted)] hover:bg-gray-200'
                }`}
              >
                {f === 'all' ? '전체' : f === 'unused' ? '미사용' : '사용됨'}
              </button>
            ))}
          </div>
        </div>

        {loadingCodes ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin w-6 h-6 border-2 border-[var(--primary)] border-t-transparent rounded-full" />
          </div>
        ) : filteredCodes.length === 0 ? (
          <div className="text-center py-8 text-[var(--text-muted)]">
            <div className="text-3xl mb-2">📭</div>
            <p>생성된 코드가 없습니다.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="text-left px-3 py-2 text-[var(--text-muted)] font-medium">코드</th>
                  <th className="text-left px-3 py-2 text-[var(--text-muted)] font-medium">플랜</th>
                  <th className="text-left px-3 py-2 text-[var(--text-muted)] font-medium">기간</th>
                  <th className="text-left px-3 py-2 text-[var(--text-muted)] font-medium">상태</th>
                  <th className="text-left px-3 py-2 text-[var(--text-muted)] font-medium">생성일</th>
                  <th className="text-left px-3 py-2 text-[var(--text-muted)] font-medium">사용일</th>
                </tr>
              </thead>
              <tbody>
                {filteredCodes.map(c => (
                  <tr key={c.id} className="border-b border-[var(--border)] last:border-0">
                    <td className="px-3 py-3 font-mono font-bold tracking-wider text-[var(--text)]">
                      {c.code}
                    </td>
                    <td className="px-3 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        c.plan === 'pro' ? 'bg-purple-100 text-purple-800' :
                        c.plan === 'business' ? 'bg-blue-100 text-blue-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {c.plan === 'starter' ? '스타터' : c.plan === 'business' ? '비즈니스' : '프로'}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-[var(--text-muted)]">{c.duration_days}일</td>
                    <td className="px-3 py-3">
                      {c.used_by ? (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                          사용됨
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          미사용
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-[var(--text-muted)]">
                      {new Date(c.created_at).toLocaleDateString('ko-KR')}
                    </td>
                    <td className="px-3 py-3 text-[var(--text-muted)]">
                      {c.used_at ? new Date(c.used_at).toLocaleDateString('ko-KR') : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-4 text-xs text-[var(--text-muted)] text-right">
          총 {codes.length}개 · 미사용 {codes.filter(c => !c.used_by).length}개 · 사용 {codes.filter(c => c.used_by).length}개
        </div>
      </div>
    </div>
  );
}
