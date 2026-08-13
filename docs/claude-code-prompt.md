# 클로드 코드용 프롬프트 — 친구야 프론트엔드

이 문서는 친구야 모노레포에서 **클로드 코드(Claude Code)** 로 작업을 이어갈 때 붙여넣는 프롬프트 모음이다. 스캐폴드는 이미 생성되어 있으므로, 아래 프롬프트들은 주로 "와이어프레임 → 실제 화면 구현" 단계를 위한 것이다. 맨 아래에 스캐폴드 자체를 처음부터 재생성하는 프롬프트도 둔다.

---

## 0. 공통 컨텍스트 (모든 작업 앞에 붙일 것)

```
너는 친구야(여행 대여 예약 서비스) 프론트엔드 모노레포에서 작업한다.

스택: Next.js 15 App Router, React 19, TypeScript strict, Turborepo + pnpm, Tailwind v4.
구조: apps/{customer,admin,agency} + packages/{ui,types,api-client,tailwind-config,eslint-config,typescript-config}.

원칙:
- 공통 비즈니스 규칙은 packages/types 가 단일 출처다. 규칙 관련 값·타입은 여기서 import 한다.
- 화면 사양은 chinguya-wireframes/ 의 HTML 와이어프레임과 docs/*_상세설명.md 를 근거로 한다.
  각 화면은 "목적/진입/주요 요소/규칙·로직/화면 이동" 5개 항목으로 정의되어 있다.
- 화면을 지칭할 때 id 와 화면 코드(예: booking = S1-C2)를 함께 쓴다.
- 새 공용 컴포넌트는 packages/ui, 새 도메인 타입은 packages/types 에 둔다. 앱에 중복 정의하지 않는다.
- 작업 후 반드시 `pnpm typecheck` 와 `pnpm lint` 가 통과해야 한다.

핵심 비즈니스 규칙(요약, 자세히는 chinguya-wireframes/docs/README.md):
- 재고 산식: 총 보유 − 여행사 할당 = 고객 가용 (Slice 2부터 자동, Slice 1은 관리자 수동).
- 예약 가능 기간: 고객 = 오늘 +1일~+3개월 / 여행사 = 오늘 +3일~+3개월. '오늘'은 일본 기준.
- 가격: 고객가/여행사가 이원화. 여행사가는 고객앱 미노출.
- 결제: PG 미사용. 고객 무통장 입금 후 관리자 수동 확인. 24h 미입금 시 강제취소 가능.
- 고객 예약 상태: 접수 → 완료(입금확인) → 취소요청 → 취소.
- 여행사 예약: 예약=즉시 완료 / 취소=즉시. 취소 마감 기본 D-3.
- 취소 수수료: 이용일 기준 차등 요율(관리자 세팅), 환불 수동.
- 인보이스: 매월 1일 전월 기준 발행, KRW, 세금 라인 없음, 정산 수동.
- 여권 영문명: 예약 시점에 확보.
```

---

## 1. 특정 앱의 화면 구현

```
[공통 컨텍스트]를 전제로 한다.

apps/customer 에서 고객 예약 흐름 화면들을 구현해줘.
1) chinguya-wireframes/고객페이지_와이어프레임_모바일.html 과
   chinguya-wireframes/docs/고객페이지_상세설명.md 를 먼저 읽어라.
2) 상세설명의 ID 매핑표에 있는 화면들을 App Router 라우트로 만든다
   (예: 상품목록, 상품상세(booking=S1-C2), 예약폼, 예약완료, 내 예약, 취소요청).
3) 상태·타입은 @chinguya/types 에서, 공용 UI 는 @chinguya/ui 에서, API 호출은
   @chinguya/api-client 에서 가져온다. 백엔드 미확정 부분은 api-client 에 목(mock)으로 둔다.
4) 각 화면 상단 주석에 대응 화면 코드(id / S-코드)를 남긴다.
5) 끝나면 pnpm --filter @chinguya/customer typecheck && lint 통과 확인.

한 번에 다 만들지 말고 라우트 단위로 나눠 진행하고, 각 단계마다 무엇을 만들었는지 알려줘.
```

