"use client";

import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { CURRENT_AGENCY } from "@/data/authData";

const ITEMS = [
  { href: "/", label: "대시보드" },
  { href: "/book", label: "상품 예약" },
  { href: "/reservations", label: "예약 목록" },
  { href: "/invoice", label: "인보이스" },
];

/**
 * 여행사 데스크톱 좌측 사이드바. 와이어프레임(g-dash 등)의 aside 영역 기준 — 로그인 화면에는
 * 표시하지 않는다(관리자의 BottomNav가 /login에서 숨는 것과 같은 이유).
 */
export function Sidebar() {
  const pathname = usePathname();

  if (pathname === "/login") return null;

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-line bg-white p-6">
      <div className="text-lg font-bold">{CURRENT_AGENCY.name}</div>

      <nav className="mt-8 flex flex-col gap-1">
        {ITEMS.map(({ href, label }) => {
          const active = isActive(href);
          return (
            <NextLink
              key={href}
              href={href}
              className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                active ? "bg-primary-100 text-primary-700" : "text-muted hover:bg-gray-100 hover:text-ink"
              }`}
            >
              {label}
            </NextLink>
          );
        })}
      </nav>

      <NextLink href="/login" className="mt-auto rounded-md px-3 py-2 text-sm font-medium text-error hover:bg-gray-100">
        로그아웃
      </NextLink>
    </aside>
  );
}
