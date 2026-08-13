import type { Product, RentalCategoryKey } from "@chinguya/types";

/**
 * 렌탈 상품 목업 데이터 (agency 앱용).
 *
 * apps/customer/src/data/rentalData.ts 와 같은 상품을 가리키는 별도 사본이다 — 실제로는 두 앱이
 * 같은 백엔드(GET /api/products)를 보게 되므로 이 중복은 임시다. 지금은 공용 데이터 패키지가
 * 없어서 그대로 복제해뒀다. 상품을 추가/수정할 때는 customer 쪽 파일도 같이 맞춰야 한다.
 *
 * 취급 상품은 총 4종: 자전거(전기자전거/일반자전거), 낚싯대(일반낚시대/릴낚시대).
 * agencyPrice(여행사가)만 화면에 쓰고 customerPrice는 여행사앱에 노출하지 않는다.
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

/** 화면에 보여줄 한글 라벨. customer 쪽과 동일 — apps/customer/src/data/rentalData.ts 참고. */
export const CATEGORY_LABEL: Record<RentalCategoryKey, string> = {
  bike: "자전거",
  fishing: "낚싯대",
};

/** id로 상품 하나 찾기 */
export function findRentalProductById(id: string): Product | undefined {
  return rentalProducts.find((p) => p.id === id);
}
