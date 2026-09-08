export type SocialProvider = "카카오" | "네이버" | "구글";

/**
 * 고객 로그인 세션 목업 저장소(S0-C1/S0-C2 회원가입, S0-C3/TopNav 로그아웃). 실제로는 로그인
 * 세션 API(예: POST /api/customer/login, /api/customer/logout)로 대체될 자리다. 메모리에만
 * 저장되므로 새로고침하면 초기화된다 — memberData.ts/reservationData.ts/CartContext.tsx와
 * 같은 한계. 다른 목업 저장소들처럼 context로 구독하지 않고 "읽을 때마다 최신값을 읽는" 방식만
 * 쓴다 — 로그인/로그아웃은 항상 페이지 이동(router.push)을 동반해서, 이동한 페이지가 다시
 * 렌더링될 때 이 값을 새로 읽으면 충분하기 때문이다.
 *
 * 로그인 기능이 이제 막 생겨서, "이미 로그인된 회원이 쓰고 있다"고 가정해 온 기존 화면들
 * (예약 목록·장바구니·내정보)과의 호환을 위해 기본값은 로그인 상태(true)로 시작한다 — 로그
 * 아웃을 실제로 눌러야만 로그아웃 상태를 볼 수 있고, 새로고침만 해도 우연히 로그인 화면부터
 * 보게 되는 일은 없다.
 */
let isLoggedIn = true;

// S0-C1(소셜 로그인) → S0-C2(아이디 입력) 사이에서 "어떤 소셜로 시작했는지"를 잠깐 들고 있는
// 값. 실제로는 소셜 인증 콜백에서 서버가 넘겨주는 값이 될 자리다.
let pendingProvider: SocialProvider | null = null;

export function getIsLoggedIn(): boolean {
  return isLoggedIn;
}

/** S0-C1 소셜 버튼 클릭(가입 흐름) — 실제로는 여기서 소셜 인증 리다이렉트가 시작된다. */
export function startSocialLogin(provider: SocialProvider): void {
  pendingProvider = provider;
}

export function getPendingProvider(): SocialProvider | null {
  return pendingProvider;
}

/**
 * 로그인 처리(재방문 회원의 /login 소셜 버튼, 또는 S0-C2 "가입 완료" 직후) — 실제로는 로그인
 * 세션 발급 API 응답으로 대체된다.
 */
export function completeLogin(): void {
  isLoggedIn = true;
  pendingProvider = null;
}

/** S0-C3 로그아웃/회원 탈퇴, TopNav 로그아웃 — 실제로는 POST /api/customer/logout(탈퇴는 DELETE /member) 호출로 교체. */
export function logout(): void {
  isLoggedIn = false;
  pendingProvider = null;
}
