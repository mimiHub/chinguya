# 친구야 — 프론트엔드 모노레포

여행 대여 예약 서비스 **친구야**의 프론트엔드. 성격이 다른 3개 웹앱이 하나의 재고/예약 도메인을 공유하므로 모노레포로 구성한다.

- **고객(C)** · 모바일 웹 — 상품 조회 → 예약 → 무통장 입금 → 완료
- **관리자(A)** · 모바일 웹 — 자산/재고/상품/예약/취소/여행사/인보이스/콘텐츠 운영
- **여행사(G)** · 데스크톱 웹 — 할당 재고 내 예약(즉시 완료)·즉시 취소·월별 정산

## 스택

- **Next.js 15** (App Router) · React 19 · TypeScript (strict)
- **Turborepo + pnpm workspaces** — 빌드 캐시·태스크 오케스트레이션
- **Tailwind CSS v4** (CSS-first) — 공용 디자인 토큰

## 구조

```
chinguya/
├─ apps/
│  ├─ customer/      # 고객 모바일 웹      (dev :3000)
│  ├─ admin/         # 관리자 모바일 웹    (dev :3001)
│  └─ agency/        # 여행사 데스크톱 웹  (dev :3002)
├─ packages/
│  ├─ ui/                 # 공용 컴포넌트 (Button, StatusBadge …)
│  ├─ types/              # 도메인 타입 = 비즈니스 규칙 단일 출처
│  ├─ api-spec/           # OpenAPI 계약 = API 스펙 단일 출처
│  ├─ api-client/         # 타입드 fetch 래퍼
│  ├─ mocks/              # api-spec 기반 MSW 목 핸들러(Slice 1)
│  ├─ tailwind-config/    # 공유 디자인 토큰(theme.css)
│  ├─ eslint-config/      # 공유 ESLint(flat) 프리셋
│  └─ typescript-config/  # 공유 tsconfig 프리셋
├─ chinguya-wireframes/   # (기존) 와이어프레임 HTML + 상세설명 문서
├─ turbo.json
├─ pnpm-workspace.yaml
└─ package.json
```

`packages/types` 는 공통 비즈니스 규칙(재고 산식, 예약 상태 흐름, 예약 가능 기간, 취소 수수료, 인보이스 등)을 코드로 옮긴 **단일 출처(source of truth)**다. 규칙이 바뀌면 이 패키지를 먼저 고치고 세 앱을 맞춘다. 규칙 원문은 `chinguya-wireframes/docs/README.md` 를 근거로 한다.

`packages/api-spec` 은 Slice 1 Core API 계약(엔드포인트·요청/응답 스키마)의 **단일 출처**다(`openapi/chinguya-slice1-openapi.yaml`). `api-client`, `packages/mocks`(MSW 목), 화면 구현은 모두 이 yaml을 따라가며, 반대로 구현이나 목이 계약을 임의로 정하지 않는다. 스펙이 바뀌어야 하면 이 yaml을 먼저 고치고 나서 구현을 맞춘다. 자세한 규칙은 [`packages/api-spec/README.md`](packages/api-spec/README.md), 목 사용법은 [`packages/mocks/README.md`](packages/mocks/README.md) 참고.

## 시작하기

전제: Node 20+, pnpm 9+ (`corepack enable`)

```bash
pnpm install          # 전체 워크스페이스 설치
pnpm dev              # 세 앱 동시 실행 — 개발(AWS EC2) API를 본다
pnpm dev:local        # 내 머신의 자바 Core API(:8080)를 본다
pnpm dev:mock         # Core API 없이 MSW 목으로만 실행
pnpm --filter @chinguya/customer dev   # 특정 앱만

pnpm build            # 전체 빌드
pnpm lint             # 전체 lint
pnpm typecheck        # 전체 타입체크
```

## 실행 환경 (local / dev / prod)

환경별 설정은 `env/*.env` 한 곳에 모여 있고 세 앱이 공유한다. 앱 디렉터리에 `.env*` 를 두지 않는다.
자세한 내용과 운영 배포 명령은 [`env/README.md`](env/README.md) 참고.

브라우저는 Core API를 직접 부르지 않고 항상 자기 오리진의 프록시 라우트(`/api/core/*`)를 거친다
— 운영의 internal-IP는 브라우저가 접근할 수 없기 때문이다. 따라서 화면 코드에서는
`createApiClient()` 를 인자 없이 쓰면 되고, Core 주소는 서버에만 존재한다.

## 앱에서 공용 패키지 사용

```tsx
import { Button } from "@chinguya/ui/button";
import { StatusBadge } from "@chinguya/ui/badge";
import type { CustomerReservation } from "@chinguya/types";
import { createApiClient } from "@chinguya/api-client";
```

`next.config.mjs` 의 `transpilePackages` 에 공용 패키지가 등록되어 있어 별도 빌드 없이 소스를 직접 참조한다.

## 다음 단계

와이어프레임(`chinguya-wireframes/`)의 화면들을 실제 라우트로 구현한다. 화면 코드(S1-C2 등)와 상세설명 문서를 기준으로 삼고, 화면 간 이동·상태 흐름을 `@chinguya/types` 로 강제한다. 상세 작업 지침은 [`docs/claude-code-prompt.md`](docs/claude-code-prompt.md) 참고.
