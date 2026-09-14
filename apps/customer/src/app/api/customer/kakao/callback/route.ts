import { NextResponse, type NextRequest } from "next/server";
import {
  ACCESS_COOKIE,
  REDIRECT_COOKIE,
  SIGNUP_COOKIE,
  STATE_COOKIE,
  cookieOptions,
  coreBaseUrl,
  readSetCookie,
  safeRedirect,
} from "../../coreSession";

/** state·redirect 쿠키는 1회용이다. 성공·실패와 무관하게 지운다. */
function clearOAuthCookies(res: NextResponse): NextResponse {
  res.cookies.delete(STATE_COOKIE);
  res.cookies.delete(REDIRECT_COOKIE);
  return res;
}

/**
 * GET — 카카오 콜백.
 *
 * ⚠ 카카오 개발자 콘솔에 등록하는 Redirect URI 가 바로 이 경로다
 *   (`{고객 앱 오리진}/api/customer/kakao/callback`). Core 의 KAKAO_REDIRECT_URI 와 글자까지 같아야 한다.
 *
 * state 를 대조한 뒤 Core 에 인가 코드를 넘기고, 결과에 따라
 * - 가입된 회원 → access_token 쿠키 → 원래 가려던 화면
 * - 처음 온 사람 → signup_token 쿠키 → /signup?step=id (S0-C2 아이디 입력)
 * 으로 보낸다. 사용자가 동의를 취소했거나 무엇이든 실패하면 /login?error=kakao.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const code = params.get("code");
  const state = params.get("state");
  const savedState = request.cookies.get(STATE_COOKIE)?.value;
  const redirectTo = safeRedirect(request.cookies.get(REDIRECT_COOKIE)?.value);

  const fail = () => clearOAuthCookies(NextResponse.redirect(new URL("/login?error=kakao", request.url)));

  // code 가 없으면 사용자가 동의를 취소한 경우다(카카오가 error 파라미터를 붙여 보낸다).
  if (!code || !state || state !== savedState) {
    return fail();
  }

  try {
    const core = await fetch(`${coreBaseUrl()}/v1/auth/kakao/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ code }),
      cache: "no-store",
    });
    if (!core.ok) {
      console.error("[kakao/callback] Core", core.status, await core.text());
      return fail();
    }
    const body = (await core.json()) as { result: "LOGGED_IN" | "SIGNUP_REQUIRED" };

    if (body.result === "LOGGED_IN") {
      const token = readSetCookie(core, ACCESS_COOKIE);
      if (!token) return fail();
      const res = NextResponse.redirect(new URL(redirectTo, request.url));
      res.cookies.set(ACCESS_COOKIE, token.value, cookieOptions(token.maxAge));
      return clearOAuthCookies(res);
    }

    const signup = readSetCookie(core, SIGNUP_COOKIE);
    if (!signup) return fail();
    const res = NextResponse.redirect(
      new URL(`/signup?step=id&redirect=${encodeURIComponent(redirectTo)}`, request.url),
    );
    res.cookies.set(SIGNUP_COOKIE, signup.value, cookieOptions(signup.maxAge));
    return clearOAuthCookies(res);
  } catch (e) {
    console.error("[kakao/callback]", e);
    return fail();
  }
}
