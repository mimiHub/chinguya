import { NextResponse, type NextRequest } from "next/server";
import {
  ACCESS_COOKIE,
  MOCK_AUTH,
  MOCK_MAX_AGE,
  MOCK_TOKEN,
  REDIRECT_COOKIE,
  STATE_COOKIE,
  cookieOptions,
  coreBaseUrl,
  kakaoRedirectUri,
  safeRedirect,
} from "../../coreSession";

/** state·redirect 쿠키 수명 — 카카오 동의 화면에 머무는 시간이면 충분하다. */
const OAUTH_COOKIE_MAX_AGE = 5 * 60;

/**
 * GET — 카카오 로그인 시작(S0-C1 카카오 버튼).
 *
 * state 를 만들어 쿠키에 두고 카카오 동의 화면으로 보낸다. 로그인·회원가입 화면이 같은 경로를
 * 쓰고, 가입 여부는 콜백(../callback)에서 갈린다. 카카오 주소는 앱 키·Redirect URI 를 가진
 * Core 가 만들어 준다.
 */
export async function GET(request: NextRequest) {
  const redirectTo = safeRedirect(request.nextUrl.searchParams.get("redirect"));

  if (MOCK_AUTH) {
    // 목 모드: 카카오를 건너뛰고 바로 로그인 상태로 만든다.
    const res = NextResponse.redirect(new URL(redirectTo, request.url));
    res.cookies.set(ACCESS_COOKIE, MOCK_TOKEN, cookieOptions(MOCK_MAX_AGE));
    return res;
  }

  const state = crypto.randomUUID();
  try {
    // 콜백 주소는 이 앱의 오리진으로 만들어 보낸다 — 로컬과 개발 EC2 의 주소가 다르기 때문이다.
    const redirectUri = kakaoRedirectUri(request);
    const core = await fetch(
      `${coreBaseUrl()}/v1/auth/kakao/authorize-url?state=${encodeURIComponent(state)}` +
        `&redirectUri=${encodeURIComponent(redirectUri)}`,
      { cache: "no-store" },
    );
    if (!core.ok) {
      throw new Error(`Core authorize-url ${core.status} ${await core.text()}`);
    }
    const { url } = (await core.json()) as { url: string };

    const res = NextResponse.redirect(url);
    res.cookies.set(STATE_COOKIE, state, cookieOptions(OAUTH_COOKIE_MAX_AGE));
    res.cookies.set(REDIRECT_COOKIE, redirectTo, cookieOptions(OAUTH_COOKIE_MAX_AGE));
    return res;
  } catch (e) {
    console.error("[kakao/start]", e);
    return NextResponse.redirect(new URL("/login?error=kakao", request.url));
  }
}
