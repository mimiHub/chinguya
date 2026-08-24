"use client";

import type { ElementType, HTMLAttributes } from "react";

type Variant = "body" | "sub" | "caption" | "lg" | "xl";
type Weight = "light" | "regular" | "medium" | "bold" | "extrabold";
type Size = "xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl";
/** "ink"는 variant 기본색과 무관하게 확실한 검정(--color-ink)을 쓰고 싶을 때 사용.
 *  "white"/"white-muted"는 Footer처럼 어두운 배경 위에 올릴 때 사용(각각 흰색, 흐린 흰색). */
type Tone = "secondary" | "accent" | "warning" | "success" | "error" | "info" | "ink" | "white" | "white-muted";

/**
 * variant마다 기본 size/weight/색이 있지만, 이걸 문자열 하나로 합쳐서(예: "text-base font-normal
 * text-ink") weight/size/tone prop이 덮어쓰는 클래스(예: "text-3xl font-extrabold text-warning")와
 * 같은 className에 같이 넣으면, 서로 같은 속성(font-size/font-weight/색)을 건드리는 유틸리티가
 * 함께 있는 셈이라 Tailwind가 최종 CSS를 만들 때 어느 쪽이 이길지 소스 코드 순서로는 보장이 안
 * 된다(실제로 값이 안 바뀌어 보이는 버그로 나타남 — size/weight에서 한 번, 색에서 또 한 번
 * 겪었다). 그래서 variant의 크기/굵기/색은 "기본값"으로만 갖고 있다가, size/weight/tone prop이
 * 오면 그 자리를 통째로 대체하는 방식으로 통일했다 — 렌더링되는 className에 font-size/
 * font-weight/색 클래스가 항상 하나씩만 남는다.
 */
const variantConfig: Record<Variant, { size: Size; weight: Weight; color: string; leading: string; extraClass?: string }> = {
  body: { size: "base", weight: "regular", color: "text-ink", leading: "leading-normal" },
  sub: { size: "sm", weight: "regular", color: "text-muted", leading: "leading-snug", extraClass: "whitespace-pre-line" },
  caption: { size: "sm", weight: "regular", color: "text-muted", leading: "leading-normal" },
  lg: { size: "lg", weight: "medium", color: "text-ink", leading: "leading-snug" },
  xl: { size: "xl", weight: "bold", color: "text-ink", leading: "leading-tight" },
};

const weightClass: Record<Weight, string> = {
  light: "font-light",
  regular: "font-normal",
  medium: "font-medium",
  bold: "font-bold",
  extrabold: "font-extrabold",
};

const sizeClass: Record<Size, string> = {
  xs: "text-xs",
  sm: "text-sm",
  base: "text-base",
  lg: "text-lg",
  xl: "text-xl",
  "2xl": "text-2xl",
  "3xl": "text-3xl",
};

const toneClass: Record<Tone, string> = {
  accent: "text-accent-700",
  secondary: "text-secondary-700",
  warning: "text-warning",
  success: "text-success",
  error: "text-error",
  info: "text-info",
  ink: "text-ink",
  white: "text-white",
  "white-muted": "text-white/60",
};

export interface TextProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType;
  variant?: Variant;
  weight?: Weight;
  size?: Size;
  tone?: Tone;
  /** true면 텍스트 앞에 로고 나뭇잎 포인트 아이콘이 붙는다(Title의 leaf prop과 동일한 방식).
   *  Title(제목)만큼 크지 않은, 섹션 라벨 같은 본문 텍스트에 나뭇잎을 붙이고 싶을 때 사용 —
   *  이미지가 필요하므로 각 앱 public/logo-mb.png가 있어야 한다. */
  leaf?: boolean;
}

/**
 * 본문/캡션 등 일반 텍스트용 컴포넌트. Title은 제목(h1~h2)용, Text는 그 외 본문 텍스트용.
 * weight/size/tone은 variant의 기본값을 덮어쓰고 싶을 때만 지정한다.
 */
export function Text({
  as: Component = "p",
  variant = "body",
  weight,
  size,
  tone,
  leaf = false,
  className = "",
  children,
  ...rest
}: TextProps) {
  const config = variantConfig[variant];
  const classNames = [
    "m-0",
    sizeClass[size ?? config.size],
    weightClass[weight ?? config.weight],
    tone ? toneClass[tone] : config.color,
    config.leading,
    config.extraClass ?? "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Component className={classNames} {...rest}>
      {leaf ? (
        <span className="inline-flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className="inline-block h-[1.4em] w-[0.9em] shrink-0 bg-[url('/logo-mb.png')] bg-contain bg-center bg-no-repeat"
          />
          {children}
        </span>
      ) : (
        children
      )}
    </Component>
  );
}