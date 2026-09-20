// 브라우저(Next.js dev)용 워커. 앱에서 아래처럼 시작한다:
//   import { worker } from "@chinguya/mocks/browser";
//   await worker.start({ onUnhandledRequest: "warn" });   // ← 권장 설정
//
// 앱의 브라우저 코드는 Core API를 직접 부르지 않고 항상 같은 오리진의 `/api/core/*`(BFF 프록시)를 부른다
// (api-client DEFAULT_API_BASE_URL). 그래서 핸들러도 운영 주소가 아니라 그 경로로 등록해야 mock 환경
// (pnpm dev:mock)에서 요청이 가로채져 Core 없이 화면이 돈다.
import { setupWorker } from "msw/browser";
import { makeHandlers } from "./handlers";

export const worker = setupWorker(...makeHandlers("/api/core"));
