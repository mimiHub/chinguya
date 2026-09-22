"use client";

import { useEffect, useState } from "react";
import { heroBannerSlides } from "@chinguya/catalog-data";
import { createApiClient } from "@chinguya/api-client";

const api = createApiClient();

export const AUTH_SLIDES_AUTOPLAY_MS = 5000;

/**
 * 번들 초기값 — 첫 페인트와 API 실패 대비용이다. 배경이 화면을 꽉 채우는 요소라, 응답을
 * 기다리며 빈 화면(회색 판)을 보여주는 것보다 초기값을 띄우고 교체하는 편이 낫다고 봤다
 * (고객 앱 히어로 HomeCarousel.tsx 와 같은 판단).
 */
const FALLBACK_SLIDES: string[] = heroBannerSlides.map((slide) => slide.pcImage);

/**
 * 관리자가 올린 이미지는 Core 의 `/content/images/…` 에 있어서 자기 오리진 프록시를 거쳐야
 * 한다. 앱 정적 파일(`/banner-pc-1.png` 등 초기값)은 그대로 쓴다.
 */
function imageSrc(url: string): string {
  return url.startsWith("/content/images/") ? `/api/core${url}` : url;
}

/**
 * 배경에 쓸 이미지 주소 목록. 관리자 콘텐츠 관리(S4-A3)가 저장한 배너를 API 로 읽는다
 * (GET /v1/content/banners) — **고객 랜딩(안 A) 히어로와 같은 값**이라, 관리자가 배너를
 * 바꾸면 두 화면이 같이 바뀐다.
 *
 * 여행사 앱은 데스크톱 전용이라 PC용 이미지만 쓰고, title/subtitle 은 배경일 뿐이라 쓰지
 * 않는다(로그인 화면의 히어로 문구는 화면이 직접 들고 있다).
 *
 * 목록 길이가 자동재생 주기·점 인디케이터 개수를 정하므로, 컴포넌트가 아니라 화면
 * (AuthScreenLayout)이 이 값을 갖고 배경에 내려준다.
 */
export function useAuthSlides(): string[] {
  const [slides, setSlides] = useState<string[]>(FALLBACK_SLIDES);

  useEffect(() => {
    let active = true;
    api.publicContent
      .banners()
      .then((banners) => {
        // 배너가 비어 있으면(운영 초기) 초기값을 그대로 둔다 — 빈 배경을 띄우지 않는다.
        if (active && banners.length > 0) {
          setSlides(banners.map((banner) => imageSrc(banner.pcImageUrl)));
        }
      })
      // 실패하면 번들 초기값을 그대로 보여준다. 배경이 안 뜨는 것보다 낫다.
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  return slides;
}

/**
 * 로그인/계정등록 화면 전체 배경. 고객 앱 히어로처럼 여러 장을 겹쳐두고 opacity를 크로스
 * 페이드시켜 자동으로 넘어가게 한다. 순수 표시 전용 컴포넌트라 슬라이드 목록과 현재
 * index만 받는다 — 자동 재생 타이머와 점 인디케이터 상태는 AuthScreenLayout(page.tsx)이
 * 갖고 있다. 점 인디케이터를 이 컴포넌트 안에 두지 않고 화면 쪽으로 뺀 이유는, 이 배경
 * 위에 카드가 올라가는 콘텐츠 레이어가 통짜 div라 그 아래 깔린 배경의 버튼은 클릭이 막히기
 * 때문 — 점 인디케이터는 그 콘텐츠 레이어보다 나중(위)에 그려지는 별도 레이어로 둔다.
 */
export function AuthBackgroundSlides({ slides, index }: { slides: string[]; index: number }) {
  return (
    <div className="absolute inset-0 overflow-hidden bg-gray-200">
      {slides.map((src, i) => (
        // 관리자가 두 슬롯에 같은 이미지를 고를 수 있으니 주소를 key 로 쓰지 않는다
        // (고객 앱 히어로 HomeCarousel.tsx 도 index 를 쓴다).
        <div
          key={i}
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
