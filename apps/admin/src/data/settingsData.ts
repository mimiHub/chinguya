import type { CancellationFeeRule, DepositAccount } from "@chinguya/types";
import { OFF_SITE_RETURN_FEE_KRW } from "@chinguya/types";

/**
 * S1-A10 계좌 · 정책 설정 목업 데이터.
 * 실제로는 GET/PUT /api/admin/settings 로 대체될 자리다.
 */
export const depositAccount: DepositAccount = {
  bankName: "신한은행",
  accountNumber: "110-123-456789",
  accountHolder: "(주)친구야",
};

/**
 * 취소 수수료율. daysBeforeUse가 클수록(이용일까지 여유가 많을수록) 요율이 낮다 —
 * 목록은 daysBeforeUse 내림차순으로 정렬해서 관리자가 위에서부터 읽었을 때
 * "여유 있게 취소하면 수수료가 적다"는 흐름이 자연스럽게 보이도록 했다.
 */
export const cancellationFeeRules: CancellationFeeRule[] = [
  { daysBeforeUse: 7, feeRate: 0 },
  { daysBeforeUse: 3, feeRate: 0.3 },
  { daysBeforeUse: 1, feeRate: 0.5 },
  { daysBeforeUse: 0, feeRate: 1 },
];

/** 타지역 반납 추가요금은 지금은 전 상품 공통 고정값(packages/types 상수) — 여기서는 참고용으로만 보여준다 */
export const offSiteReturnFeeKrw = OFF_SITE_RETURN_FEE_KRW;

/**
 * 이용일까지 남은 일수(D-day). 예약 취소 시 어느 요율 구간이 적용되는지 판정하는 기준이다.
 * '오늘'은 실제로는 일본 기준(JST)으로 판정해야 하지만(packages/types의 BOOKING_WINDOW 문서
 * 참고), 다른 화면들(예: page.tsx의 "오늘" 필터 TODO)과 마찬가지로 지금은 로컬 자정 기준
 * 근사치를 쓴다 — 정확한 JST 처리는 실제 백엔드 연동 시 함께 반영한다.
 */
export function daysBeforeUse(useDate: string, now: Date = new Date()): number {
  const use = new Date(`${useDate}T00:00:00`);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((use.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
}

/**
 * 남은 일수(daysBeforeUse)에 해당하는 취소 수수료율을 요율표에서 조회한다. 규칙을
 * daysBeforeUse 내림차순으로 본 뒤, 남은 일수가 그 이상인 첫 규칙을 적용한다
 * (예: 7일↑0% / 3일↑30% / 1일↑50% / 0일↑100% 표에서 실제 5일 남았으면 "3일 이상" 규칙의
 * 30%가 적용). 이용일이 이미 지났으면(음수) 0일로 취급해 가장 높은 요율을 적용한다.
 * 규칙 배열이 비어 있으면 0을 반환한다(수수료 없음으로 안전하게 처리).
 */
export function resolveCancellationFeeRate(rules: CancellationFeeRule[], days: number): number {
  if (rules.length === 0) return 0;
  const effectiveDays = Math.max(0, days);
  const sortedDesc = [...rules].sort((a, b) => b.daysBeforeUse - a.daysBeforeUse);
  const matched = sortedDesc.find((rule) => effectiveDays >= rule.daysBeforeUse);
  return (matched ?? sortedDesc[sortedDesc.length - 1])!.feeRate;
}
