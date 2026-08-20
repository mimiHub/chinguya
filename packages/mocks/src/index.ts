// 공용 진입점. 브라우저/노드 진입점은 서브패스로 분리(교차 임포트 방지):
//   "@chinguya/mocks/browser" · "@chinguya/mocks/node"
export { handlers, makeHandlers } from "./handlers";
export * as store from "./store";
export type { components, paths } from "./types.gen";
