import { NextResponse, type NextRequest } from "next/server";

/**
 * 여행사 앱 라우트 보호 (S2-G2).
 *
 * 액세스 토큰 쿠키의 **유무만** 본다. 서명·만료 검증은 하지 않는다 — 미들웨어는 Edge에서
 * 돌고 검증 키를 여기 두면 시크릿이 하나 더 늘어나기 때문이다. 만료된 토큰은 이 관문을
 * 통과하지만, 화면이 세션을 조회할 때 Core가 401을 주고 AgencyAuthProvider가 /login으로
 * 되돌린다. 진짜 인가 경계는 언제나 서버(Core API)다.
 *
 * 관리자 앱의 미들웨어와 같은 구조지만 한 가지가 다르다: **초대 링크는 로그인 상태에서도
 * 통과시켜야 한다.** 초대 링크(/login?token=…)는 계정 등록 화면이고, 이미 로그인한
 * 브라우저에서 다른 여행사의 초대 링크를 열 수 있다 — 그때 대시보드로 튕겨 버리면
 * 담당자는 이유도 모른 채 등록을 못 한다.
 */

const COOKIE_NAME = "agency_access_token";

export function middleware(request: NextRequest) {
  const hasToken = request.cookies.has(COOKIE_NAME);
  const isLoginPage = request.nextUrl.pathname === "/login";
  const hasInviteToken = request.nextUrl.searchParams.has("token");

  if (!hasToken && !isLoginPage) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (hasToken && isLoginPage && !hasInviteToken) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  return NextResponse.next();
}

export const config = {
  // 세션 API(로그인 자체)·Core 프록시·정적 자원은 제외한다.
  // 로그인 요청까지 막으면 들어올 길이 없고, API 경로를 /login 으로 리다이렉트하면
  // fetch 하는 쪽이 401 대신 로그인 HTML을 받아 에러 처리를 못 한다 — 인가는 Core가 한다.
  matcher: ["/((?!api/agency/session|api/core|_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
};
