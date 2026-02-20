'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { PLAN_LIMITS } from '@/types/database';
import type { DbEmployee } from '@/types/database';
import { checkContractExpiry } from '@/lib/notification-checker';
import PlanBanner from '@/components/PlanBanner';
import NotificationWidget from '@/components/NotificationWidget';
import { usePlanGate } from '@/hooks/usePlanGate';

interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  resignedEmployees: number;
  contractsExpiringSoon: number;
  documentsCount: number;
}

export default function DashboardPage() {
  const { user, company, membership, loading } = useAuth();
  const planGate = usePlanGate();
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0, activeEmployees: 0, resignedEmployees: 0,
    contractsExpiringSoon: 0, documentsCount: 0,
  });
  const [recentEmployees, setRecentEmployees] = useState<DbEmployee[]>([]);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    if (loading) return;
    if (!user) { router.push('/login'); return; }
    if (!company) { router.push('/onboarding'); return; }

    loadDashboard();
  }, [user, company, loading]);

  const loadDashboard = async () => {
    if (!company) return;

    // 직원 통계
    const { data: employees } = await supabase
      .from('employees')
      .select('*')
      .eq('company_id', company.id);

    const emps = employees || [];
    const active = emps.filter(e => e.status === 'active');
    const resigned = emps.filter(e => e.status === 'resigned');

    // 서류 수
    const { count: docsCount } = await supabase
      .from('documents')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', company.id);

    // 계약 만료 임박 체크
    const expiringContracts = checkContractExpiry(emps as DbEmployee[]);

    setStats({
      totalEmployees: emps.length,
      activeEmployees: active.length,
      resignedEmployees: resigned.length,
      contractsExpiringSoon: expiringContracts.length,
      documentsCount: docsCount || 0,
    });

    setRecentEmployees(active.slice(0, 5) as DbEmployee[]);
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full" /></div>;
  if (!company) return null;

  const planLimit = PLAN_LIMITS[company.plan];
  const usagePercent = planLimit.maxEmployees === Infinity ? 0 : Math.round((stats.activeEmployees / planLimit.maxEmployees) * 100);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* 플랜 만료/경고 배너 */}
      <PlanBanner />

      {/* 헤더 */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">{company.name}</h1>
          <p className="text-[var(--text-muted)] text-sm mt-1">
            {membership?.role === 'admin' ? '관리자' : membership?.role === 'manager' ? '담당자' : '열람자'}
            {' · '}
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
              planGate.isExpired ? 'bg-red-100 text-red-800' :
              planGate.isExpiringSoon ? 'bg-yellow-100 text-yellow-800' :
              'bg-blue-100 text-blue-800'
            }`}>
              {planGate.planLabel} 플랜
              {planGate.isExpired && ' (만료됨)'}
            </span>
            {planGate.daysRemaining !== null && !planGate.isExpired && (
              <span className="text-xs text-[var(--text-muted)] ml-2">
                (남은 기간: {planGate.daysRemaining}일)
              </span>
            )}
          </p>
        </div>
        {(company.plan === 'free' || planGate.isExpired) && (
          <Link
            href="/pricing"
            className="px-4 py-2 bg-gradient-to-r from-[var(--primary)] to-blue-600 text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
          >
            업그레이드 →
          </Link>
        )}
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard icon="👥" label="재직 직원" value={stats.activeEmployees} sub={`/ ${planLimit.maxEmployees === Infinity ? '무제한' : planLimit.maxEmployees}명`} />
        <StatCard icon="📤" label="퇴사 직원" value={stats.resignedEmployees} />
        <StatCard icon="📋" label="보관 서류" value={stats.documentsCount} />
        <StatCard icon="⚠️" label="계약만료 임박" value={stats.contractsExpiringSoon} accent />
      </div>

      {/* 알림 위젯 (유료 플랜) */}
      {planGate.isPaid && <NotificationWidget />}

      {/* 직원 한도 바 */}
      {company.plan === 'free' && (
        <div className="bg-[var(--bg-card)] rounded-xl p-4 border border-[var(--border)] mb-8">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-[var(--text-muted)]">직원 등록 한도</span>
            <span className="font-medium text-[var(--text)]">{stats.activeEmployees} / {planLimit.maxEmployees}명</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${usagePercent >= 100 ? 'bg-red-500' : usagePercent >= 80 ? 'bg-yellow-500' : 'bg-[var(--primary)]'}`}
              style={{ width: `${Math.min(usagePercent, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* 빠른 액션 */}
      <h2 className="text-lg font-bold text-[var(--text)] mb-4">빠른 시작</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <QuickAction href="/employees" icon="👥" label="직원 관리" />
        <QuickAction href="/contract/fulltime" icon="📋" label="근로계약서" />
        <QuickAction href="/payslip" icon="💵" label="급여명세서" />
        <QuickAction href="/documents/attendance" icon="🕐" label="출퇴근기록부" />
        <QuickAction href="/documents/certificate" icon="📜" label="재직증명서" />
        <QuickAction href="/wage-ledger" icon="📊" label="임금대장" />
        <QuickAction href="/work-rules" icon="📖" label="취업규칙" />
        <QuickAction href="/archive" icon="🗄️" label="서류 보관함" />
      </div>

      {/* 추가 서류 */}
      <details className="mb-8">
        <summary className="text-lg font-bold text-[var(--text)] cursor-pointer mb-4 select-none">
          📄 전체 서류 (30종) <span className="text-sm font-normal text-[var(--text-muted)]">펼치기</span>
        </summary>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <QuickAction href="/contract/fulltime" icon="📋" label="정규직 계약서" />
          <QuickAction href="/contract/parttime" icon="📋" label="파트타임 계약서" />
          <QuickAction href="/contract/freelancer" icon="📋" label="프리랜서 계약서" />
          <QuickAction href="/documents/privacy-consent" icon="🔒" label="개인정보동의서" />
          <QuickAction href="/documents/nda" icon="🤫" label="비밀유지서약서" />
          <QuickAction href="/documents/pledge" icon="✍️" label="서약서" />
          <QuickAction href="/documents/certificate" icon="📜" label="재직증명서" />
          <QuickAction href="/documents/career-certificate" icon="📜" label="경력증명서" />
          <QuickAction href="/documents/attendance" icon="🕐" label="출퇴근기록부" />
          <QuickAction href="/documents/overtime" icon="⏰" label="시간외근로합의서" />
          <QuickAction href="/documents/annual-leave" icon="🏖️" label="연차관리대장" />
          <QuickAction href="/documents/annual-leave-notice" icon="📬" label="연차촉진통보서" />
          <QuickAction href="/documents/resignation" icon="📤" label="사직서" />
          <QuickAction href="/documents/retirement-pay" icon="💰" label="퇴직금정산서" />
          <QuickAction href="/documents/personnel-card" icon="👤" label="인사카드" />
          <QuickAction href="/documents/probation-eval" icon="📝" label="수습평가서" />
          <QuickAction href="/documents/training-record" icon="🎓" label="교육훈련확인서" />
          <QuickAction href="/documents/warning-letter" icon="⚠️" label="경고장" />
          <QuickAction href="/documents/disciplinary-notice" icon="🔴" label="징계통보서" />
          <QuickAction href="/documents/termination-notice" icon="❌" label="해고통보서" />
          <QuickAction href="/documents/leave-application" icon="🏖️" label="휴직신청서" />
          <QuickAction href="/documents/reinstatement" icon="🔄" label="복직신청서" />
          <QuickAction href="/documents/work-hours-change" icon="🕐" label="근무시간변경합의서" />
          <QuickAction href="/documents/remote-work" icon="🏠" label="재택근무신청서" />
          <QuickAction href="/documents/business-trip" icon="✈️" label="출장신청서" />
          <QuickAction href="/documents/side-job-permit" icon="📄" label="겸업허가신청서" />
          <QuickAction href="/documents/handover" icon="🤝" label="업무인수인계서" />
          <QuickAction href="/payslip" icon="💵" label="급여명세서" />
          <QuickAction href="/wage-ledger" icon="📊" label="임금대장" />
          <QuickAction href="/work-rules" icon="📖" label="취업규칙" />
        </div>
      </details>

      {/* 최근 직원 */}
      {recentEmployees.length > 0 && (
        <>
          <h2 className="text-lg font-bold text-[var(--text)] mb-4">최근 등록 직원</h2>
          <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border)] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="text-left px-4 py-3 text-[var(--text-muted)] font-medium">이름</th>
                  <th className="text-left px-4 py-3 text-[var(--text-muted)] font-medium">구분</th>
                  <th className="text-left px-4 py-3 text-[var(--text-muted)] font-medium">부서</th>
                  <th className="text-left px-4 py-3 text-[var(--text-muted)] font-medium">입사일</th>
                </tr>
              </thead>
              <tbody>
                {recentEmployees.map(emp => (
                  <tr key={emp.id} className="border-b border-[var(--border)] last:border-0">
                    <td className="px-4 py-3 font-medium text-[var(--text)]">{emp.name}</td>
                    <td className="px-4 py-3 text-[var(--text-muted)]">
                      {emp.employment_type === 'fulltime' ? '정규직' : emp.employment_type === 'parttime' ? '파트타임' : '프리랜서'}
                    </td>
                    <td className="px-4 py-3 text-[var(--text-muted)]">{emp.department || '-'}</td>
                    <td className="px-4 py-3 text-[var(--text-muted)]">{emp.hire_date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, sub, accent }: {
  icon: string; label: string; value: number; sub?: string; accent?: boolean;
}) {
  return (
    <div className="bg-[var(--bg-card)] rounded-xl p-4 border border-[var(--border)]">
      <div className="text-2xl mb-2">{icon}</div>
      <div className={`text-2xl font-bold ${accent && value > 0 ? 'text-orange-500' : 'text-[var(--text)]'}`}>
        {value}{sub && <span className="text-sm font-normal text-[var(--text-muted)]"> {sub}</span>}
      </div>
      <div className="text-sm text-[var(--text-muted)]">{label}</div>
    </div>
  );
}

function QuickAction({ href, icon, label }: { href: string; icon: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-2 p-4 bg-[var(--bg-card)] rounded-xl border border-[var(--border)] hover:border-[var(--primary)] hover:shadow-sm transition-all"
    >
      <span className="text-2xl">{icon}</span>
      <span className="text-sm font-medium text-[var(--text)]">{label}</span>
    </Link>
  );
}
