"use client";

import { useEffect, useRef, useState } from "react";
import NextLink from "next/link";

// PC/모바일용 이미지가 세트로 준비돼 있어서, 화면 폭에 맞는 쪽만 보여준다(참고 사이트와 동일한
// 방식) — 아래 슬라이드에서 두 버전을 겹쳐놓고 Tailwind 반응형 클래스(md:hidden/hidden md:block)로
// 하나만 보이게 한다. title/subtitle은 참고 사이트(cafe-rose-one.vercel.app) 홈 히어로 3슬라이드
// 문구를 그대로 옮겼다.
const SLIDES = [
  {
    pc: "/banner-pc-1.png",
    mobile: "/banner-mobile-1.png",
    title: "따뜻한 순간,\n친구야 카페",
    subtitle: "일상의 작은 행복을 함께 나누는 공간\n향긋한 커피와 맛있는 디저트,\n그리고 따뜻한 이야기들이 기다리고 있어요.",
  },
  {
    pc: "/banner-pc-2.png",
    mobile: "/banner-mobile-2.png",
    title: "해안도로\n자전거 투어",
    subtitle: "전기자전거 대여 오픈 기념 이벤트",
  },
  {
    pc: "/banner-pc-3.png",
    mobile: "/banner-mobile-3.png",
    title: "낚시 체험",
    subtitle: "주말 한정 특가 진행 중",
  },
];

const AUTOPLAY_MS = 5000;

/**
 * 홈 화면 상단 히어로 캐러셀. 여러 장의 배경 이미지가 자동으로 넘어가고, 화살표(‹ ›)와
 * 하단 점(dot)으로 수동 이동도 가능하다 — 참고 사이트(cafe-rose-one.vercel.app) 홈 히어로와
 * 동일한 구성. 슬라이드마다 제목·설명·CTA 버튼이 함께 바뀌고, 화면 하단 중앙에 쌓인다
 * (문구/버튼 → 스크롤 유도 화살표 ↓ → 점 인디케이터 순으로 위에서 아래). ↓를 누르면 배너
 * 바로 아래 콘텐츠까지 부드럽게 스크롤된다.
 */
export function HomeCarousel() {
  const [index, setIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % SLIDES.length);
    }, AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, []);

  const goPrev = () => setIndex((i) => (i - 1 + SLIDES.length) % SLIDES.length);
  const goNext = () => setIndex((i) => (i + 1) % SLIDES.length);
  const slide = SLIDES[index] ?? SLIDES[0]!;

  // 화살표를 누르면 배너 바로 아래(다음 섹션)까지 부드럽게 스크롤한다. 배너 실제 높이만큼만
  // 내려가면 되니까 rootRef의 offsetHeight를 그대로 스크롤 목표로 쓴다.
  const scrollToContent = () => {
    const height = rootRef.current?.offsetHeight ?? window.innerHeight;
    window.scrollTo({ top: height, behavior: "smooth" });
  };

  return (
    // 참고 사이트처럼 화면(뷰포트)에 꽉 차게 보여주고, 스크롤하면 일반 콘텐츠처럼 같이
    // 밀려 올라간다(fixed/sticky 아님) — h-dvh는 모바일 브라우저 주소창 크기 변화까지
    // 반영하는 뷰포트 높이 단위라 h-screen보다 실제 화면에 더 정확히 맞는다.
    // 모바일에서는 하단 탭바(BottomNav, h-16=64px)가 화면 아래를 항상 덮고 있어서, 배너를
    // 뷰포트 100% 높이로 두면 배너 하단(화살표·점)이 그 탭바에 가려진다. 탭바 높이만큼 빼준다
    // (md 이상은 BottomNav가 없어져서 다시 뷰포트 전체를 채운다).
    <div className="relative h-[calc(100dvh-4rem)] w-full overflow-hidden bg-gray-200 md:h-dvh">
      {SLIDES.map((s, i) => (
        <div
          key={i}
          className={`absolute inset-0 transition-opacity duration-500 ${i === index ? "opacity-100" : "opacity-0"}`}
          aria-hidden={i !== index}
        >
          <div className="absolute inset-0 bg-cover bg-top md:hidden" style={{ backgroundImage: `url(${s.mobile})` }} />
          <div className="absolute inset-0 hidden bg-cover bg-center md:block" style={{ backgroundImage: `url(${s.pc})` }} />
        </div>
      ))}

      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-black/10" />

      {/* 슬라이드별 문구 + CTA — 화면 하단 중앙, 스크롤 화살표 바로 위에 놓는다 */}
      <div className="absolute inset-x-0 bottom-30 flex justify-center px-6 md:bottom-28">
        <div className="max-w-sm text-center md:max-w-md">
          <p className="whitespace-pre-line text-2xl font-bold leading-tight text-white drop-shadow md:text-4xl">
            {slide.title}
          </p>
          {slide.subtitle && (
            <p className="mt-3 whitespace-pre-line text-sm text-white/90 drop-shadow md:text-base">
              {slide.subtitle}
            </p>
          )}
          <NextLink
            href="/rental"
            className="mt-5 inline-block rounded-md bg-black/80 px-5 py-2.5 text-sm font-medium text-white hover:bg-black/90"
          >
            카페 둘러보기
          </NextLink>
        </div>
      </div>

      <button
        type="button"
        aria-label="이전 배너"
        onClick={goPrev}
        className="absolute left-2 top-1/2 flex h-7 w-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-black/30 text-md text-white hover:bg-black/50"
      >
        ‹
      </button>
      <button
        type="button"
        aria-label="다음 배너"
        onClick={goNext}
        className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-black/30 text-md text-white hover:bg-black/50"
      >
        ›
      </button>

      {/* 아래로 스크롤 유도 — 마우스 모양 테두리 안에서 점이 아래로 튀며 사라지는 애니메이션
          (codepen.io/daveknispel/pen/aKdWaG 참고). 누르면 배너 바로 아래 콘텐츠까지
          부드럽게 스크롤된다. */}
      <button
        type="button"
        aria-label="아래로 스크롤"
        onClick={scrollToContent}
        className="group absolute bottom-14 left-1/2 flex h-7 w-4 -translate-x-1/2 cursor-pointer items-start justify-center rounded-full border-2 border-white/90 pt-1.5 drop-shadow transition-colors hover:border-white/60"
      >
        <span className="h-1 w-0.5 animate-scroll-dot rounded-full bg-white group-hover:[animation-duration:0.7s]" />
      </button>

      {/* 점 인디케이터 — 항상 화면 정가운데 */}
      <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-1.5">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`${i + 1}번째 배너로 이동`}
            onClick={() => setIndex(i)}
            className={`h-1.5 cursor-pointer rounded-full bg-white transition-all ${i === index ? "w-5 opacity-100" : "w-1.5 opacity-50"}`}
          />
        ))}
      </div>
    </div>
  );
}
