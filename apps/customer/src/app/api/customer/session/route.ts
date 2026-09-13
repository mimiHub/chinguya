import { NextResponse, type NextRequest } from "next/server";
import { ACCESS_COOKIE, MOCK_AUTH, coreBaseUrl, mockSession } from "../coreSession";

/**
 * GET — 현재 세션(S0-C3). 쿠키를 Core 로 포워딩해 토큰 유효성까지 확인한다.
 *
 * 토큰이 만료됐거나 고객이 사라졌으면(401) 쿠키를 지운다. 고객 앱은 비로그인 열람이 되므로
 * 여기서 로그인 화면으로 보내지는 않는다 — 화면이 세션 없음으로 그린다.
 */
export async function GET(request: NextRequest) {
  const token = request.cookies.get(ACCESS_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ code: "UNAUTHORIZED", message: "로그인이 필요합니다." }, { status: 401 });
  }

  if (MOCK_AUTH) {
    return NextResponse.json(mockSession());
  }

  const core = await fetch(`${coreBaseUrl()}/v1/auth/me`, {
    headers: { cookie: `${ACCESS_COOKIE}=${token}` },
    cache: "no-store",
  });

  if (!core.ok) {
    const res = NextResponse.json(await core.json(), { status: core.status });
    if (core.status === 401) res.cookies.delete(ACCESS_COOKIE);
    return res;
  }
  return NextResponse.json(await core.json());
}

/** DELETE — 로그아웃(S0-C3). Core 호출이 실패해도 로컬 쿠키는 반드시 지운다. */
export async function DELETE(request: NextRequest) {
  const token = request.cookies.get(ACCESS_COOKIE)?.value;

  if (token && !MOCK_AUTH) {
    try {
      await fetch(`${coreBaseUrl()}/v1/auth/logout`, {
        method: "POST",
        headers: { cookie: `${ACCESS_COOKIE}=${token}` },
      });
    } catch {
      // Core가 죽어 있어도 로그아웃은 성공해야 한다 — 쿠키만 지우고 넘어간다.
      // 만료된 세션이면 Core가 401을 주는데, 그것도 로그아웃 성공으로 취급한다.
    }
  }

  const res = new NextResponse(null, { status: 204 });
  res.cookies.delete(ACCESS_COOKIE);
  return res;
}
