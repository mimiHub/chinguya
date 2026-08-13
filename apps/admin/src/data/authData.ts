import type { AdminLevel } from "@chinguya/types";

/**
 * 관리자 계정 목업 (S0-A2 로그인 / S0-A5,A6 관리자 관리에서 함께 쓴다).
 * 실제로는 POST /api/admin/login 응답으로 대체된다. 지금은 백엔드/세션이 없어서
 * 로그인에 성공해도 실제 로그인 상태가 유지되지는 않는다(새로고침하면 풀림) — 다음 단계에서
 * 세션/토큰 저장 방식이 정해지면 이 자리를 교체한다.
 */
export interface AdminAccount {
  id: string;
  password: string;
  name: string;
  level: AdminLevel;
}

export const adminAccounts: AdminAccount[] = [
  { id: "admin1", password: "admin1234", name: "김민준", level: "admin" },
  { id: "super1", password: "super1234", name: "박서연", level: "superadmin" },
];

export function findAdminAccount(id: string, password: string): AdminAccount | undefined {
  return adminAccounts.find((a) => a.id === id && a.password === password);
}
