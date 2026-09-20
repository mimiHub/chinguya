"use client";

import type { ReactNode } from "react";

type Size = "xs" | "sm" | "md";
type Weight = "normal" | "semibold";
type Tone = "secondary" | "accent" | "warning" | "success" | "error" | "info" | "ink";

const sizeClass: Record<Size, string> = {
  xs: "text-xs",
  sm: "text-sm",
  md: "text-base",
};

const weightClass: Record<Weight, string> = {
  normal: "",
  semibold: "font-semibold",
};

const toneClass: Record<Tone, string> = {
  secondary: "text-secondary-700",
  accent: "text-accent-700",
  warning: "text-warning",
  success: "text-success",
  error: "text-error",
  info: "text-info",
  ink: "text-ink",
};

export interface KvItem {
  /** 보통 문자열이지만, 라벨 안에 <Badge /> 등을 끼워 넣어야 할 때는 ReactNode도 가능하다. */
  key: ReactNode;
  /** 여러 줄 문자열(string[])이거나, <Text /> 같은 컴포넌트 하나(ReactNode)도 넣을 수 있다. */
  value: ReactNode | ReactNode[];
  align?: "right" | "left";
  /** 지정하면 value 색을 이 톤으로 바꾼다. 안 주면 기본 text-ink. */
  tone?: Tone;
}

export interface KvProps {
  items?: KvItem[];
  /** true면 각 라벨 앞에 로고 나뭇잎 포인트 아이콘이 붙는다. 아이콘 이미지는 각 앱 public/logo-mb.png 필요. */
  leaf?: boolean;
  /** true면 각 라벨 앞에 작은 포인트 점(강조색 원)이 붙는다. LabeledBox의 emphasis 라벨과 같은 스타일. */
  dot?: boolean;
  /** 행 전체 글자 크기. 기본 sm(14px), xs(12px)로 더 작게, md(16px)로 더 크게도 가능 */
  size?: Size;
  /** 행 전체(라벨·값) 글자 굵기. 기본 normal(따로 지정 안 함), semibold(600)로 강조할 수 있다. */
  weight?: Weight;
  /**
   * 기본 true — 이 Kv 안에서 배열상 마지막 행의 구분선을 지운다(뒤에 다른 내용 없이 이 Kv가
   * 곧 그 영역의 끝일 때를 가정한 기본값). 재고 세팅(inventory)처럼 항목 하나짜리 Kv 여러 개를
   * 연달아 늘어놓아 전체가 한 목록처럼 보여야 하는 화면에서는, 각 Kv가 자기 안에서는 매번
   * "마지막 행"이라 이 기본값 때문에 모든 구분선이 사라져버린다 — 그런 화면에서는
   * false로 꺼서 매 행마다 구분선이 그대로 남게 한다.
   */
  hideLastBorder?: boolean;
  className?: string;
}

/** key-value 나열 목록(예약 상세, 주문 요약 등) */
export function Kv({
  items = [],
  leaf = false,
  dot = false,
  size = "sm",
  weight = "normal",
  hideLastBorder = true,
  className = "",
}: KvProps) {
  return (
    <div className={className}>
      {items.map((item, i) => {
        const align = item.align ?? "right";
        const isLeft = align === "left";
        return (
          <div
            key={i}
            className={[
              "flex items-center justify-between gap-1 border-b border-dashed border-line py-2",
              hideLastBorder ? "last:border-b-0" : "",
              sizeClass[size],
              weightClass[weight],
              isLeft ? "flex-col items-start" : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <span className="inline-flex shrink-0 items-center gap-1.5 text-muted">
              {dot && (
                <span
                  aria-hidden="true"
                  className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary-500"
                />
              )}
              {leaf && (
                <span
                  aria-hidden="true"
                  className="inline-block h-[1.6em] w-[1em] shrink-0 bg-[url('/logo-mb.png')] bg-contain bg-center bg-no-repeat"
                />
              )}
              {item.key}
            </span>
            <span
              className={[
                "flex min-w-0 flex-col gap-0.5",
                item.tone ? toneClass[item.tone] : "text-ink",
                isLeft ? "w-full items-start text-left" : "items-end text-right",
              ].join(" ")}
            >
              {Array.isArray(item.value)
                ? item.value.map((line, j) => (
                    <span key={j} className="break-keep whitespace-normal">
                      {line}
                    </span>
                  ))
                : item.value}
            </span>
          </div>
        );
      })}
    </div>
  );
}
