'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Employee } from '@/types';
import { loadCompanyInfo, loadEmployees, formatCurrency } from '@/lib/storage';
import { MINIMUM_WAGE } from '@/lib/constants';

const serviceCategories = [
  {
    id: 'core', label: '핵심 기능', icon: '⚡', bg: '#eff6ff',
    items: [
      { href: '/employees', title: '직원 관리' },
      { href: '/settings', title: '회사 정보 설정' },
    ],
  },
  {
    id: 'contract', label: '근로계약서', icon: '📋', bg: '#ecfdf5',
    items: [
      { href: '/contract/fulltime', title: '정규직' },
      { href: '/contract/parttime', title: '단시간(파트타임)' },
      { href: '/contract/freelancer', title: '프리랜서 용역' },
    ],
  },
  {
    id: 'salary', label: '급여 · 임금', icon: '💵', bg: '#fffbeb',
    items: [
      { href: '/payslip', title: '급여명세서' },
      { href: '/wage-ledger', title: '임금대장' },
    ],
  },
  {
    id: 'onboard', label: '입사 서류', icon: '📥', bg: '#eef2ff',
    items: [
      { href: '/documents/privacy-consent', title: '개인정보 동의서' },
      { href: '/documents/nda', title: '비밀유지 서약서' },
    ],
  },
  {
    id: 'attendance', label: '근태 관리', icon: '🕐', bg: '#fdf2f8',
    items: [
      { href: '/documents/attendance', title: '출퇴근기록부' },
      { href: '/documents/annual-leave', title: '연차관리대장' },
      { href: '/documents/overtime', title: '시간외근로 합의서' },
    ],
  },
  {
    id: 'certificate', label: '증명서', icon: '📜', bg: '#fefce8',
    items: [
      { href: '/documents/certificate', title: '재직증명서' },
      { href: '/documents/career-certificate', title: '경력증명서' },
    ],
  },
  {
    id: 'offboard', label: '퇴사 서류', icon: '📤', bg: '#fef2f2',
    items: [
      { href: '/documents/resignation', title: '사직서' },
      { href: '/documents/retirement-pay', title: '퇴직금 정산서' },
      { href: '/documents/annual-leave-notice', title: '연차촉진 통보서' },
    ],
  },
  {
    id: 'rules', label: '취업규칙', icon: '📖', bg: '#f5f3ff',
    items: [
      { href: '/work-rules', title: '취업규칙 (98조항)' },
    ],
  },
];

