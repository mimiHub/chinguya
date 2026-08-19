"use client";

import type { ButtonHTMLAttributes } from "react";

export interface IconHamburgerProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  /** true면 X 모양(닫기)으로 바뀐다 — 모바일 메뉴 열림/닫힘 토글 버튼에 사용 */
  open?: boolean;
  className?: string;
}

/**
 * 햄버거(≡) / 닫기(X) 토글 아이콘 버튼. IconX와 같은 방식으로 아이콘 폰트·SVG 없이 순수 CSS
 * 막대(span) 3개로 그린다 — open이 true가 되면 가운데 막대는 사라지고 위/아래 막대가 겹쳐
 * ±45도로 돌아가 X 모양이 된다(모두 transform 트랜지션이라 애니메이션도 자연스럽다).
 */
export function IconHamburger({ open = false, className = "", "aria-label": ariaLabel = "메뉴", ...rest }: IconHamburgerProps) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      aria-expanded={open}
      className={["relative inline-flex h-6 w-6 shrink-0 items-center justify-center", className].filter(Boolean).join(" ")}
      {...rest}
    >
      <span
        className={`absolute h-0.5 bg-current transition-all duration-200 ${
          open ? "w-[24px] translate-y-0 rotate-45" : "w-5 -translate-y-1.5"
        }`}
      />
      <span
        className={`absolute h-0.5 w-5 bg-current transition-opacity duration-200 ${open ? "opacity-0" : "opacity-100"}`}
      />
      <span
        className={`absolute h-0.5 bg-current transition-all duration-200 ${
          open ? "w-[24px] translate-y-0 -rotate-45" : "w-5 translate-y-1.5"
        }`}
      />
    </button>
  );
}
