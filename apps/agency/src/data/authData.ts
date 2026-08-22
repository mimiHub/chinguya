/**
 * 여행사 계정 목업 (S2-G1/G2 계정 등록·로그인용).
 * 실제로는 관리자가 보낸 초대 이메일 링크(토큰)로 계정을 등록하고, 이후 이 계정으로
 * 로그인하는 흐름이 된다 — 지금은 백엔드가 없어서 미리 등록된 계정 하나만 흉내낸다.
 *
 * apps/admin/src/data/agencyData.ts의 agency-1(제주바다여행사)과 같은 여행사를 가리키는
 * 별도 사본이다(실제로는 같은 Agency 레코드를 두 앱이 API로 공유하게 될 자리).
 */
export interface AgencyAccount {
  id: string;
  password: string;
  agencyId: string;
  agencyName: string;
}

export const agencyAccounts: AgencyAccount[] = [
  { id: "agency01", password: "agency1234", agencyId: "agency-1", agencyName: "제주바다여행사" },
];

export function findAgencyAccount(id: string, password: string): AgencyAccount | undefined {
  return agencyAccounts.find((a) => a.id === id && a.password === password);
}

/**
 * 로그인 세션이 아직 없어서(새로고침하면 풀림), 로그인 이후 화면들은 이 값을 "현재 로그인한
 * 여행사"로 취급한다. 실제로는 로그인 성공 시 저장된 세션/토큰에서 가져와야 한다.
 */
export const CURRENT_AGENCY = { id: "agency-1", name: "제주바다여행사" };
