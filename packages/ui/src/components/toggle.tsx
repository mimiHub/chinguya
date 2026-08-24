"use client";

import type { HTMLAttributes } from "react";

export interface ToggleProps extends Omit<HTMLAttributes<HTMLSpanElement>, "onChange"> {
  on?: boolean;
  onChange?: (next: boolean) => void;
  disabled?: boolean;
  className?: string;
}

/** 어드민 화면의 표출 ON/OFF, 사용 가능/불가 등에 사용 */
export function Toggle({ on = false, onChange, disabled = false, className = "", ...rest }: ToggleProps) {
  const classNames = [
    "relative inline-block h-[22px] w-10 shrink-0 rounded-full transition-colors",
    "after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-[left]",
    on ? "bg-toggle-on after:left-[21px]" : "bg-gray-300",
    disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span
      role="switch"
      aria-checked={on}
      className={classNames}
      onClick={() => !disabled && onChange?.(!on)}
      {...rest}
    />
  );
}