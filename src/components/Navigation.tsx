'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const menuItems = [
  { href: '/dashboard', label: '대시보드', icon: '📊' },
  { href: '/employees', label: '직원관리', icon: '👥' },
  {
    href: '/contract',
    label: '근로계약서',
    icon: '📋',
    submenu: [
      { href: '/contract/fulltime', label: '정규직' },
      { href: '/contract/parttime', label: '파트타임' },
      { href: '/contract/freelancer', label: '프리랜서' },
    ]
  },
  {
    href: '/documents',
    label: '서류',
    icon: '📄',
    submenu: [
      // 증명서
      { href: '/documents/certificate', label: '📜 재직증명서' },
      { href: '/documents/career-certificate', label: '📜 경력증명서' },
      // 동의/서약
      { href: '/documents/privacy-consent', label: '🔒 개인정보동의서' },
      { href: '/documents/nda', label: '🤫 비밀유지서약서' },
      { href: '/documents/pledge', label: '✍️ 서약서' },
      // 근태
      { href: '/documents/attendance', label: '🕐 출퇴근기록부' },
      { href: '/documents/overtime', label: '⏰ 시간외근로합의서' },
      { href: '/documents/annual-leave', label: '🏖️ 연차관리대장' },
      { href: '/documents/annual-leave-notice', label: '📬 연차촉진통보서' },
      // 인사
      { href: '/documents/resignation', label: '📤 사직서' },
      { href: '/documents/retirement-pay', label: '💰 퇴직금정산서' },
      { href: '/documents/personnel-card', label: '👤 인사카드' },
      { href: '/documents/probation-eval', label: '📝 수습평가서' },
      { href: '/documents/training-record', label: '🎓 교육훈련확인서' },
    ]
  },
  {
    href: '/documents2',
    label: '서류+',
    icon: '📋',
    submenu: [
      // 징계
      { href: '/documents/warning-letter', label: '⚠️ 경고장' },
      { href: '/documents/disciplinary-notice', label: '🔴 징계통보서' },
      { href: '/documents/termination-notice', label: '❌ 해고통보서' },
      // 휴직/복직
      { href: '/documents/leave-application', label: '🏖️ 휴직신청서' },
      { href: '/documents/reinstatement', label: '🔄 복직신청서' },
      // 업무
      { href: '/documents/work-hours-change', label: '🕐 근무시간변경합의서' },
      { href: '/documents/remote-work', label: '🏠 재택근무신청서' },
      { href: '/documents/business-trip', label: '✈️ 출장신청서' },
      { href: '/documents/side-job-permit', label: '📄 겸업허가신청서' },
      { href: '/documents/handover', label: '🤝 업무인수인계서' },
    ]
  },
  { href: '/payslip', label: '급여명세서', icon: '💵' },
  { href: '/wage-ledger', label: '임금대장', icon: '📊' },
  { href: '/work-rules', label: '취업규칙', icon: '📖' },
  { href: '/archive', label: '보관함', icon: '🗄️' },
  { href: '/notifications', label: '알림', icon: '🔔' },
];

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, company, companies, switchCompany, signOut, loading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showCompanySelect, setShowCompanySelect] = useState(false);

  // 로그인/회원가입 페이지, 랜딩 페이지에서는 네비 숨김
  if (['/login', '/signup', '/onboarding'].includes(pathname)) return null;

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <nav className="nav-container no-print">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href={user ? '/dashboard' : '/'} className="flex items-center gap-2.5">
            <div className="relative w-7 h-7">
              <Image 
                src="/logo.png" 
                alt="노무원큐" 
                fill
                className="object-contain"
                priority
              />
            </div>
            <span className="font-semibold text-[var(--text)]">노무원큐</span>
          </Link>

          {user && company && (
            <>
              {/* 사업장 선택 (다중 사업장) */}
              {companies.length > 1 && (
                <div className="hidden md:block relative ml-4">
                  <button
                    onClick={() => setShowCompanySelect(!showCompanySelect)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[var(--bg)] rounded-lg border border-[var(--border)] hover:border-[var(--primary)] transition-colors"
                  >
                    <span className="font-medium text-[var(--text)]">{company.name}</span>
                    <svg className="w-3.5 h-3.5 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {showCompanySelect && (
                    <div className="absolute top-full left-0 mt-1 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg py-1 min-w-[200px] shadow-lg z-50">
                      {companies.map(c => (
                        <button
                          key={c.id}
                          onClick={() => { switchCompany(c.id); setShowCompanySelect(false); }}
                          className={`w-full text-left px-4 py-2 text-sm transition-colors ${c.id === company.id ? 'text-[var(--primary)] bg-[rgba(30,58,95,0.05)] font-medium' : 'text-[var(--text-muted)] hover:bg-[var(--bg)]'}`}
                        >
                          {c.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Desktop Menu */}
              <div className="hidden md:flex items-center gap-1 flex-1 justify-center">
                {menuItems.map((item) => (
                  <div key={item.href} className="relative">
                    {item.submenu ? (
                      <div
                        onMouseEnter={() => setOpenSubmenu(item.href)}
                        onMouseLeave={() => setOpenSubmenu(null)}
                      >
                        <button className={`nav-link ${isActive(item.href) ? 'nav-link-active' : ''}`}>
                          <span>{item.icon}</span>
                          <span>{item.label}</span>
                          <svg className="w-3 h-3 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        {openSubmenu === item.href && (
                          <div className="absolute top-full left-0 pt-1 z-50">
                            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg py-1 min-w-[140px] shadow-lg animate-fade-in">
                              {item.submenu.map((sub) => (
                                <Link key={sub.href} href={sub.href}
                                  className={`block px-4 py-2 text-sm transition-colors ${pathname === sub.href ? 'text-[var(--primary)] bg-[rgba(30,58,95,0.05)] font-medium' : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg)]'}`}
                                >
                                  {sub.label}
                                </Link>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <Link href={item.href} className={`nav-link ${isActive(item.href) ? 'nav-link-active' : ''}`}>
                        <span>{item.icon}</span>
                        <span>{item.label}</span>
                      </Link>
                    )}
                  </div>
                ))}
              </div>

              {/* User Menu */}
              <div className="hidden md:block relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-[var(--bg)] transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-[var(--primary)] flex items-center justify-center text-white text-xs font-bold">
                    {user.email?.[0]?.toUpperCase() || '?'}
                  </div>
                  <svg className="w-3.5 h-3.5 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {showUserMenu && (
                  <div className="absolute top-full right-0 mt-1 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg py-1 min-w-[180px] shadow-lg z-50">
                    <div className="px-4 py-2 text-xs text-[var(--text-muted)] border-b border-[var(--border)]">
                      {user.email}
                    </div>
                    <Link href="/settings" className="block px-4 py-2 text-sm text-[var(--text-muted)] hover:bg-[var(--bg)]" onClick={() => setShowUserMenu(false)}>
                      ⚙️ 설정
                    </Link>
                    <Link href="/pricing" className="block px-4 py-2 text-sm text-[var(--text-muted)] hover:bg-[var(--bg)]" onClick={() => setShowUserMenu(false)}>
                      💎 요금제
                    </Link>
                    <button onClick={handleSignOut} className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-[var(--bg)]">
                      로그아웃
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          {!user && !loading && (
            <div className="hidden md:flex items-center gap-2">
              <Link href="/login" className="px-4 py-2 text-sm text-[var(--text-muted)] hover:text-[var(--text)]">로그인</Link>
              <Link href="/signup" className="px-4 py-2 text-sm bg-[var(--primary)] text-white rounded-lg font-medium hover:opacity-90">무료 시작</Link>
            </div>
          )}

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2 rounded-md hover:bg-[var(--bg)]"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="메뉴 열기"
          >
            {mobileMenuOpen ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-[var(--border)] animate-fade-in">
            {user && company ? (
              <div className="space-y-1">
                <div className="px-3 py-2 text-xs font-medium text-[var(--text-muted)]">
                  🏢 {company.name}
                </div>
                {menuItems.map((item) => (
                  <div key={item.href}>
                    {item.submenu ? (
                      <div className="mb-2">
                        <div className="px-3 py-2 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">
                          {item.icon} {item.label}
                        </div>
                        <div className="ml-4 space-y-1">
                          {item.submenu.map((sub) => (
                            <Link key={sub.href} href={sub.href}
                              className={`block px-3 py-2 text-sm rounded-md ${pathname === sub.href ? 'text-[var(--primary)] bg-[rgba(30,58,95,0.08)] font-medium' : 'text-[var(--text-muted)] hover:bg-[var(--bg)]'}`}
                              onClick={() => setMobileMenuOpen(false)}
                            >
                              {sub.label}
                            </Link>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <Link href={item.href}
                        className={`flex items-center gap-2 px-3 py-2.5 text-sm rounded-md ${isActive(item.href) ? 'text-[var(--primary)] bg-[rgba(30,58,95,0.08)] font-medium' : 'text-[var(--text-muted)] hover:bg-[var(--bg)]'}`}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <span>{item.icon}</span><span>{item.label}</span>
                      </Link>
                    )}
                  </div>
                ))}
                <div className="border-t border-[var(--border)] mt-2 pt-2">
                  <button onClick={handleSignOut} className="w-full text-left px-3 py-2.5 text-sm text-red-500 rounded-md hover:bg-[var(--bg)]">
                    로그아웃
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2 px-3">
                <Link href="/login" className="block py-2 text-sm text-[var(--text-muted)]" onClick={() => setMobileMenuOpen(false)}>로그인</Link>
                <Link href="/signup" className="block py-2 text-sm text-[var(--primary)] font-medium" onClick={() => setMobileMenuOpen(false)}>무료 시작</Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
