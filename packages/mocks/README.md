# @chinguya/mocks — Slice 1 MSW 목

친구야 Slice 1(자전거 예약 MVP) 고객 Core API의 MSW 목 핸들러.

## 원칙

- **spec이 원천, 목은 소비자.** 핸들러 응답 타입은 전부
  `packages/api-spec/openapi/chinguya-slice1-openapi.yaml` 에서 생성한
  `src/types.gen.ts` 에 고정된다. 목이 스스로 계약을 만들지 않는다.
- **픽스처는 PM 소유.** 응답 '값'은 `src/fixtures.ts` 에서만 바꾼다.
  (핸들러/전이 로직은 개발자 영역)
- `onUnhandledRequest: "warn"` 로 미정의 요청을 감지한다.

## 타입 생성 (핸들러보다 먼저)

```bash
pnpm --filter @chinguya/mocks gen:types   # yaml → src/types.gen.ts
```

`types.gen.ts` 는 생성물이라 커밋 대상에서 제외하거나(권장) CI에서 생성한다.
생성 전에는 tsc가 에러를 내는 게 정상이다(먼저 gen 실행).

## 앱(Next.js dev)에 붙이기

```ts
if (process.env.NEXT_PUBLIC_API_MOCKING === "enabled") {
  const { worker } = await import("@chinguya/mocks/browser");
  await worker.start({ onUnhandledRequest: "warn" });
}
```

## 테스트(Node)에 붙이기

```ts
import { server } from "@chinguya/mocks/node";
beforeAll(() => server.listen({ onUnhandledRequest: "warn" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

## baseUrl (BFF 참고)

핸들러 기본 baseUrl은 운영 Core API(`https://api.chinguya.co.kr/v1`)다.
프론트가 Next.js Route Handler(BFF)를 거쳐 Core를 호출하므로, 목을 어디에
물릴지는 개발 모드 구성에 따른다:

- Core를 직접(또는 BFF를 목 Core로) 호출 → 기본 baseUrl 그대로 사용.
- 로컬 Core(`http://localhost:8080/v1`) 대상 → `makeHandlers("http://localhost:8080/v1")`
  로 재생성해 사용.

## 확정 상태 전이 (목에 반영됨)

```
입금대기(AWAITING_DEPOSIT) → 접수(RECEIVED) → 완료(COMPLETED)
                          ↘ 취소요청(CANCEL_REQUESTED) → 취소(CANCELLED)
```

- `POST /bookings` → 생성 직후 **입금대기**
- `POST /bookings/{id}/deposit-request` → **입금대기 → 접수**
- `POST /bookings/{id}/cancel-request` → **취소요청** (입금대기·접수에서만)
- 목록 탭: 접수=RECEIVED / 완료=COMPLETED / 취소=취소요청+취소 /
  입금대기는 전용 탭 없이 '전체'에만 노출
- 완료 전이(관리자 입금확인)는 관리자 API라 Slice 1 목 범위 밖.

## 협의 미확정 → 목의 잠정값 (spec 확정 시 함께 갱신)

| 항목 | 위치 | 잠정값 |
|---|---|---|
| 임시 홀드 TTL | `store.ts` `HOLD_TTL_MS` | 10분 |
| 취소 수수료 요율 | `store.ts` `FEE_RATE` | 0% |
| 2일+타지역반납 자동마감 표기 | `fixtures.ts` `buildAvailability` | 미반영(주석) |

## 구조

```
packages/mocks/
├─ package.json
├─ README.md
└─ src/
   ├─ types.gen.ts   (생성물 — gen:types)
   ├─ fixtures.ts    (PM 소유: 목 데이터 값)
   ├─ store.ts       (인메모리 상태 + 상태 전이)
   ├─ handlers.ts    (13 엔드포인트)
   ├─ browser.ts     (setupWorker)
   ├─ node.ts        (setupServer)
   └─ index.ts       (진입점)
```
