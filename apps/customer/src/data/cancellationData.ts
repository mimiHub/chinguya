import type { CancellationFeeRule } from "@chinguya/types";

/**
 * 취소 수수료율 목업 데이터 (고객앱 취소 요청 화면, S1-C7용).
 * apps/admin/src/data/settingsData.ts의 cancellationFeeRules와 같은 값을 가리키는 별도
 * 사본이다 — 실제로는 관리자가 설정한 요율표를 두 앱이 같은 API로 조회하게 되므로 이 중복은
 * 임시다. 관리자가 요율을 바꾸면 이 파일도 같이 맞춰야 한다.
 */
export const cancellationFeeRules: CancellationFeeRule[] = [
  { daysBeforeUse: 7, feeRate: 0 },
  { daysBeforeUse: 3, feeRate: 0.3 },
  { daysBeforeUse: 1, feeRate: 0.5 },
  { daysBeforeUse: 0, feeRate: 1 },
];

/**
 * 이용일까지 남은 일수(daysBeforeUse)에 맞는 수수료율을 찾는다.
 * 요율표는 daysBeforeUse 내림차순으로 정의돼 있다 — "여유가 많을수록 수수료가 적다"는 규칙에
 * 따라, 남은 일수가 각 임계값 이상인 것 중 가장 큰 임계값의 요율을 적용한다.
 */
export function getCancellationFeeRate(daysBeforeUse: number): number {
  const sorted = [...cancellationFeeRules].sort((a, b) => b.daysBeforeUse - a.daysBeforeUse);
  const matched = sorted.find((rule) => daysBeforeUse >= rule.daysBeforeUse);
  return matched?.feeRate ?? 1;
}

/** 오늘부터 이용일까지 남은 일수(음수면 이미 지난 날짜) */
export function getDaysBeforeUse(useDate: string, now: Date = new Date()): number {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(useDate);
  const diffMs = target.getTime() - today.getTime();
  return Math.round(diffMs / (24 * 60 * 60 * 1000));
}
