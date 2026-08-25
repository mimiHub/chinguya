# 친구야 — API 명세(spec) 변경 → MSW 목 동기화 가이드

`packages/api-spec`의 OpenAPI(yaml)가 추가·변경됐을 때 `packages/mocks`(MSW)를
어떻게 맞추는지에 대한 유지보수 문서.

---

## 원칙 — 단방향 (spec → 타입 → 목)

동기화 방향은 항상 한 방향이다.

```
api-spec/openapi/*.yaml   →   types.gen.ts   →   fixtures / store / handlers
     (원천)                    (생성물)              (목)
```

- **yaml이 유일한 원천.** 목은 yaml에서 생성한 타입(`types.gen.ts`)에 묶여 있어,
  spec이 바뀌면 타입체크가 어긋난 지점을 전부 에러로 잡아준다. → 수동으로 찾을 게 적다.
- **`types.gen.ts`와 yaml은 목 수정 목적으로 직접 건드리지 않는다.**
  응답 구조(필드)를 바꾸고 싶다면 그건 "목 수정"이 아니라 **spec 변경**이므로
  yaml부터 고친 뒤 이 절차를 탄다(목이 spec을 벗어나면 안 됨).

---

## 표준 동기화 절차

```sh
# 1) 타입 재생성 (yaml → src/types.gen.ts)
pnpm --filter @chinguya/mocks gen:types

# 2) 타입체크 — 목이 새 spec과 어긋난 지점을 전부 에러로 표시
pnpm --filter @chinguya/mocks typecheck

# 3) 에러 위치를 아래 표대로 수정 → 커밋
```

타입체크가 통과하면 목이 새 spec과 일치한다는 뜻이다.

---

## 변경 유형별 수정 위치

| spec 변경 | 목에서 고칠 곳 |
|---|---|
| 스키마 필드 추가 / 이름 변경 / 삭제 | `fixtures.ts`(값) · `store.ts`(객체 생성부) — 타입 에러 위치 그대로 |
| 필수 ↔ 선택 변경 | 위와 동일, 에러 지점만 |
| **새 엔드포인트 추가** | `handlers.ts`에 핸들러 1개 추가 (상태 있으면 `store.ts`, 고정 응답이면 `fixtures.ts` 보강) |
| 엔드포인트 삭제 / 경로 변경 | `handlers.ts`에서 해당 핸들러 삭제·수정 |
| enum 값(상태 등) 추가 | `store.ts` · `handlers.ts`의 해당 분기 보강 |

> `fixtures.ts` = 값(픽스처, PM 소유) / `store.ts` = 인메모리 상태·전이 / `handlers.ts` = 엔드포인트.
> `types.gen.ts`(생성물) · yaml(원천)은 이 표의 대상이 아니다.

---

## 누락 감지 — onUnhandledRequest

앱이 호출하는데 목에 핸들러가 없으면 `onUnhandledRequest: 'warn'` 설정에 의해
콘솔 경고로 드러난다. 즉 "새 엔드포인트 핸들러 빠뜨림"은 실행하면 바로 보인다.
경고가 뜨면 해당 경로의 핸들러를 `handlers.ts`에 추가한다.

---

## 새 slice 명세가 추가될 때 (slice2 등)

지금은 slice1 단일 파일이라 `gen:types`가 그 하나만 본다. slice2 yaml이 생기면
명세별로 나누는 구조로 확장한다.

```
src/
├─ types/
│  ├─ slice1.gen.ts
│  └─ slice2.gen.ts        ← 명세별 생성
├─ handlers/
│  ├─ slice1.ts
│  ├─ slice2.ts            ← 명세별 핸들러
│  └─ index.ts             → export const handlers = [...slice1, ...slice2]
```

그리고 `gen:types`가 `openapi/*.yaml` 전부를 돌도록 스크립트를 바꾼다.
(이 리팩터링이 필요해지면 PM에게 요청 — 전용 프롬프트 제공)

---

## 권장 — 타입 자동 최신화

`types.gen.ts`를 커밋하지 않고(gitignore) 스크립트 훅으로 자동 재생성하면
spec 변경 시 재생성을 잊어 생기는 드리프트를 원천 차단한다.

```jsonc
// packages/mocks/package.json (scripts)
{
  "predev": "pnpm gen:types",
  "postinstall": "pnpm gen:types"
}
```

- 장점: 클론·설치·실행 시점마다 yaml 기준으로 타입이 새로 생성돼 절대 낡지 않는다.
- 대안: `types.gen.ts`를 커밋해두는 방식도 가능하나, spec 변경 때마다 수동
  재생성을 잊으면 드리프트가 남는다.

---

## 체크리스트 (spec 바뀌면)

- [ ] `gen:types` 재실행
- [ ] `typecheck` 통과할 때까지 `fixtures.ts` / `store.ts` / `handlers.ts` 수정
- [ ] 새 엔드포인트면 핸들러 추가 (앱 실행 시 `onUnhandledRequest` 경고 0 확인)
- [ ] enum·상태 추가면 분기 보강
- [ ] 값 관련 수정은 `fixtures.ts`에서만 (핸들러 로직·spec·types.gen 임의 변경 금지)
- [ ] 커밋 (예: `chore(mocks): slice1 spec 변경 반영`)

---

## 부록 — Claude Code 동기화 프롬프트

```text
packages/api-spec의 OpenAPI가 변경됐다. packages/mocks(MSW)를 새 spec에 동기화한다.

[절차]
1) pnpm --filter @chinguya/mocks gen:types      # yaml → src/types.gen.ts 재생성
2) pnpm --filter @chinguya/mocks typecheck       # 어긋난 지점 확인
3) 타입 에러를 다음 원칙으로 수정한다(원천은 spec):
   - 스키마 필드 변경 → fixtures.ts(값)·store.ts(생성부)에서 에러 위치만 수정
   - 새 엔드포인트 → handlers.ts에 핸들러 추가(상태 있으면 store.ts 보강)
   - 엔드포인트 삭제/경로 변경 → handlers.ts 해당 핸들러 삭제·수정
   - enum 추가 → store.ts/handlers.ts 분기 보강
   - types.gen.ts와 yaml은 직접 수정하지 말 것(생성물/원천)
4) typecheck가 통과할 때까지 반복.
5) (가능하면) node.ts server로 스모크: 변경 관련 엔드포인트 호출이 정상 응답하는지 확인.

[커밋·push]
  chore(mocks): api-spec 변경 반영(목 동기화)
[보고] 재생성 여부, 수정 파일, typecheck 결과.
```
