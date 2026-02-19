'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const supabase = createClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }
    if (password.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다.');
      return;
    }

    setLoading(true);

    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] px-4">
        <div className="w-full max-w-md text-center">
          <div className="bg-[var(--bg-card)] rounded-2xl p-8 shadow-sm border border-[var(--border)]">
            <div className="text-5xl mb-4">✉️</div>
            <h2 className="text-xl font-bold text-[var(--text)] mb-2">이메일을 확인해주세요</h2>
            <p className="text-[var(--text-muted)] mb-6">
              <strong>{email}</strong>로 인증 메일을 보냈습니다.<br />
              이메일의 링크를 클릭하면 가입이 완료됩니다.
            </p>
            <Link
              href="/login"
              className="inline-block px-6 py-3 bg-[var(--primary)] text-white rounded-lg font-medium hover:opacity-90"
            >
              로그인 페이지로
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[var(--text)]">노무원큐</h1>
          <p className="text-[var(--text-muted)] mt-2">무료로 시작하세요</p>
        </div>

        <div className="bg-[var(--bg-card)] rounded-2xl p-8 shadow-sm border border-[var(--border)]">
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-1">이름</label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                placeholder="홍길동"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-1">이메일</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                placeholder="example@company.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-1">비밀번호</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                placeholder="6자 이상"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-1">비밀번호 확인</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                placeholder="비밀번호 재입력"
                required
              />
            </div>

            {error && (
              <div className="text-red-500 text-sm bg-red-50 px-4 py-2 rounded-lg">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[var(--primary)] text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? '가입 중...' : '무료 회원가입'}
            </button>
          </form>

          <p className="text-center text-sm text-[var(--text-muted)] mt-6">
            이미 계정이 있으신가요?{' '}
            <Link href="/login" className="text-[var(--primary)] font-medium hover:underline">
              로그인
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
