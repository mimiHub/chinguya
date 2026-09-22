"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

/**
 * TopHeader/BottomNav를 뺀 나머지 영역을 감싸는 스크롤 컨테이너.
 * 원래는 layout.tsx 안에 그냥 <div className="... pb-16 md:pb-0">로 박혀 있었다 — 모바일
 * 하단 탭바(BottomNav, h-16)에 콘텐츠가 가리지 않도록 미리 빼둔 여백이다.
 *
 * 그런데 로그인 화면(/login)은 TopHeader/BottomNav를 아예 안 띄우면서도(둘 다 pathname
 * === "/login"이면 null) 이 여백만은 그대로 남아 있었다. 배경 이미지는 fixed로 뷰포트
 * 전체를 덮게 고쳤지만, 로그인 카드는 <main>의 flex 중앙 정렬로 배치되는데 그 <main>이
 * 속한 이 div 자체가 pb-16만큼 낮아진 박스였던 것 — 그래서 카드가 정중앙보다 pb-16의
 * 절반만큼 위로 치우쳐 보였다. BottomNav.tsx와 동일하게 usePathname으로 로그인 화면인지
 * 판단해서, 로그인 화면에서만 이 여백을 빼 정확히 뷰포트 중앙에 오도록 한다.
 */
export function ContentArea({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  return (
    <div className={`min-h-0 flex-1 overflow-y-auto ${isLoginPage ? "" : "pb-16 md:pb-0"}`}>
      {children}
    </div>
  );
}
