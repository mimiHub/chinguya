"use client";

import { useEffect, useState } from "react";
import NextLink from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { IconHamburger } from "@chinguya/ui/icon-hamburger";
import { IconX } from "@chinguya/ui/icon-x";
import { getIsLoggedIn, logout } from "@/data/authData";

// 대메뉴 목록 — PC·모바일 구분 없이 항상 햄버거 버튼을 눌러 여는 드로어 메뉴에 쓰인다
// (예전엔 PC에서 가로로 나열했지만, 항목이 늘면서 항상 햄버거로 통일했다). "메뉴" 탭은
// 불필요해서 뺐다. "회사소개"·"공지사항"은 한때 /news 한 페이지로 합쳐서 칩으로
// 전환했었는데, 파일이 너무 커져서 다시 각자 대메뉴로 뺐다(각 페이지 안에서는 여전히
// 하위 탭 — 매장안내/브랜드 스토리, 공지사항/이벤트 — 로 나뉜다). "홈"은 목록이 아니라
// 드로어 상단 헤더에 로고 아이콘으로 따로 배치한다(닫기 버튼과 나란히).
const NAV_ITEMS = [
  { href: "/rental", label: "상품" },
  { href: "/mypage", label: "예약" },
  { href: "/profile", label: "내정보" },
  { href: "/about", label: "서비스 소개" },
  { href: "/notice", label: "공지사항" },
  { href: "/contact", label: "고객지원" },
];

// 배너(히어로 이미지) 위에 얹힌 투명 상태에서, 이 값(px)만큼 스크롤하면 불투명 배경으로
// 바뀐다. 홈 히어로처럼 배너가 화면 높이만큼 꽉 차는 페이지라도, 배너를 다 지나갈 때까지
// 기다리지 않고 살짝만 스크롤해도(참고 사이트 기준) 바로 반응하도록 작은 값을 쓴다 — 예전엔
// 홈에서만 "뷰포트 높이만큼" 큰 값을 썼는데, 그러면 큰 모니터에서는 창을 몇 번이고 내려야
// 겨우 바뀌는 문제가 있었다.
const SCROLL_THRESHOLD = 60;

function getScrollThreshold(): number {
  return SCROLL_THRESHOLD;
}

/**
 * 참고 사이트(cafe-rose-one.vercel.app) 상단 네비게이션을 기준으로 만든 고객앱 공통 헤더.
 * 화면 크기와 무관하게 로고 + 햄버거 버튼만 보이고, 누르면 오른쪽에서 80% 너비로 슬라이드
 * 들어오는 어두운 드로어 메뉴(NAV_ITEMS)가 뜬다. 드로어 상단에는 "홈" 역할의 로고 아이콘과
 * 닫기(X) 버튼이 나란히 있고, 선택된 메뉴는 배경 박스(bg-secondary-800) + 로고 아이콘으로
 * 표시한다. 헤더는 처음엔 배너 위에 투명하게 얹혀 있다가 스크롤하거나 메뉴를 열면 불투명
 * 배경으로 바뀐다(문서 위에서 흰 글씨가 안 보이는 문제를 막기 위함).
 */
