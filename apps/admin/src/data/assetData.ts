import type { Asset } from "@chinguya/types";
import { hasInventoryRecords } from "./inventoryData";

/**
 * 자산(명칭 마스터) 목업 데이터 (cafe-next 프로토타입에서 이관).
 * 실제 백엔드 연동 시 이 파일 대신 API 응답으로 교체한다.
 *
 * 비동기 데일리 로그(2026-09-03, "S1-A2 자산관리 기획 수정")에 따라 자산 관리는 "명칭"만
 * 등록·수정·삭제(소프트/완전삭제)·복원한다 — 카테고리, 실제 보유 수량(기준 보유량)과 날짜별
 * 재고 조정은 이 파일이 아니라 inventoryData.ts(날짜별 재고 현황, S1-A3)에서 다룬다.
 *
 * 취급 자산은 총 4종: 전기자전거/일반자전거/일반낚시대/릴낚시대. 예전에는 낚싯대를 하나의
 * 자산 풀로 묶고 초/중/상급 상품끼리 나눠 썼지만, 지금은 상품이 등급이 아니라 장비 종류(일반/릴)로
 * 나뉘어서 물리적으로도 서로 다른 장비다 — 그래서 자산도 4개로 나눠 관리한다.
 */
export const assets: Asset[] = [
  { id: "asset-bike-electric", name: "전기자전거" },
  { id: "asset-bike-regular", name: "일반자전거" },
  { id: "asset-fishing-regular", name: "일반낚시대" },
  { id: "asset-fishing-reel", name: "릴낚시대" },
  // 소프트삭제 데모 데이터 — "삭제됨" 섹션과 복원 동작을 바로 확인할 수 있도록 남겨둔다.
  { id: "asset-bike-electric-legacy", name: "구형 전기자전거", deleted: true },
];

let nextCustomId = 1;

/** 활성(소프트삭제되지 않은) 자산만 반환한다. 재고 세팅(S1-A3)의 자산 선택기가 이 함수를 쓴다. */
export function listActiveAssets(): Asset[] {
  return assets.filter((asset) => !asset.deleted);
}

/** 소프트삭제된("삭제됨") 자산만 반환한다. 자산 관리 목록 하단 섹션에 쓰인다. */
export function listDeletedAssets(): Asset[] {
  return assets.filter((asset) => asset.deleted);
}

/**
 * 명칭이 이미 쓰이고 있는지 확인한다(활성 자산끼리만 비교 — 삭제된 자산의 명칭은 재사용 가능).
 * 앞뒤 공백은 제거하고 비교한다. excludeId를 주면 그 자산 자신은 비교에서 뺀다(수정 시 사용).
 */
export function isNameTaken(name: string, excludeId?: string): boolean {
  const trimmed = name.trim();
  return assets.some((asset) => !asset.deleted && asset.id !== excludeId && asset.name === trimmed);
}

export function addAsset(name: string): Asset {
  const asset: Asset = { id: `asset-custom-${nextCustomId++}`, name: name.trim() };
  assets.push(asset);
  return asset;
}

export function updateAssetName(id: string, name: string): void {
  const asset = assets.find((a) => a.id === id);
  if (asset) asset.name = name.trim();
}

/**
 * 자산을 삭제한다 — 재고 레코드가 하나도 없으면 목록에서 완전히 제거하고, 하나라도 있으면
 * 소프트삭제(deleted=true)만 해서 "삭제됨" 섹션에서 복원할 수 있게 남겨둔다.
 */
export function deleteAsset(id: string): void {
  if (hasInventoryRecords(id)) {
    const asset = assets.find((a) => a.id === id);
    if (asset) asset.deleted = true;
    return;
  }
  const index = assets.findIndex((a) => a.id === id);
  if (index !== -1) assets.splice(index, 1);
}

/**
 * 소프트삭제된 자산을 다시 활성 상태로 되돌린다(A2-M4). 과거 재고·예약 이력을 그대로
 * 이어받으므로 id는 바뀌지 않는다 — 명칭만 복원 모달에서 입력받은 값으로 갱신한다(같은
 * 명칭의 활성 자산이 이미 있으면 호출 전에 isNameTaken으로 막아야 한다).
 */
export function restoreAsset(id: string, name: string): void {
  const asset = assets.find((a) => a.id === id);
  if (!asset) return;
  asset.deleted = false;
  asset.name = name.trim();
}
