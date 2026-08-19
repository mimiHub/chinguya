"use client";

import type { ReactNode } from "react";
import NextLink from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/", label: "홈" },
  { href: "/rental", label: "상품" },
  { href: "/mypage", label: "예약" },
  { href: "/profile", label: "내정보" },
];

// 아이콘은 아이콘 폰트·라이브러리 없이 인라인 SVG 선(stroke)만으로 그린다. stroke="currentColor"라
// 부모 Link의 글자색(활성/비활성)을 그대로 물려받아서 색을 따로 안 맞춰줘도 된다.
const ICON_PROPS = {
  viewBox: "0 0 24 24",
  width: 22,
  height: 22,
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const ICONS: Record<string, ReactNode> = {
  "/": (
    <svg {...ICON_PROPS} aria-hidden="true">
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5.5 10v9a1 1 0 0 0 1 1H9a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h2.5a1 1 0 0 0 1-1v-9" />
    </svg>
  ),
  "/rental": (
    <svg {...ICON_PROPS} aria-hidden="true">
      <path d="M6 8h12l-1 12a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1L6 8Z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </svg>
  ),
  "/mypage": (
    <svg {...ICON_PROPS} aria-hidden="true">
      <rect x="4" y="5.5" width="16" height="15" rx="2" />
      <path d="M4 10h16M8 3.5v3M16 3.5v3" />
    </svg>
  ),
  "/profile": (
    <svg {...ICON_PROPS} aria-hidden="true">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
    </svg>
  ),
};

/**
 * 고객 모바일 하단 탭바. 와이어프레임 랜딩(안 A)의 bnav(홈/상품/예약/내정보) 4개 탭 기준.
 *
 * "예약" 탭은 장바구니(/cart)가 아니라 내 예약 목록(/mypage, 기획서 S1-C4)으로 연결한다 —
 * 장바구니는 예약 흐름(상품상세→날짜선택→"장바구니 담기") 중간 단계라 하단 탭에서 바로
 * 들어가는 진입점이 아니고, /mypage가 실제로 "내 예약" 화면이기 때문이다.
 * "내정보" 탭(/profile, 기획서 S0-C3 회원정보)은 이 앱에 아직 로그인 기능이 없어
 * ComingSoon 스텁으로 연결해뒀다.
 */
export function BottomNav() {
  const pathname = usePathname();

  // "/"(홈)은 정확히 일치할 때만, 나머지는 하위 경로(예: /rental/bike-electric)도 같은 탭으로 취급
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    // h-16(64px)로 높이를 고정한다 — layout.tsx의 body padding(pb-16)이나 장바구니 하단 고정
    // 바(bottom-16)처럼 "이 네비 높이는 64px"라고 가정하고 여백을 잡아둔 곳들이 있어서, 내용
    // 길이에 따라 높이가 자동으로 정해지면(기존엔 py-2 + 내용물 높이) 그 가정과 어긋나 틈이
    // 생긴다. 높이를 고정하고 내용은 justify-center로 가운데 정렬한다.
    <nav className="fixed inset-x-0 bottom-0 z-[100] flex h-16 border-t border-line bg-white md:hidden">
      {ITEMS.map(({ href, label }) => {
        const active = isActive(href);
        return (
          <NextLink
            key={href}
            href={href}
            className={`flex flex-1 flex-col items-center justify-center gap-1 text-[11px] ${
              active ? "text-accent-700 font-medium" : "text-muted"
            }`}
          >
            {ICONS[href]}
            {label}
          </NextLink>
        );
      })}
    </nav>
  );
}
