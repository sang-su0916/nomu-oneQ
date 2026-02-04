/**
 * 2026년 기준 노무 관련 상수
 * 매년 업데이트 필요
 * 
 * 📅 최종 업데이트: 2026-02-04
 * 📌 출처: 국민건강보험공단, 국민연금공단, 고용노동부
 */

// ============================================
// 최저임금 (2026년)
// ============================================
export const MINIMUM_WAGE = {
  year: 2026,
  hourly: 10320,  // 시급 (2026년 확정)
  monthly: 2156880,  // 월급 (209시간 기준: 10,320 × 209 = 2,156,880원)
  weeklyHours: 40,
  monthlyHours: 209,  // 주 40시간 × 4.345주
};

// ============================================
// 4대보험료율 (2026년) ⭐ 업데이트
// 근로자 부담분
// ============================================
export const INSURANCE_RATES = {
  year: 2026,
  
  // 국민연금: 9.5% (사용자 4.75% + 근로자 4.75%) ⬆️ 2025년 9%에서 인상
  nationalPension: {
    employee: 0.0475,  // 4.75%
    employer: 0.0475,  // 4.75%
    total: 0.095,       // 9.5%
    // 기준소득월액 상한: 637만원, 하한: 40만원 (2026.6.30까지)
    maxBase: 6370000,  // ⬆️ 617만원에서 인상
    minBase: 400000,   // ⬆️ 39만원에서 인상
  },
  
  // 건강보험: 7.19% (사용자 3.595% + 근로자 3.595%) ⬆️ 2025년 7.09%에서 인상
  healthInsurance: {
    employee: 0.03595,  // 3.595%
    employer: 0.03595,  // 3.595%
    total: 0.0719,
    // 보험료액 상한액: 900만 8,340원
    maxPremium: 9008340,
  },
  
  // 장기요양보험: 건강보험료의 12.95% (동결 가정)
  longTermCare: {
    rate: 0.1295,  // 건강보험료의 12.95%
  },
  
  // 고용보험: 1.8% (근로자 0.9% 고정)
  employmentInsurance: {
    employee: 0.009,  // 0.9%
    employer: {
      // 사업장 규모별 차등 (근로자 부담분 0.9% + 사업주 추가 부담)
      under150: 0.009 + 0.0025,  // 150인 미만: 1.15%
      over150: 0.009 + 0.0045,   // 150인 이상: 1.35%
      over1000: 0.009 + 0.0065,  // 1000인 이상: 1.55%
    }
  },
  
  // 산재보험: 업종별 상이 (사용자 전액 부담)
  industrialAccident: {
    average: 0.018,  // 평균 1.8% (업종별 0.6%~34%)
  }
};

// ============================================
// 비과세 한도 (2026년) ⭐ 업데이트
// ============================================
export const TAX_EXEMPTION_LIMITS = {
  year: 2026,
  
  // 식대 (2023년부터 월 20만원)
  meal: {
    monthly: 200000,
    description: '식대 (구내식당 제공 시 제외)',
  },
  
  // 자가운전보조금 (본인 차량 업무사용)
  carAllowance: {
    monthly: 200000,
    description: '자가운전보조금 (본인 명의 차량, 업무용)',
    condition: '출퇴근용은 비과세 불가',
  },
  
  // 출산/보육수당 (6세 이하 자녀) ⭐ 2026년 개정
  childcare: {
    monthlyPerChild: 200000,  // 자녀 1인당 월 20만원 (2026년~)
    maxAge: 6,  // 6세 이하 (변경 없음)
    description: '출산/보육수당 (6세 이하 자녀)',
    note: '2026년부터 자녀 1인당 월 20만원 (기존: 1인당 총 20만원)',
  },
  
  // 연구활동비 (연구원)
  research: {
    monthly: 200000,
    description: '연구활동비 (연구원 한정)',
  },
  
  // 유류비/차량유지비 (업무용)
  fuel: {
    monthly: 200000,
    description: '유류비/차량유지비 (업무용 차량)',
    condition: '자가운전보조금과 별개로 적용 가능',
  },
  
  // 생산직 야간근로수당 (월정액 210만원 이하)
  nightShift: {
    yearlyLimit: 2400000,
    monthlyWageLimit: 2100000,
    description: '생산직 야간근로수당',
  },
  
  // 출산지원금 (2024년~)
  birthSupport: {
    limit: 'unlimited',  // 전액 비과세
    condition: '출산 후 2년 이내 지급, 2회 이내',
    description: '출산지원금 (출생일 이후 2년 내 지급 시 전액 비과세)',
  },
};

