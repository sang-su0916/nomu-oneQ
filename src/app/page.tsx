'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Employee } from '@/types';
import { loadCompanyInfo, loadEmployees, formatCurrency } from '@/lib/storage';
import { MINIMUM_WAGE } from '@/lib/constants';

const features = [
  {
    href: '/employees',
    icon: '👥',
    title: '직원 관리',
    description: '직원 등록 및 급여 최적화',
    badge: '핵심',
  },
  {
    href: '/contract/fulltime',
    icon: '📋',
    title: '정규직 근로계약서',
    description: '고용노동부 표준 양식',
  },
  {
    href: '/contract/parttime',
    icon: '⏰',
    title: '단시간 근로계약서',
    description: '파트타임/아르바이트용',
  },
  {
    href: '/contract/freelancer',
    icon: '💼',
    title: '프리랜서 용역계약서',
    description: '업무위탁 계약서',
  },
  {
    href: '/payslip',
    icon: '💵',
    title: '급여명세서',
    description: '월별 급여 내역 발급',
  },
  {
    href: '/wage-ledger',
    icon: '📊',
    title: '임금대장',
    description: '급여 지급 기록 관리',
  },
  {
    href: '/work-rules',
    icon: '📖',
    title: '취업규칙',
    description: '10인 이상 사업장 필수',
  },
  {
    href: '/settings',
    icon: '⚙️',
    title: '회사 정보 설정',
    description: '사업자 정보 관리',
  },
];

