import type { AdminRole } from "@chinguya/types";

/**
 * 관리자 계정 목업 — 이제 **S0-A5/A6 관리자 관리 화면 전용**이다.
 * 로그인(S0-A2)은 Core API 실연동으로 넘어갔다(AdminAuthContext 참고).
 *
 * 관리자 계정 CRUD API는 아직 없다(V3__admin_auth.sql이 범위 밖으로 명시). 그래서 그 화면만
 * 이 목을 계속 쓰며, 화면 안에서만 추가/삭제되고 새로고침하면 초기화된다.
 */
export interface AdminAccount {
  id: string;
  password: string;
  name: string;
  role: AdminRole;
}

export const adminAccounts: AdminAccount[] = [
  { id: "admin1", password: "admin1234", name: "김민준", role: "STAFF" },
  { id: "super1", password: "super1234", name: "박서연", role: "SUPER_ADMIN" },
];
