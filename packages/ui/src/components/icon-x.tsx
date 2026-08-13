"use client";

import type { ButtonHTMLAttributes } from "react";

type Size = "sm" | "md";

const sizeClass: Record<Size, string> = {
  sm: "h-5 w-5",
  md: "h-6 w-6",
};

const barSizeClass: Record<Size, string> = {
  sm: "w-2.5",
  md: "w-3",
};

export interface IconXProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  size?: Size;
  className?: string;
}

/**
 * X 모양 아이콘 버튼(삭제/닫기 등에 사용). 아이콘 폰트나 SVG 없이 순수 CSS로 두 개의 막대를
 * ±45도로 겹쳐서 X 모양을 만든다. aria-label을 안 주면 "삭제"로 기본 표시된다.
 */
export function IconX({ size = "md", className = "", "aria-label": ariaLabel = "삭제", ...rest }: IconXProps) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      className={[
        "relative inline-flex shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-gray-100 hover:text-error",
        sizeClass[size],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      <span className={`absolute h-[1.5px] rotate-45 bg-current ${barSizeClass[size]}`} />
      <span className={`absolute h-[1.5px] -rotate-45 bg-current ${barSizeClass[size]}`} />
    </button>
  );
}
