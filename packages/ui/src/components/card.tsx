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
  sm: "p-4",
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
  /** 기본 true. false면 카드 그림자를 없앤다(다른 카드 안에 중첩된 카드처럼 그림자가
   *  부담스러운 경우 사용). */
  shadow?: boolean;
  /** true면 카드 상단에 기울어진 워시테이프 장식이 붙어 폴라로이드 사진처럼 보인다.
   *  홈 Rental 섹션처럼 감성적인 이미지 카드에 사용(sticker와 함께 쓰면 테이프 옆에
   *  동그란 스티커도 같이 붙는다). */
  polaroid?: boolean;
  /** 카드 우측 상단에 붙일 동그란 스티커 이미지 경로(예: "/sticker02.png"). polaroid=true일 때만 표시됨 */
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
  shadow = true,
  polaroid = false,
  sticker,
  width = "full",
  children,
  ...rest
}: CardProps) {
  const paddingKey = padding ?? (noPadding ? "none" : "md");
  // 배경색(bg-*)은 항상 딱 하나만 남아야 한다 — "bg-white"를 기본값에 고정으로 넣어두고
  // tint가 있을 때 "bg-card-*"를 추가로 붙이면, 같은 속성(background-color)을 건드리는
  // 유틸리티 두 개가 한 className에 동시에 있어서 Tailwind가 최종 CSS를 만들 때 어느 게
  // 이길지 소스 코드 순서로는 보장이 안 된다(실제로 tint를 줘도 흰 배경이 이겨버리는 버그로
  // 나타났다). 그래서 tint 유무에 따라 배경 클래스 자리를 통째로 하나만 고른다. 그림자
  // (box-shadow)도 같은 이유로 shadow prop에 따라 "있음/없음" 자리를 하나만 고른다 —
  // 호출하는 쪽에서 className="shadow-none"처럼 덮어쓰려 하면 같은 문제가 재발한다.
  const classNames = [
    // padding은 paddingClass[paddingKey] 한 곳에서만 정해야 한다 — 여기 기본 문자열에
    // p-4 md:p-6를 같이 넣어두면 padding="sm" 같은 값이 있어도 같은 속성(padding)을 건드리는
    // 유틸리티 두 개가 한 className에 동시에 있게 돼서(예: p-2와 p-4가 함께 붙는 문제),
    // Tailwind가 최종 CSS를 만들 때 어느 게 이길지 보장이 안 된다.
    "relative rounded-lg border border-card-border",
    shadow ? "shadow-[0_2px_10px_rgba(0,0,0,0.05)]" : "",
    tint ? tintClass[tint] : "bg-surface",
    onClick
      ? `cursor-pointer transition-[box-shadow,transform] hover:-translate-y-0.5 ${shadow ? "hover:shadow-[0_6px_20px_rgba(0,0,0,0.08)]" : ""}`
      : "",
    paddingClass[paddingKey],
    widthClass[width],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classNames} onClick={onClick} {...rest}>
      {polaroid && (
        <>
          <img
            src="/sticker01.png"
            alt=""
            className="pointer-events-none absolute -top-3.5 left-1/2 z-10 w-[150px] -translate-x-1/2 -rotate-6 md:w-[180px]"
          />
          {sticker && (
            <img
              src={sticker}
              alt=""
              className="pointer-events-none absolute -top-4.5 right-6 z-10 w-16 rotate-6"
            />
          )}
        </>
      )}
      {children}
    </div>
  );
}
