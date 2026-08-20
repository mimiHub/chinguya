// Node(테스트/서버)용 서버. 테스트에서 아래처럼 사용한다:
//   import { server } from "@chinguya/mocks/node";
//   beforeAll(() => server.listen({ onUnhandledRequest: "warn" }));
//   afterEach(() => server.resetHandlers());
//   afterAll(() => server.close());
import { setupServer } from "msw/node";
import { handlers } from "./handlers";

export const server = setupServer(...handlers);