// ============================================
// 소득세율 (근로소득 간이세액표 기준)
// ============================================
export const INCOME_TAX_BRACKETS = [
  { min: 0, max: 14000000, rate: 0.06, deduction: 0 },
  { min: 14000000, max: 50000000, rate: 0.15, deduction: 1260000 },
  { min: 50000000, max: 88000000, rate: 0.24, deduction: 5760000 },
  { min: 88000000, max: 150000000, rate: 0.35, deduction: 15440000 },
  { min: 150000000, max: 300000000, rate: 0.38, deduction: 19940000 },
  { min: 300000000, max: 500000000, rate: 0.40, deduction: 25940000 },
  { min: 500000000, max: 1000000000, rate: 0.42, deduction: 35940000 },
  { min: 1000000000, max: Infinity, rate: 0.45, deduction: 65940000 },
];

// ============================================
// 급여 최적화 계산
// ============================================
export interface SalaryOptimization {
  baseSalary: number;        // 기본급 (과세)
  mealAllowance: number;     // 식대 (비과세)
  carAllowance: number;      // 자가운전보조금 (비과세)
  childcareAllowance: number; // 보육수당 (비과세)
  totalGross: number;        // 총 급여
  taxableIncome: number;     // 과세 소득
  insuranceBase: number;     // 4대보험 기준액
  savings: {
    insurance: number;       // 4대보험 절감액
    tax: number;             // 소득세 절감액
    total: number;           // 총 절감액
  };
  warnings: string[];        // 경고 메시지
}

export function optimizeSalary(
  totalGross: number,
  options: {
    hasOwnCar?: boolean;        // 본인 차량 있음
    hasChildUnder6?: boolean;   // 6세 이하 자녀 있음 (기존 호환용)
    childrenUnder6?: number;    // 6세 이하 자녀 수 (2026년 개정 반영)
  } = {}
): SalaryOptimization {
  const warnings: string[] = [];
  
  // 1. 비과세 항목 최대 활용
  let remainingAmount = totalGross;
  
  // 식대 (거의 모든 경우 적용 가능)
  const mealAllowance = Math.min(TAX_EXEMPTION_LIMITS.meal.monthly, remainingAmount);
  remainingAmount -= mealAllowance;
  
  // 자가운전보조금 (차량 있는 경우만)
  let carAllowance = 0;
  if (options.hasOwnCar && remainingAmount > 0) {
    carAllowance = Math.min(TAX_EXEMPTION_LIMITS.carAllowance.monthly, remainingAmount);
    remainingAmount -= carAllowance;
  }
  
  // 보육수당 (6세 이하 자녀 수에 따라 - 2026년 개정)
  // 자녀 수가 지정되지 않고 hasChildUnder6만 있으면 1명으로 간주
  let childcareAllowance = 0;
  const childrenCount = options.childrenUnder6 ?? (options.hasChildUnder6 ? 1 : 0);
  if (childrenCount > 0 && remainingAmount > 0) {
    const maxChildcare = TAX_EXEMPTION_LIMITS.childcare.monthlyPerChild * childrenCount;
    childcareAllowance = Math.min(maxChildcare, remainingAmount);
    remainingAmount -= childcareAllowance;
  }
  
  // 나머지는 기본급
  const baseSalary = remainingAmount;
  
  // 2. 최저임금 체크
  if (baseSalary < MINIMUM_WAGE.monthly) {
    const effectiveHourly = totalGross / MINIMUM_WAGE.monthlyHours;
    if (effectiveHourly < MINIMUM_WAGE.hourly) {
      warnings.push(`⚠️ 최저임금 미달! (시급 ${Math.floor(effectiveHourly).toLocaleString()}원 < ${MINIMUM_WAGE.hourly.toLocaleString()}원)`);
    }
  }
  
  // 3. 과세 소득 및 4대보험 기준액
  const taxableIncome = baseSalary;  // 비과세 제외
  const insuranceBase = Math.min(
    Math.max(taxableIncome, INSURANCE_RATES.nationalPension.minBase),
    INSURANCE_RATES.nationalPension.maxBase
  );
  
  // 4. 절감액 계산 (최적화 vs 전액 과세)
  const fullTaxableInsurance = totalGross * (
    INSURANCE_RATES.nationalPension.employee +
    INSURANCE_RATES.healthInsurance.employee +
    INSURANCE_RATES.healthInsurance.employee * INSURANCE_RATES.longTermCare.rate +
    INSURANCE_RATES.employmentInsurance.employee
  );
  
  const optimizedInsurance = insuranceBase * (
    INSURANCE_RATES.nationalPension.employee +
    INSURANCE_RATES.healthInsurance.employee +
    INSURANCE_RATES.healthInsurance.employee * INSURANCE_RATES.longTermCare.rate +
    INSURANCE_RATES.employmentInsurance.employee
  );
  
  const insuranceSavings = Math.round(fullTaxableInsurance - optimizedInsurance);
  
  // 소득세 절감 (간략 계산)
  const taxSavings = Math.round((totalGross - taxableIncome) * 0.06); // 최저세율 기준
  
  return {
    baseSalary,
    mealAllowance,
    carAllowance,
    childcareAllowance,
    totalGross,
    taxableIncome,
    insuranceBase,
    savings: {
      insurance: insuranceSavings,
      tax: taxSavings,
      total: insuranceSavings + taxSavings,
    },
    warnings,
  };
}

