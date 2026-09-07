import { createCoreProxyHandlers } from "@chinguya/api-client/core-proxy";

/**
 * 관리자 앱 → Core API 프록시. 관리자 컨트롤러는 `/v1` 이 아니라 `/admin` 프리픽스를 쓴다.
 * 로그인/로그아웃은 쿠키를 자기 오리진으로 옮겨 심어야 해서 `../admin/session` 이 따로 처리한다.
 */
export const { GET, POST, PUT, PATCH, DELETE } = createCoreProxyHandlers({ prefix: "/admin" });
