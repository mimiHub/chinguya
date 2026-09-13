import { NextResponse, type NextRequest } from "next/server";
import {
  ACCESS_COOKIE,
  MOCK_AUTH,
  MOCK_MAX_AGE,
  MOCK_TOKEN,
  SIGNUP_COOKIE,
  cookieOptions,
  coreBaseUrl,
  mockSession,
  readSetCookie,
} from "../../coreSession";

/**
 * POST — 아이디 입력으로 가입 완료(S0-C2).
 *
 * 카카오 콜백이 심어 둔 signup_token 쿠키가 인증 수단이다. 성공하면 access_token 을 심고
 * signup_token 을 지운다.
 */
export async function POST(request: NextRequest) {
  const { loginId } = (await request.json()) as { loginId?: string };

  if (MOCK_AUTH) {
    const res = NextResponse.json(mockSession(loginId));
    res.cookies.set(ACCESS_COOKIE, MOCK_TOKEN, cookieOptions(MOCK_MAX_AGE));
    return res;
  }

  const signupToken = request.cookies.get(SIGNUP_COOKIE)?.value;
  if (!signupToken) {
    return NextResponse.json(
      { code: "SIGNUP_TOKEN_INVALID", message: "카카오 인증이 만료되었습니다. 처음부터 다시 시도해 주세요." },
      { status: 401 },
    );
  }

  const core = await fetch(`${coreBaseUrl()}/v1/auth/signup`, {
    method: "POST",
    headers: { "content-type": "application/json", cookie: `${SIGNUP_COOKIE}=${signupToken}` },
    body: JSON.stringify({ loginId }),
    cache: "no-store",
  });

  if (!core.ok) {
    // Core의 에러 본문({code, message})을 그대로 흘려보낸다 — 화면이 서버 문구를 쓴다.
    const res = NextResponse.json(await core.json(), { status: core.status });
    // 가입 토큰이 만료됐으면(401) 더 쓸 수 없으니 지운다. 중복(409)·형식 오류(400)는 다시 입력하면 된다.
    if (core.status === 401) res.cookies.delete(SIGNUP_COOKIE);
    return res;
  }

  const token = readSetCookie(core, ACCESS_COOKIE);
  if (!token) {
    return NextResponse.json(
      { code: "NO_SESSION_COOKIE", message: "인증 서버가 세션 쿠키를 내려주지 않았습니다." },
      { status: 502 },
    );
  }

  const res = NextResponse.json(await core.json());
  res.cookies.set(ACCESS_COOKIE, token.value, cookieOptions(token.maxAge));
  res.cookies.delete(SIGNUP_COOKIE);
  return res;
}
