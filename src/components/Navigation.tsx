'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const menuItems = [
  { href: '/', label: '홈', icon: '🏠' },
  { href: '/employees', label: '직원관리', icon: '👥' },
  { 
    href: '/contract', 
    label: '근로계약서', 
    icon: '📝',
    submenu: [
      { href: '/contract/fulltime', label: '정규직' },
      { href: '/contract/parttime', label: '파트타임' },
      { href: '/contract/freelancer', label: '프리랜서' },
    ]
  },
  { href: '/payslip', label: '급여명세서', icon: '💰' },
  { href: '/wage-ledger', label: '임금대장', icon: '📊' },
  { href: '/work-rules', label: '취업규칙', icon: '📋' },
  { href: '/settings', label: '설정', icon: '⚙️' },
];

export default function Navigation() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [contractMenuOpen, setContractMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white shadow-sm z-50 no-print">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* 로고 */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">👷</span>
            <span className="text-xl font-bold text-blue-600">노무뚝딱</span>
          </Link>

          {/* 데스크톱 메뉴 */}
          <div className="hidden md:flex items-center gap-1">
            {menuItems.map((item) => (
              <div key={item.href} className="relative group">
                {item.submenu ? (
                  <div 
                    className="relative"
                    onMouseEnter={() => setContractMenuOpen(true)}
                    onMouseLeave={() => setContractMenuOpen(false)}
                  >
                    <button
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors
                        ${pathname.startsWith('/contract') 
                          ? 'bg-blue-50 text-blue-600' 
                          : 'text-gray-600 hover:bg-gray-50'
                        }`}
                    >
                      <span>{item.icon}</span>
                      <span>{item.label}</span>
                      <span className="text-xs">▼</span>
                    </button>
                    {contractMenuOpen && (
                      <div className="absolute top-full left-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-100 py-1 min-w-[140px]">
                        {item.submenu.map((sub) => (
                          <Link
                            key={sub.href}
                            href={sub.href}
                            className={`block px-4 py-2 text-sm transition-colors
                              ${pathname === sub.href 
                                ? 'bg-blue-50 text-blue-600' 
                                : 'text-gray-600 hover:bg-gray-50'
                              }`}
                          >
                            {sub.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    href={item.href}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors
                      ${pathname === item.href 
                        ? 'bg-blue-50 text-blue-600' 
                        : 'text-gray-600 hover:bg-gray-50'
                      }`}
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                )}
              </div>
            ))}
          </div>

          {/* 모바일 메뉴 버튼 */}
          <button 
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span className="text-2xl">{mobileMenuOpen ? '✕' : '☰'}</span>
          </button>
        </div>

        {/* 모바일 메뉴 */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-100">
            {menuItems.map((item) => (
              <div key={item.href}>
                {item.submenu ? (
                  <>
                    <div className="flex items-center gap-2 px-4 py-3 text-gray-700 font-medium">
                      <span>{item.icon}</span>
                      <span>{item.label}</span>
                    </div>
                    <div className="pl-10">
                      {item.submenu.map((sub) => (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          className={`block py-2 text-sm ${
                            pathname === sub.href ? 'text-blue-600' : 'text-gray-600'
                          }`}
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          {sub.label}
                        </Link>
                      ))}
                    </div>
                  </>
                ) : (
                  <Link
                    href={item.href}
                    className={`flex items-center gap-2 px-4 py-3 ${
                      pathname === item.href ? 'text-blue-600 bg-blue-50' : 'text-gray-700'
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
        )}
      </div>
    </nav>
  );
}
