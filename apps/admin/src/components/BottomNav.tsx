"use client";

import NextLink from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/", label: "홈" },
  { href: "/reservations", label: "예약" },
  { href: "/products", label: "상품" },
  { href: "/more", label: "더보기" },
];

/** 관리자 모바일 하단 탭바. 와이어프레임(S1-A1 등) 기준 4개 탭. */
export function BottomNav() {
  const pathname = usePathname();

  // 로그인 화면은 탭이 필요 없는 별도 화면이라 하단 탭바 자체를 안 보여준다
  if (pathname === "/login") return null;

  // "/"(홈)은 정확히 일치할 때만, 나머지는 하위 경로(예: /reservations/FR-1)도 같은 탭으로 취급
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <nav className="fixed inset-x-0 bottom-0 z-[100] flex border-t border-line bg-white md:hidden">
      {ITEMS.map(({ href, label }) => {
        const active = isActive(href);
        return (
          <NextLink
            key={href}
            href={href}
            className={`flex flex-1 flex-col items-center gap-1 py-2 text-[11px] ${
              active ? "text-primary-500 font-medium" : "text-muted"
            }`}
          >
            <span className={`h-[18px] w-[18px] rounded-[5px] border ${active ? "border-primary-500 bg-primary-100" : "border-line bg-gray-100"}`} />
            {label}
          </NextLink>
        );
      })}
    </nav>
  );
}
