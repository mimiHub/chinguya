import { createCoreProxyHandlers } from "@chinguya/api-client/core-proxy";

/** 여행사 앱 → Core API 프록시. 고객 앱과 같은 `/v1` 프리픽스를 쓴다. */
export const { GET, POST, PUT, PATCH, DELETE } = createCoreProxyHandlers({ prefix: "/v1" });
