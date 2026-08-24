"use client";

import { useRef, type HTMLAttributes, type ReactNode } from "react";

export interface ChipProps extends HTMLAttributes<HTMLSpanElement> {
  on?: boolean;
  className?: string;
  children?: ReactNode;
}

/** 카테고리 필터, 대여 옵션(2시간/1일/2일) 선택 등에 사용 */
export function Chip({ on = false, className = "", children, ...rest }: ChipProps) {
  const classNames = [
    "inline-flex items-center whitespace-nowrap rounded-full border px-4 py-1 text-sm transition-colors cursor-pointer",
    on ? "bg-primary-500 text-white border-primary-500" : "bg-surface text-muted border-line",
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
  /** true면 브라우저 기본 가로 스크롤바 대신, 양쪽 화살표 버튼으로 넘기게 한다
   *  (탭처럼 칩이 많아서 한 줄에 다 안 들어갈 때 사용). */
  scrollArrows?: boolean;
}

/** 여러 Chip을 가로 스크롤 목록으로 감쌀 때 사용 */
Chip.List = function ChipList({ className = "", children, scrollArrows = false }: ChipListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (!scrollArrows) {
    return <div className={`flex gap-2 overflow-x-auto ${className}`}>{children}</div>;
  }

  const scrollByAmount = (dir: -1 | 1) => {
    scrollRef.current?.scrollBy({ left: dir * 160, behavior: "smooth" });
  };

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <button
        type="button"
        aria-label="왼쪽으로 이동"
        onClick={() => scrollByAmount(-1)}
        className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full border border-line bg-surface text-muted hover:text-ink"
      >
        ‹
      </button>
      {/* 스크롤바를 숨기고(3대 브라우저 각각 다른 방식 필요) 화살표로만 넘기게 한다 */}
      <div
        ref={scrollRef}
        className="scrollbar-hide flex flex-1 gap-2 overflow-x-auto scroll-smooth"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {children}
      </div>
      <button
        type="button"
        aria-label="오른쪽으로 이동"
        onClick={() => scrollByAmount(1)}
        className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full border border-line bg-surface text-muted hover:text-ink"
      >
        ›
      </button>
    </div>
  );
};
