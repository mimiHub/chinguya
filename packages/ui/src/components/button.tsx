"use client";

import NextLink from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "outline" | "text" | "danger" | "ghost" | "subtle";
type Size = "sm" | "md" | "lg";
type Align = "start" | "center" | "end";
type Padding = "none";

const variantClass: Record<Variant, string> = {
  primary: "bg-primary-500 text-white hover:bg-primary-600",
  secondary: "bg-secondary-800 text-ink hover:bg-secondary-600",
  outline: "bg-surface text-primary-500 border border-primary-500 hover:bg-bg-light",
  text: "bg-transparent text-muted hover:text-ink",
  danger: "bg-error text-white hover:bg-[#d63c3c]",
  // scaffold 초기 데모에서 쓰던 별칭 — cafe-next 원본에는 없던 variant, "text"와 동일하게 취급
  ghost: "bg-transparent text-primary-500 hover:bg-gray-100",
  // 특정 의미색(빨강=위험, 초록=CTA 등) 없이, 배경과 살짝 톤 차이만 나는 중립 버튼 —
  // 강제취소처럼 "위험해 보이는 강조색"도 "CTA처럼 튀는 포인트색"도 원치 않을 때 사용.
  // 배경을 bg-surface(Input과 동일한 배경)로 두면 옆에 놓인 Input과 색이 같아서 버튼인지
  // 구분이 안 되는 문제가 있었다 — bg-bg-light(한 톤 올린 배경)로 바꿔서 Input과는 다르게,
  // 눈에 띄게 했다.
  subtle: "border border-button-subtle-border bg-bg-light text-ink hover:bg-gray-200",
};

const sizeClass: Record<Size, string> = {
  sm: "h-8 px-4 text-sm",
  md: "h-10 px-6 text-base",
  lg: "h-12 px-10 text-lg",
};

const alignClass: Record<Align, string> = {
  start: "self-start",
  center: "self-center",
  end: "self-end",
};

interface CommonProps {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  /**
   * Stack처럼 align-items:stretch인 flex 부모 안에서 버튼이 늘어나지 않고
   * 한쪽에 붙게 하고 싶을 때 사용(align-self).
   */
  align?: Align;
  /** "none"을 주면 여백·고정 높이를 없애서 텍스트 링크처럼 붙일 수 있다. */
  padding?: Padding;
  className?: string;
  children?: ReactNode;
}

export type ButtonProps = CommonProps &
  ButtonHTMLAttributes<HTMLButtonElement> &
  Partial<AnchorHTMLAttributes<HTMLAnchorElement>> & {
    /** href를 넘기면 next/link로, 안 넘기면 button으로 렌더링된다. */
    href?: string;
  };

function buildClassName({
  variant = "primary",
  size = "md",
  fullWidth,
  align,
  padding,
  className = "",
}: CommonProps) {
  return [
    "inline-flex items-center justify-center gap-1 rounded-md font-medium whitespace-nowrap transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
    variantClass[variant],
    padding === "none" ? "h-auto p-0" : sizeClass[size],
    fullWidth ? "w-full" : "",
    align ? alignClass[align] : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");
}

/**
 * 공용 버튼. href를 넘기면 next/link로, 안 넘기면 button으로 렌더링된다
 * (링크로 감싸지 않아도 됨).
 */
export function Button({
  variant,
  size,
  fullWidth,
  align,
  padding,
  className,
  disabled = false,
  type = "button",
  href,
  children,
  ...rest
}: ButtonProps) {
  const classNames = buildClassName({ variant, size, fullWidth, align, padding, className });

  if (href) {
    return (
      <NextLink href={href} className={classNames} {...(rest as AnchorHTMLAttributes<HTMLAnchorElement>)}>
        {children}
      </NextLink>
    );
  }

  return (
    <button
      type={type}
      className={classNames}
      disabled={disabled}
      {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}
    >
      {children}
    </button>
  );
}