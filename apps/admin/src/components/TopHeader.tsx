"use client";

import { useEffect, useState } from "react";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { IconHamburger } from "@chinguya/ui/icon-hamburger";
import { IconX } from "@chinguya/ui/icon-x";
import { adminAccounts } from "@/data/authData";

// 아직 실제 로그인 세션이 없어서(로그인해도 새로고침하면 풀림 — authData.ts 주석 참고),
// 드로어의 "로그인 정보"는 목업 계정 중 첫 번째를 그대로 보여준다. 실제 세션이 생기면
// 여기를 로그인한 계정 정보로 교체한다.
const currentAdmin = adminAccounts[0];

/**
 * 모든 관리자 화면 상단에 공통으로 뜨는 헤더. 왼쪽엔 고객 사이트와 같은 나뭇잎 로고(누르면
 * 대시보드로 이동), 오른쪽엔 햄버거 버튼 — 누르면 고객앱 TopNav.tsx와 같은 구조(오른쪽에서
 * 슬라이드로 들어오는 드로어)로 로그인 정보 확인과 로그아웃을 할 수 있다. 로그인 화면은
 * BottomNav와 마찬가지로 헤더 자체를 숨긴다.
 */
export function TopHeader() {
  const pathname = usePathname();
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
          <IconHamburger open={menuOpen} onClick={() => setMenuOpen((v) => !v)} className="text-ink" />
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

      {/* 오른쪽에서 슬라이드로 들어오는 드로어 — 로그인 정보 확인 + 로그아웃 */}
      <div
        className={`fixed inset-y-0 right-0 z-[120] flex w-[80%] max-w-xs flex-col border-l border-line bg-surface text-ink transition-transform duration-200 ${
          menuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-line px-4">
          <span className="text-sm font-bold">메뉴</span>
          <IconX size="lg" aria-label="메뉴 닫기" onClick={() => setMenuOpen(false)} />
        </div>

        {currentAdmin && (
          <div className="flex flex-col gap-1 border-b border-line px-6 py-4">
            <span className="text-xs text-muted">로그인 정보</span>
            <span className="text-base font-bold">{currentAdmin.name}</span>
            <span className="text-sm text-muted">
              {currentAdmin.id} · {currentAdmin.level === "superadmin" ? "슈퍼어드민" : "관리자"}
            </span>
          </div>
        )}

        <div className="flex-1" />

        <NextLink
          href="/login"
          onClick={() => setMenuOpen(false)}
          className="border-t border-line px-6 py-4 text-left text-sm text-muted hover:text-ink"
        >
          로그아웃
        </NextLink>
      </div>
    </>
  );
}
