"use client";

import type { ReactNode } from "react";

export interface KvItem {
  key: string;
  /** 여러 줄 문자열(string[])이거나, <Price /> 같은 컴포넌트 하나(ReactNode)도 넣을 수 있다. */
  value: ReactNode | ReactNode[];
  align?: "right" | "left";
}

export interface KvProps {
  items?: KvItem[];
  /** true면 각 라벨 앞에 로고 나뭇잎 포인트 아이콘이 붙는다. 아이콘 이미지는 각 앱 public/logo-mb.png 필요. */
  leaf?: boolean;
  className?: string;
}

/** key-value 나열 목록(예약 상세, 주문 요약 등) */
export function Kv({ items = [], leaf = false, className = "" }: KvProps) {
  return (
    <div className={className}>
      {items.map((item, i) => {
        const align = item.align ?? "right";
        const isLeft = align === "left";
        return (
          <div
            key={i}
            className={[
              "flex items-center justify-between gap-1 border-b border-dashed border-line py-2 text-sm last:border-b-0",
              isLeft ? "flex-col items-start" : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <span className="inline-flex shrink-0 items-center gap-1.5 text-muted">
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
                "flex min-w-0 flex-col gap-0.5 text-ink",
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
