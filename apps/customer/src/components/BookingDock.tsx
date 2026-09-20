"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import type { ReactNode } from "react";

/**
 * 모바일 전용 "하단에 붙어 있다가 푸터 앞에서 풀리는 예약 팝업" — 상품 상세(/rental/[id])의 옵션·날짜·수량·합계 영역을 감싼다.
 *
 * 왜 필요한가: 상품 사용방법처럼 본문이 길어지면, 예약에 필요한 옵션·합계·버튼이 페이지 맨 아래에 있어서
 * 사용자가 긴 글을 읽다가 예약하려면 끝까지 내려가야 한다. 그래서 이 영역만 화면 하단에 붙여 두고,
 * 나머지(상품 정보·탭·사용방법)는 그 뒤에서 자유롭게 스크롤되게 한다.
 *
 * 핵심 개념: 패널은 **하나뿐인 요소**이고 화면 폭에 따라 className만 바뀐다.
 *   - 모바일(md 미만): position: sticky + bottom(탭바 바로 위). 본문 맨 끝에 원래 자리를 두고 있어서
 *       · 본문을 읽는 동안에는 원래 자리가 화면 아래쪽에 있으므로 화면 하단(탭바 위)에 붙어 있고,
 *       · 끝까지 내려가 원래 자리가 화면에 들어오면 그 자리(= 푸터 바로 위)에서 풀려 본문과 같이 스크롤된다.
 *     JS 없이 CSS만으로 되는 "푸터 앞에서 멈추는 sticky 바" 방식이다(스크롤 이벤트·IntersectionObserver 불필요).
 *     그래서 이 컴포넌트는 반드시 페이지 본문 컨테이너의 **마지막 자식**으로 둬야 한다(푸터 바로 앞).
 *   - PC(md 이상)     : 아무 꾸밈 없이 본문 흐름 안에 그대로 펼쳐진다(기존 그대로).
 *
 * 접기/펼치기: 핸들로 접고 편다. 접어도 footer(합계·버튼)는 남는다("완전히 접히지 않음"). 처음엔 **펼쳐져 있다** —
 * 주 사용자가 50대 이상이라, 접혀 있으면 옵션을 고르는 UI가 어디 있는지 찾기 어렵기 때문. 본문을 읽고 싶으면 핸들이나
 * 뒷배경을 눌러 접으면 된다.
 * 펼친 동안(모바일)에는 뒤의 페이지가 움직이지 않게 잠근다 — 페이지 스크롤(html overflow)을 막고, 시트 본문이
 * 끝에 닿아도 스크롤이 페이지로 넘어가지 않게(overscroll-contain) 하고, 시트 밖 영역의 터치 이동도 막고, 뒤쪽 화면 전체를
 * 덮는 반투명 배경을 깔아 뒤 컨텐츠의 클릭·탭도 받지 않게 한다(배경을 누르거나 Esc를 누르면 시트가 접힌다). 상단 내비·하단 탭바는
 * 배경보다 위(z-index)라 그대로 쓸 수 있다.
 *
 * 페이지 끝: 팝업이 본문 흐름 안에 실제 자리를 차지하므로, 맨 끝에서는 팝업이 푸터를 밀어 내려 푸터가 가려지지 않는다.
 * (fixed 방식일 땐 팝업 높이를 재서 여백을 따로 잡아야 했지만 sticky는 그럴 필요가 없다.)
 */

const DESKTOP_QUERY = "(min-width: 768px)";

