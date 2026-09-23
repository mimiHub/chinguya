"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";

/**
 * 여행사 앱 공통 셸. 로그인 화면(/login)에는 헤더·사이드바를 아예 렌더링하지 않는다
 * (그 화면은 전체 화면 배경을 따로 쓴다 — apps/agency/src/app/login/page.tsx의
 * AuthScreenLayout 참고). 그 외 화면에서는 상단 헤더(햄버거 버튼 + 여행사명)와, 햄버거를
 * 누르면 열리는 사이드바 패널을 함께 관리한다 — 열림 상태를 여기서 갖고 있어야 헤더의
 * 버튼과 사이드바가 서로 통신할 수 있다.
 *
 * 데스크톱(lg, 1024px 이상)과 모바일·태블릿(lg 미만)에서 열렸을 때의 모양이 다르다
 * (자세한 폭·위치 계산은 Sidebar.tsx 참고). 데스크톱은 사이드바와 콘텐츠가 flex 형제로
 * 나란히 있어서, 사이드바가 열리면 콘텐츠 폭이 줄어들며 한 화면 안에 같이 보인다. 화면이
 * 좁은 모바일·태블릿은 그럴 자리가 없으므로 사이드바가 콘텐츠 위로 뜨는 오버레이가 되고,
 * 뒤 콘텐츠가 눌리지 않도록 반투명 딤(dim) 배경을 함께 깐다 — 고객 앱 모바일 드로어
 * 메뉴(TopNav.tsx)와 같은 패턴. 이 딤은 lg 이상에서는 렌더링하지 않는다(데스크톱은
 * 오버레이가 아니라 원래 딤이 필요 없다).
 */
export function AgencyShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // 모바일·태블릿(오버레이)에서는 메뉴에서 화면을 이동하면 자동으로 닫아준다 — 오버레이라
  // 열어둔 채로 두면 다음 화면을 계속 가린다. 데스크톱(lg 이상)은 원래 설계대로 자동 닫힘이
  // 없다(사이드바가 콘텐츠 옆 패널이라 이동할 때마다 닫히면 오히려 불편하다) — 그래서 여기서
  // 뷰포트 폭을 직접 확인하고 lg 미만일 때만 닫는다.
  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 1023px)").matches) {
      setSidebarOpen(false);
    }
  }, [pathname]);

  if (pathname === "/login") {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <Header open={sidebarOpen} onMenuClick={() => setSidebarOpen((v) => !v)} />
      {/* min-h-screen(최소 높이)만 쓰면, 표가 길어서 콘텐츠가 화면보다 커질 때 이 아래
          영역(사이드바+콘텐츠) 전체가 뷰포트보다 커지면서 사이드바까지 같이 길게 늘어나고,
          브라우저 창 높이가 낮으면 아래쪽 내용이 화면 밖으로 잘려 보이는 문제가 있었다.
          h-screen(고정 높이) + overflow-hidden으로 이 영역 자체는 항상 뷰포트 높이만큼만
          차지하게 고정하고, 실제로 길어질 수 있는 콘텐츠 영역에만 overflow-y-auto를 줘서
          그 부분만 내부 스크롤이 생기게 한다 — 헤더·사이드바는 고정, 콘텐츠만 스크롤. */}
      <div className="flex flex-1 overflow-hidden">
        {/* 모바일·태블릿 전용 뒷배경 딤 — 사이드바(오버레이)가 열려 있을 때만 보이고,
            누르면 닫힌다. lg 이상에서는 아예 렌더링하지 않는다. */}
        <div
          className={`fixed inset-0 z-[110] bg-black/50 transition-opacity duration-200 lg:hidden ${
            sidebarOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
          }`}
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
        <Sidebar open={sidebarOpen} onExpand={() => setSidebarOpen(true)} />
        {/* min-h-0이 빠져 있어서(min-w-0만 있었음) 표(Table)가 길어지면 이 안에서
            overflow-y-auto로 스크롤되는 대신 이 div 자체가 내용 높이만큼 늘어나 버렸고,
            그게 그대로 페이지(body) 스크롤이 되면서 예약 목록·인보이스 등 표가 긴 화면에서
            표가 부모 상자를 넘어가 보이는 문제가 있었다(2026-09-23). flex-1과 min-h-0을
            같이 줘야 이 영역이 위 h-screen 높이 안으로 고정되고, 그 안에서만 스크롤된다. */}
        <div className="min-h-0 min-w-0 flex-1 overflow-y-auto p-4 lg:p-8">{children}</div>
      </div>
    </div>
  );
}
