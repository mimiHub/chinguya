# 친구야 — MSW 적용 가이드 (퍼블리셔 / Claude Code용)

Claude Code로 고객 화면을 만들 때, `@chinguya/mocks`(MSW)를 붙여 **실제 백엔드 없이**
spec대로 데이터를 받아 화면을 개발하기 위한 가이드.

---

## 0. 동작 원리 (핵심 3조건)

- **목은 두 곳에서 돈다.** Next.js는 데이터를 브라우저(클라이언트 fetch)와
  Node(서버 컴포넌트·Route Handler)에서 모두 가져올 수 있다. 둘 다 가로채야 하므로
  **브라우저 워커 + Node 서버**를 함께 켠다.
- **base URL이 일치해야 가로챈다.** 앱이 호출하는 API base = 목 핸들러 base.
  목 기본 base는 Core API(`https://api.chinguya.co.kr/v1`). 앱도 dev에서 이 base로 호출.
- **브라우저 워커는 `public/mockServiceWorker.js`가 필요하다.** `msw init`으로 생성.

---

## 1. 1회 배선 — PM이 반영 완료 (pull만 받으면 됨)

목 배선은 **공유 인프라**라 PM이 고객 앱에 반영해 push했다. 퍼블리셔는 직접 세팅할
필요 없이 아래만 하면 된다.

```sh
git pull
pnpm install        # 워크스페이스 의존성 동기화
```

이미 포함돼 있는 것(건드릴 필요 없음):

- 서버측 목: `instrumentation.ts`
- 브라우저측 목: `app/msw-provider.tsx` (+ 루트 레이아웃 래핑)
- 브라우저 워커 파일: `public/mockServiceWorker.js`
- 공통 env 기본값(커밋됨): `NEXT_PUBLIC_API_MOCKING=enabled`,
  `NEXT_PUBLIC_API_BASE_URL=https://api.chinguya.co.kr/v1`
- (있으면) openapi-fetch 타입 클라이언트

실행:

```sh
# 고객 앱에서 dev 실행 (예: pnpm --filter <고객 앱> dev, 또는 앱 폴더에서 pnpm dev)
pnpm --filter <고객 앱> dev
```

브라우저 콘솔에 MSW 시작 로그가 뜨고 Network 응답이 service worker에서 오면 준비 완료다.
배선 파일을 직접 바꿀 필요는 없다. 문제가 있으면 §3 트러블슈팅을 보거나 PM에게 문의한다.

> 목을 잠깐 끄고 실제 API로 보려면 `.env.development.local`에
> `NEXT_PUBLIC_API_MOCKING=disabled`로 로컬 오버라이드하면 된다(공통 기본값은 건드리지 말 것).

---

## 2. 화면 만들 때 규칙 (스크린 개발 프롬프트에 함께 넣기)

Claude Code가 화면을 만들 때 아래를 지켜야 fetch가 목에 정확히 걸린다.
**각 화면 개발 프롬프트 상단에 이 블록을 붙여라.**

```text
[API 호출 규칙 — 반드시 준수]
- 모든 API 호출은 OpenAPI(packages/api-spec/openapi/chinguya-slice1-openapi.yaml)에
  정의된 경로·메서드·스키마로만 한다. spec에 없는 엔드포인트/필드를 임의로 만들지 말 것.
- 호출 base는 NEXT_PUBLIC_API_BASE_URL(절대경로). 지금 목은 이 Core API URL을 가로챈다.
  (BFF 라우트는 나중에 같은 경로로 얹으면 base만 바꿔 전환 가능)
- 가능하면 openapi-fetch 타입 클라이언트를 사용해 경로/응답을 타입으로 고정한다.
- 예약 상태 코드값: AWAITING_DEPOSIT / RECEIVED / COMPLETED / CANCEL_REQUESTED / CANCELLED.
  목록 탭 매핑: 접수=RECEIVED, 완료=COMPLETED, 취소=CANCEL_REQUESTED+CANCELLED,
  입금대기(AWAITING_DEPOSIT)는 전용 탭 없이 '전체'에만 노출.
- 화면이 비거나 목 데이터가 부족하면, 값은 packages/mocks/src/fixtures.ts(픽스처)에서
  추가/수정한다. 핸들러 로직·spec·yaml은 임의로 바꾸지 말 것(원천은 spec).
```

---

## 3. 동작 확인 / 트러블슈팅

| 증상 | 원인 | 조치 |
|---|---|---|
| Network에 `mockServiceWorker.js` 404 | 워커 파일 미생성 | `npx msw init public/ --save` 재실행 |
| 요청이 목을 안 타고 실제 도메인으로 나감 | 앱 base ≠ 목 base | `.env`의 `NEXT_PUBLIC_API_BASE_URL`을 목 base와 일치시킴 |
| 서버 컴포넌트 fetch만 목이 안 걸림 | instrumentation 미동작 | Next<15면 `experimental.instrumentationHook: true`, `NEXT_RUNTIME==='nodejs'` 가드 확인 |
| `onUnhandledRequest` 경고 다수 | spec에 없는 경로 호출 | 화면의 fetch 경로를 spec 경로로 교정(§2 규칙) |
| 상태 태그가 특정 상태에서 빈값 | enum 코드 불일치 | `AWAITING_DEPOSIT` 등 정확한 코드값 사용 |

> 운영 배포 시에는 `NEXT_PUBLIC_API_MOCKING`을 끄면 목이 전부 비활성화된다(코드 변경 없음).
