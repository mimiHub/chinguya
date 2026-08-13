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
│  ├─ api-client/         # 타입드 fetch 래퍼
│  ├─ tailwind-config/    # 공유 디자인 토큰(theme.css)
│  ├─ eslint-config/      # 공유 ESLint(flat) 프리셋
│  └─ typescript-config/  # 공유 tsconfig 프리셋
├─ chinguya-wireframes/   # (기존) 와이어프레임 HTML + 상세설명 문서
├─ turbo.json
├─ pnpm-workspace.yaml
└─ package.json
```

`packages/types` 는 공통 비즈니스 규칙(재고 산식, 예약 상태 흐름, 예약 가능 기간, 취소 수수료, 인보이스 등)을 코드로 옮긴 **단일 출처(source of truth)**다. 규칙이 바뀌면 이 패키지를 먼저 고치고 세 앱을 맞춘다. 규칙 원문은 `chinguya-wireframes/docs/README.md` 를 근거로 한다.

## 시작하기

전제: Node 20+, pnpm 9+ (`corepack enable`)

```bash
pnpm install          # 전체 워크스페이스 설치
pnpm dev              # 세 앱 동시 실행 (turbo)
pnpm --filter @chinguya/customer dev   # 특정 앱만

pnpm build            # 전체 빌드
pnpm lint             # 전체 lint
pnpm typecheck        # 전체 타입체크
```

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
