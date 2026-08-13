# CLAUDE.md — 친구야 프론트엔드 모노레포 협업 가이드

이 저장소는 여행 대여 예약 서비스 **친구야**의 프론트엔드다. 성격이 다른 3개 웹앱이 하나의 재고/예약 도메인을 공유하므로 모노레포로 구성한다. 이 파일은 여러 협업자와 각자의 Claude가 **같은 규칙으로** 작업하기 위한 지침이다. 작업 시작 전 이 파일과 루트 `README.md`, 그리고 `chinguya-wireframes/docs/README.md`(공통 비즈니스 규칙 원문)를 읽는다.

## 스택

- **Next.js 15** (App Router) · React 19 · TypeScript (strict)
- **Turborepo + pnpm workspaces** — 태스크 오케스트레이션·빌드 캐시
- **Tailwind CSS v4** (CSS-first, `@theme` 토큰)

전제: Node 20+, pnpm 9+ (`corepack enable`).

## 저장소 구조

```
chinguya/
├─ CLAUDE.md                  # (이 파일) 모노레포 협업 가이드
├─ README.md                  # 개요 · 시작하기
├─ apps/
│  ├─ customer/               # 고객(C) · 모바일 웹   (dev :3000)
│  ├─ admin/                  # 관리자(A) · 모바일 웹 (dev :3001)
│  └─ agency/                 # 여행사(G) · 데스크톱 웹 (dev :3002)
├─ packages/
│  ├─ ui/                     # 공용 컴포넌트 (Button, StatusBadge …)
│  ├─ types/                  # 도메인 타입 = 비즈니스 규칙 단일 출처
│  ├─ api-client/             # 타입드 fetch 래퍼
│  ├─ tailwind-config/        # 공유 디자인 토큰(theme.css)
│  ├─ eslint-config/          # 공유 ESLint(flat) 프리셋
│  └─ typescript-config/      # 공유 tsconfig 프리셋
├─ chinguya-wireframes/       # 화면 사양(와이어프레임 HTML + 상세설명 문서)
├─ docs/claude-code-prompt.md # 클로드 코드용 작업 프롬프트 모음
├─ turbo.json · pnpm-workspace.yaml · package.json
```

- **앱과 패키지는 `@chinguya/*` 네임스페이스**를 쓴다(예: `@chinguya/ui`, `@chinguya/customer`).
- 워크스페이스 참조는 `workspace:*` 로 건다.
- 각 앱 `next.config.mjs` 의 `transpilePackages` 에 사용하는 공용 패키지를 등록한다.

## 세 사용자군 (화면 사양의 근거)

- **고객(C)** · 모바일: 상품 조회 → 예약 → 무통장 입금 → 관리자 수동 확인 → 완료. 취소는 요청 방식.
- **관리자(A)** · 모바일: 자산/재고/상품/예약/취소/여행사/인보이스/콘텐츠 운영. 일반 관리자는 조회 전용, 쓰기는 슈퍼어드민.
- **여행사(G)** · 데스크톱: 할당 재고 내 예약(즉시 완료)·즉시 취소·월별 인보이스 정산.

화면 사양은 `chinguya-wireframes/` 의 와이어프레임 HTML과 `docs/*_상세설명.md`(화면마다 `목적/진입/주요 요소/규칙·로직/화면 이동` 5개 항목)를 기준으로 한다.

## ★ 핵심 규칙: 비즈니스 규칙은 `packages/types` 가 단일 출처

공통 비즈니스 규칙(재고 산식, 예약 상태 흐름, 예약 가능 기간, 가격 이원화, 취소 수수료, 인보이스, 여권 영문명 등)은 **`packages/types` 의 타입·상수로만** 정의한다. 앱이나 다른 패키지에 규칙 값을 중복 하드코딩하지 않는다.

- 규칙이 바뀌면 **`packages/types` 를 먼저 고치고**, 이를 참조하는 앱을 맞춘다.
- 규칙 원문(값·정책)의 근거는 `chinguya-wireframes/docs/README.md` 의 '공통 비즈니스 규칙'이다. 값이 바뀌면 그 문서와 `packages/types` 를 함께 갱신한다.
- 예시값/미확정 항목은 JSDoc 으로 표시한다.

요약(자세히는 `chinguya-wireframes/docs/README.md`):

- 재고 산식: `총 보유 − 여행사 할당 = 고객 가용` (Slice 2부터 자동, Slice 1은 관리자 수동).
- 예약 가능 기간: 고객 = 오늘 +1일~+3개월 / 여행사 = 오늘 +3일~+3개월. '오늘'은 **일본 기준**.
- 가격: 고객가/여행사가 이원화. **여행사가는 고객앱 미노출**.
- 결제: PG 미사용. 고객 무통장 입금 후 관리자 수동 확인. 24h 미입금 시 강제취소 가능.
- 고객 예약 상태: 접수 → 완료(입금확인) → 취소요청 → 취소.
- 여행사 예약: 예약=즉시 완료 / 취소=즉시. 취소 마감 기본 D-3.
- 취소 수수료: 이용일 기준 차등 요율(관리자 세팅), 환불 수동.
- 인보이스: 매월 1일 전월 기준 발행, KRW, 세금 라인 없음, 정산 수동.
- 여권 영문명: **예약 시점**에 확보.

## 작성 규약

- **새 도메인 타입 → `packages/types`**, **새 공용 컴포넌트 → `packages/ui`**, **API 호출 → `packages/api-client`**. 앱 안에 중복 정의하지 않는다.
- **디자인 토큰**은 `packages/tailwind-config/theme.css` 의 `@theme` 변수만 사용한다. 색·radius·폰트를 컴포넌트에 하드코딩하지 않는다. 디자인 확정 시 이 파일 한 곳만 고치면 세 앱에 반영된다.
- `packages/ui` 는 컴포넌트를 `package.json` 의 `exports` 로 경로별 노출한다(예: `@chinguya/ui/button`).
- 화면을 구현·지칭할 때 와이어프레임의 **`id` 와 화면 코드**를 함께 쓴다. 예: `booking`(S1-C2). 화면 파일 상단 주석에도 남긴다.
- `fetch` 를 쓰는 패키지(`api-client`)는 tsconfig `lib` 에 `DOM` 을 포함한다.
- ESLint next 프리셋은 `jsx-runtime` 을 포함한다(최신 JSX 트랜스폼, `react-in-jsx-scope` 끔).

## 명령어

```bash
pnpm install                          # 전체 설치
pnpm dev                              # 세 앱 동시 실행
pnpm --filter @chinguya/customer dev  # 특정 앱만
pnpm build                            # 전체 빌드
pnpm lint                             # 전체 lint
pnpm typecheck                        # 전체 타입체크
```

## 작업 마무리 전 자가 점검

1. `pnpm typecheck` 통과하는가?
2. `pnpm lint` 통과하는가?
3. 새 규칙/타입을 `packages/types` 에 반영했는가(앱에 중복 정의 아님)?
4. 색·폰트·radius를 하드코딩하지 않고 `tailwind-config` 토큰을 썼는가?
5. 화면 구현 시 대응 화면 코드(`id`/S-코드) 주석을 남겼고, 와이어프레임의 화면 이동·상태 흐름과 어긋나지 않는가?
6. 비즈니스 규칙 값을 바꿨다면 `chinguya-wireframes/docs/README.md` 도 함께 갱신했는가?
