// 브라우저(Next.js dev)용 워커. 앱에서 아래처럼 시작한다:
//   import { worker } from "@chinguya/mocks/browser";
//   await worker.start({ onUnhandledRequest: "warn" });   // ← 권장 설정
import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";

export const worker = setupWorker(...handlers);
