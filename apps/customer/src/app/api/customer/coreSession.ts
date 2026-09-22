import type { CustomerSession } from "@chinguya/types";

/**
 * 고객 세션 BFF 공용 도우미 (S0-C1 카카오 로그인 / S0-C2 가입 / S0-C3 세션).
 *
 * 여행사 앱의 /api/agency/session 과 같은 이유로 공용 프록시(/api/core/*)를 쓰지 않는다 —
 * 그 프록시는 Core 응답의 Set-Cookie 를 흘려보내지 않는다. 그래서 Core 가 준 토큰을 여기서
 * 고객 앱 자기 오리진 쿠키로 다시 심는다.
 *
 * 계약: packages/api-spec/openapi/chinguya-slice1-openapi.yaml (auth 태그)
 */

export const ACCESS_COOKIE = "access_token";
export const SIGNUP_COOKIE = "signup_token";
/** 카카오 인증 왕복 동안만 쓰는 1회용 쿠키. */
export const STATE_COOKIE = "kakao_oauth_state";
export const REDIRECT_COOKIE = "kakao_oauth_redirect";

/**
 * [퍼블 작업용 임시 우회] Core API 없이(pnpm dev:mock) 로그인 상태를 만들 수 있게 하는 스위치.
 * 여행사 앱의 AGENCY_MOCK_AUTH 와 같은 역할이다. env/mock.env 에서만 켠다.
 */
export const MOCK_AUTH = process.env.CUSTOMER_MOCK_AUTH === "true";
export const MOCK_TOKEN = "mock-customer-token";
export const MOCK_MAX_AGE = 24 * 60 * 60;

export function mockSession(loginId?: string): CustomerSession {
  return {
    customerId: "mock-customer",
    loginId: loginId || "gildong",
    socialProvider: "KAKAO",
    passportName: null,
    expiresAt: new Date(Date.now() + MOCK_MAX_AGE * 1000).toISOString(),
  };
}

export function coreBaseUrl(): string {
  const base = process.env.CORE_API_BASE_URL;
  if (!base) {
    throw new Error("CORE_API_BASE_URL 환경변수가 없습니다. env/README.md 참고.");
  }
  return base.replace(/\/$/, "");
}

/** Core 응답의 Set-Cookie 에서 쿠키 값과 Max-Age(초)를 뽑는다. */
export function readSetCookie(res: Response, name: string): { value: string; maxAge: number } | null {
  for (const raw of res.headers.getSetCookie()) {
    const match = raw.match(new RegExp(`^${name}=([^;]*)`));
    if (!match || !match[1]) continue;
    const maxAge = raw.match(/Max-Age=(\d+)/i);
    return { value: match[1], maxAge: maxAge ? Number(maxAge[1]) : 0 };
  }
  return null;
}

/** 이 오리진에 심는 인증 쿠키 공통 옵션. JS가 읽지 못하게 HttpOnly. */
export function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge,
  };
}

/**
 * 로그인 후 돌아갈 경로. 같은 오리진 경로만 허용한다 — `//evil.com` 같은 값으로 로그인 직후
 * 외부 사이트로 튕기는 오픈 리다이렉트를 막는다.
 */
export function safeRedirect(path: string | null | undefined): string {
  if (!path || !path.startsWith("/") || path.startsWith("//") || path.startsWith("/\\")) {
    return "/profile";
  }
  return path;
}

/** 카카오 개발자 콘솔에 등록하는 콜백 경로. Core 의 허용 목록에도 이 경로가 들어간다. */
export const KAKAO_CALLBACK_PATH = "/api/customer/kakao/callback";

/**
 * 카카오에 넘길 redirect_uri — **이 앱이 실제로 떠 있는 오리진** 기준으로 만든다.
 *
 * 서버 설정에 하나로 박아 두면 한쪽이 반드시 깨진다. 이 앱은 로컬(localhost:3000)과
 * 개발 서버(chinguya.1daybus.com) 양쪽에서 뜨기 때문이다. Core 는 허용 목록에 있는 값만 받는다.
 *
 * ⚠ 인가 URL 을 받을 때와 토큰을 교환할 때 **같은 값**이어야 한다 — 카카오가 두 값을 대조한다.
 * 그래서 start·callback 이 이 함수 하나를 같이 쓴다.
 *
 * nginx 뒤에서는 요청 URL 이 내부 주소일 수 있어 X-Forwarded-* 를 먼저 본다.
 */
export function kakaoRedirectUri(request: Request): string {
  const url = new URL(request.url);
  const proto = request.headers.get("x-forwarded-proto") ?? url.protocol.replace(":", "");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? url.host;
  return `${proto}://${host}${KAKAO_CALLBACK_PATH}`;
}
