'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import BottomSheet from './BottomSheet';

const tabs = [
  { href: '/dashboard', label: '홈', icon: '🏠' },
  { href: '/documents', label: '서류', icon: '📄', hasSheet: true },
  { href: '/archive', label: '보관함', icon: '🗄️' },
  { href: '/notifications', label: '알림', icon: '🔔' },
  { href: '/settings', label: '설정', icon: '⚙️' },
];

const documentGroups = [
  {
    title: '근로계약서',
    items: [
      { href: '/contract/fulltime', label: '정규직 계약서', icon: '📋' },
      { href: '/contract/parttime', label: '파트타임 계약서', icon: '📋' },
      { href: '/contract/freelancer', label: '프리랜서 계약서', icon: '📋' },
    ],
  },
  {
    title: '증명서',
    items: [
      { href: '/documents/certificate', label: '재직증명서', icon: '📜' },
      { href: '/documents/career-certificate', label: '경력증명서', icon: '📜' },
    ],
  },
  {
    title: '동의/서약',
    items: [
      { href: '/documents/privacy-consent', label: '개인정보동의서', icon: '🔒' },
      { href: '/documents/nda', label: '비밀유지서약서', icon: '🤫' },
      { href: '/documents/pledge', label: '서약서', icon: '✍️' },
    ],
  },
  {
    title: '근태',
    items: [
      { href: '/documents/attendance', label: '출퇴근기록부', icon: '🕐' },
      { href: '/documents/overtime', label: '시간외근로합의서', icon: '⏰' },
      { href: '/documents/annual-leave', label: '연차관리대장', icon: '🏖️' },
      { href: '/documents/annual-leave-notice', label: '연차촉진통보서', icon: '📬' },
    ],
  },
  {
    title: '인사',
    items: [
      { href: '/documents/resignation', label: '사직서', icon: '📤' },
      { href: '/documents/retirement-pay', label: '퇴직금정산서', icon: '💰' },
      { href: '/documents/personnel-card', label: '인사카드', icon: '👤' },
      { href: '/documents/probation-eval', label: '수습평가서', icon: '📝' },
      { href: '/documents/training-record', label: '교육훈련확인서', icon: '🎓' },
    ],
  },
  {
    title: '징계',
    items: [
      { href: '/documents/warning-letter', label: '경고장', icon: '⚠️' },
      { href: '/documents/disciplinary-notice', label: '징계통보서', icon: '🔴' },
      { href: '/documents/termination-notice', label: '해고통보서', icon: '❌' },
    ],
  },
  {
    title: '업무/기타',
    items: [
      { href: '/documents/leave-application', label: '휴직신청서', icon: '🏖️' },
      { href: '/documents/reinstatement', label: '복직신청서', icon: '🔄' },
      { href: '/documents/work-hours-change', label: '근무시간변경합의서', icon: '🕐' },
      { href: '/documents/remote-work', label: '재택근무신청서', icon: '🏠' },
      { href: '/documents/business-trip', label: '출장신청서', icon: '✈️' },
      { href: '/documents/side-job-permit', label: '겸업허가신청서', icon: '📄' },
      { href: '/documents/handover', label: '업무인수인계서', icon: '🤝' },
    ],
  },
  {
    title: '급여/규칙',
    items: [
      { href: '/payslip', label: '급여명세서', icon: '💵' },
      { href: '/wage-ledger', label: '임금대장', icon: '📊' },
      { href: '/work-rules', label: '취업규칙', icon: '📖' },
    ],
  },
];

export default function MobileTabBar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [showDocSheet, setShowDocSheet] = useState(false);

  // 로그인/회원가입/온보딩에서는 숨김
  if (['/login', '/signup', '/onboarding', '/'].includes(pathname)) return null;
  if (!user) return null;

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    if (href === '/documents') return pathname.startsWith('/documents') || pathname.startsWith('/contract');
    return pathname.startsWith(href);
  };

  return (
    <>
      <nav className="mobile-tab-bar no-print">
        {tabs.map((tab) => (
          <button
            key={tab.href}
            onClick={() => {
              if (tab.hasSheet) {
                setShowDocSheet(true);
              } else {
                window.location.href = tab.href;
              }
            }}
            className={`mobile-tab-item ${isActive(tab.href) ? 'mobile-tab-active' : ''}`}
          >
            <span className="text-lg">{tab.icon}</span>
            <span className="text-[10px] mt-0.5">{tab.label}</span>
          </button>
        ))}
      </nav>

      <BottomSheet isOpen={showDocSheet} onClose={() => setShowDocSheet(false)} title="서류 선택">
        <div className="space-y-5">
          {documentGroups.map((group) => (
            <div key={group.title}>
              <h3 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-2 px-1">
                {group.title}
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {group.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setShowDocSheet(false)}
                    className={`flex items-center gap-2.5 px-3 py-3 rounded-xl border transition-colors touch-target ${
                      pathname === item.href
                        ? 'border-[var(--primary)] bg-[rgba(30,58,95,0.05)] text-[var(--primary)] font-medium'
                        : 'border-[var(--border)] bg-[var(--bg-card)] text-[var(--text)] hover:border-[var(--primary)]'
                    }`}
                  >
                    <span>{item.icon}</span>
                    <span className="text-sm truncate">{item.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </BottomSheet>
    </>
  );
}