관리자·여행사도 대상 파일만 바꿔 동일하게 지시한다:
- 관리자: `apps/admin`, `관리자_와이어프레임_모바일.html`, `docs/관리자_상세설명.md`
- 여행사: `apps/agency`, `여행사_와이어프레임_데스크톱.html`, `docs/여행사_상세설명.md`

---

## 2. 도메인 타입 확장

```
[공통 컨텍스트]를 전제로 한다.

packages/types 에 아직 없는 도메인 개념을 추가해줘: [예: 자산(Asset), 알림(Notification),
콘텐츠(LandingContent/FAQ), 관리자 권한 체크 헬퍼].
- chinguya-wireframes/docs 의 해당 설명을 근거로 필드를 정한다.
- 예시값/미확정 항목은 JSDoc 으로 표시한다.
- 세 앱 중 어디서 쓰는지 주석으로 남긴다.
- pnpm --filter @chinguya/types typecheck 통과 확인.
```

---

## 3. 공용 UI 컴포넌트 추가

```
[공통 컨텍스트]를 전제로 한다.

packages/ui 에 [예: DateRangePicker(예약 가능 기간 규칙 반영), PriceTag(고객가만 노출),
InvoiceTable] 컴포넌트를 추가해줘.
- 디자인 토큰은 @chinguya/tailwind-config/theme.css 의 변수만 사용한다(하드코딩 색상 금지).
- props 타입은 @chinguya/types 를 재사용한다.
- package.json 의 exports 에 새 컴포넌트 경로를 등록한다.
- 세 앱 중 한 곳에서 실제로 import 해서 렌더되는지 확인한다.
```

---

## 4. 스캐폴드 재생성 (처음부터 다시 만들 때)

```
chinguya/ 아래에 프론트엔드 모노레포를 새로 구성해줘.

- 도구: pnpm workspaces + Turborepo. 프레임워크: Next.js 15 App Router + React 19 + TypeScript strict.
  스타일: Tailwind CSS v4 (CSS-first).
- apps/{customer(:3000, 모바일), admin(:3001, 모바일), agency(:3002, 데스크톱)}
- packages/{ui, types, api-client, tailwind-config, eslint-config, typescript-config}
  - typescript-config: base/nextjs/react-library 프리셋
  - eslint-config: flat config, base/next/react-internal. next 프리셋엔 jsx-runtime 포함(react-in-jsx-scope 끔)
  - tailwind-config: @theme 토큰을 담은 theme.css 를 exports 로 노출
  - types: 위 '핵심 비즈니스 규칙'을 타입/상수로 옮긴 단일 출처
  - api-client: 타입드 fetch 래퍼(tsconfig lib 에 DOM 포함). @chinguya/types 의존.
  - ui: Button, StatusBadge. @chinguya/types 의존. exports 로 컴포넌트별 경로 노출.
- 각 앱 next.config.mjs 의 transpilePackages 에 @chinguya/{ui,types,api-client} 등록.
- 루트 스크립트: dev/build/lint/typecheck 를 turbo 로 오케스트레이션.
- 마지막에 pnpm install && pnpm typecheck && pnpm lint && (한 앱) pnpm build 로 검증.

주의:
- api-client 는 fetch 를 쓰므로 tsconfig 에 "lib": ["ES2022","DOM"] 필요.
- ui 처럼 @chinguya/types 를 import 하는 패키지는 dependencies 에 workspace:* 로 반드시 등록.
- eslint next 프리셋에 pluginReact.configs.flat["jsx-runtime"] 를 넣지 않으면 빌드 시
  react/react-in-jsx-scope 로 실패한다.
```

---

## 작업 체크리스트 (매 작업 종료 전)

1. `pnpm typecheck` 통과
2. `pnpm lint` 통과
3. 새 규칙/타입은 packages/types 에 반영했는가 (앱에 중복 정의 아님)
4. 화면 구현 시 대응 화면 코드(id / S-코드) 주석을 남겼는가
5. 와이어프레임/상세설명과 화면 이동·상태 흐름이 어긋나지 않는가
