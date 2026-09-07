"use client";

import type { ReactNode } from "react";

export type TooltipPosition = "top" | "bottom";

export interface TooltipProps {
  /** 말풍선에 보여줄 짧은 설명 한 줄 */
  label: string;
  /** 툴팁을 붙일 기준 요소(아이콘 버튼 등) — 한 개만. 마우스 오버·키보드 포커스 둘 다에서 뜬다. */
  children: ReactNode;
  /** 말풍선이 뜨는 방향. 기본은 위(툴팁이 화면 위쪽 잘릴 걱정이 없을 때 대부분 이 경우다). */
  position?: TooltipPosition;
  className?: string;
}

/**
 * 아이콘 버튼처럼 그 자체로는 뜻이 안 드러나는 요소에 짧은 설명을 붙일 때 쓴다(예: 콘텐츠
 * 관리의 배너 사이즈 안내 +버튼 — "더보기"). 별도 라이브러리 없이 순수 CSS만으로 만들었다 —
 * 이 디자인 시스템의 다른 컴포넌트(IconX, Stepper 등)와 같은 방침.
 *
 * 마우스 오버(group-hover)뿐 아니라 키보드 포커스(group-focus-within)에서도 뜨게 해서,
 * 마우스 없이 Tab으로 이동하는 사용자도 설명을 볼 수 있게 했다. 배경은 색상 값이 항상
 * "어두운 배경 + 흰 글자"여야 해서 Toast와 같은 이유로 테마 전용 토큰(tooltip-bg)을 쓴다
 * (theme.css 참고) — 라이트/다크 앱 어디서든 툴팁 자체 색은 안 바뀐다.
 *
 * children은 트리거 하나(주로 아이콘 버튼)를 그대로 감싸기만 하고 스타일은 건드리지 않는다 —
 * 버튼의 크기·클릭 영역·기존 hover 효과는 그대로 유지된다.
 */
export function Tooltip({ label, children, position = "top", className = "" }: TooltipProps) {
  const positionClass = position === "top" ? "bottom-full mb-1.5" : "top-full mt-1.5";

  return (
    <span className={`group relative inline-flex ${className}`}>
      {children}
      <span
        role="tooltip"
        className={`pointer-events-none absolute left-1/2 z-[100] -translate-x-1/2 whitespace-nowrap rounded-md bg-tooltip-bg px-2 py-1 text-xs text-white opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100 ${positionClass}`}
      >
        {label}
      </span>
    </span>
  );
}
