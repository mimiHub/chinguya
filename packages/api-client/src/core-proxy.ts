/**
 * Core API 프록시 — Next Route Handler(`app/api/core/[...path]/route.ts`)에서 쓴다.
 *
 * 브라우저는 Core API를 직접 부르지 않고 항상 자기 오리진의 `/api/core/*` 를 부른다.
 *  - 운영에서 Core 주소가 internal-IP라 브라우저가 접근할 수 없다.
 *  - Core에 CORS 설정이 없고 액세스 토큰 쿠키가 SameSite=Lax라 cross-origin 요청에 실리지 않는다.
 * 이 파일은 서버사이드에서만 실행되므로 `CORE_API_BASE_URL` 이 클라이언트 번들에 노출되지 않는다.
 *
 * 환경별 주소는 `env/*.env` 참고.
 */

export interface CoreProxyOptions {
  /**
   * Core API 경로 프리픽스. 앱마다 다르다.
   * 고객/여행사 = `/v1`, 관리자 = `/admin` (@RequestMapping("/admin/...")).
   */
  prefix: string;
}

/** Next 15 Route Handler의 두 번째 인자. `params` 가 Promise다. */
export interface RouteContext {
  params: Promise<{ path?: string[] }>;
}

/** 응답 본문을 가질 수 없는 상태 코드 — Response 생성자가 예외를 던진다. */
const BODYLESS_STATUS = new Set([204, 205, 304]);

function coreBaseUrl(): string {
  const base = process.env.CORE_API_BASE_URL;
  if (!base) {
    throw new Error("CORE_API_BASE_URL 환경변수가 없습니다. env/README.md 참고.");
  }
  return base.replace(/\/$/, "");
}

async function proxy(request: Request, context: RouteContext, prefix: string): Promise<Response> {
  const { path = [] } = await context.params;
  const search = new URL(request.url).search;
  const target = `${coreBaseUrl()}${prefix}/${path.join("/")}${search}`;

  // 화이트리스트로만 헤더를 넘긴다 — host/origin 등을 그대로 전달하면 Core가 오해한다.
  const headers = new Headers();
  for (const name of ["cookie", "content-type", "accept", "accept-language"]) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }

  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  const res = await fetch(target, {
    method: request.method,
    headers,
    body: hasBody ? await request.text() : undefined,
    cache: "no-store",
    redirect: "manual",
  });

  // 상태코드와 에러 본문({code, message})을 그대로 흘려보낸다 — 화면이 서버 문구를 쓴다.
  const outHeaders = new Headers();
  const contentType = res.headers.get("content-type");
  if (contentType) outHeaders.set("content-type", contentType);

  return new Response(BODYLESS_STATUS.has(res.status) ? null : res.body, {
    status: res.status,
    headers: outHeaders,
  });
}

/**
 * 메서드별 Route Handler 한 벌을 만든다.
 *
 * ```ts
 * export const { GET, POST, PUT, PATCH, DELETE } = createCoreProxyHandlers({ prefix: "/v1" });
 * ```
 */
export function createCoreProxyHandlers({ prefix }: CoreProxyOptions) {
  const handler = (request: Request, context: RouteContext) => proxy(request, context, prefix);
  return { GET: handler, POST: handler, PUT: handler, PATCH: handler, DELETE: handler };
}
