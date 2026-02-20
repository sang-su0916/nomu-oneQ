'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const { user, company, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (user && company) router.push('/dashboard');
    else if (user && !company) router.push('/onboarding');
  }, [user, company, loading, router]);

  if (loading) return null;
  if (user) return null; // 리다이렉트 중

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[var(--bg)] to-blue-50">
        <div className="max-w-6xl mx-auto px-4 py-20 md:py-32 text-center">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-amber-100 to-orange-100 text-orange-700 text-sm font-bold mb-6 animate-pulse shadow-md">
            🎉 2월 베타 오픈 — 전 기능 무료 체험! (~2/28)
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold text-[var(--text)] leading-tight mb-6">
            사업장 노무관리,<br />
            <span className="text-[var(--primary)]">원큐</span>로 해결
          </h1>
          <p className="text-lg md:text-xl text-[var(--text-muted)] max-w-2xl mx-auto mb-10">
            근로계약서, 급여명세서, 연차관리까지<br />
            소규모 사업장을 위한 스마트 노무관리 솔루션
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/signup"
              className="px-8 py-4 bg-[var(--primary)] text-white rounded-xl text-lg font-bold hover:opacity-90 transition-opacity shadow-lg"
            >
              무료로 시작하기
            </Link>
            <Link
              href="/about"
              className="px-8 py-4 bg-[var(--bg-card)] text-[var(--text)] rounded-xl text-lg font-medium border border-[var(--border)] hover:border-[var(--primary)] transition-colors"
            >
              자세히 보기
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-[var(--bg-card)]">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-[var(--text)] mb-4">왜 노무원큐인가요?</h2>
          <p className="text-center text-[var(--text-muted)] mb-12">복잡한 노무관리, 더 이상 엑셀로 하지 마세요</p>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon="⚡"
              title="1분 만에 서류 완성"
              desc="직원 정보 한 번 입력하면 근로계약서부터 퇴직금정산까지 자동 생성"
            />
            <FeatureCard
              icon="🔒"
              title="사업장별 안전한 관리"
              desc="로그인 기반 사업장 격리. 우리 회사 데이터는 우리만 접근"
            />
            <FeatureCard
              icon="📱"
              title="모바일에서도 OK"
              desc="PC, 태블릿, 스마트폰 어디서든 노무서류를 작성하고 관리"
            />
            <FeatureCard
              icon="💰"
              title="급여 자동 계산"
              desc="2026년 4대보험요율, 최저임금 자동 반영. 비과세 최적화까지"
            />
            <FeatureCard
              icon="📋"
              title="30종+ 노무서류"
              desc="근로계약서, 급여명세서, 취업규칙, 징계서류 등 필요한 서류 총집합"
            />
            <FeatureCard
              icon="👨‍💼"
              title="전문가 상담 연결"
              desc="어려운 노무 문제는 엘비즈파트너스 전문가에게 바로 상담"
            />
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-20 bg-[var(--bg)]">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-[var(--text)] mb-4">합리적인 요금제</h2>
          <p className="text-center text-[var(--text-muted)] mb-12">사업장 규모에 맞게 선택하세요</p>
          <div className="grid md:grid-cols-4 gap-6">
            <PriceCard plan="무료" price="0" unit="" features={['직원 3명', '기본 서류 5종', 'PDF 다운로드']} />
            <PriceCard plan="스타터" price="19,900" unit="/월" features={['직원 10명', '전체 서류 30종+', 'PDF 무제한']} highlight />
            <PriceCard plan="비즈니스" price="39,900" unit="/월" features={['직원 50명', '전자서명', '서류 보관함', '만료 알림']} />
            <PriceCard plan="프로" price="99,000" unit="/월" features={['직원 무제한', '다지점 관리', '전문가 상담', '우선 지원']} />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-[var(--primary)] text-white text-center">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl font-bold mb-4">지금 바로 시작하세요</h2>
          <p className="text-lg opacity-80 mb-8">가입 후 1분이면 첫 번째 서류를 만들 수 있습니다</p>
          <Link
            href="/signup"
            className="inline-block px-8 py-4 bg-white text-[var(--primary)] rounded-xl text-lg font-bold hover:opacity-90 transition-opacity"
          >
            무료 회원가입 →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-[var(--bg)] border-t border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm text-[var(--text-muted)]">
          <p className="mb-2">
            <strong>노무원큐</strong> by <a href="https://lbiz-partners.com" className="text-[var(--primary)] hover:underline" target="_blank">엘비즈파트너스</a>
          </p>
          <p>본 서비스의 문서 양식은 참고용이며, 법적 효력은 관할 기관 및 전문가 확인이 필요합니다.</p>
          <p className="mt-1">© 2026 엘비즈파트너스. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="p-6 bg-[var(--bg)] rounded-2xl border border-[var(--border)]">
      <div className="text-3xl mb-4">{icon}</div>
      <h3 className="text-lg font-bold text-[var(--text)] mb-2">{title}</h3>
      <p className="text-[var(--text-muted)] text-sm leading-relaxed">{desc}</p>
    </div>
  );
}

function PriceCard({ plan, price, unit, features, highlight }: {
  plan: string; price: string; unit: string; features: string[]; highlight?: boolean;
}) {
  return (
    <div className={`p-6 rounded-2xl border-2 ${highlight ? 'border-[var(--primary)] shadow-lg' : 'border-[var(--border)]'} bg-[var(--bg-card)] relative`}>
      {highlight && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-[var(--primary)] text-white text-xs font-bold rounded-full">
          인기
        </div>
      )}
      <h3 className="text-lg font-bold text-[var(--text)] mb-2">{plan}</h3>
      <div className="mb-4">
        <span className="text-3xl font-extrabold text-[var(--text)]">{price}</span>
        <span className="text-sm text-[var(--text-muted)]">원{unit}</span>
      </div>
      <ul className="space-y-2">
        {features.map((f, i) => (
          <li key={i} className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
            <span className="text-green-500">✓</span> {f}
          </li>
        ))}
      </ul>
    </div>
  );
}
