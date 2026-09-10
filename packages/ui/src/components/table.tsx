"use client";

import type { ReactNode } from "react";

export interface TableColumn {
  key: string;
  label: string;
  /**
   * 이 컬럼의 너비. colgroup의 <col style={{ width }} />로 적용된다 — 예: "80px", "20%".
   * 생략하면 브라우저가 내용 길이에 맞춰 자동으로 배분한다. 표 안의 컬럼 중 일부만 폭을
   * 정해도 되고(나머지는 auto), 전부 안 정하면 colgroup 자체를 만들지 않는다.
   */
  width?: string;
  /**
   * 이 컬럼 셀(th/td)의 가로 정렬. 기본은 "left".
   * 주의: colgroup/col에는 CSS 스펙상 width·border·background·visibility만 적용되고
   * text-align은 적용되지 않으므로(브라우저가 무시함), 정렬은 매 셀에 클래스로 직접 준다 —
   * 폭은 colgroup, 정렬은 이 값. 숫자·금액 컬럼은 "right", 뱃지·수량처럼 짧고 가운데
   * 맞추고 싶은 컬럼은 "center"를 주면 된다.
   */
  align?: "left" | "center" | "right";
}

const ALIGN_CLASS: Record<"left" | "center" | "right", string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

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
  const hasWidth = columns.some((col) => col.width);

  return (
    <div className={`w-full overflow-x-auto ${className}`}>
      <table className="w-full border-collapse text-sm whitespace-nowrap">
        {hasWidth ? (
          <colgroup>
            {columns.map((col) => (
              <col key={col.key} style={col.width ? { width: col.width } : undefined} />
            ))}
          </colgroup>
        ) : null}
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={`sticky top-0 z-10 border-b border-line bg-surface p-2 text-sm font-medium text-muted ${ALIGN_CLASS[col.align ?? "left"]}`}
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
                  <td
                    key={col.key}
                    className={`border-b border-line p-2 ${ALIGN_CLASS[col.align ?? "left"]}`}
                  >
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
