import type { Asset } from "@chinguya/types";

/**
 * 자산(보유 대수) 목업 데이터 (cafe-next 프로토타입에서 이관).
 * 실제 백엔드 연동 시 이 파일 대신 API 응답으로 교체한다.
 *
 * "사유(수리/입고/외부임대)는 관리하지 않고, 수량만 관리한다"는 와이어프레임(S1-A2) 규칙에 따라
 * Asset은 그냥 이름 + 총 보유 대수만 갖는다. 날짜별로 "오늘 고객에게 몇 대 보여줄지"는
 * 이 파일이 아니라 inventoryData.ts(재고 세팅, S1-A3)에서 다룬다.
 *
 * 취급 자산은 총 4종: 전기자전거/일반자전거/일반낚시대/릴낚시대. 예전에는 낚싯대를 하나의
 * 자산 풀로 묶고 초/중/상급 상품끼리 나눠 썼지만, 지금은 상품이 등급이 아니라 장비 종류(일반/릴)로
 * 나뉘어서 물리적으로도 서로 다른 장비다 — 그래서 자산도 4개로 나눠 관리한다.
 */
export const assets: Asset[] = [
  { id: "asset-bike-electric", category: "bike", name: "전기자전거", totalCount: 8 },
  { id: "asset-bike-regular", category: "bike", name: "일반자전거", totalCount: 10 },
  { id: "asset-fishing-regular", category: "fishing", name: "일반낚시대", totalCount: 6 },
  { id: "asset-fishing-reel", category: "fishing", name: "릴낚시대", totalCount: 4 },
];
