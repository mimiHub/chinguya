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
 * 랜딩 히어로 배너. 고객앱 홈 화면 캐러셀(apps/customer/src/components/HomeCarousel.tsx의
 * SLIDES)과 같은 3장·같은 문구·같은 이미지 경로로 시작한다 — 실제로는 한 백엔드를 공유해서
 * 여기서 편집하면 고객앱 캐러셀도 그대로 바뀌어야 하지만, 지금은 두 앱이 독립된 프로토타입이라
 * 반영되지 않는다.
 *
 * 배너마다 PC용과 모바일용 이미지가 따로 필요하다 — 반응형으로 한 이미지를 늘리고 줄이는
 * 방식이 아니라, 화면 폭에 맞는 이미지를 통째로 다르게 보여주는 방식이라서다
 * (HomeCarousel.tsx 상단 주석 참고).
 */
export interface BannerSlide {
  id: string;
  title: string;
  /** 부제. 첫 배너처럼 없을 수도 있다 */
  subtitle?: string;
  /** 지금 고객앱에 노출 중인 PC용 이미지 경로(참고용 — 여기서 바꿔도 실제로 반영되지 않음) */
  pcImage: string;
  /** 지금 고객앱에 노출 중인 모바일용 이미지 경로(참고용 — 여기서 바꿔도 실제로 반영되지 않음) */
  mobileImage: string;
}

export const bannerSlides: BannerSlide[] = [
  {
    id: "banner-1",
    title: "따뜻한 순간,\n친구야 카페",
    subtitle:
      "일상의 작은 행복을 함께 나누는 공간\n향긋한 커피와 맛있는 디저트,\n그리고 따뜻한 이야기들이 기다리고 있어요.",
    pcImage: "/banner-pc-1.png",
    mobileImage: "/banner-mobile-1.png",
  },
  {
    id: "banner-2",
    title: "해안도로\n자전거 투어",
    subtitle: "전기자전거 대여 오픈 기념 이벤트",
    pcImage: "/banner-pc-2.png",
    mobileImage: "/banner-mobile-2.png",
  },
  {
    id: "banner-3",
    title: "낚시 체험",
    subtitle: "주말 한정 특가 진행 중",
    pcImage: "/banner-pc-3.png",
    mobileImage: "/banner-mobile-3.png",
  },
];
