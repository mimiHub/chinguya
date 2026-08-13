"use client";

import type { HTMLAttributes, ReactNode } from "react";

type Direction = "row" | "column";
type Gap = "xs" | "sm" | "md" | "lg" | "xl";
type Align = "start" | "center" | "end";
type Justify = "start" | "center" | "end" | "between";

const directionClass: Record<Direction, string> = {
  row: "flex-row",
  column: "flex-col",
};

const gapClass: Record<Gap, string> = {
  xs: "gap-1",
  sm: "gap-2",
  md: "gap-4",
  lg: "gap-6",
  xl: "gap-10",
};

const alignClass: Record<Align, string> = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
};

const justifyClass: Record<Justify, string> = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
  between: "justify-between",
};

export interface StackProps extends HTMLAttributes<HTMLDivElement> {
  direction?: Direction;
  gap?: Gap;
  align?: Align;
  justify?: Justify;
  wrap?: boolean;
  className?: string;
  children?: ReactNode;
}

/** flex 레이아웃 공용 래퍼. 여러 화면에서 반복되던 flex 컨테이너를 대체. */
export function Stack({
  direction = "row",
  gap = "md",
  align,
  justify,
  wrap = false,
  className = "",
  children,
  ...rest
}: StackProps) {
  const classNames = [
    "flex",
    directionClass[direction],
    gapClass[gap],
    align ? alignClass[align] : "",
    justify ? justifyClass[justify] : "",
    wrap ? "flex-wrap" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classNames} {...rest}>
      {children}
    </div>
  );
}
