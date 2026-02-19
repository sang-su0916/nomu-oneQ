# 노무원큐 (nomu-oneQ)

소규모 사업장(5~50인)을 위한 **스마트 노무관리 SaaS**

🌐 **Live**: [nomu-oneq.vercel.app](https://nomu-oneq.vercel.app)

## 주요 기능

### 📋 노무서류 30종
| 카테고리 | 서류 |
|---------|------|
| 계약서 | 정규직·파트타임·프리랜서 근로계약서 |
| 증명서 | 재직증명서, 경력증명서 |
| 급여 | 급여명세서, 임금대장, 퇴직금정산서 |
| 근태 | 출퇴근기록부, 시간외근로합의서, 연차관리대장, 연차촉진통보서 |
| 인사 | 인사카드, 수습평가서, 교육훈련확인서, 업무인수인계서 |
| 징계 | 경고장, 징계통보서, 해고통보서 |
| 휴직 | 휴직신청서, 복직신청서 |
| 서약 | 개인정보동의서, 비밀유지서약서, 서약서, 겸업허가신청서 |
| 업무 | 근무시간변경합의서, 재택근무신청서, 출장신청서 |
| 기타 | 사직서, 취업규칙 |

### 🔒 사업장별 격리
- Supabase Auth 기반 로그인
- RLS(Row Level Security)로 사업장 데이터 완전 격리
- 다중 사업장 지원 (사업장 전환)

### 💰 급여 자동 계산
- 2026년 최저임금(₩10,320/시) 자동 반영
- 4대보험 요율 자동 계산
- 비과세 최적화 추천

### 🗄️ 서류 보관함
- 생성한 서류를 클라우드에 안전 보관
- 검색·필터·삭제
- 언제든 다시 조회

## 기술 스택

- **Frontend**: Next.js 16 + TypeScript + Tailwind CSS
- **Backend**: Supabase (Auth + PostgreSQL + RLS)
- **배포**: Vercel
- **DB 스키마**: companies, company_members, employees, payment_records, documents, notifications, profiles

## 요금제

| 플랜 | 가격 | 직원 | 서류 |
|------|------|------|------|
| 무료 | ₩0 | 3명 | 기본 5종 |
| 스타터 | ₩19,900/월 | 10명 | 전체 30종 |
| 비즈니스 | ₩39,900/월 | 50명 | 전체 + 전자서명 |
| 프로 | ₩99,000/월 | 무제한 | 전체 + 다지점 + 전문가 상담 |

## 개발

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # 프로덕션 빌드
```

### 환경변수
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

## 제작

**엘비즈파트너스** - 세무·노무·법무 컨설팅 전문  
🌐 [lbiz-partners.com](https://lbiz-partners.com)

---

© 2026 엘비즈파트너스. All rights reserved.
