import type { Product, RentalCategoryKey, RentalOptionKey } from "@chinguya/types";

/**
 * 렌탈 상품 목업 데이터.
 * 실제 백엔드 연동 시 이 파일 대신 API 응답(GET /api/products)으로 교체한다.
 *
 * Product 하나 = 카탈로그 항목 하나(예: "전기자전거"). "몇 대 갖고 있는지"는 여기서 관리하지
 * 않고 별도의 Asset(총 보유 대수)·Inventory(날짜별 가용 수량)로 관리한다 — admin 쪽
 * apps/admin/src/data/assetData.ts, inventoryData.ts 참고.
 *
 * 취급 상품은 총 4종: 자전거 카테고리에 전기자전거/일반자전거, 낚싯대 카테고리에
 * 일반낚시대/릴낚시대. 이전에 있던 낚시 초급/중급/고급 등급 구분은 없앴다(장비 종류로
 * 구분하는 걸로 대체).
 *
 * agencyPrice(여행사가)는 cafe-next 프로토타입에 아직 없던 값이라 임시로 customerPrice와
 * 다르게 채워뒀다 — 실제 여행사 정산가가 정해지면 이 값만 고치면 된다(고객앱엔 노출 안 됨).
 */

const price = (customerWon: number, agencyWon: number) => ({ customerPrice: customerWon, agencyPrice: agencyWon });

export const rentalProducts: Product[] = [
  {
    id: "bike-electric",
    category: "bike",
    title: "전기자전거",
    name: "전기자전거 대여(당일 오후 4시 반납)",
    description: "전동 어시스트로 오르막도 편하게 다닐 수 있는 전기자전거 대여 상품입니다.",
    image: "/elec-bike.png",
    priceByOption: {
      "2h": price(6000, 6000),
      "1d": price(15000, 15000),
      "2d": price(27000, 27000),
      night: price(8000, 8000),
    },
    customerVisible: true,
    agencyVisible: true,
  },
  {
    id: "bike-regular",
    category: "bike",
    title: "일반자전거",
    name: "일반자전거 대여(당일 오후 4시 반납)",
    description: "가볍게 타기 좋은 일반자전거 대여 상품입니다.",
    image: "/bike.png",
    priceByOption: {
      "2h": price(3000, 3000),
      "1d": price(8000, 8000),
      "2d": price(14000, 14000),
      night: price(5000, 5000),
    },
    customerVisible: true,
    agencyVisible: true,
  },
  {
    id: "fishing-regular",
    category: "fishing",
    title: "일반낚시대",
    name: "일반낚시대 세트 렌탈",
    description: "입문자도 편하게 사용할 수 있는 일반 낚시대 세트 대여 상품입니다.",
    image: "/fishing-set.png",
    priceByOption: {
      "2h": price(3000, 3000),
      "1d": price(7000, 7000),
      "2d": price(12000, 12000),
      night: price(8000, 8000),
    },
    customerVisible: true,
    agencyVisible: true,
  },
  {
    id: "fishing-reel",
    category: "fishing",
    title: "릴낚시대",
    name: "릴낚시대 세트 렌탈",
    description: "릴을 이용한 캐스팅 낚시를 즐기실 수 있는 릴낚시대 세트 대여 상품입니다.",
    image: "/fishing-set.png",
    priceByOption: {
      "2h": price(5000, 5000),
      "1d": price(12000, 12000),
      "2d": price(20000, 20000),
      night: price(13000, 13000),
    },
    customerVisible: true,
    agencyVisible: true,
  },
];

export const rentalNotice = [
  "예약 가능 기간: 오늘 +1일 ~ +3개월(현지 기준 '오늘').",
  "가용 수량은 재고 상황에 따라 매일 달라질 수 있습니다.",
  "2일 대여 + 타지역 반납 선택 시 다음날 예약이 자동 마감됩니다.",
];

/**
 * 화면에 보여줄 한글 라벨 모음.
 * packages/types 쪽 타입(RentalCategoryKey, RentalOptionKey)에는 "bike"/"2h" 같은
 * 식별자만 있고 글자는 없다 — 사용자 노출 문구는 각 앱의 데이터/i18n 쪽 책임이라서 여기 둔다.
 */
export const CATEGORY_LABEL: Record<RentalCategoryKey, string> = {
  bike: "자전거",
  fishing: "낚싯대",
};

export const RENTAL_OPTION_LABEL: Record<RentalOptionKey, string> = {
  "2h": "2시간",
  "1d": "1일",
  "2d": "2일",
  night: "야간",
};

/** 옵션 칩을 순서대로 그릴 때 쓰는 고정 순서 목록 */
export const RENTAL_OPTION_ORDER: RentalOptionKey[] = ["2h", "1d", "2d", "night"];

/** id로 상품 하나 찾기. 상세 페이지(/rental/[id])에서 사용. */
export function findRentalProductById(id: string): Product | undefined {
  return rentalProducts.find((p) => p.id === id);
}
