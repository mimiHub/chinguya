"use client";

import { useState } from "react";
import { IconHamburger, IconX, Button } from "@chinguya/ui";
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
 * 오른쪽 사용자 영역(UserMenu) — 원래는 로그인한 아이디(loginId)를 캡슐(알약) 모양으로
 * 항상 펼쳐서 보여줬는데, 아이디 텍스트가 바로 노출되지 않도록 아바타 아이콘 버튼 하나로
 * 줄이고, 누르면 뜨는 팝업(크롬 프로필 메뉴 같은 패턴) 안에 아이디와 — 나중에 계정 관련
 * 메뉴가 늘어나면 — 추가 메뉴 항목이 들어갈 수 있게 했다. 아이콘 하나뿐이라 자리를 거의
 * 차지하지 않아 PC·태블릿뿐 아니라 모바일에서도 항상 보인다(이전엔 모바일에서 캡슐 전체를
 * 숨겼었다). 값은 세션(GET /api/agency/session, useAgencyAuth)에서 온다. 세션이 없으면
 * 로그인 바로가기 버튼을 두지만, 보호된 화면은 미들웨어가 먼저 /login 으로 보내므로 실제로는
 * 세션이 만료된 직후에만 보인다(계정 등록은 관리자 초대 링크로만 들어가는 화면이라 바로가기를
 * 두지 않는다). 세션 조회 중에는 비워 둔다 — 로그인 버튼이 잠깐 번쩍이지 않게. 로그아웃은
 * 지금은 그대로 사이드바 하단 링크에 있다(이 메뉴는 별도 요청 전까지 정보 표시 + 확장용).
 *
 * z-[130] — 모바일·태블릿(lg 미만)에서는 사이드바가 fixed inset-y-0(화면 맨 위부터)로 뜨는
 * 오버레이라, 헤더보다 쌓임 순서가 낮으면 열렸을 때 이 헤더 전체가 사이드바 뒤로 가려져서
 * 햄버거가 바뀐 닫기(X) 버튼조차 눌러 닫을 방법이 없어진다. 사이드바(z-[120])·딤
 * 배경(z-[110], AgencyShell.tsx)보다 항상 위에 오도록 헤더에 더 높은 z-index를 준다.
 */
export function Header({ open, onMenuClick }: { open: boolean; onMenuClick: () => void }) {
  const { session, loading } = useAgencyAuth();

  return (
    <header className="relative z-[130] flex items-center justify-center border-b border-line bg-white px-6 py-4">
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
          <UserMenu loginId={session.loginId} />
        ) : (
          <Button href="/login" variant="text" size="sm">
            로그인
          </Button>
        )}
      </div>
    </header>
  );
}

/**
 * 아바타 아이콘 버튼 + 클릭 시 뜨는 계정 팝업. 팝업 바깥을 누르면 닫히는 방식은
 * packages/ui/src/components/dropdown.tsx(Dropdown)와 같은 패턴 — 화면 전체를 덮는
 * 투명 레이어(z-40)를 팝업(z-50)보다 낮게 깔아서 바깥 클릭을 감지한다.
 */
function UserMenu({ loginId }: { loginId: string }) {
  const [open, setOpen] = useState(false);
  const initial = loginId.charAt(0).toUpperCase();

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="사용자 메뉴"
        className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary-800 text-sm font-semibold text-white"
      >
        {initial}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full right-0 z-50 mt-2 w-56 rounded-lg border border-line bg-white shadow-lg">
            {/* 팝업 자체를 닫는 버튼 — 바깥(fixed 레이어) 클릭으로도 닫히지만, 눌러서 바로
                닫을 수 있는 명시적인 닫기 버튼도 우상단에 둔다. IconX 자체가 기본 클래스로
                relative를 갖고 있어서 className으로 absolute를 얹어도 카드 밖으로 밀려나
                버리길래, absolute는 감싸는 wrapper에 주고 IconX는 그 안에서 자기 자리(relative)를
                그대로 쓰게 했다. */}
            <div className="absolute top-2 right-2">
              <IconX aria-label="닫기" size="sm" onClick={() => setOpen(false)} />
            </div>
            <div className="flex flex-col items-center gap-2 px-4 py-5">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary-800 text-lg font-semibold text-white">
                {initial}
              </span>
              <span className="truncate text-sm font-semibold text-ink">{loginId}</span>
            </div>
            {/* 계정 관련 메뉴 항목이 늘어나면 여기(위 정보 영역 아래)에 구분선(border-t
                border-line)과 함께 버튼/링크 목록으로 추가한다. */}
          </div>
        </>
      )}
    </div>
  );
}
