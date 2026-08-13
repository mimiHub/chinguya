"use client";

import type { ElementType, HTMLAttributes } from "react";

type Variant = "body" | "sub" | "caption" | "lg" | "xl";
type Weight = "light" | "regular" | "medium" | "bold";
type Size = "sm" | "base" | "lg" | "xl" | "2xl";
type Tone = "secondary" | "accent" | "warning";

const variantClass: Record<Variant, string> = {
  body: "text-base font-normal text-ink leading-normal",
  sub: "text-sm text-muted leading-snug whitespace-pre-line",
  caption: "text-sm font-normal text-muted leading-normal",
  lg: "text-lg font-medium text-ink leading-snug",
  xl: "text-xl font-bold text-ink leading-tight",
};

const weightClass: Record<Weight, string> = {
  light: "font-light",
  regular: "font-normal",
  medium: "font-medium",
  bold: "font-bold",
};

const sizeClass: Record<Size, string> = {
  sm: "text-sm",
  base: "text-base",
  lg: "text-lg",
  xl: "text-xl",
  "2xl": "text-2xl",
};

const toneClass: Record<Tone, string> = {
  accent: "text-accent-700",
  secondary: "text-secondary-700",
  warning: "text-warning",
};

export interface TextProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  variant?: Variant;
  weight?: Weight;
  size?: Size;
  tone?: Tone;
  mono?: boolean;
}

/**
 * 본문/캡션 등 일반 텍스트용 컴포넌트. Title은 제목(h1~h2)용, Text는 그 외 본문 텍스트용.
 * weight/size/tone은 variant의 기본값을 덮어쓰고 싶을 때만 지정한다.
 * mono=true면 금액 등 숫자 강조에 쓰는 고정폭 글꼴(font-mono)이 적용된다.
 */
export function Text({
  as: Component = "p",
  variant = "body",
  weight,
  size,
  tone,
  mono = false,
  className = "",
  children,
  ...rest
}: TextProps) {
  const classNames = [
    "m-0",
    variantClass[variant],
    weight ? weightClass[weight] : "",
    size ? sizeClass[size] : "",
    tone ? toneClass[tone] : "",
    mono ? "font-mono" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Component className={classNames} {...rest}>
      {children}
    </Component>
  );
}