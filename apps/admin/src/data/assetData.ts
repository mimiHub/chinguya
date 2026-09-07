import type { Asset } from "@chinguya/types";

/**
 * 자산(명칭 마스터) 목업 데이터.
 *
 * ⚠ 자산 관리(S1-A2, /assets)와 재고 세팅(S1-A3, /inventory)은 Core API에 실연동돼
 * 이 파일을 쓰지 않는다. 여기 남은 목록은 아직 목업으로 도는 할당 세팅(/allocations)의
 * 자산 선택기·재고 값(inventoryData.ts)을 위한 것이다. 그 화면이 실연동되면 이 파일은
 * 통째로 사라진다.
 *
 * 취급 자산은 총 4종: 전기자전거/일반자전거/일반낚시대/릴낚시대. 예전에는 낚싯대를 하나의
 * 자산 풀로 묶고 초/중/상급 상품끼리 나눠 썼지만, 지금은 상품이 등급이 아니라 장비 종류(일반/릴)로
 * 나뉘어서 물리적으로도 서로 다른 장비다 — 그래서 자산도 4개로 나눠 관리한다.
 *
 * assetId는 Core의 숫자 PK와 달리 목업 고유의 문자열이다. inventoryData.ts·allocationData.ts가
 * 이 값을 키로 쓰므로 실연동 시 두 파일을 함께 옮겨야 한다.
 */
const MOCK_TIMESTAMP = "2026-09-01T00:00:00Z";

function mockAsset(assetId: string, name: string): Asset {
  return {
    assetId,
    name,
    deleted: false,
    hasInventoryRecords: true,
    createdAt: MOCK_TIMESTAMP,
    updatedAt: MOCK_TIMESTAMP,
    deletedAt: null,
  };
}

export const assets: Asset[] = [
  mockAsset("asset-bike-electric", "전기자전거"),
  mockAsset("asset-bike-regular", "일반자전거"),
  mockAsset("asset-fishing-regular", "일반낚시대"),
  mockAsset("asset-fishing-reel", "릴낚시대"),
];
