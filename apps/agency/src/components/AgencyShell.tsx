"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";

/**
 * 여행사 앱 공통 셸. 로그인 화면(/login)에는 헤더·사이드바를 아예 렌더링하지 않는다
 * (그 화면은 전체 화면 배경을 따로 쓴다 — apps/agency/src/app/login/page.tsx의
 * AuthScreenLayout 참고). 그 외 화면에서는 상단 헤더(햄버거 버튼 + 여행사명)와, 햄버거를
 * 누르면 옆에서 폭이 늘어나며 열리는 사이드바 패널을 함께 관리한다 — 열림 상태를 여기서
 * 갖고 있어야 헤더의 버튼과 사이드바가 서로 통신할 수 있다. 오버레이(콘텐츠를 덮는 방식)가
 * 아니라 사이드바와 콘텐츠가 flex 형제로 나란히 있어서, 사이드바가 열리면 콘텐츠 폭이
 * 줄어들며 한 화면 안에 같이 보인다.
 */
export function AgencyShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (pathname === "/login") {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen flex-col">
      <Header open={sidebarOpen} onMenuClick={() => setSidebarOpen((v) => !v)} />
      {/* min-h-screen(최소 높이)만 쓰면, 표가 길어서 콘텐츠가 화면보다 커질 때 이 아래
          영역(사이드바+콘텐츠) 전체가 뷰포트보다 커지면서 사이드바까지 같이 길게 늘어나고,
          브라우저 창 높이가 낮으면 아래쪽 내용이 화면 밖으로 잘려 보이는 문제가 있었다.
          h-screen(고정 높이) + overflow-hidden으로 이 영역 자체는 항상 뷰포트 높이만큼만
          차지하게 고정하고, 실제로 길어질 수 있는 콘텐츠 영역에만 overflow-y-auto를 줘서
          그 부분만 내부 스크롤이 생기게 한다 — 헤더·사이드바는 고정, 콘텐츠만 스크롤. */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar open={sidebarOpen} />
        <div className="min-w-0 flex-1 overflow-y-auto p-8">{children}</div>
      </div>
    </div>
  );
}