// ============================================
// 4대보험료 계산 (2026년 요율 적용)
// ============================================
export interface InsuranceCalculation {
  nationalPension: number;
  healthInsurance: number;
  longTermCare: number;
  employmentInsurance: number;
  totalEmployee: number;
  totalEmployer: number;
}

export function calculateInsurance(taxableIncome: number): InsuranceCalculation {
  // 국민연금 기준소득월액 적용
  const pensionBase = Math.min(
    Math.max(taxableIncome, INSURANCE_RATES.nationalPension.minBase),
    INSURANCE_RATES.nationalPension.maxBase
  );
  
  const nationalPension = Math.round(pensionBase * INSURANCE_RATES.nationalPension.employee);
  const healthInsurance = Math.round(taxableIncome * INSURANCE_RATES.healthInsurance.employee);
  const longTermCare = Math.round(healthInsurance * INSURANCE_RATES.longTermCare.rate);
  const employmentInsurance = Math.round(taxableIncome * INSURANCE_RATES.employmentInsurance.employee);
  
  const totalEmployee = nationalPension + healthInsurance + longTermCare + employmentInsurance;
  
  // 사용자 부담분 (150인 미만 기준)
  const employerNational = Math.round(pensionBase * INSURANCE_RATES.nationalPension.employer);
  const employerHealth = Math.round(taxableIncome * INSURANCE_RATES.healthInsurance.employer);
  const employerLongTerm = Math.round(employerHealth * INSURANCE_RATES.longTermCare.rate);
  const employerEmployment = Math.round(taxableIncome * INSURANCE_RATES.employmentInsurance.employer.under150);
  const employerIndustrial = Math.round(taxableIncome * INSURANCE_RATES.industrialAccident.average);
  
  const totalEmployer = employerNational + employerHealth + employerLongTerm + employerEmployment + employerIndustrial;
  
  return {
    nationalPension,
    healthInsurance,
    longTermCare,
    employmentInsurance,
    totalEmployee,
    totalEmployer,
  };
}

// ============================================
// 간이세액표 기반 소득세 계산
// ============================================
export function calculateIncomeTax(monthlyTaxable: number, dependents: number = 1): number {
  // 간이세액표 근사 계산 (실제로는 국세청 표 참조)
  const annualTaxable = monthlyTaxable * 12;
  
  // 기본공제: 150만원 × 부양가족 수
  const basicDeduction = 1500000 * dependents;
  const taxableAfterDeduction = Math.max(0, annualTaxable - basicDeduction);
  
  let tax = 0;
  for (const bracket of INCOME_TAX_BRACKETS) {
    if (taxableAfterDeduction > bracket.min) {
      const taxableInBracket = Math.min(taxableAfterDeduction, bracket.max) - bracket.min;
      tax = taxableAfterDeduction * bracket.rate - bracket.deduction;
      if (taxableAfterDeduction <= bracket.max) break;
    }
  }
  
  // 월 환산
  return Math.max(0, Math.round(tax / 12));
}
