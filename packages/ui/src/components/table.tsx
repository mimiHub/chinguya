"use client";

import type { ReactNode } from "react";

export interface TableColumn {
  key: string;
  label: string;
}

export interface TableProps {
  columns?: TableColumn[];
  rows?: Record<string, ReactNode>[];
  className?: string;
  /**
   * rows가 빈 배열일 때 tbody 안(컬럼 전체 폭을 가로지르는 한 줄)에 보여줄 내용.
   * 헤더는 그대로 유지한 채 본문 자리에만 "데이터 없음" 상태가 들어간다 — 표 밖에 따로
   * EmptyState/Alert를 붙이면 헤더만 남은 빈 표와 별개 메시지가 따로 떠서 어색해 보이므로,
   * 표 자체가 자기 빈 상태를 책임지도록 이 prop으로 통일한다. 보통 <EmptyState> 또는
   * <Alert status="info">를 그대로 넘긴다.
   */
  emptyMessage?: ReactNode;
}

/**
 * 여행사 예약목록/인보이스 같은 표 형태 데이터.
 * 모바일에서는 가로 스크롤됨(좁은 화면에서 표는 스크롤이 카드형보다 데이터 밀도 유지에 유리).
 * 헤더 행은 sticky — 이 표를 감싼 조상 요소가 세로로 스크롤되는 경우(예: 표 전용으로 높이를
 * 제한하고 overflow-y-auto를 준 Card), 행을 내려도 컬럼 제목이 화면에 계속 보인다. 조상이
 * 스크롤되지 않는 일반적인 경우엔 sticky가 아무 효과가 없어서 다른 화면엔 영향 없다.
 */
export function Table({ columns = [], rows = [], className = "", emptyMessage }: TableProps) {
  return (
    <div className={`w-full overflow-x-auto ${className}`}>
      <table className="w-full border-collapse text-sm whitespace-nowrap">
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className="sticky top-0 z-10 border-b border-line bg-surface p-2 text-left text-sm font-medium text-muted"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && emptyMessage ? (
            <tr>
              <td colSpan={columns.length || 1} className="p-2">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr key={i} className="hover:[&>td]:bg-bg-light">
                {columns.map((col) => (
                  <td key={col.key} className="border-b border-line p-2">
                    {row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