export function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  // authData.ts 목업 세션을 렌더링 시점에 그대로 읽는다 — 로그인/로그아웃은 항상 페이지
  // 이동(router.push)을 동반해서 pathname이 바뀌고, 그때 이 컴포넌트가 다시 렌더링되며
  // 최신값을 읽는다(memberData.ts 등 다른 목업 저장소와 같은 "이동할 때마다 새로 읽기" 방식).
  const loggedIn = getIsLoggedIn();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > getScrollThreshold());
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // 라우트가 바뀌면(메뉴에서 링크를 눌러 이동하면) 오버레이 메뉴를 자동으로 닫는다.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // 오버레이 메뉴가 열려 있는 동안은 뒤 배경이 스크롤되지 않게 막는다.
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const solid = scrolled || menuOpen;

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-[110] transition-colors duration-200 ${
          solid ? "bg-secondary-100 text-ink shadow-sm" : "bg-transparent text-white"
        }`}
      >
        {/* 배너 위 투명 상태에서는 배경이 없어서 대메뉴 글자가 사진에 묻혀 잘 안 보일 수 있다.
            네비 높이(h-16=64px)보다 더 큰 그라데이션을 뒤에 깔아서, 상단은 짙고 아래로
            내려갈수록 투명해지게 해 메뉴 가독성을 높인다. 스크롤해서 불투명 배경이 되면
            필요 없어지므로 그때는 안 그린다. */}
        {!solid && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-32 bg-gradient-to-b from-black/60 via-black/25 to-transparent"
          />
        )}
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <NextLink href="/" className="flex items-center">
            {/* 모바일: 잎사귀 아이콘만 보여준다. 배너 위 투명 상태에서는 filter로 흰색
                실루엣으로 바꾸고, 스크롤로 불투명 배경이 되면 원래 색(연한 초록)으로 되돌린다. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-mb.png"
              alt="친구야"
              className={`h-9 w-9 object-contain transition-[filter] duration-200 md:hidden ${
                solid ? "" : "brightness-0 invert"
              }`}
            />
            {/* PC: 잎사귀+글자가 함께 있는 가로형 로고 이미지. 모바일 로고와 마찬가지로 배너 위
                투명 상태에서는 흰색으로, 스크롤로 배경이 생기면 원래 색으로 되돌아온다. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-pc.png"
              alt="친구야 카페"
              className={`hidden h-9 w-auto object-contain transition-[filter] duration-200 md:block ${
                solid ? "" : "brightness-0 invert"
              }`}
            />
          </NextLink>

          <IconHamburger open={menuOpen} onClick={() => setMenuOpen((v) => !v)} />
        </div>
      </header>

      {/* 뒷배경 딤 처리 — 화면 전체를 반투명하게 덮어서 뒤 콘텐츠가 눌리지 않게 막는다.
          패널 바깥(이 딤 영역)을 누르면 메뉴가 닫힌다. */}
      <div
        className={`fixed inset-0 z-[115] bg-black/50 transition-opacity duration-200 ${
          menuOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setMenuOpen(false)}
        aria-hidden="true"
      />

      {/* 메뉴 패널 — 화면 전체가 아니라 오른쪽에서 80%만 슬라이드로 들어오는 일반적인
          드로어(drawer) 형태. translate-x로 화면 밖에 대기하다가 열리면 안으로 들어온다. */}
      <div
        className={`fixed inset-y-0 right-0 z-[120] flex w-[80%] max-w-xs flex-col bg-secondary-900 text-white transition-transform duration-200 ${
          menuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex h-16 shrink-0 items-center justify-between px-4">
          {/* "홈"은 목록 항목 대신, PC 가로형 로고 이미지로 여기 배치한다 — 닫기(X) 버튼과
              나란히 양 끝(justify-between)에 놓인다. 로고 원본은 어두운 갈색 글자라 드로어의
              어두운 배경(secondary-900) 위에서는 안 보여서, invert 필터로 흰색으로 바꿔서
              쓴다. */}
          <NextLink href="/" aria-label="홈" onClick={() => setMenuOpen(false)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-pc.png"
              alt="친구야 카페"
              className="h-8 w-auto object-contain brightness-0 invert"
            />
          </NextLink>
          <IconX
            size="lg"
            aria-label="메뉴 닫기"
            className="text-white hover:bg-white/10 hover:text-white"
            onClick={() => setMenuOpen(false)}
          />
        </div>
        <nav className="flex flex-col gap-1 px-4 pt-5">
          {NAV_ITEMS.map((item) => {
            const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <NextLink
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 rounded-xl px-4 py-3 text-md transition-colors ${
                  isActive ? "bg-secondary-800/30 font-medium text-white" : "text-white/90 hover:bg-white/5"
                }`}
              >
                {/* 선택된 메뉴에만 로고와 같은 나뭇잎 아이콘을 라벨 앞에 붙여서 표시한다 —
                    사이드/드로어형 네비게이션(여행사 앱과 통일된 스타일)의 공통 규칙. */}
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="h-5 w-5 shrink-0 bg-contain bg-center bg-no-repeat"
                    style={{ backgroundImage: "url(/logo-mb.png)" }}
                  />
                )}
                {item.label}
              </NextLink>
            );
          })}
        </nav>

        {/* 로그인 여부에 따라 로그아웃/로그인 버튼을 바꿔 보여준다. 로그아웃을 누르면
            실제로 세션을 지우고(logout()) 홈으로 이동한다. */}
        <div className="flex-1" />
        {loggedIn ? (
          <button
            type="button"
            onClick={() => {
              logout();
              setMenuOpen(false);
              router.push("/");
            }}
            className="border-t border-white/10 px-6 py-4 text-left text-sm text-white/70"
          >
            로그아웃
          </button>
        ) : (
          <NextLink
            href="/login"
            onClick={() => setMenuOpen(false)}
            className="border-t border-white/10 px-6 py-4 text-left text-sm text-white/70"
          >
            로그인
          </NextLink>
        )}
      </div>
    </>
  );
}
