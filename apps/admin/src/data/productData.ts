import type { AssetCategory } from "@chinguya/types";

/**
 * 상품 카탈로그 명칭 목업.
 *
 * 상품 관리(S1-A4/A5)는 Core API 에 실연동돼 이 파일을 쓰지 않는다. 여기 남은 목록은 아직
 * 목업으로 도는 **인보이스(S2-A5/A6)** 가 productId 로 상품명을 되찾는 데만 쓴다
 * (invoiceData.ts). 그 화면이 실연동되면 이 파일은 통째로 사라진다.
 *
 * slug 는 Core 의 숫자 PK 와 달리 목업 고유의 문자열이다.
 */
export const CATALOG_TITLES: { slug: string; category: AssetCategory; title: string; image: string }[] = [
  { slug: "bike-electric", category: "BICYCLE", title: "전기자전거", image: "/elec-bike.png" },
  { slug: "bike-regular", category: "BICYCLE", title: "일반자전거", image: "/bike.png" },
  { slug: "fishing-regular", category: "FISHING_ROD", title: "일반낚시대", image: "/fishing-set.png" },
  { slug: "fishing-reel", category: "FISHING_ROD", title: "릴낚시대", image: "/fishing-reel-set.png" },
];