function subscribeDesktop(onChange: () => void) {
  const query = window.matchMedia(DESKTOP_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/** Tailwind md 미만 여부. 서버 렌더에선 false(=PC 취급)라 팝업 동작은 클라이언트에서만 켜진다. */
function useIsMobile() {
  return useSyncExternalStore(
    subscribeDesktop,
    () => !window.matchMedia(DESKTOP_QUERY).matches,
    () => false,
  );
}

export interface BookingDockProps {
  /** 옵션·날짜·수량 — 팝업에서는 접으면 사라지고, 길면 팝업 안에서 따로 스크롤된다. */
  children: ReactNode;
  /** 합계·버튼 — 접어도 항상 보인다. 팝업 모드인지 알려 줘서 간격을 다르게 줄 수 있다. */
  footer: (popup: boolean) => ReactNode;
  /** 처음 상태. 기본은 펼침(옵션·날짜·수량이 바로 보임) — 접으려면 false. */
  defaultOpen?: boolean;
  /**
   * 팝업(모바일) 모드에서만 패널에 덧붙는 클래스 — 부모 컨테이너의 좌우/아래 padding을 상쇄해 화면 폭 끝까지 펴거나
   * (-mx-6), 본문이 짧을 때 컨테이너 맨 아래로 내리는(mt-auto) 용도.
   */
  popupClassName?: string;
}

export function BookingDock({
  children,
  footer,
  defaultOpen = true,
  popupClassName = "",
}: BookingDockProps) {
  const bodyId = useId();
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(defaultOpen);
  const scrollerRef = useRef<HTMLDivElement>(null);
  // 팝업 모드에서 펼쳐진 동안만 true — 이때 뒤 페이지의 스크롤·터치·클릭을 잠근다.
  const locked = isMobile && open;

  useEffect(() => {
    if (!locked) return;

    // 1) 페이지 스크롤 잠금: 스크롤 위치는 그대로 두고 스크롤만 막는다.
    //    html에만 건다 — body에도 overflow:hidden을 주면 body가 자기만의 스크롤 영역이 되어, 패널의 sticky가
    //    화면(뷰포트)이 아니라 body를 기준으로 계산돼 하단 고정이 풀리고 합계·버튼이 탭바 뒤로 밀려난다.
    const html = document.documentElement;
    const prevHtmlOverflow = html.style.overflow;
    html.style.overflow = "hidden";

    // 2) overflow:hidden을 무시하는 옛 iOS 대비 — 시트 본문(스크롤 영역) 밖에서 시작된 터치 이동은 페이지를 못 움직이게 막는다.
    const blockTouchMove = (e: TouchEvent) => {
      if (!scrollerRef.current?.contains(e.target as Node)) e.preventDefault();
    };
    document.addEventListener("touchmove", blockTouchMove, { passive: false });

    // 3) Esc로 접기
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      html.style.overflow = prevHtmlOverflow;
      document.removeEventListener("touchmove", blockTouchMove);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [locked]);

  // 같은 요소를 화면 폭에 따라 className만 바꿔 쓴다(PC에서는 아무 꾸밈도 없다).
  const panelClass = isMobile
    ? `sticky bottom-16 z-[96] overflow-hidden rounded-t-lg border-t border-line bg-bg shadow-[0_-4px_16px_rgba(0,0,0,0.08)] ${popupClassName}`
    : "";
  // 접기/펼치기: 0fr↔1fr 전환이라 내용 높이에 맞춰 CSS만으로 부드럽게 열린다(height:auto는 애니메이션 불가).
  const wrapClass = isMobile
    ? `grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none ${
        open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
      }`
    : "";
  const clipClass = isMobile ? "min-h-0 overflow-hidden" : "";
  // 상단 내비·탭바·핸들·footer(타지역 반납 안내·안내 문구까지 붙은 가장 큰 높이)를 뺀 만큼만 쓰고, 넘치면 팝업 안에서만 스크롤한다.
  // 이 예약분(22rem)이 모자라면 팝업이 본문 위쪽 끝에 걸려 아래가 탭바 뒤로 밀려 내려가니, footer가 커지면 같이 키운다.
  const scrollerClass = isMobile
    ? "flex max-h-[calc(80dvh_-_22rem)] flex-col gap-4 overflow-y-auto overscroll-contain border-y border-line bg-bg px-6 py-4"
    : "flex flex-col gap-4";
  // pt-4: 위(옵션 영역 끝 선 또는 핸들)와 첫 줄 사이 여백 — 타지역 반납 안내처럼 첫 줄이 작은 글씨일 때 선에 붙어 보이지 않게 아래 pb-4와 같은 간격을 둔다.
  const footerClass = isMobile ? "bg-surface px-6 pt-4 pb-4" : "mt-4 border-t border-line pt-4";

  return (
    <>
      {locked && (
        // 뒤쪽 화면 전체를 덮는 반투명 배경 — 뒤 컨텐츠의 클릭·탭을 받지 않고, 누르면 시트가 접힌다.
        // 시트(z-[96])보다 아래, 상단 내비(110)·하단 탭바(100)보다도 아래(95)라 그 둘은 그대로 눌린다.
        <div
          aria-hidden="true"
          className="fixed inset-0 z-[95] bg-black/30"
          onClick={() => setOpen(false)}
        />
      )}
      <div className={panelClass}>
        {isMobile && (
          <button
            type="button"
            aria-expanded={open}
            aria-controls={bodyId}
            onClick={() => setOpen((v) => !v)}
            className="flex h-9 w-full cursor-pointer items-center justify-center gap-1 bg-surface text-xs text-muted"
          >
            <svg
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className={`h-4 w-4 transition-transform duration-300 motion-reduce:transition-none ${
                open ? "" : "rotate-180"
              }`}
            >
              <path d="M5 8l5 5 5-5" />
            </svg>
            {open ? "접기" : "옵션 · 날짜 선택"}
          </button>
        )}

        {/* 접힌 동안엔 inert로 안의 입력이 Tab 키·스크린리더에 잡히지 않게 한다 */}
        <div id={bodyId} inert={isMobile && !open} className={wrapClass}>
          <div className={clipClass}>
            <div ref={scrollerRef} className={scrollerClass}>
              {children}
            </div>
          </div>
        </div>

        <div className={footerClass}>{footer(isMobile)}</div>
      </div>
    </>
  );
}
