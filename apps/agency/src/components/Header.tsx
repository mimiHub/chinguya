"use client";

import { IconHamburger } from "@chinguya/ui/icon-hamburger";
import { Button } from "@chinguya/ui/button";
import { useAgencyAuth } from "@/context/AgencyAuthContext";

/**
 * 상단 헤더. 사이드바가 기본적으로 접혀 있는 토글형 패널로 바뀌면서, 어느 화면에서든 열고
 * 닫을 수 있도록 햄버거 버튼을 항상 여기에 둔다. 고객 앱과 같은 공용 IconHamburger(@chinguya/ui)를
 * 그대로 써서 열렸을 때 햄버거(≡)가 닫기(X) 모양으로 자연스럽게 바뀐다 — 이 버튼 자체가
 * 열기/닫기 버튼을 겸한다. 여행사명 텍스트 대신 로고(logo-pc.png, 로그인 화면과 같은 자산)를
 * 둔다 — 배경이 흰색 헤더라 로그인 화면에서 쓴 필터(brightness-0 invert) 없이 원본 색 그대로
 * 잘 보인다(로그인 화면에는 이 헤더 자체가 없다 — AgencyShell 참고). 로고는 헤더 가운데,
 * 햄버거/닫기 버튼은 왼쪽에 고정한다 — 실제로 열리는 사이드바 패널도 화면 왼쪽에서 나오므로,
 * 버튼 위치와 패널이 열리는 방향을 일치시켜 헷갈리지 않게 한다.
 *
 * 오른쪽에는 로그인한 아이디(여행사명이 아니라 loginId, 예: agency01)를 캡슐(알약) 모양
 * 배경으로 보여준다 — 테두리 선·그림자는 없이 border-radius로만 캡슐 모양을 내고, 헤더가 흰
 * 배경이라 배경색은 bg-white 대신 톤 차이가 나는 bg-bg-light를 써서 캡슐 모양 자체가 보이게
 * 한다. 값은 세션(GET /api/agency/session, useAgencyAuth)에서 온다. 세션이 없으면 로그인
 * 바로가기 버튼을 두지만, 보호된 화면은 미들웨어가 먼저 /login 으로 보내므로 실제로는 세션이
 * 만료된 직후에만 보인다(계정 등록은 관리자 초대 링크로만 들어가는 화면이라 바로가기를 두지
 * 않는다). 세션 조회 중에는 비워 둔다 — 로그인 버튼이 잠깐 번쩍이지 않게. 로그아웃은 사이드바
 * 하단 링크에서 한다(여기는 정보 표시만).
 */
export function Header({ open, onMenuClick }: { open: boolean; onMenuClick: () => void }) {
  const { session, loading } = useAgencyAuth();

  return (
    <header className="relative flex items-center justify-center border-b border-line bg-white px-6 py-4">
      {/* eslint-disable-next-line @next/next/no-img-element -- 고정 로고 이미지, next/image 최적화가 필요 없는 크기 */}
      <img src="/logo-pc.png" alt="Cafe Chinguya" className="h-7 w-auto" />
      {/* 공용 컴포넌트(IconHamburger)는 고객 앱도 같이 쓰므로 크기를 직접 고치지 않고,
          여기서만 scale로 줄인다 — 열렸을 때(X) 막대가 회전하며 커지는 애니메이션이라
          버튼 자체를 축소해야 열림/닫힘 두 모양이 같은 비율로 함께 작아진다. */}
      <div className="absolute left-6">
        <IconHamburger open={open} onClick={onMenuClick} className="scale-75" />
      </div>

      <div className="absolute right-6 flex items-center gap-2">
        {loading ? null : session ? (
          <span className="flex items-center gap-1.5 rounded-full bg-bg-light px-3 py-1.5 text-sm text-ink">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-mb.png"
              alt=""
              aria-hidden="true"
              className="h-4 w-4 object-contain"
            />
            {session.loginId}
          </span>
        ) : (
          <Button href="/login" variant="text" size="sm">
            로그인
          </Button>
        )}
      </div>
    </header>
  );
}
