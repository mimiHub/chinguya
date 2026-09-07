# env/ — 실행 환경 설정

세 앱(customer / admin / agency)이 **한 벌의 환경 파일을 공유**한다. 앱별 `.env*` 파일은 두지 않는다.

| 환경 | 명령 | Core API 주소 | MSW |
| --- | --- | --- | --- |
| local | `pnpm dev:local` | `http://localhost:8080` (내 머신의 자바 Core) | off |
| dev | `pnpm dev` | AWS EC2 퍼블릭 주소 | off |
| prod | `pnpm build:prod` → `pnpm start:prod` | AWS EC2 internal-IP | off |
| mock | `pnpm dev:mock` | 없음 (MSW 핸들러) | on |

## 변수

- `APP_ENV` — 현재 환경 이름. 로깅·분기용.
- `CORE_API_BASE_URL` — Core API **오리진만** 담는다. `/v1`, `/admin` 같은 경로 프리픽스는
  각 앱의 프록시 라우트가 붙이므로 여기에 쓰지 않는다.
- `NEXT_PUBLIC_API_MOCKING` — `enabled` 일 때만 MSW 기동. mock 환경에서만 설정한다.

## 왜 `CORE_API_BASE_URL` 에 `NEXT_PUBLIC_` 이 없나

`NEXT_PUBLIC_*` 은 빌드 시 클라이언트 번들에 문자열로 박힌다. 운영의 internal-IP는
브라우저가 접근할 수 없으므로 그 방식으로는 동작하지 않는다.

그래서 모든 API 호출은 브라우저 → 같은 오리진의 Next Route Handler(`/api/core/*`) →
Core API 순으로 흐른다. Core 주소는 서버에만 존재하고, CORS 설정도 필요 없으며,
세 환경이 완전히 동일한 클라이언트 코드를 쓴다.

## 머신별 임시 오버라이드

`env/*.local.env` 는 `.gitignore` 대상이다. 예를 들어 `env/dev.local.env` 를 만들고
`pnpm dotenv -e env/dev.local.env -- turbo run dev` 로 띄우면 커밋 없이 주소를 바꿀 수 있다.
