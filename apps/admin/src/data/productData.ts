import type { PriceBook, RentalCategoryKey, RentalOptionKey } from "@chinguya/types";
import { OFF_SITE_RETURN_FEE_KRW } from "@chinguya/types";

/**
 * 관리자 "상품 관리"(S1-A4/S1-A5) 목업 데이터.
 *
 * 와이어프레임 S1-A5(상품 등록/수정)를 보면 옵션별 가격표를 입력하는 게 아니라 고객가/여행사가를
 * 단일 값으로 입력한다 — 즉 관리자 입장에서 "상품" 하나는 "카테고리+대여기간" 조합 하나다
 * (예: "전기자전거 · 1일", "전기자전거 · 야간"은 서로 다른 상품). 타지역 반납 추가요금도
 * "2일 상품에만" 있는 필드로 나온다.
 *
 * 반면 고객앱(apps/customer)에서는 이 조합들을 카탈로그 타이틀(예: "전기자전거") 기준으로 묶어서
 * 옵션 칩 하나의 상세 페이지로 보여준다(apps/customer/src/data/rentalData.ts의
 * Product.priceByOption이 바로 이 조합들을 모아놓은 것과 같음). 즉 같은 가격 데이터를 관리자는
 * "조합별로 쪼개서", 고객앱은 "카탈로그로 묶어서" 보여주는 셈이다. 실제 백엔드가 생기면 두 화면이
 * 같은 GET /api/products 응답을 서로 다르게 가공해서 보여주는 구조가 될 것이다.
 *
 * 취급 상품은 총 4종: 자전거는 전기자전거/일반자전거, 낚시는 일반낚시대/릴낚시대.
 * (이전에 있던 낚시 초급/중급/고급 등급 구분은 없앴다 — 장비 종류 구분으로 대체.)
 */
export interface AdminProductVariant {
  /** URL(/products/[id])에 그대로 쓰이는 값이라 한글·공백·괄호 없이 영문 슬러그만 쓴다 */
  id: string;
  category: RentalCategoryKey;
  /** 카탈로그 타이틀(예: "전기자전거") — 관리자가 자유 입력하지 않고 CATALOG_TITLES 중에서 고른다 */
  title: string;
  image: string;
  option: RentalOptionKey;
  price: PriceBook;
  customerVisible: boolean;
  agencyVisible: boolean;
  /** 2일(2d) 상품에만 있는 타지역 반납 추가요금. 그 외 옵션엔 없음(undefined) */
  offSiteReturnFeeKrw?: number;
  description?: string;
}

/** 신규 상품 등록 시 고를 수 있는 카탈로그 목록(자산 관리와 이름을 맞춰둠) */
export const CATALOG_TITLES: { slug: string; category: RentalCategoryKey; title: string; image: string }[] = [
  { slug: "bike-electric", category: "bike", title: "전기자전거", image: "/elec-bike.png" },
  { slug: "bike-regular", category: "bike", title: "일반자전거", image: "/bike.png" },
  { slug: "fishing-regular", category: "fishing", title: "일반낚시대", image: "/fishing-set.png" },
  { slug: "fishing-reel", category: "fishing", title: "릴낚시대", image: "/fishing-reel-set.png" },
];

const price = (customerWon: number, agencyWon: number): PriceBook => ({ customerPrice: customerWon, agencyPrice: agencyWon });

function variantId(slug: string, option: RentalOptionKey): string {
  return `${slug}__${option}`;
}

function buildVariants(
  slug: string,
  category: RentalCategoryKey,
  title: string,
  image: string,
  pricesByOption: Record<RentalOptionKey, number>,
): AdminProductVariant[] {
  return (Object.keys(pricesByOption) as RentalOptionKey[]).map((option) => ({
    id: variantId(slug, option),
    category,
    title,
    image,
    option,
    price: price(pricesByOption[option], pricesByOption[option]),
    customerVisible: true,
    agencyVisible: true,
    offSiteReturnFeeKrw: option === "2d" ? OFF_SITE_RETURN_FEE_KRW : undefined,
  }));
}

export const adminProductVariants: AdminProductVariant[] = [
  ...buildVariants("bike-electric", "bike", "전기자전거", "/elec-bike.png", {
    "2h": 6000,
    "1d": 15000,
    "2d": 27000,
    night: 8000,
  }),
  ...buildVariants("bike-regular", "bike", "일반자전거", "/bike.png", {
    "2h": 3000,
    "1d": 8000,
    "2d": 14000,
    night: 5000,
  }),
  ...buildVariants("fishing-regular", "fishing", "일반낚시대", "/fishing-set.png", {
    "2h": 3000,
    "1d": 7000,
    "2d": 12000,
    night: 8000,
  }),
  ...buildVariants("fishing-reel", "fishing", "릴낚시대", "/fishing-reel-set.png", {
    "2h": 5000,
    "1d": 12000,
    "2d": 20000,
    night: 13000,
  }),
];

export function findAdminProductVariantById(id: string): AdminProductVariant | undefined {
  return adminProductVariants.find((v) => v.id === id);
}

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

export const RENTAL_OPTION_ORDER: RentalOptionKey[] = ["2h", "1d", "2d", "night"];
