import type { RentalOptionKey } from "@chinguya/types";
import { getAgencyExposedQty } from "@chinguya/catalog-data";
import { rentalProducts, RENTAL_OPTION_ORDER } from "./rentalData";

/**
 * S2-G4/G5 상품 예약 표의 한 행 = "상품 + 대여기간" 조합(예: "전기자전거 · 1일") — admin의
 * 상품 관리(AdminProductVariant)와 같은 단위다.
 *
 * "가용(할당)"은 @chinguya/catalog-data(총 보유 − 여행사 할당, 세 앱이 공유하는 값)의
 * 여행사 할당 수량을 그대로 쓴다 — 실제로는 특정 날짜의 AgencyAllocation(관리자가 이 여행사에
 * 배정한 수량)에서 가져와야 하는데, 지금은 날짜별 할당 데이터가 없어서 상품 하나당 고정된
 * 값을 모든 대여기간 옵션에 동일하게 적용한다. 실제 연동 시 이용 날짜가 바뀔 때마다 다시
 * 조회하도록 교체한다.
 */
export interface BookingRow {
  id: string;
  productId: string;
  title: string;
  option: RentalOptionKey;
  agencyPrice: number;
  allocatedQty: number;
}

export function getBookingRows(): BookingRow[] {
  return rentalProducts.flatMap((product) =>
    RENTAL_OPTION_ORDER.map((option) => ({
      id: `${product.id}__${option}`,
      productId: product.id,
      title: product.title,
      option,
      agencyPrice: product.priceByOption[option].agencyPrice,
      allocatedQty: getAgencyExposedQty(product.id),
    })),
  );
}
