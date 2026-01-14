/**
 * Dues Type Definitions
 * Lightning Pickleball 클럽 회비 관리 시스템 타입 정의
 */

import { Timestamp as FirebaseTimestamp } from 'firebase/firestore';

// 회비 유형 (확장: 가입비, 분기회비, 연체료 추가)
export type DuesType = 'join' | 'monthly' | 'quarterly' | 'yearly' | 'late_fee';

// 결제 방법
export type PaymentMethod = 'venmo' | 'paypal' | 'zelle' | 'cash' | 'bank_transfer' | 'other';

// 납부 상태 (확장: 승인 대기 추가)
export type PaymentStatus = 'paid' | 'unpaid' | 'overdue' | 'pending_approval' | 'exempt';

// 클럽 회비 설정
export interface ClubDuesSettings {
  id: string;
  clubId: string;

  // 회비 정책 (확장: 개별 회비 금액)
  duesType: DuesType; // 기본 회비 유형 (monthly 또는 yearly)
  amount: number; // 기본 회비 금액 (하위 호환용)
  currency: string; // 'USD', 'KRW' 등

  // 개별 회비 금액 (신규)
  joinFee?: number; // 가입비
  monthlyFee?: number; // 월회비
  quarterlyFee?: number; // 분기회비 (3개월치)
  yearlyFee?: number; // 연회비
  lateFee?: number; // 연체료 (기본 금액)

  // 납부 일정
  dueDay: number; // 매월 몇일까지 (1-31)
  gracePeriodDays: number; // 유예 기간 (일)

  // 결제 정보
  paymentMethods: PaymentMethodInfo[];
  paymentInstructions: string; // 결제 안내 문구

  // 자동 청구서 발부
  autoInvoiceEnabled?: boolean; // 월회비 청구서 자동 발부 여부

  // 설정 메타데이터
  isActive: boolean;
  createdBy: string;
  createdAt: FirebaseTimestamp;
  updatedAt: FirebaseTimestamp;
}

// 결제 방법 정보
export interface PaymentMethodInfo {
  method: PaymentMethod;
  displayName: string; // 'Venmo', 'PayPal' 등
  qrCodeImageUrl?: string; // QR 코드 이미지 URL
  accountInfo?: string; // 계좌번호, ID 등
  instructions?: string; // 특별 안내사항
  isActive: boolean;
}

// 회원별 회비 납부 상태
export interface MemberDuesStatus {
  id: string;
  clubId: string;
  userId: string;

  // 기간 정보
  period: DuesPeriod;

  // 납부 상태
  status: PaymentStatus;
  amount: number;
  currency: string;

  // 납부 정보
  paidAt?: FirebaseTimestamp;
  paidMethod?: PaymentMethod;
  paidAmount?: number;
  transactionId?: string;

  // 관리 정보
  markedBy?: string; // 관리자가 수동 처리한 경우
  notes?: string;

  // 알림 정보
  reminderSentAt?: FirebaseTimestamp;
  reminderCount: number;

  // 메타데이터
  createdAt: FirebaseTimestamp;
  updatedAt: FirebaseTimestamp;
}

// 회비 기간
export interface DuesPeriod {
  year: number;
  month?: number; // 월회비의 경우만 (1-12)
  type: DuesType;

  // 기간 표시용
  displayName: string; // '2025년 1월', '2025년' 등

  // 납부 기한
  dueDate: FirebaseTimestamp;
  overdueDate: FirebaseTimestamp; // 연체 시작일
}

// 회비 납부 요약
export interface DuesPaymentSummary {
  clubId: string;
  period: DuesPeriod;

  // 통계
  totalMembers: number;
  paidMembers: number;
  unpaidMembers: number;
  overdueMembers: number;
  exemptMembers: number;

  // 금액
  totalExpected: number;
  totalCollected: number;
  totalPending: number;

  // 비율
  collectionRate: number; // 0-100

  lastUpdated: FirebaseTimestamp;
}

// 회원 정보 (회비 관리용)
export interface MemberForDues {
  userId: string;
  displayName: string;
  email?: string;
  profileImage?: string;
  joinedAt: FirebaseTimestamp;
  membershipType?: string;
  isActive: boolean;

  // 현재 회비 상태
  currentDuesStatus?: MemberDuesStatus;
}

