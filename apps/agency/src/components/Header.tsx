"use client";

import { IconHamburger } from "@chinguya/ui/icon-hamburger";

/**
 * 상단 헤더. 사이드바가 기본적으로 접혀 있는 토글형 패널로 바뀌면서, 어느 화면에서든 열고
 * 닫을 수 있도록 햄버거 버튼을 항상 여기에 둔다. 고객 앱과 같은 공용 IconHamburger(@chinguya/ui)를
 * 그대로 써서 열렸을 때 햄버거(≡)가 닫기(X) 모양으로 자연스럽게 바뀐다 — 이 버튼 자체가
 * 열기/닫기 버튼을 겸한다. 여행사명 텍스트 대신 로고(logo-pc.png, 로그인 화면과 같은 자산)를
 * 둔다 — 배경이 흰색 헤더라 로그인 화면에서 쓴 필터(brightness-0 invert) 없이 원본 색 그대로
 * 잘 보인다(로그인 화면에는 이 헤더 자체가 없다 — AgencyShell 참고).
 */
export function Header({ open, onMenuClick }: { open: boolean; onMenuClick: () => void }) {
  return (
    <header className="flex items-center justify-between border-b border-line bg-white px-6 py-4">
      {/* eslint-disable-next-line @next/next/no-img-element -- 고정 로고 이미지, next/image 최적화가 필요 없는 크기 */}
      <img src="/logo-pc.png" alt="Cafe Chinguya" className="h-7 w-auto" />
      {/* 공용 컴포넌트(IconHamburger)는 고객 앱도 같이 쓰므로 크기를 직접 고치지 않고,
          여기서만 scale로 줄인다 — 열렸을 때(X) 막대가 회전하며 커지는 애니메이션이라
          버튼 자체를 축소해야 열림/닫힘 두 모양이 같은 비율로 함께 작아진다. */}
      <IconHamburger open={open} onClick={onMenuClick} className="scale-75" />
    </header>
  );
}
