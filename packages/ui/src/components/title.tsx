"use client";

import type { ElementType, ReactNode } from "react";

type Size = "xl" | "lg" | "md" | "sm";
type Weight = "light" | "regular" | "medium" | "bold";
type Tone = "default" | "secondary" | "accent";

const sizeClass: Record<Size, string> = {
  xl: "text-xl md:text-2xl",
  lg: "text-lg md:text-xl",
  md: "text-base md:text-lg",
  sm: "text-sm",
};

const weightClass: Record<Weight, string> = {
  light: "font-light",
  regular: "font-normal",
  medium: "font-medium",
  bold: "font-bold",
};

const toneClass: Record<Tone, string> = {
  default: "",
  secondary: "text-secondary-800",
  accent: "text-primary-500",
};

export interface TitleProps {
  as?: ElementType;
  size?: Size;
  center?: boolean;
  subtitle?: ReactNode;
  action?: ReactNode;
  weight?: Weight;
  /** true면 제목 앞에 로고 나뭇잎 포인트 아이콘이 붙는다. 아이콘 이미지는 각 앱 public/logo-mb.png 필요. */
  leaf?: boolean;
  tone?: Tone;
  className?: string;
  children?: ReactNode;
}

/**
 * 페이지/섹션 제목. 기본은 h2. action을 주면 제목 오른쪽에 버튼 등을 나란히 배치.
 * 위아래 여백은 이 컴포넌트에 넣지 않는다 — Stack의 gap이 이미 형제 요소 간격을 담당하는데,
 * Title 자체에 기본 마진까지 있으면 gap과 마진이 겹쳐서 간격이 의도치 않게 벌어진다.
 * 제목 앞뒤 간격이 필요하면 호출하는 쪽에서 Stack(gap="sm" 등)으로 감싸서 조절한다.
 */
export function Title({
  as: Tag = "h2",
  size = "lg",
  center = false,
  subtitle,
  action,
  weight,
  leaf = false,
  tone = "default",
  className = "",
  children,
}: TitleProps) {
  const classNames = [
    "font-bold text-ink",
    sizeClass[size],
    center ? "text-center" : "",
    weight ? weightClass[weight] : "",
    toneClass[tone],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const titleContent = leaf ? (
    <span className="inline-flex items-center gap-1.5">
      <span
        aria-hidden="true"
        className="inline-block h-[1.6em] w-[1em] shrink-0 bg-[url('/logo-mb.png')] bg-contain bg-center bg-no-repeat"
      />
      {children}
    </span>
  ) : (
    children
  );

  const titleEl = <Tag className={classNames}>{titleContent}</Tag>;
  const subtitleEl = subtitle && (
    <p className={`mt-1 text-sm font-normal text-muted ${center ? "text-center" : ""}`}>{subtitle}</p>
  );

  if (action) {
    return (
      <div>
        <div className="flex items-center justify-between gap-2">
          {titleEl}
          {action}
        </div>
        {subtitleEl}
      </div>
    );
  }

  return (
    <div>
      {titleEl}
      {subtitleEl}
    </div>
  );
}