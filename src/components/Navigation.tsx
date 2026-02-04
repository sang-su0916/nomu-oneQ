'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const menuItems = [
  { href: '/', label: '홈', icon: '🏠' },
  { href: '/employees', label: '직원관리', icon: '👥' },
  { 
    href: '/contract', 
    label: '계약서',
    icon: '📋',
    submenu: [
      { href: '/contract/fulltime', label: '정규직' },
      { href: '/contract/parttime', label: '파트타임' },
      { href: '/contract/freelancer', label: '프리랜서' },
    ]
  },
  { href: '/payslip', label: '급여명세서', icon: '💵' },
  { href: '/wage-ledger', label: '임금대장', icon: '📊' },
  { href: '/work-rules', label: '취업규칙', icon: '📖' },
  { href: '/settings', label: '설정', icon: '⚙️' },
];

export default function Navigation() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [contractMenuOpen, setContractMenuOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <nav className="nav-container no-print">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="relative w-7 h-7">
              <Image 
                src="/logo.png" 
                alt="노무뚝딱" 
                fill
                className="object-contain"
                priority
              />
            </div>
            <span className="font-semibold text-[var(--text)]">노무뚝딱</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-1">
            {menuItems.map((item) => (
              <div key={item.href} className="relative">
                {item.submenu ? (
                  <div 
                    onMouseEnter={() => setContractMenuOpen(true)}
                    onMouseLeave={() => setContractMenuOpen(false)}
                  >
                    <button
                      className={`nav-link ${
                        isActive('/contract') ? 'nav-link-active' : ''
                      }`}
                    >
                      <span>{item.icon}</span>
                      <span>{item.label}</span>
                      <svg className="w-3 h-3 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {contractMenuOpen && (
                      <div className="absolute top-full left-0 pt-1 z-50">
                        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg py-1 min-w-[140px] shadow-lg animate-fade-in">
                          {item.submenu.map((sub) => (
                            <Link
                              key={sub.href}
                              href={sub.href}
                              className={`block px-4 py-2 text-sm transition-colors ${
                                pathname === sub.href 
                                  ? 'text-[var(--primary)] bg-[rgba(30,58,95,0.05)] font-medium' 
                                  : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg)]'
                              }`}
                            >
                              {sub.label}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    href={item.href}
                    className={`nav-link ${
                      isActive(item.href) ? 'nav-link-active' : ''
                    }`}
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                )}
              </div>
            ))}
          </div>

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
            <div className="space-y-1">
              {menuItems.map((item) => (
                <div key={item.href}>
                  {item.submenu ? (
                    <div className="mb-2">
                      <div className="px-3 py-2 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">
                        {item.icon} {item.label}
                      </div>
                      <div className="ml-4 space-y-1">
                        {item.submenu.map((sub) => (
                          <Link
                            key={sub.href}
                            href={sub.href}
                            className={`block px-3 py-2 text-sm rounded-md ${
                              pathname === sub.href 
                                ? 'text-[var(--primary)] bg-[rgba(30,58,95,0.08)] font-medium' 
                                : 'text-[var(--text-muted)] hover:bg-[var(--bg)]'
                            }`}
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            {sub.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <Link
                      href={item.href}
                      className={`flex items-center gap-2 px-3 py-2.5 text-sm rounded-md ${
                        isActive(item.href) 
                          ? 'text-[var(--primary)] bg-[rgba(30,58,95,0.08)] font-medium' 
                          : 'text-[var(--text-muted)] hover:bg-[var(--bg)]'
                      }`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <span>{item.icon}</span>
                      <span>{item.label}</span>
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
