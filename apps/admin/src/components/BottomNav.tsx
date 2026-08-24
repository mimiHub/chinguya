"use client";

import type { ReactNode } from "react";
import NextLink from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/", label: "홈" },
  { href: "/reservations", label: "예약" },
  { href: "/products", label: "상품" },
  { href: "/more", label: "더보기" },
];

// 아이콘은 아이콘 폰트·라이브러리 없이 인라인 SVG 선(stroke)만으로 그린다. stroke="currentColor"라
// 부모 Link의 글자색(활성/비활성)을 그대로 물려받아서 색을 따로 안 맞춰줘도 된다
// (고객앱 BottomNav.tsx와 동일한 방식 — 디자인을 맞추기 위해 그대로 옮겼다).
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
  "/reservations": (
    <svg {...ICON_PROPS} aria-hidden="true">
      <rect x="4" y="5.5" width="16" height="15" rx="2" />
      <path d="M4 10h16M8 3.5v3M16 3.5v3" />
    </svg>
  ),
  "/products": (
    <svg {...ICON_PROPS} aria-hidden="true">
      <path d="M6 8h12l-1 12a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1L6 8Z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </svg>
  ),
  "/more": (
    <svg {...ICON_PROPS} aria-hidden="true">
      <circle cx="5.5" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="18.5" cy="12" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  ),
};

/**
 * 관리자 모바일 하단 탭바. 와이어프레임(S1-A1 등) 기준 4개 탭 — 고객앱 BottomNav.tsx와
 * 디자인을 통일했다(아이콘만, 높이 h-16 고정, 활성색 text-accent-700).
 */
export function BottomNav() {
  const pathname = usePathname();

  // 로그인 화면은 탭이 필요 없는 별도 화면이라 하단 탭바 자체를 안 보여준다
  if (pathname === "/login") return null;

  // "/"(홈)은 정확히 일치할 때만, 나머지는 하위 경로(예: /reservations/FR-1)도 같은 탭으로 취급
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    // h-16(64px)로 높이를 고정한다 — 고객앱과 동일하게, 내용 길이에 따라 높이가 들쭉날쭉해지지
    // 않도록 고정하고 아이콘은 justify-center로 가운데 정렬한다.
    <nav className="fixed inset-x-0 bottom-0 z-[100] flex h-16 gap-5 border-t border-line bg-surface md:hidden">
      {ITEMS.map(({ href, label }) => {
        const active = isActive(href);
        return (
          <NextLink
            key={href}
            href={href}
            aria-label={label}
            className={`flex flex-1 items-center justify-center ${active ? "text-primary-500" : "text-muted"}`}
          >
            {ICONS[href]}
          </NextLink>
        );
      })}
    </nav>
  );
}
