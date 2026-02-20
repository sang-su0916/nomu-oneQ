'use client';

import Link from 'next/link';
import { usePlanGate } from '@/hooks/usePlanGate';

export default function PlanBanner() {
  const { plan, planStatus, planLabel, daysRemaining, isExpired, isExpiringSoon } = usePlanGate();

  // 🎉 베타 기간 배너
  const BETA_END = new Date('2026-03-01T00:00:00+09:00');
  const isBeta = new Date() < BETA_END;
  
  if (isBeta) {
    const betaDays = Math.ceil((BETA_END.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return (
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎉</span>
            <div>
              <p className="font-bold text-blue-800 text-sm">
                베타 기간 — 전 기능 무료 체험 중!
              </p>
              <p className="text-blue-600 text-xs mt-0.5">
                2월 28일까지 모든 기능을 무료로 사용할 수 있습니다. (D-{betaDays})
              </p>
            </div>
          </div>
          <div className="shrink-0 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium">
            PRO 체험 중
          </div>
        </div>
      </div>
    );
  }

  // 무료 플랜이거나 정상 유료 플랜이면 배너 숨김
  if (plan === 'free' || planStatus === 'active') return null;

  if (isExpired) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="font-bold text-red-800 text-sm">
                {planLabel} 플랜이 만료되었습니다
              </p>
              <p className="text-red-600 text-xs mt-0.5">
                일부 기능이 제한됩니다. 인증코드를 입력하여 플랜을 갱신해주세요.
              </p>
            </div>
          </div>
          <Link
            href="/pricing#license-code"
            className="shrink-0 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
          >
            갱신하기
          </Link>
        </div>
      </div>
    );
  }

  if (isExpiringSoon) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⏳</span>
            <div>
              <p className="font-bold text-yellow-800 text-sm">
                {planLabel} 플랜 만료 {daysRemaining}일 전
              </p>
              <p className="text-yellow-700 text-xs mt-0.5">
                만료 전에 인증코드를 입력하여 플랜을 갱신해주세요.
              </p>
            </div>
          </div>
          <Link
            href="/pricing#license-code"
            className="shrink-0 px-4 py-2 bg-yellow-600 text-white rounded-lg text-sm font-medium hover:bg-yellow-700 transition-colors"
          >
            갱신하기
          </Link>
        </div>
      </div>
    );
  }

  return null;
}
