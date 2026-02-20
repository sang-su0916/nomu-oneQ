'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

const quickDocs = [
  { href: '/contract/fulltime', label: '근로계약서', icon: '📋' },
  { href: '/documents/certificate', label: '재직증명서', icon: '📜' },
  { href: '/payslip', label: '급여명세서', icon: '💵' },
  { href: '/documents/attendance', label: '출퇴근기록부', icon: '🕐' },
  { href: '/documents/resignation', label: '사직서', icon: '📤' },
];

export default function FAB() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  // 로그인/회원가입/온보딩에서는 숨김
  if (['/login', '/signup', '/onboarding', '/'].includes(pathname)) return null;
  if (!user) return null;

  return (
    <div className="fixed bottom-24 right-4 z-50 md:hidden no-print">
      {/* Quick doc links */}
      {isOpen && (
        <div className="mb-3 space-y-2 animate-fade-in">
          {quickDocs.map((doc) => (
            <Link
              key={doc.href}
              href={doc.href}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 px-4 py-2.5 bg-[var(--bg-card)] rounded-full shadow-lg border border-[var(--border)] text-sm font-medium text-[var(--text)] hover:border-[var(--primary)] transition-colors touch-target whitespace-nowrap ml-auto w-fit"
            >
              <span>{doc.icon}</span>
              <span>{doc.label}</span>
            </Link>
          ))}
        </div>
      )}

      {/* FAB button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`ml-auto flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-all duration-200 ${
          isOpen
            ? 'bg-gray-600 rotate-45'
            : 'bg-[var(--primary)]'
        }`}
        aria-label="빠른 서류 작성"
      >
        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>
  );
}