// 회비 설정 요청
export interface UpdateDuesSettingsRequest {
  duesType: DuesType;
  amount: number;
  currency: string;
  dueDay: number;
  gracePeriodDays: number;
  paymentMethods: PaymentMethodInfo[];
  paymentInstructions: string;
  autoInvoiceEnabled?: boolean; // 월회비 청구서 자동 발부 여부
}

// 납부 처리 요청
export interface MarkAsPaidRequest {
  userId: string;
  period: DuesPeriod;
  paidAmount: number;
  paidMethod: PaymentMethod;
  transactionId?: string;
  notes?: string;
}

// 알림 발송 요청
export interface SendReminderRequest {
  userIds: string[];
  period: DuesPeriod;
  message?: string;
}

// 헬퍼 함수들
export const getCurrentPeriod = (duesType: DuesType): DuesPeriod => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  if (duesType === 'monthly') {
    return {
      year,
      month,
      type: 'monthly',
      displayName: `${year}년 ${month}월`,
      dueDate: new FirebaseTimestamp(Math.floor(new Date(year, month - 1, 5).getTime() / 1000), 0),
      overdueDate: new FirebaseTimestamp(
        Math.floor(new Date(year, month - 1, 15).getTime() / 1000),
        0
      ),
    };
  } else {
    return {
      year,
      type: 'yearly',
      displayName: `${year}년`,
      dueDate: new FirebaseTimestamp(Math.floor(new Date(year, 0, 31).getTime() / 1000), 0),
      overdueDate: new FirebaseTimestamp(Math.floor(new Date(year, 1, 28).getTime() / 1000), 0),
    };
  }
};

export const formatPeriod = (period: DuesPeriod): string => {
  return period.displayName;
};

export const getPaymentStatusColor = (status: PaymentStatus): string => {
  switch (status) {
    case 'paid':
      return '#4caf50';
    case 'unpaid':
      return '#ff9800';
    case 'overdue':
      return '#f44336';
    case 'pending_approval':
      return '#2196f3';
    case 'exempt':
      return '#9e9e9e';
    default:
      return '#666';
  }
};

/**
 * Get payment status text using translation function
 * @param status - Payment status key
 * @param t - Translation function from i18n
 * @returns Translated payment status text
 *
 * Usage:
 * const label = getPaymentStatusLabel('paid', t);
 */
export const getPaymentStatusLabel = (
  status: PaymentStatus,
  t: (key: string) => string
): string => {
  return t(`types.dues.paymentStatus.${status}`);
};

/**
 * @deprecated Use getPaymentStatusLabel(status, t) instead
 * This function will be removed in a future version
 */
export const getPaymentStatusText = (status: PaymentStatus, language: string = 'ko'): string => {
  const statusTexts: Record<string, Record<PaymentStatus, string>> = {
    ko: {
      paid: '납부 완료',
      unpaid: '미납',
      overdue: '연체',
      pending_approval: '승인 대기',
      exempt: '면제',
    },
    en: {
      paid: 'Paid',
      unpaid: 'Unpaid',
      overdue: 'Overdue',
      pending_approval: 'Pending Approval',
      exempt: 'Exempt',
    },
    ru: {
      paid: 'Оплачено',
      unpaid: 'Не оплачено',
      overdue: 'Просрочено',
      pending_approval: 'Ожидает подтверждения',
      exempt: 'Освобождён',
    },
    ja: {
      paid: '支払済',
      unpaid: '未払い',
      overdue: '延滞',
      pending_approval: '承認待ち',
      exempt: '免除',
    },
    zh: {
      paid: '已支付',
      unpaid: '未支付',
      overdue: '逾期',
      pending_approval: '待审批',
      exempt: '免除',
    },
    de: {
      paid: 'Bezahlt',
      unpaid: 'Unbezahlt',
      overdue: 'Überfällig',
      pending_approval: 'Ausstehend',
      exempt: 'Befreit',
    },
    fr: {
      paid: 'Payé',
      unpaid: 'Non payé',
      overdue: 'En retard',
      pending_approval: 'En attente',
      exempt: 'Exempté',
    },
    es: {
      paid: 'Pagado',
      unpaid: 'No pagado',
      overdue: 'Atrasado',
      pending_approval: 'Pendiente',
      exempt: 'Exento',
    },
    it: {
      paid: 'Pagato',
      unpaid: 'Non pagato',
      overdue: 'Scaduto',
      pending_approval: 'In attesa',
      exempt: 'Esente',
    },
    pt: {
      paid: 'Pago',
      unpaid: 'Não pago',
      overdue: 'Atrasado',
      pending_approval: 'Pendente',
      exempt: 'Isento',
    },
  };
  // Fallback to 'en' if language is not supported
  const texts = statusTexts[language] || statusTexts.en;
  return texts[status] || status;
};

