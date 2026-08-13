"use client";

import type { HTMLAttributes, MouseEventHandler, ReactNode } from "react";

type Tint = "primary" | "secondary" | "tertiary";
type Padding = "none" | "sm" | "md" | "lg" | "xl";
type Width = "full" | "md" | "sm";

const tintClass: Record<Tint, string> = {
  primary: "bg-card-primary",
  secondary: "bg-card-secondary",
  tertiary: "bg-card-tertiary",
};

const paddingClass: Record<Padding, string> = {
  none: "p-0",
  sm: "p-2 md:p-4",
  md: "p-4 md:p-6",
  lg: "p-6 md:p-10",
  xl: "p-10 md:p-16",
};

const widthClass: Record<Width, string> = {
  full: "",
  md: "w-full max-w-[800px]",
  sm: "w-full max-w-[400px]",
};

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** 지정하면 카드 배경색이 적용됨(미지정 시 기본 흰 배경) */
  tint?: Tint;
  /** 카드 안쪽 여백 크기(미지정 시 기존 기본 여백) */
  padding?: Padding;
  /** true면 padding="none"과 동일 */
  noPadding?: boolean;
  width?: Width;
  /** 카드 우측 상단에 붙일 배지 이미지 경로(예: "/sticker02.png")를 넘기면 장식 스티커가 함께 표시됨 */
  sticker?: string;
  onClick?: MouseEventHandler<HTMLDivElement>;
  className?: string;
  children?: ReactNode;
}

export function Card({
  className = "",
  noPadding = false,
  padding,
  tint,
  onClick,
  sticker,
  width = "full",
  children,
  ...rest
}: CardProps) {
  const paddingKey = padding ?? (noPadding ? "none" : "md");
  const classNames = [
    "relative rounded-lg bg-white border border-white p-4 shadow-[0_2px_10px_rgba(0,0,0,0.05)] md:p-6",
    tint ? tintClass[tint] : "",
    onClick ? "cursor-pointer transition-[box-shadow,transform] hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(0,0,0,0.08)]" : "",
    paddingClass[paddingKey],
    widthClass[width],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classNames} onClick={onClick} {...rest}>
      {sticker && (
        <>
          <img
            src="/sticker01.png"
            alt=""
            className="pointer-events-none absolute -top-3.5 left-1/2 z-10 w-[150px] -translate-x-1/2 -rotate-6 md:w-[180px]"
          />
          <img
            src={sticker}
            alt=""
            className="pointer-events-none absolute -top-4.5 right-6 z-10 w-16 rotate-6"
          />
        </>
      )}
      {children}
    </div>
  );
}
