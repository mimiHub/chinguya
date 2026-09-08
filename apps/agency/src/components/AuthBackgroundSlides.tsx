"use client";

import { heroBannerSlides } from "@chinguya/catalog-data";

// admin 콘텐츠 관리 화면(S4-A1/A3)에서 편집하는 것과 같은 배너 목록이다 — 고객 앱 홈
// 히어로(HomeCarousel.tsx)도 같은 @chinguya/catalog-data의 heroBannerSlides를 쓴다.
// 여행사 앱은 데스크톱 전용이라 pcImage만 쓰고 title/subtitle은 배경일 뿐이라 쓰지 않는다.
export const AUTH_SLIDES = heroBannerSlides.map((slide) => slide.pcImage);
export const AUTH_SLIDES_AUTOPLAY_MS = 5000;

/**
 * 로그인/계정등록 화면 전체 배경. 고객 앱 히어로처럼 여러 장을 겹쳐두고 opacity를 크로스
 * 페이드시켜 자동으로 넘어가게 한다. 순수 표시 전용 컴포넌트라 현재 슬라이드 index만
 * 받는다 — 자동 재생 타이머와 점 인디케이터 상태는 AuthScreenLayout(page.tsx)이 갖고
 * 있다. 점 인디케이터를 이 컴포넌트 안에 두지 않고 화면 쪽으로 뺀 이유는, 이 배경 위에
 * 카드가 올라가는 콘텐츠 레이어가 통짜 div라 그 아래 깔린 배경의 버튼은 클릭이 막히기
 * 때문 — 점 인디케이터는 그 콘텐츠 레이어보다 나중(위)에 그려지는 별도 레이어로 둔다.
 */
export function AuthBackgroundSlides({ index }: { index: number }) {
  return (
    <div className="absolute inset-0 overflow-hidden bg-gray-200">
      {AUTH_SLIDES.map((src, i) => (
        <div
          key={src}
          aria-hidden={i !== index}
          className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${
            i === index ? "opacity-100" : "opacity-0"
          }`}
          style={{ backgroundImage: `url(${src})` }}
        />
      ))}
    </div>
  );
}
