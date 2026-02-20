/**
 * 알림 조건 체크 로직
 * 직원 데이터 기반 서류 만료/갱신 이벤트 감지
 */

import type { DbEmployee } from '@/types/database';

export interface NotificationItem {
  type: 'contract_expiry' | 'probation_end' | 'annual_leave_notice' | 'nda_renewal';
  employeeId: string;
  employeeName: string;
  title: string;
  message: string;
  targetDate: string; // YYYY-MM-DD
  daysLeft: number;
  urgency: 'critical' | 'warning' | 'info'; // 7일 이내 / 30일 이내 / 그 외
  actionUrl: string; // 관련 서류 작성 페이지
}

function diffDays(dateStr: string): number {
  const target = new Date(dateStr + 'T00:00:00');
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function urgency(days: number): 'critical' | 'warning' | 'info' {
  if (days <= 7) return 'critical';
  if (days <= 30) return 'warning';
  return 'info';
}

function formatDate(d: string): string {
  return new Date(d + 'T00:00:00').toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
}

/**
 * 근로계약 만료 임박 체크
 * - 계약 종료일이 있는 직원(파트타임, 프리랜서 등)
 * - 30일 이내 만료 예정인 직원 반환
 * - documents 테이블에서 계약 종료일 정보가 있으면 활용, 없으면 hire_date + 1년 추정
 */
export function checkContractExpiry(
  employees: DbEmployee[],
  documents?: { employee_id: string; data: Record<string, unknown> }[]
): NotificationItem[] {
  const results: NotificationItem[] = [];
  const activeEmps = employees.filter(e => e.status === 'active');

  for (const emp of activeEmps) {
    // 계약 종료일 찾기: documents에서 contract_end_date 확인
    let contractEndDate: string | null = null;

    if (documents) {
      const empDocs = documents.filter(d => d.employee_id === emp.id);
      for (const doc of empDocs) {
        const endDate = doc.data?.contractEndDate || doc.data?.contract_end_date || doc.data?.endDate;
        if (typeof endDate === 'string' && endDate) {
          contractEndDate = endDate;
          break;
        }
      }
    }

    // 파트타임/프리랜서는 계약 종료일이 없으면 입사일 + 1년 추정
    if (!contractEndDate && (emp.employment_type === 'parttime' || emp.employment_type === 'freelancer')) {
      const hireDate = new Date(emp.hire_date);
      hireDate.setFullYear(hireDate.getFullYear() + 1);
      contractEndDate = hireDate.toISOString().split('T')[0];
    }

    if (!contractEndDate) continue;

    const days = diffDays(contractEndDate);
    if (days < 0 || days > 30) continue;

    const contractTypeLabel = emp.employment_type === 'fulltime' ? '정규직' : emp.employment_type === 'parttime' ? '파트타임' : '프리랜서';

    results.push({
      type: 'contract_expiry',
      employeeId: emp.id,
      employeeName: emp.name,
      title: `근로계약 만료 임박: ${emp.name}`,
      message: `${emp.name}(${contractTypeLabel})의 근로계약이 ${formatDate(contractEndDate)}에 만료됩니다. (D-${days})`,
      targetDate: contractEndDate,
      daysLeft: days,
      urgency: urgency(days),
      actionUrl: emp.employment_type === 'fulltime' ? '/contract/fulltime' : emp.employment_type === 'parttime' ? '/contract/parttime' : '/contract/freelancer',
    });
  }

  return results.sort((a, b) => a.daysLeft - b.daysLeft);
}

/**
 * 수습 기간 만료 체크
 * - 입사일 + 3개월 기준
 * - 입사 후 3개월 이내인 재직 직원 중, 만료 30일 전부터 알림
 */
export function checkProbationEnd(employees: DbEmployee[]): NotificationItem[] {
  const results: NotificationItem[] = [];
  const activeEmps = employees.filter(e => e.status === 'active' && e.employment_type === 'fulltime');

  for (const emp of activeEmps) {
    const hireDate = new Date(emp.hire_date);
    const probationEnd = new Date(hireDate);
    probationEnd.setMonth(probationEnd.getMonth() + 3);
    const endStr = probationEnd.toISOString().split('T')[0];

    const days = diffDays(endStr);
    if (days < 0 || days > 30) continue;

    results.push({
      type: 'probation_end',
      employeeId: emp.id,
      employeeName: emp.name,
      title: `수습 평가 필요: ${emp.name}`,
      message: `${emp.name}의 수습 기간이 ${formatDate(endStr)}에 종료됩니다. 수습평가서를 작성해주세요. (D-${days})`,
      targetDate: endStr,
      daysLeft: days,
      urgency: urgency(days),
      actionUrl: '/documents/probation-eval',
    });
  }

  return results.sort((a, b) => a.daysLeft - b.daysLeft);
}

/**
 * 연차촉진 통보 시기 체크
 * - 근로기준법 제61조: 연차 기산일(입사일) 기준 10개월 시점에 1차 촉진
 * - 촉진 대상: 입사 1년 이상, 잔여 연차가 있는 직원
 * - 간략화: 입사 기념일 2개월 전 ~ 입사 기념일 사이 알림
 */
export function checkAnnualLeaveNotice(employees: DbEmployee[]): NotificationItem[] {
  const results: NotificationItem[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const activeEmps = employees.filter(e => e.status === 'active');

  for (const emp of activeEmps) {
    const hireDate = new Date(emp.hire_date);
    
    // 입사 1년 미만이면 스킵
    const oneYearAfter = new Date(hireDate);
    oneYearAfter.setFullYear(oneYearAfter.getFullYear() + 1);
    if (today < oneYearAfter) continue;

    // 다음 입사 기념일 계산
    const nextAnniversary = new Date(hireDate);
    nextAnniversary.setFullYear(today.getFullYear());
    if (nextAnniversary <= today) {
      nextAnniversary.setFullYear(nextAnniversary.getFullYear() + 1);
    }

    // 1차 촉진 시점: 입사 기념일 2개월 전
    const noticeDate = new Date(nextAnniversary);
    noticeDate.setMonth(noticeDate.getMonth() - 2);
    const noticeDateStr = noticeDate.toISOString().split('T')[0];

    const days = diffDays(noticeDateStr);
    // 촉진 시점 30일 전 ~ 촉진 시점 이후 30일까지 알림
    if (days < -30 || days > 30) continue;

    const deadlineStr = nextAnniversary.toISOString().split('T')[0];

    results.push({
      type: 'annual_leave_notice',
      employeeId: emp.id,
      employeeName: emp.name,
      title: `연차촉진 통보 시기: ${emp.name}`,
      message: `${emp.name}의 연차촉진 1차 통보 시기입니다. 기한: ${formatDate(deadlineStr)}`,
      targetDate: noticeDateStr,
      daysLeft: Math.max(0, days),
      urgency: days <= 0 ? 'critical' : urgency(days),
      actionUrl: '/documents/annual-leave-notice',
    });
  }

  return results.sort((a, b) => a.daysLeft - b.daysLeft);
}

/**
 * 비밀유지서약서 갱신 체크
 * - 1년 주기 갱신
 * - documents 테이블에서 NDA 작성일 기준 + 1년
 */
export function checkNdaRenewal(
  employees: DbEmployee[],
  documents?: { employee_id: string; doc_type: string; created_at: string }[]
): NotificationItem[] {
  const results: NotificationItem[] = [];
  if (!documents) return results;

  const activeEmps = employees.filter(e => e.status === 'active');
  const ndaDocs = documents.filter(d => d.doc_type === 'nda');

  for (const emp of activeEmps) {
    const empNda = ndaDocs
      .filter(d => d.employee_id === emp.id)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

    if (!empNda) continue;

    const createdDate = new Date(empNda.created_at);
    const renewalDate = new Date(createdDate);
    renewalDate.setFullYear(renewalDate.getFullYear() + 1);
    const renewalStr = renewalDate.toISOString().split('T')[0];

    const days = diffDays(renewalStr);
    if (days < 0 || days > 30) continue;

    results.push({
      type: 'nda_renewal',
      employeeId: emp.id,
      employeeName: emp.name,
      title: `비밀유지서약서 갱신: ${emp.name}`,
      message: `${emp.name}의 비밀유지서약서가 ${formatDate(renewalStr)}에 갱신 기한입니다. (D-${days})`,
      targetDate: renewalStr,
      daysLeft: days,
      urgency: urgency(days),
      actionUrl: '/documents/nda',
    });
  }

  return results.sort((a, b) => a.daysLeft - b.daysLeft);
}

/**
 * 전체 알림 통합 체크
 */
export function checkAllNotifications(
  employees: DbEmployee[],
  documents?: { employee_id: string; doc_type: string; data: Record<string, unknown>; created_at: string }[]
): NotificationItem[] {
  const contractDocs = documents?.map(d => ({ employee_id: d.employee_id, data: d.data }));
  const ndaDocs = documents?.map(d => ({ employee_id: d.employee_id, doc_type: d.doc_type, created_at: d.created_at }));

  return [
    ...checkContractExpiry(employees, contractDocs),
    ...checkProbationEnd(employees),
    ...checkAnnualLeaveNotice(employees),
    ...checkNdaRenewal(employees, ndaDocs),
  ].sort((a, b) => a.daysLeft - b.daysLeft);
}