export const calculateCollectionRate = (summary: DuesPaymentSummary): number => {
  if (summary.totalMembers === 0) return 0;
  return Math.round((summary.paidMembers / summary.totalMembers) * 100);
};

// ============================================
// 회비 레코드 시스템 (신규 - 개별 회비 추적용)
// ============================================

// 회원별 회비 기록 (개별 회비 유형별 기록)
export interface MemberDuesRecord {
  id: string;
  clubId: string;
  userId: string;

  // 회비 유형
  duesType: DuesType;

  // 기간 정보 (월회비/연회비용)
  period?: {
    year: number;
    month?: number; // monthly인 경우만
  };

  // 금액
  amount: number;
  currency: string;

  // 납부 상태
  status: PaymentStatus;

  // 납부 정보
  paidAt?: FirebaseTimestamp;
  paidMethod?: PaymentMethod;
  paidAmount?: number;
  transactionId?: string;

  // 회원 납부 요청 (pending_approval일 때)
  paymentRequestedAt?: FirebaseTimestamp;
  paymentRequestedMethod?: PaymentMethod;
  paymentProofImageUrl?: string;
  requestNotes?: string;
  requestedAmount?: number;
  requestedPaymentType?: 'monthly' | 'quarterly' | 'yearly' | 'custom';

  // 관리자 처리
  markedBy?: string;
  approvedBy?: string;
  rejectedReason?: string;
  notes?: string;

  // 연체료 관련 (late_fee 타입일 때)
  relatedDuesId?: string;

  // 알림 정보
  reminderSentAt?: FirebaseTimestamp;
  reminderCount: number;

  // 메타데이터
  createdAt: FirebaseTimestamp;
  updatedAt: FirebaseTimestamp;
}

// 회원 회비 현황 (종합)
export interface MemberDuesSummary {
  userId: string;
  displayName: string;
  email?: string;
  profileImage?: string;
  joinedAt: FirebaseTimestamp;

  // 면제 상태
  isDuesExempt?: boolean;
  exemptReason?: string;

  // 각 회비별 상태
  joinFee: MemberDuesRecord | null;
  currentMonthDues: MemberDuesRecord | null;
  currentYearDues: MemberDuesRecord | null;
  lateFees: MemberDuesRecord[];

  // 총액
  totalOwed: number;
  totalPaid: number;
}

// 납부 요청 생성 요청
export interface PaymentApprovalRequest {
  recordId: string;
  userId: string;
  paymentMethod: PaymentMethod;
  proofImageUrl?: string;
  notes?: string;
}

// 납부 승인/거절 요청
export interface PaymentApprovalAction {
  recordId: string;
  actionBy: string;
  reason?: string; // 거절 시 사유
}

// 연체료 추가 요청
export interface AddLateFeeRequest {
  clubId: string;
  userId: string;
  amount: number;
  relatedDuesId?: string;
  notes?: string;
}

/**
 * Get dues type label using translation function
 * @param duesType - Dues type key
 * @param t - Translation function from i18n
 * @returns Translated dues type label
 *
 * Usage:
 * const label = getDuesTypeLabel('monthly', t);
 */
export const getDuesTypeLabel = (duesType: DuesType, t: (key: string) => string): string => {
  return t(`types.dues.duesTypes.${duesType}`);
};

/**
 * @deprecated Use getDuesTypeLabel(duesType, t) instead
 * This function will be removed in a future version
 */
