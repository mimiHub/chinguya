"use client";

import type { ReactNode } from "react";
import { Card } from "./card";

export interface EmptyStateProps {
  className?: string;
  /**
   * 생김새. 기본 "box"는 옅은 회색 배경 박스(표 안·카드 안·요약 패널처럼 이미 다른 면 위에 놓이는 자리용).
   * "card"는 실제 데이터 카드(Card)와 같은 흰 배경·테두리·그림자 — 데이터가 있을 땐 카드가 쭉 나열되는 목록이
   * 비었을 때, 빈 자리도 같은 카드 모양으로 보이게 하고 싶을 때 쓴다(회색 박스는 페이지 배경과 톤이 비슷해
   * 배경에 묻혀 보이는 문제가 있다).
   */
  variant?: "box" | "card";
  children: ReactNode;
}

/**
 * 표·목록이 비어 있을 때 공통으로 쓰는 "데이터 없음" 상태. 원래는 화면마다 그냥
 * <Text variant="sub">...없습니다.</Text> 한 줄만 놓아서 화면마다 배치·여백이 제각각이고
 * 표 안에서 존재감도 약했다 — 옅은 회색 배경 박스로 감싸서 "지금 비어 있는 자리"라는 걸
 * 시각적으로 분명히 구분되게 통일했다. className은 바깥 여백(margin) 조정 용도로만 쓰고,
 * 정렬·색 등은 이 컴포넌트가 통일해서 관리한다.
 */
export function EmptyState({ className = "", variant = "box", children }: EmptyStateProps) {
  if (variant === "card") {
    // Card의 padding은 "none"으로 두고 안쪽 여백을 직접 준다 — Card 기본 padding(p-4 md:p-6)에 다른 padding
    // 클래스를 덧붙이면 같은 속성끼리 충돌한다(card.tsx 주석 참고). 안쪽 여백은 예약 카드 등 데이터 카드와 같은 px-4 py-3.
    return (
      <Card padding="none" className={className}>
        <div className="px-4 py-3 text-sm text-muted">{children}</div>
      </Card>
    );
  }
  return (
    <div className={`rounded-md bg-gray-100 px-4 py-3 text-sm text-muted ${className}`}>
      {children}
    </div>
  );
}