export default function Home() {
  const [companyName, setCompanyName] = useState('');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const company = loadCompanyInfo();
    if (company) setCompanyName(company.name);
    setEmployees(loadEmployees());
    setIsLoaded(true);
  }, []);

  const activeEmployees = employees.filter(e => e.status === 'active');
  const fulltimeCount = activeEmployees.filter(e => e.employmentType === 'fulltime').length;
  const parttimeCount = activeEmployees.filter(e => e.employmentType === 'parttime').length;
  const totalMonthlySalary = activeEmployees.reduce((sum, emp) => {
    if (emp.salary.type === 'monthly') {
      return sum + emp.salary.baseSalary + emp.salary.mealAllowance +
             emp.salary.carAllowance + emp.salary.childcareAllowance;
    }
    return sum + (emp.salary.hourlyWage || 0) * emp.workCondition.weeklyHours * 4;
  }, 0);
  const currentMonth = `${new Date().getMonth() + 1}월`;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 animate-fade-in">

      {/* First-time visitor */}
      {isLoaded && !companyName && (
        <>
          {/* Hero */}
          <section className="mb-6 rounded-2xl overflow-hidden" style={{
            background: 'linear-gradient(135deg, #0f2744 0%, #1e3a5f 50%, #234e82 100%)',
          }}>
            <div className="px-6 py-10 sm:px-10 sm:py-14 text-white text-center">
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium mb-6"
                style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)' }}>
                2026년 최신 노동법 반영
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold mb-3" style={{ letterSpacing: '-0.5px', lineHeight: 1.3 }}>
                노무서류 관리,<br />노무뚝딱으로 시작하세요
              </h1>
              <p className="text-sm sm:text-base opacity-80 mb-8 max-w-md mx-auto leading-relaxed">
                직원 한 번 등록하면 계약서부터 퇴직금까지<br className="hidden sm:block" />
                18종 노무서류가 자동으로 완성됩니다.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Link
                  href="/settings"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold shadow-lg hover:shadow-xl transition-all hover:brightness-110"
                  style={{ background: '#c9a028', color: '#0f2744' }}
                >
                  회사 정보 등록하기 →
                </Link>
                <a
                  href="/landing-page.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 text-white border border-white/25 rounded-lg text-sm font-medium hover:bg-white/20 transition-colors"
                >
                  상세 소개 보기
                </a>
              </div>
            </div>
          </section>

          {/* Quick Start Steps */}
          <section className="mb-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { step: 1, title: '회사 정보 설정', desc: '사업자번호·대표자·주소 입력', link: '/settings' },
                { step: 2, title: '직원 등록', desc: '급여 최적화로 절세 효과', link: '/employees' },
                { step: 3, title: '서류 작성 · 출력', desc: '직원 선택 → 자동 완성 → PDF' },
              ].map((s) => (
                <div key={s.step} className="flex items-start gap-3 p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border)]">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{ background: '#1e3a5f' }}>
                    {s.step}
                  </span>
                  <div>
                    <p className="font-semibold text-sm text-[var(--text)]">{s.title}</p>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">{s.desc}</p>
                    {s.link && (
                      <Link href={s.link} className="text-xs font-medium mt-1.5 inline-block text-[#2563eb] hover:underline">
                        바로가기 →
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      {/* Returning visitor dashboard */}
      {isLoaded && companyName && (
        <section className="mb-6">
          <div className="flex items-center gap-3 p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border)]">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
              style={{ background: 'rgba(30,58,95,0.08)' }}>
              🏢
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-bold text-[var(--text)] truncate">{companyName}</h1>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--text-muted)]">
                {activeEmployees.length > 0 ? (
                  <>
                    <span>직원 {activeEmployees.length}명 (정규 {fulltimeCount} / 파트 {parttimeCount})</span>
                    {totalMonthlySalary > 0 && (
                      <span>{currentMonth} 예상 급여 {formatCurrency(totalMonthlySalary)}</span>
                    )}
                  </>
                ) : (
                  <span>직원을 등록하면 서류가 자동으로 완성됩니다</span>
                )}
                <span className="text-[var(--text-light)]">📌 2026 최저시급 {formatCurrency(MINIMUM_WAGE.hourly)}</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Services Grid */}
      <section className="mb-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {serviceCategories.map((cat) => (
            <div key={cat.id} className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden hover:shadow-sm transition-shadow">
              <div className="px-4 pt-4 pb-2 flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0"
                  style={{ background: cat.bg }}>
                  {cat.icon}
                </span>
                <span className="font-semibold text-sm text-[var(--text)]">{cat.label}</span>
              </div>
              <div className="px-3 pb-3">
                {cat.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-md text-[13px] text-[var(--text-muted)] hover:text-[var(--primary)] hover:bg-[var(--bg)] transition-colors"
                  >
                    <span className="w-1 h-1 rounded-full bg-current opacity-40 flex-shrink-0" />
                    {item.title}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Employee List */}
      {isLoaded && activeEmployees.length > 0 && (
        <section className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-[var(--text-muted)] tracking-wide">직원 목록</h2>
            <Link href="/employees" className="btn btn-secondary btn-sm">전체 보기</Link>
          </div>
          <div className="table-container">
            <table className="table-modern">
              <thead>
                <tr>
                  <th>이름</th>
                  <th>고용형태</th>
                  <th>부서</th>
                  <th className="text-right">급여</th>
                </tr>
              </thead>
              <tbody>
                {activeEmployees.slice(0, 5).map(emp => (
                  <tr key={emp.id}>
                    <td className="font-medium">{emp.info.name}</td>
                    <td>
                      <span className={`badge ${emp.employmentType === 'fulltime' ? 'badge-primary' : 'badge-neutral'}`}>
                        {emp.employmentType === 'fulltime' ? '정규직' :
                         emp.employmentType === 'parttime' ? '파트타임' : '프리랜서'}
                      </span>
                    </td>
                    <td className="text-[var(--text-muted)]">{emp.department || '—'}</td>
                    <td className="text-right font-medium">
                      {emp.salary.type === 'monthly'
                        ? formatCurrency(emp.salary.baseSalary + emp.salary.mealAllowance + emp.salary.carAllowance)
                        : `${formatCurrency(emp.salary.hourlyWage || 0)}/시간`
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Legal */}
      <p className="text-[11px] text-center text-[var(--text-light)] mb-10 leading-relaxed">
        본 서비스의 문서 양식은 참고용이며, 법적 효력은 관할 기관 및 전문가 확인이 필요합니다.
      </p>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] pt-8 pb-6">
        <div className="flex flex-col items-center">
          <div className="relative w-12 h-12 mb-2">
            <Image src="/logo.png" alt="L-BIZ Partners" fill className="object-contain" />
          </div>
          <span className="text-sm font-bold" style={{ color: '#b8860b' }}>엘비즈 파트너스</span>
          <span className="text-xs text-[var(--text-light)] mt-1">© 2026 노무뚝딱 · 노무서류 관리 시스템</span>
          <a href="mailto:sangsu0916@naver.com" className="text-xs text-[var(--text-muted)] hover:text-[var(--text)] mt-1">
            sangsu0916@naver.com
          </a>
        </div>
      </footer>
    </div>
  );
}
