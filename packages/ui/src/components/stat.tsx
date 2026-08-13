"use client";

export interface StatItem {
  value: string | number;
  label: string;
}

export interface StatProps {
  items?: StatItem[];
  className?: string;
}

/** 어드민 대시보드 상단 수치 카드 (신규예약/입금확인요청/취소요청 등) */
export function Stat({ items = [], className = "" }: StatProps) {
  return (
    <div className={`grid grid-cols-[repeat(auto-fit,minmax(90px,1fr))] gap-2 ${className}`}>
      {items.map((item, i) => (
        <div key={i} className="rounded-md border border-line p-2 text-center">
          <div className="text-xl font-bold text-ink">{item.value}</div>
          <div className="mt-1 text-sm text-muted">{item.label}</div>
        </div>
      ))}
    </div>
  );
}
