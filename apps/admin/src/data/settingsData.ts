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
