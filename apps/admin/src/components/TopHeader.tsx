"use client";

import { useEffect, useState } from "react";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { IconHamburger, IconX } from "@chinguya/ui";
import { useAdminAuth } from "@/context/AdminAuthContext";

// BottomNav.tsx와 같은 4개 탭 — PC 고정폭 레이아웃이라 모바일 기기 실제 화면(좁은 뷰포트)에서
// 보면 BottomNav 자체가 md:hidden 밖으로 밀려나 안 보이는 경우가 있다. 그럴 때도 내비게이션이
// 막히지 않도록, 같은 목적지를 이 드로어 메뉴에도 넣어 햄버거 하나로 접근 가능하게 한다.
const MENU_ITEMS: { href: string; label: string }[] = [
  { href: "/", label: "홈" },
  { href: "/reservations", label: "예약" },
  { href: "/products", label: "상품" },
  { href: "/more", label: "더보기" },
];

/**
 * 모든 관리자 화면 상단에 공통으로 뜨는 헤더. 왼쪽엔 고객 사이트와 같은 나뭇잎 로고(누르면
 * 대시보드로 이동), 오른쪽엔 햄버거 버튼 — 누르면 고객앱 TopNav.tsx와 같은 구조(오른쪽에서
 * 슬라이드로 들어오는 드로어)로 로그인 정보 확인과 로그아웃을 할 수 있다. 로그인 화면은
 * BottomNav와 마찬가지로 헤더 자체를 숨긴다.
 */
export function TopHeader() {
  const pathname = usePathname();
  const { session, logout } = useAdminAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  // 라우트가 바뀌면 드로어를 자동으로 닫는다(고객앱 TopNav와 동일한 동작).
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // 드로어가 열려 있는 동안은 뒤 배경이 스크롤되지 않게 막는다.
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  if (pathname === "/login") return null;

  return (
    <>
      <header className="sticky top-0 z-[90] border-b border-line bg-surface px-6 py-3">
        <div className="flex items-center justify-between">
          <NextLink href="/" aria-label="대시보드로 이동">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-mb.png" alt="친구야" className="h-8 w-auto" />
          </NextLink>
          <IconHamburger
            open={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
            className="text-ink"
          />
        </div>
      </header>

      {/* 뒷배경 딤 처리 — 패널 바깥을 누르면 드로어가 닫힌다 */}
      <div
        className={`fixed inset-0 z-[115] bg-black/50 transition-opacity duration-200 ${
          menuOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setMenuOpen(false)}
        aria-hidden="true"
      />

      {/* 오른쪽에서 슬라이드로 들어오는 드로어 — 로그인 정보 확인 + 로그아웃.
          기본 배경은 다른 관리자 화면과 같은 평범한 bg-surface였는데, 로그인 화면에 넣은
          야경 사진 배경(달맞이 고양이)과 톤을 맞춰달라는 요청으로 로그인 화면의 모바일용
          배경 이미지(login-bg-mobile.jpg — 세로 구도라 이 좁은 드로어 폭에도 잘 맞는다)를
          그대로 재사용한다. 처음엔 로그인 화면과 같은 bg-black/60을 썼는데, 이 드로어는
          로그인 화면보다 좁은 폭에 사진이 bg-cover로 잘려 들어가다 보니 상대적으로 밝게
          느껴진다는 피드백으로 한 단계 더 진하게(bg-black/75) 눌러서 글자 대비를 더
          확보했다. flex 레이아웃은
          바깥 fixed div에서 안쪽 relative 래퍼로 옮겼다 — 배경 사진·오버레이 레이어를
          absolute inset-0로 깔려면 실제 콘텐츠(헤더/로그인정보/내비/로그아웃)가 그 위에
          쌓이도록 별도 stacking context가 필요하기 때문이다. */}
      <div
        className={`fixed inset-y-0 right-0 z-[120] w-[80%] max-w-xs overflow-hidden border-l border-line text-ink transition-transform duration-200 ${
          menuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url(/login-bg-mobile.jpg)" }}
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-black/75" aria-hidden="true" />

        <div className="relative flex h-full flex-col">
          <div className="flex h-14 shrink-0 items-center justify-end border-b border-line px-4">
            <IconX size="lg" aria-label="메뉴 닫기" onClick={() => setMenuOpen(false)} />
          </div>

          {/* Core API의 세션 응답에는 표시 이름(name)이 없어서 아이디와 등급만 보여준다.
              이름 노출이 필요해지면 백엔드 응답에 필드를 추가해야 한다(api-spec TODO 1번).
              로그인 정보를 상단에 두고, 그 아래에 내비게이션을 배치한다(레퍼런스 디자인) — 예전엔
              "로그인 정보" 라벨과 함께 메뉴 맨 아래 로그아웃 바로 위에 있어서 내비게이션과 분리된
              느낌이었는데, 위로 올리니 "지금 누구로 로그인해 있는지"가 드로어를 열자마자 바로
              보인다. 카드처럼 배경을 따로 띄우지 않고 다른 메뉴 줄과 같은 톤으로 두되, 위아래
              구분선(border)만으로 하나의 섹션임을 나타낸다(레퍼런스 디자인: 다른 항목들과 동일한
              평면 위에서 선으로만 구획). */}
          {session && (
            <div className="border-b border-line px-6 py-3">
              <p className="text-base font-bold">{session.loginId}</p>
              <p className="text-sm text-muted">
                [등급]{session.role === "SUPER_ADMIN" ? "슈퍼어드민" : "관리자"}
              </p>
            </div>
          )}

          {/* BottomNav를 대신하는 내비게이션 — 좁은 화면에서 하단 탭바가 안 보일 때 여기로 이동한다. */}
          <nav className="flex flex-col border-b border-line py-2">
            {MENU_ITEMS.map(({ href, label }) => {
              const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
              return (
                <NextLink
                  key={href}
                  href={href}
                  className={`px-6 py-3 text-sm ${active ? "font-bold text-primary-500" : "text-ink"}`}
                >
                  {label}
                </NextLink>
              );
            })}
          </nav>

          <div className="flex-1" />

          <button
            type="button"
            onClick={() => {
              setMenuOpen(false);
              void logout();
            }}
            className="cursor-pointer border-t border-line px-6 py-4 text-left text-sm text-muted hover:text-ink"
          >
            로그아웃
          </button>
        </div>
      </div>
    </>
  );
}
