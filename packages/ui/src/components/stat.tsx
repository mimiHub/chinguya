"use client";

import NextLink from "next/link";

export interface StatItem {
  value: string | number;
  label: string;
  /** 지정하면 카드 전체가 링크가 된다(예: 대시보드 지표 클릭 시 해당 목록으로 이동) */
  href?: string;
}

export interface StatProps {
  items?: StatItem[];
  className?: string;
}

/** 어드민 대시보드 상단 수치 카드 (신규예약/입금확인요청/취소요청 등) */
export function Stat({ items = [], className = "" }: StatProps) {
  return (
    <div className={`grid grid-cols-[repeat(auto-fit,minmax(90px,1fr))] gap-2 ${className}`}>
      {items.map((item, i) => {
        const cardClass = "rounded-md border border-line p-2 text-center";
        const content = (
          <>
            <div className="text-xl font-bold text-ink">{item.value}</div>
            <div className="mt-1 text-sm text-muted">{item.label}</div>
          </>
        );

        return item.href ? (
          <NextLink key={i} href={item.href} className={`${cardClass} block cursor-pointer transition-colors hover:border-primary-500`}>
            {content}
          </NextLink>
        ) : (
          <div key={i} className={cardClass}>
            {content}
          </div>
        );
      })}
    </div>
  );
}
