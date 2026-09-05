import { NextResponse, type NextRequest } from "next/server";

/**
 * 관리자 앱 라우트 보호 (S0-A2).
 *
 * 액세스 토큰 쿠키의 **유무만** 본다. 서명·만료 검증은 하지 않는다 — 미들웨어는 Edge에서
 * 돌고 검증 키를 여기 두면 시크릿이 하나 더 늘어나기 때문이다. 만료된 토큰은 이 관문을
 * 통과하지만, 화면이 세션을 조회할 때 Core가 401을 주고 AdminAuthProvider가 /login으로
 * 되돌린다. 진짜 인가 경계는 언제나 서버(Core API)다.
 */

const COOKIE_NAME = "admin_access_token";

export function middleware(request: NextRequest) {
  const hasToken = request.cookies.has(COOKIE_NAME);
  const isLoginPage = request.nextUrl.pathname === "/login";

  if (!hasToken && !isLoginPage) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (hasToken && isLoginPage) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  return NextResponse.next();
}

export const config = {
  // 세션 API(로그인 자체)와 정적 자원은 제외한다 — 로그인 요청까지 막으면 들어올 길이 없다.
  matcher: ["/((?!api/admin/session|_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
};
