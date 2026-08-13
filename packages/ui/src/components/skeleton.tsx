"use client";

import type { CSSProperties } from "react";

type Variant = "text" | "title" | "image" | "list";

const shimmerClass =
  "block animate-skeleton-shimmer rounded-sm bg-[linear-gradient(90deg,var(--color-gray-100)_25%,var(--color-gray-200)_37%,var(--color-gray-100)_63%)] bg-[length:400%_100%] motion-reduce:animate-none";

export interface SkeletonProps {
  /** "text"(기본, 본문 여러 줄) | "title"(제목 한 줄) | "image"(썸네일/사진 박스) | "list"(아이콘+텍스트 목록 행) */
  variant?: Variant;
  /** variant="text"의 줄 수(기본 1) / variant="list"의 행 수(기본 3) */
  count?: number;
  width?: CSSProperties["width"];
  height?: CSSProperties["height"];
  className?: string;
}

/** 로딩 상태를 나타내는 폴리모픽 스켈레톤. */
export function Skeleton({ variant = "text", count, width, height, className = "" }: SkeletonProps) {
  const style: CSSProperties = {
    ...(width !== undefined ? { width } : {}),
    ...(height !== undefined ? { height } : {}),
  };

  if (variant === "title") {
    return <span className={`${shimmerClass} h-6 w-2/5 ${className}`} style={style} />;
  }

  if (variant === "image") {
    return <span className={`${shimmerClass} aspect-square w-full rounded-md ${className}`} style={style} />;
  }

  if (variant === "list") {
    const rows = count ?? 3;
    return (
      <span className={`flex flex-col gap-4 ${className}`}>
        {Array.from({ length: rows }, (_, i) => (
          <span key={i} className="flex items-center gap-2">
            <span className={`${shimmerClass} h-10 w-10 shrink-0 rounded-full`} />
            <span className="flex min-w-0 flex-1 flex-col gap-1.5">
              <span className={`${shimmerClass} h-3 w-4/5`} />
              <span className={`${shimmerClass} h-3 w-2/5`} />
            </span>
          </span>
        ))}
      </span>
    );
  }

  // variant === "text" (기본)
  const lines = count ?? 1;
  return (
    <span className={`flex flex-col gap-1 ${className}`}>
      {Array.from({ length: lines }, (_, i) => (
        <span
          key={i}
          className={`${shimmerClass} h-3.5 ${i === lines - 1 ? "w-[70%]" : "w-full"}`}
          style={i === 0 ? style : undefined}
        />
      ))}
    </span>
  );
}