export default function Home() {
  const [companyName, setCompanyName] = useState('');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const company = loadCompanyInfo();
    if (company) {
      setCompanyName(company.name);
    }
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

  const today = new Date();
  const currentMonth = `${today.getMonth() + 1}월`;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 animate-fade-in">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="relative w-8 h-8">
            <Image 
              src="/logo.png" 
              alt="노무뚝딱" 
              fill
              className="object-contain"
            />
          </div>
          <div>
            <h1 className="heading-lg">노무뚝딱</h1>
            <p className="text-sm text-[var(--text-muted)]">노무서류 관리 시스템</p>
          </div>
        </div>
        {companyName && (
          <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 bg-[var(--bg-card)] border border-[var(--border)] rounded-md">
            <span className="text-sm font-medium">{companyName}</span>
          </div>
        )}
      </header>

      {/* Alert: Company Info Required */}
      {isLoaded && !companyName && (
        <div className="alert alert-warning mb-6">
          <span className="text-lg">⚠️</span>
          <div>
            <p className="font-medium text-sm">회사 정보가 등록되지 않았습니다</p>
            <p className="text-sm opacity-80 mt-0.5">
              <Link href="/settings" className="underline hover:no-underline">설정</Link>에서 
              회사 정보를 먼저 입력해 주세요.
            </p>
          </div>
        </div>
      )}

      {/* Stats Dashboard */}
      {isLoaded && (
        <section className="mb-8">
          <h2 className="heading-sm mb-4 flex items-center gap-2">
            <span className="icon-box icon-box-primary">📊</span>
            관리 현황
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="stat-card">
              <div className="flex items-center justify-between mb-2">
                <span className="stat-icon bg-blue-50 text-blue-600">👥</span>
              </div>
              <p className="stat-value">{activeEmployees.length}</p>
              <p className="stat-label">등록 직원</p>
            </div>
            
            <div className="stat-card">
              <div className="flex items-center justify-between mb-2">
                <span className="stat-icon bg-green-50 text-green-600">📋</span>
              </div>
              <p className="stat-value">
                <span>{fulltimeCount}</span>
                <span className="text-[var(--text-light)] text-lg mx-1">/</span>
                <span className="text-lg text-[var(--text-muted)]">{parttimeCount}</span>
              </p>
              <p className="stat-label">정규 / 파트</p>
            </div>
            
            <div className="stat-card">
              <div className="flex items-center justify-between mb-2">
                <span className="stat-icon bg-amber-50 text-amber-600">💵</span>
              </div>
              <p className="stat-value text-xl">{formatCurrency(totalMonthlySalary)}</p>
              <p className="stat-label">{currentMonth} 예상 급여</p>
            </div>
            
            <div className="stat-card border-l-4 border-l-[var(--primary)]">
              <div className="flex items-center justify-between mb-2">
                <span className="stat-icon bg-slate-100 text-slate-600">📌</span>
                <span className="badge badge-primary">2026</span>
              </div>
              <p className="stat-value text-xl">{formatCurrency(MINIMUM_WAGE.hourly)}</p>
              <p className="stat-label">최저시급</p>
            </div>
          </div>
        </section>
      )}

      {/* Services */}
      <section className="mb-8">
        <h2 className="heading-sm mb-4 flex items-center gap-2">
          <span className="icon-box icon-box-primary">🗂️</span>
          서비스
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {features.map((feature) => (
            <Link 
              key={feature.href} 
              href={feature.href}
              className="feature-card"
            >
              <div className="flex items-start justify-between mb-2">
                <span className="feature-card-icon">{feature.icon}</span>
                {feature.badge && (
                  <span className="badge badge-primary">{feature.badge}</span>
                )}
              </div>
              <h3 className="feature-card-title">{feature.title}</h3>
              <p className="feature-card-desc">{feature.description}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Employee List */}
      {isLoaded && activeEmployees.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="heading-sm flex items-center gap-2">
              <span className="icon-box icon-box-success">👥</span>
              직원 목록
            </h2>
            <Link 
              href="/employees" 
              className="btn btn-secondary btn-sm"
            >
              전체 보기
            </Link>
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
                      <span className={`badge ${
                        emp.employmentType === 'fulltime' ? 'badge-primary' : 'badge-neutral'
                      }`}>
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

      {/* Quick Guide */}
      <section className="mb-8">
        <h2 className="heading-sm mb-4 flex items-center gap-2">
          <span className="icon-box icon-box-warning">💡</span>
          사용 가이드
        </h2>
        
        <div className="card">
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { step: 1, title: '회사 정보 등록', desc: '사업자 정보 입력', icon: '⚙️' },
                { step: 2, title: '직원 등록', desc: '급여 설정 및 최적화', icon: '👥' },
                { step: 3, title: '계약서 작성', desc: '자동 입력 활용', icon: '📋' },
                { step: 4, title: '급여 관리', desc: '명세서 발급 및 대장 관리', icon: '💵' },
              ].map((item, idx) => (
                <div key={item.step} className="flex items-start gap-3">
                  <span className={`step-number ${idx === 0 ? 'step-active' : 'step-pending'}`}>
                    {item.step}
                  </span>
                  <div>
                    <p className="font-medium text-sm">{item.title}</p>
                    <p className="text-xs text-[var(--text-muted)]">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Legal Notice */}
      <div className="alert alert-info mb-6">
        <span className="text-lg">ℹ️</span>
        <div className="text-sm">
          <p className="font-medium">법적 고지</p>
          <p className="opacity-80">본 서비스에서 제공하는 문서 양식은 참고용이며, 실제 법적 효력은 관할 기관 및 전문가 확인이 필요합니다.</p>
        </div>
      </div>

      {/* Footer */}
      <footer className="footer">
        <div className="flex items-center justify-center gap-3 mb-3">
          <div className="relative w-5 h-5 opacity-60">
            <Image 
              src="/logo.png" 
              alt="L-BIZ Partners" 
              fill
              className="object-contain"
            />
          </div>
          <span className="text-sm">엘비즈 파트너스</span>
        </div>
        <p className="text-xs text-[var(--text-light)] mb-2">
          © 2026 노무뚝딱 · 노무서류 관리 시스템
        </p>
        <p className="text-xs">
          <a 
            href="mailto:sangsu0916@naver.com" 
            className="text-[var(--text-muted)] hover:text-[var(--text)]"
          >
            sangsu0916@naver.com
          </a>
        </p>
      </footer>
    </div>
  );
}
