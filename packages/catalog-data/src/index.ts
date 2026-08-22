import type { RentalCategoryKey } from "@chinguya/types";

/**
 * 상품별 재고 배분 목업 — customer/admin/agency 세 앱이 전부 이 패키지를 가져다 써서 같은
 * 숫자를 보게 한다(각 앱 안에 따로 복제하지 않는다).
 *
 * 규칙(기존 admin 재고 세팅 화면과 동일한 산식): 총 보유 − 여행사 할당 = 고객 가용.
 * 예를 들어 전기자전거 총 보유가 8대인데 여행사에 5대를 할당했다면, 고객에게는 3대만 풀린다 —
 * 그래서 고객 상품 조회(S1/S3-C1) 목록에는 그 상품 카드가 3장만 반복해서 나온다(관리자가
 * '표출 ON'한 상품이 노출 가능한 수량만큼 나열되는 것 — 쿠팡류 쇼핑몰의 검색 결과 목록과 같은
 * 형태). 여행사앱 예약 화면(S2-G4/G5)의 "가용(할당)"도 같은 여행사 할당 수량을 기준값으로 쓴다.
 *
 * apps/admin/src/data/assetData.ts의 총 보유 대수(totalCount)와 같은 값을 가리키는 사본이다 —
 * 실제로는 관리자의 재고 세팅·할당 세팅(날짜별 Inventory/AgencyAllocation) 결과가 그대로
 * 여기 반영되게 될 자리다. 지금은 날짜 구분 없이 고정된 데모값 하나만 쓴다.
 */
export interface ProductStock {
  productId: string;
  category: RentalCategoryKey;
  /** 총 보유 대수 (admin의 Asset.totalCount와 같은 값) */
  totalCount: number;
  /** 여행사에 할당한 수량 (admin의 여행사 할당 세팅 결과) */
  agencyAllocated: number;
}

export const productStocks: ProductStock[] = [
  { productId: "bike-electric", category: "bike", totalCount: 8, agencyAllocated: 5 },
  { productId: "bike-regular", category: "bike", totalCount: 10, agencyAllocated: 6 },
  { productId: "fishing-regular", category: "fishing", totalCount: 6, agencyAllocated: 3 },
  { productId: "fishing-reel", category: "fishing", totalCount: 4, agencyAllocated: 2 },
];

export function getProductStock(productId: string): ProductStock | undefined {
  return productStocks.find((s) => s.productId === productId);
}

/** 고객앱 상품 조회 목록에 이 상품을 몇 장의 카드로 반복해서 보여줄지 (= 총 보유 − 여행사 할당) */
export function getCustomerExposedQty(productId: string): number {
  const stock = getProductStock(productId);
  if (!stock) return 0;
  return Math.max(stock.totalCount - stock.agencyAllocated, 0);
}

/** 여행사앱 예약 화면에서 이 상품의 가용(할당) 수량 */
export function getAgencyExposedQty(productId: string): number {
  return getProductStock(productId)?.agencyAllocated ?? 0;
}
