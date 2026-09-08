import { createCoreProxyHandlers } from "@chinguya/api-client/core-proxy";

/** 고객 앱 → Core API 프록시. 고객 엔드포인트는 `/v1` 프리픽스를 쓴다. */
export const { GET, POST, PUT, PATCH, DELETE } = createCoreProxyHandlers({ prefix: "/v1" });
