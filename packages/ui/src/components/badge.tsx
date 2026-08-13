"use client";

import type { CustomerReservationStatus } from "@chinguya/types";
import type { ReactNode } from "react";

const label: Record<CustomerReservationStatus, string> = {
  received: "접수",
  completed: "완료",
  cancel_requested: "취소요청",
  cancelled: "취소",
};

/** 예약 상태 배지 — 상태 흐름 라벨을 3개 앱에서 동일하게 표시. */
export function StatusBadge({ status }: { status: CustomerReservationStatus }) {
  return (
    <span className="inline-flex rounded-full border border-line px-2 py-0.5 text-xs text-muted">
      {label[status]}
    </span>
  );
}

type Variant = "primary" | "secondary" | "success" | "warning" | "error" | "gray";

const variantClass: Record<Variant, string> = {
  primary: "bg-primary-100 text-primary-700",
  secondary: "bg-secondary-100 text-gray-600",
  success: "bg-success-light text-success",
  warning: "bg-warning-light text-warning",
  error: "bg-error-light text-error",
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
      className={`inline-flex h-6 items-center justify-center whitespace-nowrap rounded-full px-2 text-sm font-medium ${variantClass[variant]} ${className}`}
    >
      {children}
    </span>
  );
}