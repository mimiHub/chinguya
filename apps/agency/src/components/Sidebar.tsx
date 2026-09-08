"use client";

import NextLink from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/", label: "대시보드" },
  { href: "/book", label: "상품 예약" },
  { href: "/reservations", label: "예약 목록" },
  { href: "/invoice", label: "인보이스" },
];

/**
 * 여행사 좌측 메뉴. 오버레이(화면 위에 떠서 콘텐츠를 덮는 방식)가 아니라, 일반 문서 흐름
 * 안의 flex 자식으로 두고 open일 때만 폭(w-[250px], 안쪽 nav/로그아웃 링크는 p-6 패딩(24px×2)을
 * 뺀 w-[202px]로 맞춤 — 그대로 aside 폭을 그대로 쓰면 오른쪽 24px이 aside의 overflow-hidden에
 * 잘려 라벨 텍스트가 잘려 보이는 문제가 있었다)을 주는 방식이다 — 열리면 옆의 콘텐츠 영역
 * (flex-1)이 그만큼 좁아지면서 같이 자리를 잡는다("한 화면에 같이 보인다"는 요구사항).
 * 닫힘/열림은 헤더의 햄버거(IconHamburger) 버튼 하나로만 토글한다 — 별도의 배경 딤이나
 * 항목 클릭 시 자동 닫힘은 없다(오버레이가 아니라 항상 콘텐츠 옆에 나란히 있는 패널이라
 * 클릭할 때마다 닫히면 오히려 불편하다).
 *
 * 배경색은 secondary-900(#4a3b20, packages/tailwind-config/theme.css의 웜톤 크림 스케일
 * 가장 어두운 단)을 쓴다 — 하드코딩 hex 대신 이미 있는 디자인 토큰을 그대로 쓴 것. 나머지
 * 톤(비활성 글자·hover·활성 항목)도 전부 같은 secondary 토큰 스케일 안에서 어두운 배경에
 * 맞게 골랐다: 비활성 글자는 secondary-200(밝은 크림), hover는 반투명 secondary-800, 활성
 * 항목은 secondary-800 배경의 둥근 칩(chip)으로 강조하고 라벨 앞에 로고와 같은 나뭇잎
 * 아이콘(logo-mb.png)을 붙인다 — 고객 앱 모바일 드로어 메뉴와 통일된 디자인 규칙.
 */
export function Sidebar({ open }: { open: boolean }) {
  const pathname = usePathname();

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <aside
      className={`flex shrink-0 flex-col overflow-hidden border-r border-secondary-800 bg-secondary-900 transition-[width] duration-200 ${
        open ? "w-[250px] p-6" : "w-0 p-0"
      }`}
    >
      <nav className="mt-2 flex w-[202px] flex-col gap-1 whitespace-nowrap">
        {ITEMS.map(({ href, label }) => {
          const active = isActive(href);
          return (
            <NextLink
              key={href}
              href={href}
              className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-base font-medium transition-colors ${
                active
                  ? "bg-secondary-800 text-white"
                  : "text-secondary-200 hover:bg-secondary-800/60 hover:text-white"
              }`}
            >
              {/* 고객 앱 모바일 드로어 메뉴와 통일된 규칙 — 선택된 항목에만 로고와 같은
                  나뭇잎 아이콘을 라벨 앞에 붙인다. */}
              {active && (
                <span
                  aria-hidden="true"
                  className="h-5 w-5 shrink-0 bg-contain bg-center bg-no-repeat"
                  style={{ backgroundImage: "url(/logo-mb.png)" }}
                />
              )}
              {label}
            </NextLink>
          );
        })}
      </nav>

      {/* 고객 앱 모바일 드로어 메뉴의 로그아웃과 같은 스타일 — 위쪽 구분선 + 다른 메뉴
          항목과 같은 글자색(text-secondary-200). 빨간 경고색이 아니라 일반 메뉴 항목처럼
          보이게 한다. 구분선은 로그아웃 링크 자체(rounded-md + w-[202px])에 border-t로 주면
          둥근 모서리 때문에 선 양 끝이 짧게 끊겨 보이는 문제가 있어서, 링크를 감싸는
          별도 래퍼 div에 선을 긋고 링크는 그 안에서 여백만 준다. */}
      <div className="mt-auto w-[202px] border-t border-secondary-800 pt-4">
        <NextLink
          href="/login"
          className="block whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium text-secondary-200 hover:bg-secondary-800/60 hover:text-white"
        >
          로그아웃
        </NextLink>
      </div>
    </aside>
  );
}
