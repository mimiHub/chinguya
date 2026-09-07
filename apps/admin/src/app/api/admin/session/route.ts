import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { AdminSession } from "@chinguya/types";

/**
 * 관리자 세션 BFF (S0-A2 로그인 / 로그아웃 / 세션 조회).
 *
 * 브라우저에서 Core API(:8080)를 직접 부르지 않고 이 Route Handler를 거친다 —
 * Core에는 CORS 설정이 없고 액세스 토큰 쿠키가 SameSite=Lax라 cross-origin 요청에는
 * 실려 가지 않기 때문이다. 여기서는 서버사이드 fetch라 CORS와 무관하고, Core가 내려준
 * JWT를 관리자 앱 자기 오리진 쿠키로 다시 심으므로 이후 요청은 same-origin이 된다.
 *
 * 계약: packages/api-spec/openapi/chinguya-admin-api.yaml
 */

const COOKIE_NAME = "admin_access_token";

/**
 * [퍼블 작업용 임시 우회] Core API(:8080)가 아직 안 떠 있어도 화면 작업을 계속할 수 있게
 * 하는 로컬 전용 스위치다. 기본값은 꺼짐(false)이라 아무 데도 영향을 주지 않는다.
 * 켜려면 apps/admin/.env.local 에 ADMIN_MOCK_AUTH=true 를 넣는다 — .env.local은
 * .gitignore 대상이라 커밋되지 않고, 각자 컴퓨터에만 적용된다. Core API 로그인이 실제로
 * 연동되면(또는 그 전이라도 실 서버로 테스트하고 싶으면) 이 스위치는 꺼두면 된다.
 */
const MOCK_AUTH = process.env.ADMIN_MOCK_AUTH === "true";
const MOCK_TOKEN = "mock-admin-token";

function mockSession(): AdminSession {
  return {
    adminId: "mock-admin",
    loginId: "admin",
    role: "SUPER_ADMIN",
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };
}

function coreBaseUrl(): string {
  const base = process.env.ADMIN_CORE_API_BASE_URL;
  if (!base) {
    throw new Error("ADMIN_CORE_API_BASE_URL 환경변수가 없습니다. apps/admin/.env.example 참고.");
  }
  return base.replace(/\/$/, "");
}

/** Core 응답의 Set-Cookie 헤더에서 액세스 토큰 값만 뽑는다. */
function readTokenFromSetCookie(res: Response): string | null {
  for (const raw of res.headers.getSetCookie()) {
    const match = raw.match(new RegExp(`^${COOKIE_NAME}=([^;]*)`));
    if (match && match[1]) return match[1];
  }
  return null;
}

/** POST — 로그인. Core에 인증을 위임하고 발급된 토큰을 이 오리진 쿠키로 옮겨 심는다. */
export async function POST(request: Request) {
  const body = await request.json();

  if (MOCK_AUTH) {
    // 퍼블 작업용 우회: 아이디/비밀번호를 검증하지 않고 바로 통과시킨다.
    const session = mockSession();
    const maxAge = Math.floor((new Date(session.expiresAt).getTime() - Date.now()) / 1000);
    (await cookies()).set(COOKIE_NAME, MOCK_TOKEN, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge,
    });
    return NextResponse.json(session);
  }

  const res = await fetch(`${coreBaseUrl()}/admin/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ loginId: body.loginId, password: body.password }),
  });

  if (!res.ok) {
    // Core의 에러 본문({code, message})을 그대로 흘려보낸다 — 화면이 서버 문구를 쓴다.
    return NextResponse.json(await res.json(), { status: res.status });
  }

  const token = readTokenFromSetCookie(res);
  if (!token) {
    return NextResponse.json(
      { code: "NO_SESSION_COOKIE", message: "인증 서버가 세션 쿠키를 내려주지 않았습니다." },
      { status: 502 },
    );
  }

  const session: AdminSession = await res.json();
  const maxAge = Math.floor((new Date(session.expiresAt).getTime() - Date.now()) / 1000);

  (await cookies()).set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge,
  });

  return NextResponse.json(session);
}

/** GET — 현재 세션. 쿠키를 Core로 포워딩해 토큰 유효성까지 확인한다. */
export async function GET() {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ code: "UNAUTHORIZED", message: "로그인이 필요합니다." }, { status: 401 });
  }

  if (MOCK_AUTH) {
    return NextResponse.json(mockSession());
  }

  const res = await fetch(`${coreBaseUrl()}/admin/auth/me`, {
    headers: { cookie: `${COOKIE_NAME}=${token}` },
    cache: "no-store",
  });

  if (!res.ok) {
    return NextResponse.json(await res.json(), { status: res.status });
  }
  return NextResponse.json(await res.json());
}

/** DELETE — 로그아웃. Core 호출이 실패해도 로컬 쿠키는 반드시 지운다. */
export async function DELETE() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;

  if (token && !MOCK_AUTH) {
    try {
      await fetch(`${coreBaseUrl()}/admin/auth/logout`, {
        method: "POST",
        headers: { cookie: `${COOKIE_NAME}=${token}` },
      });
    } catch {
      // Core가 죽어 있어도 로그아웃은 성공해야 한다 — 쿠키만 지우고 넘어간다.
    }
  }

  store.delete(COOKIE_NAME);
  return new NextResponse(null, { status: 204 });
}
