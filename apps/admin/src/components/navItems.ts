/**
 * 관리자 앱 주 내비게이션 목록 — 하단 탭바(BottomNav)와 헤더 드로어(TopHeader)가 함께 쓰는 단일 출처.
 * 두 컴포넌트가 각자 배열을 들고 있으면 한쪽만 고쳐져 어긋난다(2026-09-28 '재고 관리' 추가 때 실제로
 * 드로어만 바뀌었다). 메뉴를 더하거나 이름을 바꿀 때는 이 파일만 고친다. 하단 탭바 아이콘은
 * BottomNav.tsx의 ICONS에 같은 href 키로 추가한다.
 */
export const ADMIN_NAV_ITEMS: readonly { href: string; label: string }[] = [
  { href: "/", label: "홈" },
  { href: "/reservations", label: "예약" },
  { href: "/inventory", label: "재고 관리" },
  { href: "/products", label: "상품 관리" },
  { href: "/more", label: "더보기" },
];

/** "/"(홈)은 정확히 일치할 때만, 나머지는 하위 경로(예: /reservations/FR-1)도 같은 메뉴로 본다. */
export function isNavActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}
