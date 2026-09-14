import type { DepositAccount } from "@chinguya/types";

/**
 * 입금 계좌 목업 데이터 (고객앱 입금 안내 화면, S1-C4용).
 * 관리자는 이미 설정 화면(S1-A10)에서 Core API(PUT /admin/settings)로 계좌를 저장한다 —
 * 고객앱은 예약 API가 생기면 입금 안내 조회(GET /v1/bookings/{bookingId}/deposit-info)로
 * 그 계좌를 받게 되므로 이 목업은 임시다.
 */
export const depositAccount: DepositAccount = {
  bankName: "신한은행",
  accountNumber: "110-123-456789",
  accountHolder: "(주)친구야",
};
