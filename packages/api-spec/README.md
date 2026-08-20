# @chinguya/api-spec

친구야 API 계약(OpenAPI)의 단일 원천. 타입 생성·MSW·백엔드가 이걸 소비한다. 이 파일이 spec의 원천이며 mock이 spec을 대체하지 않는다.

## 파일

- `openapi/chinguya-slice1-openapi.yaml` — Slice 1 Core API 계약(초안). Redocly lint 통과 기준.

## 작업 규칙

- **이 yaml이 Slice 1 Core API 계약의 유일한 원천이다.** MSW mock, 프론트 타입, 백엔드 구현은 모두 이 파일을 따라간다. 반대 방향(구현·mock이 계약을 임의로 정하는 것)은 금지.
- 현재는 타입 자동생성/MSW 패키지가 아직 이 spec에 연결되어 있지 않다(`packages/api-client`도 아직 참조하지 않음). 그동안은 **수동 동기화 구간**이므로, 엔드포인트/스키마 작업 전에 이 yaml을 먼저 확인하고 필드명·상태값·경로를 맞춰서 구현한다.
- **Claude Code로 작업할 때는** 엔드포인트/응답 스키마를 구현·수정하기 전에 `packages/api-spec/openapi/chinguya-slice1-openapi.yaml`을 먼저 읽도록 프롬프트에 명시한다. 지시가 없으면 필드명을 임의로 추측해서 구현할 수 있다.
- **스펙 변경 순서**: 이 yaml을 먼저 고치고 리뷰 → 그다음 `api-client`/화면 구현을 맞춘다. 구현을 먼저 바꾸고 스펙을 나중에 맞추면 "mock/구현이 사실상 spec"이 되는 문제가 재발한다.
- yaml 하단 `TODO(협의)` 항목(상태 enum 전이, 임시 홀드 TTL, 취소 수수료 요율 등)은 임의로 확정하지 말고 기획/백엔드와 먼저 협의한다.
- `packages/types`와의 관계: `api-spec`은 API **계약**의 원천이고, `packages/types`는 프론트 내부 도메인 타입·비즈니스 규칙 값(재고 산식, 예약 상태 흐름 등)의 원천이다. 둘이 겹치는 값(예: 예약 상태 enum)은 `api-spec`이 먼저 바뀌고 `packages/types`가 그것을 반영하는 방향으로 맞춘다.
