"use client";

import { useEffect, useState } from "react";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { IconHamburger } from "@chinguya/ui/icon-hamburger";
import { IconX } from "@chinguya/ui/icon-x";

// PC 상단 네비게이션 전용 메뉴. "메뉴" 탭은 불필요해서 뺐다. "회사소개"·"공지사항"은 한때
// /news 한 페이지로 합쳐서 칩으로 전환했었는데, 파일이 너무 커져서 다시 각자 대메뉴로 뺐다
// (각 페이지 안에서는 여전히 하위 탭 — 매장안내/브랜드 스토리, 공지사항/이벤트 — 로 나뉜다).
const NAV_ITEMS = [
  { href: "/rental", label: "상품" },
  { href: "/mypage", label: "예약" },
  { href: "/profile", label: "내정보" },
  { href: "/about", label: "서비스 소개" },
  { href: "/notice", label: "공지사항" },
  { href: "/contact", label: "고객지원" },
];

// 모바일 햄버거 메뉴 목록 — "홈"은 목록이 아니라 드로어 상단 헤더에 나뭇잎 로고 아이콘으로
// 따로 배치하기 때문에(닫기 버튼과 나란히), 나머지는 PC 대메뉴(NAV_ITEMS)와 동일하다.
const MOBILE_NAV_ITEMS = NAV_ITEMS;

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
 * PC: 로고 + 가로 메뉴(NAV_ITEMS), 처음엔 배너 위에 투명하게 얹혀 있다가 스크롤하면 불투명
 * 배경으로 바뀐다(문서 위에서 흰 글씨가 안 보이는 문제를 막기 위함). 모바일: 로고 + 햄버거
 * 버튼만 보이고, 누르면 전체화면 어두운 오버레이 메뉴(MOBILE_NAV_ITEMS)가 뜬다 — "홈"
 * 항목만 추가됐을 뿐 나머지는 PC 대메뉴(NAV_ITEMS)와 동일하다.
 */
export function TopNav() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

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

          <nav className="hidden items-center gap-10 text-[18px] font-medium md:flex">
            {NAV_ITEMS.map((item) => {
              const isActive = item.href !== "/" && pathname.startsWith(item.href);
              return (
                <NextLink
                  key={item.href}
                  href={item.href}
                  className="relative flex items-center transition-opacity hover:opacity-70"
                >
                  {/* 참고 사이트처럼, 지금 보고 있는 메뉴 위에 로고와 같은 잎사귀 아이콘을 띄워
                      선택 상태를 표시한다(굵게 처리 대신) — 텍스트 오른쪽이 아니라 메뉴 상단
                      가운데에 오도록 절대 위치로 뺐다. */}
                  {isActive && (
                    <span
                      aria-hidden="true"
                      className={`absolute -top-3 left-1/2 h-4 w-4 -translate-x-1/2 bg-contain bg-center bg-no-repeat transition-[filter] duration-200 ${
                        solid ? "" : "brightness-0 invert"
                      }`}
                      style={{ backgroundImage: "url(/logo-mb.png)" }}
                    />
                  )}
                  {item.label}
                </NextLink>
              );
            })}
          </nav>

          <div className="md:hidden">
            <IconHamburger open={menuOpen} onClick={() => setMenuOpen((v) => !v)} />
          </div>
        </div>
      </header>

      {/* 뒷배경 딤 처리 — 화면 전체를 반투명하게 덮어서 뒤 콘텐츠가 눌리지 않게 막는다.
          패널 바깥(이 딤 영역)을 누르면 메뉴가 닫힌다. */}
      <div
        className={`fixed inset-0 z-[115] bg-black/50 transition-opacity duration-200 md:hidden ${
          menuOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setMenuOpen(false)}
        aria-hidden="true"
      />

      {/* 모바일 메뉴 패널 — 화면 전체가 아니라 오른쪽에서 80%만 슬라이드로 들어오는 일반적인
          드로어(drawer) 형태. translate-x로 화면 밖에 대기하다가 열리면 안으로 들어온다. */}
      <div
        className={`fixed inset-y-0 right-0 z-[120] flex w-[80%] max-w-xs flex-col bg-secondary-900 text-white transition-transform duration-200 md:hidden ${
          menuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex h-16 shrink-0 items-center justify-between px-4">
          {/* "홈"은 목록 항목 대신, 로고와 같은 나뭇잎 아이콘으로 여기 배치한다 — 닫기(X)
              버튼과 나란히 양 끝(justify-between)에 놓인다. */}
          <NextLink href="/" aria-label="홈" onClick={() => setMenuOpen(false)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-mb.png" alt="친구야" className="h-8 w-8 object-contain" />
          </NextLink>
          <IconX
            size="lg"
            aria-label="메뉴 닫기"
            className="text-white hover:bg-white/10 hover:text-white"
            onClick={() => setMenuOpen(false)}
          />
        </div>
        <nav className="flex flex-col px-6">
          {MOBILE_NAV_ITEMS.map((item) => {
            const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <NextLink
                key={item.href}
                href={item.href}
                className="flex items-center gap-1.5 py-4 text-md"
              >
                {item.label}
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="h-6 w-6 shrink-0 bg-contain bg-center bg-no-repeat"
                    style={{ backgroundImage: "url(/logo-mb.png)" }}
                  />
                )}
              </NextLink>
            );
          })}
        </nav>

        {/* 로그인 기능이 아직 없어서 실제 로그아웃 동작은 없고, 메뉴만 닫는다. 나중에 인증이
            붙으면 여기서 실제 로그아웃 처리를 하면 된다. */}
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => setMenuOpen(false)}
          className="border-t border-white/10 px-6 py-4 text-left text-sm text-white/70"
        >
          로그아웃
        </button>
      </div>
    </>
  );
}
