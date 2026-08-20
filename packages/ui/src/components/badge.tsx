"use client";

import type { CustomerReservationStatus } from "@chinguya/types";
import type { ReactNode } from "react";

const label: Record<CustomerReservationStatus, string> = {
  received: "접수",
  completed: "완료",
  cancel_requested: "취소요청",
  cancelled: "취소",
};

// 기획서(와이어프레임)의 상태 표기 색상 — 접수는 주의를 끄는 톤(warning), 완료는 success,
// 취소요청은 진행 중임을 알리는 info(파랑), 취소는 error(빨강)로 맞췄다. theme.css의
// 시맨틱 토큰(--color-warning 등)을 그대로 쓰므로 색을 바꾸려면 이 파일이 아니라 theme.css를 고친다.
const statusClass: Record<CustomerReservationStatus, string> = {
  received: "bg-warning-light text-warning",
  completed: "bg-success-light text-success",
  cancel_requested: "bg-info-light text-info",
  cancelled: "bg-error-light text-error",
};

/** 예약 상태 배지 — 상태 흐름 라벨·색을 3개 앱에서 동일하게 표시. */
export function StatusBadge({ status }: { status: CustomerReservationStatus }) {
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusClass[status]}`}>
      {label[status]}
    </span>
  );
}

type Variant = "primary" | "secondary" | "success" | "warning" | "error" | "info" | "gray";

const variantClass: Record<Variant, string> = {
  primary: "bg-primary-100 text-primary-700",
  secondary: "bg-secondary-300 text-secondary-700",
  success: "bg-success-light text-success",
  warning: "bg-warning-light text-warning",
  error: "bg-error-light text-error",
  info: "bg-info-light text-info",
  gray: "bg-gray-100 text-gray-700",
};

export interface BadgeProps {
  variant?: Variant;
  className?: string;
  children?: ReactNode;
}

/** 범용 상태/카테고리 뱃지. 예약 상태 전용은 StatusBadge를 사용. */
export function Badge({ variant = "gray", className = "", children }: BadgeProps) {
  return (
    <span
      className={`inline-flex h-6 items-center justify-center whitespace-nowrap rounded-full px-2 text-xs font-medium ${variantClass[variant]} ${className}`}
    >
      {children}
    </span>
  );
}