export const getDuesTypeText = (duesType: DuesType, language: string = 'ko'): string => {
  const texts: Record<string, Record<DuesType, string>> = {
    ko: {
      join: '가입비',
      monthly: '월회비',
      quarterly: '분기회비',
      yearly: '연회비',
      late_fee: '연체료',
    },
    en: {
      join: 'Join Fee',
      monthly: 'Monthly Dues',
      quarterly: 'Quarterly Dues',
      yearly: 'Yearly Dues',
      late_fee: 'Late Fee',
    },
    ru: {
      join: 'Вступительный взнос',
      monthly: 'Ежемесячный взнос',
      quarterly: 'Ежеквартальный взнос',
      yearly: 'Ежегодный взнос',
      late_fee: 'Штраф за просрочку',
    },
    ja: {
      join: '入会費',
      monthly: '月会費',
      quarterly: '四半期会費',
      yearly: '年会費',
      late_fee: '延滞料',
    },
    zh: {
      join: '入会费',
      monthly: '月费',
      quarterly: '季度费',
      yearly: '年费',
      late_fee: '滞纳金',
    },
    de: {
      join: 'Aufnahmegebühr',
      monthly: 'Monatsbeitrag',
      quarterly: 'Quartalsbeitrag',
      yearly: 'Jahresbeitrag',
      late_fee: 'Säumnisgebühr',
    },
    fr: {
      join: "Frais d'inscription",
      monthly: 'Cotisation mensuelle',
      quarterly: 'Cotisation trimestrielle',
      yearly: 'Cotisation annuelle',
      late_fee: 'Frais de retard',
    },
    es: {
      join: 'Cuota de inscripción',
      monthly: 'Cuota mensual',
      quarterly: 'Cuota trimestral',
      yearly: 'Cuota anual',
      late_fee: 'Recargo por mora',
    },
    it: {
      join: 'Quota di iscrizione',
      monthly: 'Quota mensile',
      quarterly: 'Quota trimestrale',
      yearly: 'Quota annuale',
      late_fee: 'Penale per ritardo',
    },
    pt: {
      join: 'Taxa de inscrição',
      monthly: 'Mensalidade',
      quarterly: 'Taxa trimestral',
      yearly: 'Taxa anual',
      late_fee: 'Multa por atraso',
    },
  };
  // Fallback to 'en' if language is not supported
  const duesTexts = texts[language] || texts.en;
  return duesTexts[duesType] || duesType;
};

/**
 * @deprecated Use getPaymentStatusLabel(status, t) instead
 * This is the same as getPaymentStatusText and will be removed
 */
export const getExtendedPaymentStatusText = (
  status: PaymentStatus,
  language: string = 'ko'
): string => {
  const statusTexts: Record<string, Record<PaymentStatus, string>> = {
    ko: {
      paid: '납부 완료',
      unpaid: '미납',
      overdue: '연체',
      pending_approval: '승인 대기',
      exempt: '면제',
    },
    en: {
      paid: 'Paid',
      unpaid: 'Unpaid',
      overdue: 'Overdue',
      pending_approval: 'Pending Approval',
      exempt: 'Exempt',
    },
    ru: {
      paid: 'Оплачено',
      unpaid: 'Не оплачено',
      overdue: 'Просрочено',
      pending_approval: 'Ожидает подтверждения',
      exempt: 'Освобождён',
    },
    ja: {
      paid: '支払済',
      unpaid: '未払い',
      overdue: '延滞',
      pending_approval: '承認待ち',
      exempt: '免除',
    },
    zh: {
      paid: '已支付',
      unpaid: '未支付',
      overdue: '逾期',
      pending_approval: '待审批',
      exempt: '免除',
    },
    de: {
      paid: 'Bezahlt',
      unpaid: 'Unbezahlt',
      overdue: 'Überfällig',
      pending_approval: 'Ausstehend',
      exempt: 'Befreit',
    },
    fr: {
      paid: 'Payé',
      unpaid: 'Non payé',
      overdue: 'En retard',
      pending_approval: 'En attente',
      exempt: 'Exempté',
    },
    es: {
      paid: 'Pagado',
      unpaid: 'No pagado',
      overdue: 'Atrasado',
      pending_approval: 'Pendiente',
      exempt: 'Exento',
    },
    it: {
      paid: 'Pagato',
      unpaid: 'Non pagato',
      overdue: 'Scaduto',
      pending_approval: 'In attesa',
      exempt: 'Esente',
    },
    pt: {
      paid: 'Pago',
      unpaid: 'Não pago',
      overdue: 'Atrasado',
      pending_approval: 'Pendente',
      exempt: 'Isento',
    },
  };
  // Fallback to 'en' if language is not supported
  const texts = statusTexts[language] || statusTexts.en;
  return texts[status] || status;
};

// 확장된 납부 상태 색상 (pending_approval 추가)
export const getExtendedPaymentStatusColor = (status: PaymentStatus): string => {
  switch (status) {
    case 'paid':
      return '#4caf50'; // Green
    case 'unpaid':
      return '#ff9800'; // Orange
    case 'overdue':
      return '#f44336'; // Red
    case 'pending_approval':
      return '#2196f3'; // Blue
    case 'exempt':
      return '#9e9e9e'; // Gray
    default:
      return '#666';
  }
};

