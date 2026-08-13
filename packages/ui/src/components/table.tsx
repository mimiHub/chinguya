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
}

/**
 * 여행사 예약목록/인보이스 같은 표 형태 데이터.
 * 모바일에서는 가로 스크롤됨(좁은 화면에서 표는 스크롤이 카드형보다 데이터 밀도 유지에 유리).
 */
export function Table({ columns = [], rows = [], className = "" }: TableProps) {
  return (
    <div className={`w-full overflow-x-auto ${className}`}>
      <table className="w-full border-collapse text-sm whitespace-nowrap">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} className="border-b border-line p-2 text-left text-sm font-medium text-muted">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="hover:[&>td]:bg-bg-light">
              {columns.map((col) => (
                <td key={col.key} className="border-b border-line p-2">
                  {row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
