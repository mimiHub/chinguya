"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

export interface HelpTooltipProps {
  /** 말풍선 안에 보여줄 안내 내용 — 여러 줄·문단도 가능하다. */
  children: ReactNode;
  /** 아이콘의 접근성 라벨. 기본 "도움말". */
  label?: string;
  className?: string;
}

/**
 * 라벨/타이틀 옆에 붙는 "?" 도움말 아이콘 — 누르면 말풍선이 떠서 안내 문구를 보여주고, 다시
 * 누르거나 바깥을 누르거나 Esc를 누르면 닫힌다.
 *
 * packages/ui/tooltip.tsx의 Tooltip은 마우스 오버·키보드 포커스에서만 뜨는 순수 CSS 컴포넌트라
 * 한 줄짜리 짧은 라벨용(whitespace-nowrap 고정)이다 — 여기처럼 여러 줄 안내문을 "클릭"으로
 * 열고 닫아야 하는 경우엔 안 맞아서, 자체 열림 상태를 갖는 별도 컴포넌트로 뺐다. 배경은 Tooltip과
 * 같은 테마 토큰(tooltip-bg)을 써서 어디서 쓰이든 톤이 일치한다.
 */
export function HelpTooltip({ children, label = "도움말", className = "" }: HelpTooltipProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocPointerDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onDocPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <span ref={rootRef} className={`relative inline-flex ${className}`}>
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={[
          "inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold leading-none",
          open ? "border-primary-500 text-primary-500" : "border-line text-muted hover:border-primary-500 hover:text-ink",
        ].join(" ")}
      >
        ?
      </button>
      {open && (
        // 가운데 정렬(left-1/2 + -translate-x-1/2)로 뒀더니, 이 아이콘은 보통 라벨 맨 앞이라
        // 팝업 왼쪽 끝에 가까워서 말풍선 왼쪽 절반이 화면 밖으로 잘려나갔다(위치 계산 라이브러리
        // 없이 순수 CSS로 만든 한계 — Tooltip과 같은 방침). 그래서 아이콘 왼쪽 끝에 맞춰서
        // 오른쪽으로만 펼쳐지게 하고, 폭도 좁혀서 좁은 팝업(모바일 w-full)에서도 안 잘리게 했다.
        <span
          role="tooltip"
          className="absolute left-0 top-full z-[100] mt-1.5 w-56 rounded-md bg-tooltip-bg px-3 py-2 text-xs font-normal leading-relaxed text-white shadow-lg"
        >
          {children}
        </span>
      )}
    </span>
  );
}
