import type { DepositAccount } from "@chinguya/types";

/**
 * 입금 계좌 목업 데이터 (고객앱 입금 안내 화면, S1-C4용).
 * apps/admin/src/data/settingsData.ts의 depositAccount와 같은 값을 가리키는 별도 사본이다 —
 * 실제로는 관리자가 설정한 계좌를 두 앱이 같은 API(GET /api/settings)로 조회하게 되므로 이
 * 중복은 임시다. 관리자가 계좌를 바꾸면 이 파일도 같이 맞춰야 한다.
 */
export const depositAccount: DepositAccount = {
  bankName: "신한은행",
  accountNumber: "110-123-456789",
  accountHolder: "(주)친구야",
};
