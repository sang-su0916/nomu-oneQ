'use client';

import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PLAN_LIMITS, FREE_DOCUMENT_TYPES } from '@/types/database';

export type PlanStatus = 'active' | 'expired' | 'expiring_soon' | 'free';

export interface PlanGate {
  // 현재 플랜 정보
  plan: 'free' | 'starter' | 'business' | 'pro';
  planStatus: PlanStatus;
  planLabel: string;
  isPaid: boolean;
  
  // 만료 관련
  daysRemaining: number | null;
  expiresAt: string | null;
  isExpired: boolean;
  isExpiringSoon: boolean; // 7일 이내
  
  // 기능 체크
  canAccessDocument: (docType: string) => boolean;
  canAddEmployee: (currentCount: number) => boolean;
  canUseFeature: (feature: string) => boolean;
  maxEmployees: number;
  
  // 제한 정보
  limits: typeof PLAN_LIMITS[keyof typeof PLAN_LIMITS];
  freeDocTypes: readonly string[];
}

const PLAN_LABELS: Record<string, string> = {
  free: '무료',
  starter: '스타터',
  business: '비즈니스',
  pro: '프로',
};

export function usePlanGate(): PlanGate {
  const { company } = useAuth();

  return useMemo(() => {
    const plan = company?.plan || 'free';
    const expiresAt = company?.plan_expires_at || null;
    
    // 만료일 계산
    let daysRemaining: number | null = null;
    let isExpired = false;
    let isExpiringSoon = false;

    if (expiresAt && plan !== 'free') {
      const now = new Date();
      const expDate = new Date(expiresAt);
      const diffMs = expDate.getTime() - now.getTime();
      daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      isExpired = daysRemaining <= 0;
      isExpiringSoon = daysRemaining > 0 && daysRemaining <= 7;
    }

    // 플랜 상태 결정
    let planStatus: PlanStatus = 'free';
    if (plan !== 'free') {
      if (isExpired) planStatus = 'expired';
      else if (isExpiringSoon) planStatus = 'expiring_soon';
      else planStatus = 'active';
    }

    // 만료된 경우 free 제한 적용
    const effectivePlan = (plan !== 'free' && isExpired) ? 'free' : plan;
    const limits = PLAN_LIMITS[effectivePlan];
    const isPaid = effectivePlan !== 'free';

    const canAccessDocument = (docType: string): boolean => {
      if (isPaid) return true;
      return (FREE_DOCUMENT_TYPES as readonly string[]).includes(docType);
    };

    const canAddEmployee = (currentCount: number): boolean => {
      return currentCount < limits.maxEmployees;
    };

    const canUseFeature = (feature: string): boolean => {
      return (limits.features as readonly string[]).includes(feature);
    };

    return {
      plan,
      planStatus,
      planLabel: PLAN_LABELS[plan] || plan,
      isPaid,
      daysRemaining,
      expiresAt,
      isExpired,
      isExpiringSoon,
      canAccessDocument,
      canAddEmployee,
      canUseFeature,
      maxEmployees: limits.maxEmployees,
      limits,
      freeDocTypes: FREE_DOCUMENT_TYPES,
    };
  }, [company]);
}
