'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import LicenseCodeInput from '@/components/LicenseCodeInput';

const plans = [
  {
    id: 'free',
    name: '무료',
    price: '0',
    period: '',
    description: '노무관리 첫걸음',
    features: [
      '직원 3명까지',
      '기본 서류 5종',
      'PDF 다운로드',
      '2026년 요율 자동 적용',
    ],
    limitations: [
      '서류 보관함 미지원',
      '전자서명 미지원',
    ],
    cta: '현재 플랜',
    ctaStyle: 'outline',
  },
  {
    id: 'starter',
    name: '스타터',
    price: '19,900',
    period: '/월',
    description: '소규모 사업장에 딱',
    features: [
      '직원 10명까지',
      '전체 서류 30종+',
      'PDF 무제한 다운로드',
      '서류 보관함 (6개월)',
      '엑셀 내보내기',
    ],
    limitations: [
      '전자서명 미지원',
    ],
    cta: '스타터 시작',
    ctaStyle: 'primary',
    highlight: true,
  },
  {
    id: 'business',
    name: '비즈니스',
    price: '39,900',
    period: '/월',
    description: '성장하는 사업장',
    features: [
      '직원 50명까지',
      '전체 서류 30종+',
      '전자서명',
      '서류 보관함 (무제한)',
      '계약만료 · 연차 알림',
      '엑셀 내보내기',
      '담당자 추가 (3명)',
    ],
    limitations: [],
    cta: '비즈니스 시작',
    ctaStyle: 'primary',
  },
  {
    id: 'pro',
    name: '프로',
    price: '99,000',
    period: '/월',
    description: '다지점 · 전문 관리',
    features: [
      '직원 무제한',
      '전체 서류 30종+',
      '전자서명 · 서류 보관',
      '다지점 관리',
      '전문가 상담 연결',
      '우선 고객지원',
      '담당자 무제한',
      'API 연동 (준비중)',
    ],
    limitations: [],
    cta: '프로 시작',
    ctaStyle: 'primary',
  },
];

export default function PricingPage() {
  const { company } = useAuth();

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-[var(--text)] mb-3">요금제</h1>
        <p className="text-[var(--text-muted)]">사업장 규모에 맞는 플랜을 선택하세요</p>
      </div>

      <div className="pricing-scroll md:grid md:grid-cols-4 gap-6">
        {plans.map(plan => {
          const isCurrent = company?.plan === plan.id;

          return (
            <div
              key={plan.id}
              className={`relative rounded-2xl border-2 p-6 ${
                plan.highlight ? 'border-[var(--primary)] shadow-lg' : 'border-[var(--border)]'
              } bg-[var(--bg-card)]`}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-[var(--primary)] text-white text-xs font-bold rounded-full">
                  가장 인기
                </div>
              )}

              <h3 className="text-lg font-bold text-[var(--text)]">{plan.name}</h3>
              <p className="text-sm text-[var(--text-muted)] mt-1">{plan.description}</p>

              <div className="mt-4 mb-6">
                <span className="text-3xl font-extrabold text-[var(--text)]">{plan.price}</span>
                <span className="text-sm text-[var(--text-muted)]">원{plan.period}</span>
              </div>

              <ul className="space-y-2 mb-6">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-[var(--text)]">
                    <span className="text-green-500 mt-0.5">✓</span> {f}
                  </li>
                ))}
                {plan.limitations.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-[var(--text-muted)]">
                    <span className="text-gray-300 mt-0.5">✗</span> {f}
                  </li>
                ))}
              </ul>

              {isCurrent ? (
                <div className="w-full py-3 text-center text-sm font-medium text-[var(--text-muted)] border border-[var(--border)] rounded-lg">
                  현재 플랜
                </div>
              ) : (
                <Link
                  href={plan.id === 'free' ? '/signup' : `/contact?plan=${plan.id}`}
                  className={`block w-full py-3 text-center text-sm font-medium rounded-lg transition-opacity ${
                    plan.ctaStyle === 'primary'
                      ? 'bg-[var(--primary)] text-white hover:opacity-90'
                      : 'border border-[var(--border)] text-[var(--text)] hover:border-[var(--primary)]'
                  }`}
                >
                  {plan.cta}
                </Link>
              )}
            </div>
          );
        })}
      </div>

      {/* 인증코드 입력 섹션 */}
      <div className="mt-12 max-w-2xl mx-auto">
        <LicenseCodeInput />
      </div>

      <div className="mt-12 text-center">
        <p className="text-[var(--text-muted)] text-sm">
          💬 요금제 관련 문의: <a href="tel:010-3709-5785" className="text-[var(--primary)]">010-3709-5785</a>
          {' · '}
          <a href="mailto:sangsu0916@naver.com" className="text-[var(--primary)]">sangsu0916@naver.com</a>
        </p>
        <p className="text-[var(--text-muted)] text-xs mt-2">
          * 부가세 별도 · 연간 결제 시 20% 할인 · 언제든 해지 가능
        </p>
      </div>
    </div>
  );
}
