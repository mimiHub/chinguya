import { NextResponse, type NextRequest } from "next/server";
import { ACCESS_COOKIE, MOCK_AUTH, coreBaseUrl, mockSession } from "../../coreSession";

/**
 * PUT — 여권 영문명 저장(S0-C3). 쿠키를 Core 로 포워딩한다.
 *
 * Core(`PUT /v1/auth/me/passport-name`)가 검증·공백제거를 하고 바뀐 세션을 돌려주므로,
 * 이 라우트는 전달만 하고 응답 본문을 그대로 흘려보낸다(에러 본문도 그대로 — 화면이
 * Core 의 message 를 띄운다).
 */
export async function PUT(request: NextRequest) {
  const token = request.cookies.get(ACCESS_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ code: "UNAUTHORIZED", message: "로그인이 필요합니다." }, { status: 401 });
  }

  const body = await request.json();

  // mock 모드에는 저장소가 없다 — 보낸 값을 그대로 되돌려줘 화면 흐름만 확인할 수 있게 한다.
  if (MOCK_AUTH) {
    return NextResponse.json({ ...mockSession(), passportName: String(body?.passportName ?? "").trim() });
  }

  const core = await fetch(`${coreBaseUrl()}/v1/auth/me/passport-name`, {
    method: "PUT",
    headers: { cookie: `${ACCESS_COOKIE}=${token}`, "content-type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const res = NextResponse.json(await core.json(), { status: core.status });
  if (core.status === 401) res.cookies.delete(ACCESS_COOKIE);
  return res;
}
