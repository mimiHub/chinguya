"use client";

import type { ReactNode } from "react";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { useAgencyAuth } from "@/context/AgencyAuthContext";

/**
 * 메뉴별 아이콘(SVG). 아이콘 라이브러리를 새로 추가하지 않고, 이 파일 안에서만 쓰는
 * 작은 인라인 SVG로 그린다. 5개 전부 같은 규칙으로 맞춰서 굵기·크기가 들쭉날쭉해 보이지
 * 않게 한다: viewBox 24x24 고정, 실제 그림은 (4,4)~(20,20) 16x16 칸 안에 맞춰 그리고,
 * 선 굵기는 전부 strokeWidth 1.3(얇게) + strokeLinecap/strokeLinejoin round로 통일.
 */
function DashboardIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <rect x="4" y="4" width="6.5" height="6.5" rx="1.3" stroke="currentColor" strokeWidth="1.3" />
      <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.3" stroke="currentColor" strokeWidth="1.3" />
      <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.3" stroke="currentColor" strokeWidth="1.3" />
      <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.3" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

/** "상품 예약" — packages/ui의 CalendarIcon은 viewBox·선 굵기가 달라 다른 4개와 나란히
 *  두면 크기가 어긋나 보여서, 같은 규칙으로 새로 그린 전용 버전을 쓴다. */
function BookingIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <rect x="4" y="5.5" width="16" height="14.5" rx="2" stroke="currentColor" strokeWidth="1.3" />
      <path d="M8 3.5V7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M16 3.5V7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M4 10H20" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

function ListIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <circle cx="5.5" cy="7" r="1" fill="currentColor" />
      <circle cx="5.5" cy="12" r="1" fill="currentColor" />
      <circle cx="5.5" cy="17" r="1" fill="currentColor" />
      <path d="M9.5 7H20" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M9.5 12H20" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M9.5 17H20" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function InvoiceIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <path
        d="M5 4H19V20L17 18.7L15 20L13 18.7L11 20L9 18.7L7 20L5 18.7V4Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <path d="M8 9H16" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M8 13H16" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function LogoutIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <path
        d="M10 20H6C4.9 20 4 19.1 4 18V6C4 4.9 4.9 4 6 4H10"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M14 16L18 12L14 8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M18 12H9.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

const ITEMS: { href: string; label: string; icon: (props: { className?: string }) => ReactNode }[] = [
  { href: "/", label: "대시보드", icon: DashboardIcon },
  { href: "/book", label: "상품 예약", icon: BookingIcon },
  { href: "/reservations", label: "예약 목록", icon: ListIcon },
  { href: "/invoice", label: "인보이스", icon: InvoiceIcon },
];

/**
 * 여행사 좌측 메뉴. 데스크톱(lg, 1024px 이상)과 모바일·태블릿(lg 미만)에서 동작 방식이
 * 다르다.
 *
 * 데스크톱: 오버레이가 아니라 일반 문서 흐름 안의 flex 자식으로 두는 패널이다 — 완전히
 * 숨는 대신(width: 0) "접힘 = 아이콘만 보이는 좁은 레일(w-[72px])", "펼침 = 아이콘 + 라벨이
 * 같이 보이는 넓은 패널(w-[250px])" 두 상태를 오간다. 접혀 있어도 항목은 그대로 NextLink라
 * 아이콘을 클릭하면 바로 그 화면으로 이동한다. 열리면 옆의 콘텐츠 영역(flex-1)이 그만큼
 * 좁아지면서 같이 자리를 잡는다("한 화면에 같이 보인다"는 요구사항). 별도의 배경 딤이나
 * 항목 클릭 시 자동 닫힘은 없다(패널이 콘텐츠 옆에 나란히 있어서 클릭마다 닫히면 오히려
 * 불편하다).
 *
 * 모바일·태블릿: 화면이 좁아 패널이 콘텐츠 옆에 나란히 있을 자리가 없으므로, 고객 앱
 * 모바일 드로어(TopNav.tsx)와 같은 오버레이 방식으로 바뀐다 — fixed로 화면 위에 뜨고
 * (position: fixed, z-[120]), 닫혀 있을 때는 -translate-x-full로 화면 왼쪽 바깥에 완전히
 * 대기하다가(아이콘 레일도 없이 아예 안 보임) 열리면 translate-x-0로 슬라이드해 들어와
 * 콘텐츠를 덮는다. 뒷배경 딤(AgencyShell.tsx)을 눌러도 닫히고, 페이지 이동 시에도 자동으로
 * 닫힌다(AgencyShell.tsx의 pathname 변경 감지) — 데스크톱과 달리 오버레이라 클릭마다
 * 닫히는 게 자연스럽다.
 *
 * top-[61px](헤더 실측 높이, inset-y-0 아님) — 처음엔 inset-y-0로 화면 맨 위부터 채웠는데,
 * 그러면 사이드바가 헤더 영역까지 덮어서 첫 메뉴 항목(대시보드)이 헤더 뒤에 가려 안 보이는
 * 문제가 있었다(헤더를 사이드바보다 위 z-index로 올려서 헤더 자체는 보이게 했지만, 그
 * 헤더가 불투명해서 그 밑에 깔린 사이드바 상단부가 가려지는 건 그대로였다). 헤더 높이만큼
 * 아래에서 시작하게 해서 겹치는 부분 자체를 없앴다.
 *
 * 닫힘/열림 자체는 두 경우 다 헤더의 햄버거(IconHamburger) 버튼 하나로만 토글한다.
 *
 * width뿐 아니라 padding·내부 nav 폭도 함께 transition을 걸어야 한다 — width만 애니메이션하면
 * padding(px-6→px-3)은 즉시 바뀌어서 어색한 순간이 보인다. 위아래 padding(py-6)은 접힘/펼침
 * 상태와 무관하게 항상 고정해서, 열고 닫을 때 메뉴 항목들이 위아래로 흔들리지 않게 한다. 라벨 텍스트는 접힌 상태에서는 아예
 * 렌더링하지 않는다(펼쳐지는 애니메이션 도중 좁은 폭 안에서 줄바꿈되어 보이는 것을 막기 위해) —
 * 대신 각 항목에 title 속성을 둬서 접힌 상태에서도 아이콘에 마우스를 올리면 라벨이 툴팁으로
 * 뜬다.
 *
 * 배경색은 secondary-900(#4a3b20, packages/tailwind-config/theme.css의 웜톤 크림 스케일
 * 가장 어두운 단)을 쓴다 — 하드코딩 hex 대신 이미 있는 디자인 토큰을 그대로 쓴 것. 나머지
 * 톤(비활성 글자·hover·활성 항목)도 전부 같은 secondary 토큰 스케일 안에서 어두운 배경에
 * 맞게 골랐다: 비활성 글자는 secondary-200(밝은 크림), hover는 반투명 secondary-800, 활성
 * 항목은 secondary-active(#604d2b, secondary-800과는 별개 전용 토큰) 배경의 둥근
 * 칩(chip)으로 강조한다. 예전에는 활성 항목에만 별도
 * 나뭇잎 아이콘(logo-mb.png)을 라벨 앞에 붙였는데, 이제 항목마다 자기 의미를 나타내는
 * 아이콘이 항상 있어서(접힘 상태의 유일한 단서이기도 하다) 그 방식은 제거했다 — 활성 여부는
 * 배경 칩 색과 아이콘·글자색으로 구분한다.
 */
