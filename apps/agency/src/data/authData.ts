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

/**
 * 헤더의 로그인/회원가입 버튼 ↔ 로그인 정보 표시를 전환하기 위한 로그인 여부 목업.
 * 기본값은 false다 — 대시보드 화면 자체는 (아직 실제 로그인 가드가 없어서) 로그인 없이도
 * 들어와지지만, 헤더는 "아직 로그인하지 않은 방문자"를 기본으로 보여줘야 로그인 버튼이 뜬다.
 * /login에서 로그인에 성공하면 login()으로 true가 되고, 사이드바 로그아웃을 누르면
 * logout()으로 다시 false가 된다.
 *
 * 고객 앱 authData.ts와 달리 메모리에만 두지 않고 localStorage에도 같이 저장한다 — 메모리만
 * 쓰면 브라우저 새로고침은 물론, 개발 중 코드를 저장할 때마다 일어나는 Next.js Fast Refresh
 * (모듈이 다시 초기화됨)에도 로그인 상태가 풀려서, 로그아웃을 누르지 않았는데도 헤더가
 * 로그아웃 상태로 보이는 문제가 있었다. localStorage 값을 모듈 로드 시 한 번 읽어와 초기값으로
 * 쓰면 새로고침·Fast Refresh를 거쳐도 유지된다. 서버 렌더링 중에는 window가 없으므로
 * typeof window 체크로 건너뛴다(그때는 기본값 false로 렌더링되고, 클라이언트에서 곧
 * 실제 값으로 다시 그려진다).
 */
const STORAGE_KEY = "chinguya-agency-auth";

function readStoredAuth(): { id: string } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as { id: string }) : null;
  } catch {
    return null;
  }
}

const stored = readStoredAuth();
let isLoggedIn = stored !== null;
// 헤더에 표시할 값 — 여행사명이 아니라 로그인에 쓴 아이디(agency01)를 그대로 보여준다.
let loggedInId: string | null = stored?.id ?? null;

export function getIsLoggedIn(): boolean {
  return isLoggedIn;
}

export function getLoggedInId(): string | null {
  return loggedInId;
}

/** /login 로그인 성공 시 호출 — 실제로는 로그인 세션 발급 API 응답(계정 아이디 포함)으로 대체된다. */
export function login(id: string): void {
  isLoggedIn = true;
  loggedInId = id;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ id }));
  }
}

/** 사이드바 로그아웃 클릭 시 호출 — 실제로는 POST /api/agency/logout 호출로 교체. */
export function logout(): void {
  isLoggedIn = false;
  loggedInId = null;
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(STORAGE_KEY);
  }
}
