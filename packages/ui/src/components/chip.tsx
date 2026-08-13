"use client";

import type { HTMLAttributes, ReactNode } from "react";

export interface ChipProps extends HTMLAttributes<HTMLSpanElement> {
  on?: boolean;
  className?: string;
  children?: ReactNode;
}

/** 카테고리 필터, 대여 옵션(2시간/1일/2일) 선택 등에 사용 */
export function Chip({ on = false, className = "", children, ...rest }: ChipProps) {
  const classNames = [
    "inline-flex items-center whitespace-nowrap rounded-full border px-4 py-1 text-sm transition-colors cursor-pointer",
    on ? "bg-primary-500 text-white border-primary-500" : "bg-white text-muted border-line",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={classNames} {...rest}>
      {children}
    </span>
  );
}

export interface ChipListProps {
  className?: string;
  children?: ReactNode;
}

/** 여러 Chip을 가로 스크롤 목록으로 감쌀 때 사용 */
Chip.List = function ChipList({ className = "", children }: ChipListProps) {
  return <div className={`flex gap-2 overflow-x-auto ${className}`}>{children}</div>;
};