export function Sidebar({ open, onExpand }: { open: boolean; onExpand: () => void }) {
  const pathname = usePathname();
  const { logout } = useAgencyAuth();

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <aside
      className={`fixed bottom-0 top-[61px] left-0 z-[120] flex w-[250px] shrink-0 flex-col overflow-hidden border-r border-secondary-800 bg-secondary-900 px-6 py-6 transition-[width,padding,transform] duration-200 lg:static lg:inset-y-auto lg:top-auto lg:bottom-auto lg:left-auto lg:z-auto lg:translate-x-0 ${
        open ? "translate-x-0" : "-translate-x-full"
      } ${open ? "lg:w-[250px] lg:px-6" : "lg:w-[72px] lg:px-3"}`}
    >
      <nav
        className={`mt-2 flex flex-col gap-1 transition-[width] duration-200 ${open ? "w-[202px]" : "w-12"}`}
      >
        {ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <NextLink
              key={href}
              href={href}
              title={label}
              onClick={() => {
                // 접힌 상태(데스크톱 아이콘 레일)에서 메뉴를 누르면 이동과 동시에 펼쳐서
                // 라벨이 보이는 상태로 전환한다 — 이미 펼쳐져 있으면 그대로 둔다.
                if (!open) onExpand();
              }}
              className={`flex items-center rounded-xl py-2.5 text-base font-medium transition-colors ${
                open ? "gap-2 px-3" : "justify-center px-0"
              } ${
                active
                  ? "bg-secondary-active text-white"
                  : "text-secondary-200 hover:bg-secondary-800/60 hover:text-white"
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {open && <span className="whitespace-nowrap">{label}</span>}
            </NextLink>
          );
        })}
      </nav>

      {/* 고객 앱 모바일 드로어 메뉴의 로그아웃과 같은 스타일 — 위쪽 구분선 + 다른 메뉴
          항목과 같은 글자색(text-secondary-200). 빨간 경고색이 아니라 일반 메뉴 항목처럼
          보이게 한다. 구분선은 로그아웃 링크 자체(rounded-md + w-[202px])에 border-t로 주면
          둥근 모서리 때문에 선 양 끝이 짧게 끊겨 보이는 문제가 있어서, 링크를 감싸는
          별도 래퍼 div에 선을 긋고 링크는 그 안에서 여백만 준다. */}
      {/* 링크가 아니라 버튼이다 — 세션 쿠키를 지워야 하므로 /login 으로 이동만 하면
          로그인 상태가 그대로 남아 미들웨어가 다시 대시보드로 돌려보낸다. */}
      <div
        className={`mt-auto border-t border-secondary-800 pt-4 transition-[width] duration-200 ${
          open ? "w-[202px]" : "w-12"
        }`}
      >
        <button
          type="button"
          onClick={() => void logout()}
          title="로그아웃"
          className={`flex w-full items-center rounded-md py-2 text-sm font-medium text-secondary-200 hover:bg-secondary-800/60 hover:text-white ${
            open ? "gap-2 px-3 text-left" : "justify-center px-0"
          }`}
        >
          <LogoutIcon className="h-5 w-5 shrink-0" />
          {open && <span className="whitespace-nowrap">로그아웃</span>}
        </button>
      </div>
    </aside>
  );
}
