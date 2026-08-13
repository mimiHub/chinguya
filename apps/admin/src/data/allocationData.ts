import type { AgencyAllocation } from "@chinguya/types";

/**
 * 여행사별 할당 세팅(S1-A3 재고 세팅에서 이어지는 화면) 목업.
 * 실제로는 GET/PUT /api/admin/allocations?assetId=...&date=... 로 대체될 자리다.
 *
 * 재고 세팅(inventoryData.ts)과 마찬가지로 자산(전기자전거/일반자전거/일반낚시대/릴낚시대)
 * 단위로 관리한다.
 * AgencyAllocation.productId 필드에는 실제로 assetId를 담는다(inventoryData.ts와 동일한 관례).
 */
const mockAllocations = new Map<string, number>();

function mapKey(assetId: string, agencyId: string, date: string): string {
  return `${assetId}__${agencyId}__${date}`;
}

/** 특정 자산 · 특정 날짜 · 특정 여행사의 할당 수량. 저장된 적 없으면 0. */
export function getAllocatedQty(assetId: string, agencyId: string, date: string): number {
  return mockAllocations.get(mapKey(assetId, agencyId, date)) ?? 0;
}

/** 할당 수량 저장(지금은 메모리에만 저장 — 새로고침하면 초기화됨). */
export function saveAllocatedQty(assetId: string, agencyId: string, date: string, qty: number): void {
  mockAllocations.set(mapKey(assetId, agencyId, date), qty);
}

/** 특정 자산 · 특정 날짜에 모든 여행사에 할당된 수량의 합계(Inventory.agencyAllocated와 같아야 하는 값). */
export function getTotalAllocatedQty(assetId: string, agencyIds: string[], date: string): number {
  return agencyIds.reduce((sum, agencyId) => sum + getAllocatedQty(assetId, agencyId, date), 0);
}

export type { AgencyAllocation };
