"use client";

import type { ReactNode } from "react";

export interface EmptyStateProps {
  className?: string;
  children: ReactNode;
}

/**
 * 표·목록이 비어 있을 때 공통으로 쓰는 "데이터 없음" 상태. 원래는 화면마다 그냥
 * <Text variant="sub">...없습니다.</Text> 한 줄만 놓아서 화면마다 배치·여백이 제각각이고
 * 표 안에서 존재감도 약했다 — 옅은 회색 배경 박스로 감싸서 "지금 비어 있는 자리"라는 걸
 * 시각적으로 분명히 구분되게 통일했다. className은 바깥 여백(margin) 조정 용도로만 쓰고,
 * 정렬·색 등은 이 컴포넌트가 통일해서 관리한다.
 */
export function EmptyState({ className = "", children }: EmptyStateProps) {
  return <div className={`rounded-md bg-gray-100 px-4 py-3 text-sm text-muted ${className}`}>{children}</div>;
}