// ============================================
// 연회비 면제 기간 시스템
// ============================================

// 회원별 연회비 면제 정보
export interface MemberYearlyDuesExemption {
  id: string;
  clubId: string;
  userId: string;

  // 연회비 시작 정보
  startYear: number;
  startMonth: number; // 1-12

  // 면제 종료 정보 (시작월로부터 12개월)
  endYear: number;
  endMonth: number;

  // 연회비 납부 기록 참조
  yearlyDuesRecordId: string;

  // 메타데이터
  createdAt: FirebaseTimestamp;
  createdBy: string;
}

// ============================================
// 회비 보고서 시스템
// ============================================

// 연간 회비 수입 보고서
export interface AnnualDuesReport {
  id: string;
  clubId: string;
  year: number;

  // 회원 통계
  totalMembers: number;
  activeMembers: number;
  newMembers: number; // 해당 연도에 가입한 회원 수

  // 수입 요약
  totalRevenue: number;
  currency: string;

  // 회비 유형별 수입
  joinFeeRevenue: number;
  monthlyDuesRevenue: number;
  yearlyDuesRevenue: number;
  lateFeeRevenue: number;

  // 월별 수입 내역
  monthlyBreakdown: MonthlyRevenueBreakdown[];

  // 미수금
  totalOutstanding: number;
  overdueAmount: number;

  // 징수율
  collectionRate: number; // 0-100%

  // 보고서 메타데이터
  generatedAt: FirebaseTimestamp;
  generatedBy?: string; // 수동 생성 시
}

// 월별 수입 내역
export interface MonthlyRevenueBreakdown {
  month: number; // 1-12
  joinFee: number;
  monthlyDues: number;
  yearlyDues: number;
  lateFee: number;
  total: number;
  paidCount: number; // 납부 건수
}

// 회원 납부 이력 (3년 보관용)
export interface MemberPaymentHistory {
  userId: string;
  displayName: string;
  records: MemberDuesRecord[];
  totalPaid: number;
  totalOutstanding: number;
}

// 납부 이력 조회 필터
export interface PaymentHistoryFilter {
  clubId: string;
  userId?: string; // 특정 회원만 조회 시
  startDate?: Date;
  endDate?: Date;
  duesType?: DuesType;
  status?: PaymentStatus;
  year?: number;
}

// 납부 이력 조회 결과
export interface PaymentHistoryResult {
  records: MemberDuesRecord[];
  totalCount: number;
  totalAmount: number;
  summary: {
    paid: number;
    unpaid: number;
    overdue: number;
    pendingApproval: number;
  };
}

/**
 * Format period string using translation function
 * @param year - Year number
 * @param month - Month number (optional)
 * @param t - Translation function from i18n
 * @returns Formatted period string
 *
 * Usage:
 * const period = formatPeriodString(2025, 1, t); // "2025년 1월" or "1/2025"
 */
export const formatPeriodString = (
  year: number,
  month?: number,
  t?: (key: string, params?: Record<string, string | number>) => string
): string => {
  if (month) {
    return t ? t('types.dues.period.yearMonth', { year, month }) : `${year}년 ${month}월`;
  }
  return t ? t('types.dues.period.year', { year }) : `${year}년`;
};

// 연회비 면제 기간 계산 헬퍼
export const calculateYearlyExemptionPeriod = (
  startYear: number,
  startMonth: number
): { endYear: number; endMonth: number } => {
  // 시작월로부터 11개월 후 (총 12개월)
  let endMonth = startMonth - 1; // 시작월 전달까지 면제
  let endYear = startYear + 1;

  if (endMonth <= 0) {
    endMonth = 12 + endMonth;
    endYear = startYear;
  }

  return { endYear, endMonth };
};

// 특정 월이 면제 기간 내인지 확인
export const isMonthExempted = (
  checkYear: number,
  checkMonth: number,
  startYear: number,
  startMonth: number,
  endYear: number,
  endMonth: number
): boolean => {
  const checkDate = checkYear * 12 + checkMonth;
  const startDate = startYear * 12 + startMonth;
  const endDate = endYear * 12 + endMonth;

  return checkDate >= startDate && checkDate <= endDate;
};

// ============================================
// 분기 회비 면제 시스템
// ============================================

// 회원별 분기 회비 면제 정보 (3개월 면제)
export interface MemberQuarterlyDuesExemption {
  id: string;
  clubId: string;
  userId: string;

