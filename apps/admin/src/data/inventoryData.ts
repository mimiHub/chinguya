import type { Inventory } from "@chinguya/types";
import { assets } from "./assetData";

/**
 * 날짜별 재고 세팅(S1-A3) 목업.
 * 실제로는 GET/PUT /api/admin/inventory?assetId=...&date=... 로 대체될 자리다.
 *
 * 재고는 "카테고리+대여기간" 조합(상품)이 아니라 자산(전기자전거/일반자전거/일반낚시대/릴낚시대)
 * 단위로 관리한다 — 재고 세팅 화면은 assetData.ts의 자산 목록을 그대로 쓴다.
 *
 * key는 `${assetId}__${YYYY-MM-DD}`. 이 목업에 없는 날짜는 자산의 총 보유 대수를 그대로
 * totalStock 기본값으로 쓰고, 여행사 할당 0 · 휴무 아님으로 취급한다.
 */
const mockInventory = new Map<string, Inventory & { closed: boolean }>();

function toDateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function mapKey(assetId: string, dateKey: string): string {
  return `${assetId}__${dateKey}`;
}

/** 자산의 총 보유 대수를 가져온다(재고 세팅의 기본값). */
export function getDefaultTotalStock(assetId: string): number {
  return assets.find((a) => a.id === assetId)?.totalCount ?? 0;
}

/** 특정 자산 · 특정 날짜의 재고 세팅값을 가져온다. 저장된 적 없으면 기본값을 만들어 돌려준다. */
export function getInventoryRecord(
  assetId: string,
  year: number,
  month: number,
  day: number,
): Inventory & { closed: boolean } {
  const dateKey = toDateKey(year, month, day);
  const existing = mockInventory.get(mapKey(assetId, dateKey));
  if (existing) return existing;

  const totalStock = getDefaultTotalStock(assetId);
  return { productId: assetId, date: dateKey, totalStock, agencyAllocated: 0, customerAvailable: totalStock, closed: false };
}

/** 재고 세팅값을 저장한다(지금은 메모리에만 저장 — 새로고침하면 초기화됨. 실제로는 API 호출로 교체). */
export function saveInventoryRecord(record: Inventory & { closed: boolean }): void {
  mockInventory.set(mapKey(record.productId, record.date), record);
}
