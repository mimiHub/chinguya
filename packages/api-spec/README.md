# @chinguya/api-spec

친구야 API 계약(OpenAPI)의 단일 원천. 타입 생성·MSW·백엔드가 이걸 소비한다. 이 파일이 spec의 원천이며 mock이 spec을 대체하지 않는다.

## 파일

- `openapi/chinguya-slice1-openapi.yaml` — **고객** 대상 Slice 1 Core API 계약(초안). Redocly lint 통과 기준.
- `openapi/chinguya-admin-api.yaml` — **관리자** 대상 Core API 계약. 현재는 인증(S0-A2), 자산 관리(S1-A2), 날짜별 재고 세팅(S1-A3), 계좌·정책 설정(S1-A10), 여행사 관리(S2-A1/A2/A3), FAQ·콘텐츠 관리(S4-A1/A3). 나머지 관리자 운영 API는 구현되는 대로 이어 붙인다.
- `openapi/chinguya-agency-api.yaml` — **여행사** 대상 Core API 계약. 현재는 계정 등록(S2-G1)과 로그인(S2-G2). 대시보드·예약·인보이스(S2-G3~G7)는 구현되는 대로 이어 붙인다.

세 문서는 쿠키가 다르다 — 고객 `access_token`(30분) / 관리자 `admin_access_token`(4시간) / 여행사 `agency_access_token`(4시간). 서명 키도 관리자와 여행사가 서로 다르다(키가 같으면 감사 검사 버그 하나로 토큰이 서로 통용될 수 있다). 경로는 고객·여행사가 `/v1` 프리픽스를 쓰고 관리자만 없다.

여행사 관리는 문서가 둘로 갈린다 — 관리자가 부르는 것(목록·등록·상세·토글·초대 재발송)은 admin 문서에, 여행사 담당자가 부르는 것(초대 수락·로그인)은 agency 문서에 있다. 한 화면 흐름(S2-A2 → S2-G1)이 두 문서를 넘나드므로 한쪽만 고치지 않도록 주의한다.

## 작업 규칙

- **이 yaml들이 Core API 계약의 유일한 원천이다.** MSW mock, 프론트 타입, 백엔드 구현은 모두 이 파일을 따라간다. 반대 방향(구현·mock이 계약을 임의로 정하는 것)은 금지. 예외적으로 `chinguya-admin-api.yaml`의 인증 부분은 백엔드 구현이 먼저 있었던 것을 역문서화했다(해당 파일 헤더에 명시).
- 현재는 타입 자동생성/MSW 패키지가 아직 이 spec에 연결되어 있지 않다(`packages/api-client`도 아직 참조하지 않음). 그동안은 **수동 동기화 구간**이므로, 엔드포인트/스키마 작업 전에 이 yaml을 먼저 확인하고 필드명·상태값·경로를 맞춰서 구현한다.
- **Claude Code로 작업할 때는** 엔드포인트/응답 스키마를 구현·수정하기 전에 `packages/api-spec/openapi/chinguya-slice1-openapi.yaml`을 먼저 읽도록 프롬프트에 명시한다. 지시가 없으면 필드명을 임의로 추측해서 구현할 수 있다.
- **스펙 변경 순서**: 이 yaml을 먼저 고치고 리뷰 → 그다음 `api-client`/화면 구현을 맞춘다. 구현을 먼저 바꾸고 스펙을 나중에 맞추면 "mock/구현이 사실상 spec"이 되는 문제가 재발한다.
- yaml 하단 `TODO(협의)` 항목(상태 enum 전이, 임시 홀드 TTL, 취소 수수료 요율 등)은 임의로 확정하지 말고 기획/백엔드와 먼저 협의한다.
- `packages/types`와의 관계: `api-spec`은 API **계약**의 원천이고, `packages/types`는 프론트 내부 도메인 타입·비즈니스 규칙 값(재고 산식, 예약 상태 흐름 등)의 원천이다. 둘이 겹치는 값(예: 예약 상태 enum)은 `api-spec`이 먼저 바뀌고 `packages/types`가 그것을 반영하는 방향으로 맞춘다.
