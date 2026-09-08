/**
 * 랜딩(안 A) 히어로 배너 · 서비스 소개(S4-C2) 콘텐츠 목업(S4-A1/A3 FAQ · 콘텐츠 관리에서 편집).
 *
 * 실제로는 GET/PUT /api/admin/content 로 대체될 자리이고, 고객앱(홈 배너·서비스 소개 페이지)이
 * 이 값을 그대로 읽어와야 한다. 지금은 앱이 서로 독립된 프로토타입이라 여기서 저장해도
 * 고객앱 화면에는 반영되지 않는다(계좌·정책 설정 저장 버튼과 같은 한계).
 */
export interface IntroContent {
  /** 서비스 소개(S4-C2) 단일 페이지 본문 */
  body: string;
}

export const introContent: IntroContent = {
  body:
    "친구야는 쓰시마 이즈하라에서 자전거와 낚싯대를 대여해 드리는 여행자 렌탈 서비스입니다. " +
    "섬 곳곳을 자유롭게 둘러보실 수 있도록 반나절부터 이틀까지 다양한 대여 옵션을 준비했고, " +
    "한국어 응대와 원화(KRW) 결제로 예약부터 반납까지 편하게 이용하실 수 있어요.",
};

/**
 * 랜딩 히어로 배너. 값 자체(3장·문구·이미지 경로)는 `@chinguya/catalog-data`의
 * heroBannerSlides가 단일 출처 — customer 홈 캐러셀(HomeCarousel.tsx)과 agency 로그인
 * 배경(AuthBackgroundSlides.tsx)도 같은 값을 가져다 쓴다. 이 화면에서 편집하는 배열은
 * 그 초기값을 그대로 복사해온 React state라서, 세 앱이 항상 같은 배너에서 출발하는 건
 * 보장되지만 실제 저장 API가 아직 없어 여기서 "저장"해도 catalog-data(및 다른 두 앱)에는
 * 반영되지 않는다 — PUT /api/admin/content/banners 연동 시 그 응답으로 대체될 자리.
 */
export { heroBannerSlides as bannerSlides } from "@chinguya/catalog-data";
export type { HeroBannerSlide as BannerSlide } from "@chinguya/types";
