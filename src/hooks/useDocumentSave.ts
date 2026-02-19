'use client';

/**
 * 서류 보관함 저장 훅
 * 기존 서류 페이지에서 "보관함에 저장" 기능 추가
 */
import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

interface SaveDocumentParams {
  docType: string;
  title: string;
  employeeId?: string;
  data: Record<string, unknown>;
}

export function useDocumentSave() {
  const { company } = useAuth();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const supabase = createClient();

  const saveDocument = useCallback(async (params: SaveDocumentParams) => {
    if (!company) {
      alert('사업장 정보가 없습니다. 로그인을 확인해주세요.');
      return null;
    }

    setSaving(true);
    setSaved(false);

    try {
      const { data, error } = await supabase
        .from('documents')
        .insert({
          company_id: company.id,
          employee_id: params.employeeId || null,
          doc_type: params.docType,
          title: params.title,
          data: params.data,
        })
        .select()
        .single();

      if (error) throw error;

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      return data;
    } catch (err) {
      alert('저장 실패: ' + (err instanceof Error ? err.message : '알 수 없는 오류'));
      return null;
    } finally {
      setSaving(false);
    }
  }, [company, supabase]);

  return { saveDocument, saving, saved };
}

// 서류 유형 한글명 매핑
export const DOC_TYPE_LABELS: Record<string, string> = {
  // 계약서
  contract_fulltime: '정규직 근로계약서',
  contract_parttime: '파트타임 근로계약서',
  contract_freelancer: '프리랜서 계약서',
  // 기존 서류
  privacy_consent: '개인정보동의서',
  nda: '비밀유지서약서',
  attendance: '출퇴근기록부',
  annual_leave: '연차관리대장',
  overtime: '시간외근로합의서',
  certificate: '재직증명서',
  career_certificate: '경력증명서',
  resignation: '사직서',
  retirement_pay: '퇴직금정산서',
  annual_leave_notice: '연차촉진통보서',
  payslip: '급여명세서',
  wage_ledger: '임금대장',
  work_rules: '취업규칙',
  // 새 서류 (Phase 2)
  warning_letter: '경고장',
  disciplinary_notice: '징계통보서',
  termination_notice: '해고통보서',
  training_record: '교육훈련확인서',
  probation_eval: '수습평가서',
  personnel_card: '인사카드',
  leave_application: '휴직신청서',
  reinstatement: '복직신청서',
  work_hours_change: '근무시간변경합의서',
  side_job_permit: '겸업허가신청서',
  handover: '업무인수인계서',
  pledge: '서약서',
  business_trip: '출장신청서',
  remote_work: '재택근무신청서',
};

// 카테고리별 서류 분류
export const DOC_CATEGORIES = {
  contracts: {
    label: '📋 계약서',
    types: ['contract_fulltime', 'contract_parttime', 'contract_freelancer'],
  },
  certificates: {
    label: '📜 증명서',
    types: ['certificate', 'career_certificate'],
  },
  payroll: {
    label: '💵 급여/임금',
    types: ['payslip', 'wage_ledger', 'retirement_pay'],
  },
  leave: {
    label: '🏖️ 휴가/휴직',
    types: ['annual_leave', 'annual_leave_notice', 'leave_application', 'reinstatement'],
  },
  attendance: {
    label: '🕐 근태',
    types: ['attendance', 'overtime', 'work_hours_change', 'remote_work', 'business_trip'],
  },
  discipline: {
    label: '⚠️ 징계/해고',
    types: ['warning_letter', 'disciplinary_notice', 'termination_notice'],
  },
  hr: {
    label: '👤 인사관리',
    types: ['personnel_card', 'probation_eval', 'training_record', 'handover'],
  },
  compliance: {
    label: '📄 서약/동의',
    types: ['privacy_consent', 'nda', 'pledge', 'side_job_permit', 'resignation'],
  },
  rules: {
    label: '📖 규정',
    types: ['work_rules'],
  },
};