  // 분기 회비 시작 정보
  startYear: number;
  startMonth: number; // 1-12

  // 면제 종료 정보 (시작월로부터 3개월)
  endYear: number;
  endMonth: number;

  // 분기 회비 납부 기록 참조
  quarterlyDuesRecordId: string;

  // 메타데이터
  createdAt: FirebaseTimestamp;
  createdBy: string;
}

// 분기 면제 기간 계산 헬퍼 (3개월)
export const calculateQuarterlyExemptionPeriod = (
  startYear: number,
  startMonth: number
): { endYear: number; endMonth: number } => {
  // 시작월로부터 2개월 후 (총 3개월 면제: 시작월 포함)
  let endMonth = startMonth + 2;
  let endYear = startYear;

  if (endMonth > 12) {
    endMonth = endMonth - 12;
    endYear = startYear + 1;
  }

  return { endYear, endMonth };
};

// 납부 금액으로 회비 유형 판별
export const determineDuesTypeByAmount = (
  paidAmount: number,
  monthlyFee: number,
  quarterlyFee?: number,
  yearlyFee?: number
): { duesType: DuesType; exemptMonths: number } => {
  // 연회비 금액과 일치하면 연회비 (12개월 면제)
  if (yearlyFee && paidAmount === yearlyFee) {
    return { duesType: 'yearly', exemptMonths: 12 };
  }

  // 분기 회비 금액과 일치하면 분기회비 (3개월 면제)
  if (quarterlyFee && paidAmount === quarterlyFee) {
    return { duesType: 'quarterly', exemptMonths: 3 };
  }

  // 월회비 금액과 일치하면 월회비 (0개월 면제 - 해당 월만)
  if (paidAmount === monthlyFee) {
    return { duesType: 'monthly', exemptMonths: 0 };
  }

  // 금액이 정확히 일치하지 않으면 월회비로 처리
  return { duesType: 'monthly', exemptMonths: 0 };
};

// ============================================
// 커스텀 금액 면제 시스템
// ============================================

// 커스텀 금액으로 몇 개월 면제 + 나머지 크레딧 계산
export const calculateCustomAmountExemption = (
  paidAmount: number,
  monthlyFee: number
): { fullMonths: number; remainingCredit: number } => {
  if (monthlyFee <= 0) {
    return { fullMonths: 0, remainingCredit: 0 };
  }

  // 완전히 커버되는 개월 수
  const fullMonths = Math.floor(paidAmount / monthlyFee);
  // 나머지 금액 (다음 달 크레딧)
  const remainingCredit = paidAmount % monthlyFee;

  return { fullMonths, remainingCredit };
};

// 커스텀 금액 면제 정보
export interface MemberCustomExemption {
  id: string;
  clubId: string;
  userId: string;

  // 면제 기간
  startYear: number;
  startMonth: number;
  endYear: number;
  endMonth: number;

  // 나머지 크레딧 (다음 달에 적용할 금액)
  remainingCredit: number;
  // 크레딧 적용 대상 월
  creditApplyYear?: number;
  creditApplyMonth?: number;

  // 납부 기록 참조
  duesRecordId: string;

  // 메타데이터
  createdAt: FirebaseTimestamp;
  createdBy: string;
}

// 커스텀 면제 기간 계산 헬퍼
export const calculateCustomExemptionPeriod = (
  startYear: number,
  startMonth: number,
  fullMonths: number
): { endYear: number; endMonth: number; creditApplyYear: number; creditApplyMonth: number } => {
  // fullMonths가 0이면 현재 월만 (면제 없음)
  if (fullMonths <= 0) {
    return {
      endYear: startYear,
      endMonth: startMonth,
      creditApplyYear: startYear,
      creditApplyMonth: startMonth,
    };
  }

  // 면제 종료월 계산 (시작월 포함하므로 fullMonths - 1)
  let endMonth = startMonth + fullMonths - 1;
  let endYear = startYear;

  while (endMonth > 12) {
    endMonth -= 12;
    endYear += 1;
  }

  // 크레딧 적용월 (면제 종료 다음 달)
  let creditApplyMonth = endMonth + 1;
  let creditApplyYear = endYear;

  if (creditApplyMonth > 12) {
    creditApplyMonth = 1;
    creditApplyYear += 1;
  }

  return { endYear, endMonth, creditApplyYear, creditApplyMonth };
};
