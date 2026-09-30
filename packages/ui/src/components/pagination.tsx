"use client";

/**
 * 목록 페이지 이동(2026-09-30) — `‹ 1 / 10 ›`. 페이지 번호 버튼을 늘어놓지 않고 현재/전체와 화살표만 둔다
 * (모바일 폭에서도 한 줄로 끝나게). 첫/마지막 페이지에서는 해당 화살표를 흐리게 막는다.
 * 글이 적어 1페이지뿐이어도 **항상 보인다**(`‹ 1 / 1 ›`, 화살표 둘 다 흐림 — 2026-09-30 결정). 0건이면 1 / 1.
 *
 * `page` 는 **0부터**다(Core API 의 page 와 같다). 화면 표시는 1부터.
 */
export interface PaginationProps {
  /** 현재 페이지(0부터) */
  page: number;
  /** 전체 페이지 수 */
  totalPages: number;
  onChange: (page: number) => void;
  className?: string;
}

export function Pagination({ page, totalPages: rawTotalPages, onChange, className = "" }: PaginationProps) {
  const totalPages = Math.max(1, rawTotalPages);
  const arrowClass =
    "flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-lg leading-none text-muted transition-colors hover:bg-bg-light hover:text-ink disabled:cursor-default disabled:opacity-30 disabled:hover:bg-transparent";
  return (
    <nav aria-label="페이지 이동" className={`flex items-center justify-center gap-3 ${className}`}>
      <button
        type="button"
        aria-label="이전 페이지"
        disabled={page <= 0}
        onClick={() => onChange(page - 1)}
        className={arrowClass}
      >
        ‹
      </button>
      <span className="min-w-12 text-center text-sm tabular-nums text-ink" aria-current="page">
        {page + 1} <span className="text-muted">/ {totalPages}</span>
      </span>
      <button
        type="button"
        aria-label="다음 페이지"
        disabled={page >= totalPages - 1}
        onClick={() => onChange(page + 1)}
        className={arrowClass}
      >
        ›
      </button>
    </nav>
  );
}
