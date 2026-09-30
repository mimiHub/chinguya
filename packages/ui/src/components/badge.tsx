"use client";

import {
  NOTICE_CATEGORY_LABEL,
  NOTICE_TAG_LABEL,
  type CustomerReservationStatus,
  type NoticeCategoryKey,
  type NoticeTagKey,
} from "@chinguya/types";
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
  gray: "bg-badge-gray-bg text-badge-gray-text",
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
/**
 * 공지사항·이벤트 뱃지(2026-09-30) — 관리자 목록·고객 공지사항(S4-C6)·고객 홈 공지 섹션이 같이 쓴다.
 *
 * 공지사항은 **세부 카테고리**(점검·안내·업데이트·긴급·장애)를, 이벤트는 '이벤트'를 보여준다. 색은 성격별 3묶음:
 * - 점검·안내 → 차분한 블루/그레이(info·gray) — 일상 알림
 * - 이벤트·업데이트 → 브랜드 포인트 색(secondary·primary)
 * - 긴급·장애 → 경고용 레드/오렌지(error·warning)
 *
 * 세부 카테고리가 없는 공지사항(백엔드 반영 전 응답·예전 글)은 **'안내'** 로 보인다 — 계약상 기존 공지사항 글은
 * 마이그레이션에서 INFO(안내)로 채우므로(admin yaml 2026-09-30) 서버 반영 전후 화면이 같다.
 */
const NOTICE_TAG_VARIANT: Record<NoticeTagKey, Variant> = {
  MAINTENANCE: "info",
  INFO: "gray",
  UPDATE: "primary",
  URGENT: "error",
  INCIDENT: "warning",
};

export interface NoticeBadgeProps {
  category: NoticeCategoryKey;
  /** 공지사항 세부 카테고리. 이벤트면 무시한다. */
  tag?: NoticeTagKey | null;
  className?: string;
}

export function NoticeBadge({ category, tag, className = "" }: NoticeBadgeProps) {
  if (category === "EVENT") {
    return (
      <Badge variant="secondary" className={className}>
        {NOTICE_CATEGORY_LABEL.EVENT}
      </Badge>
    );
  }
  const resolved: NoticeTagKey = tag ?? "INFO";
  return (
    <Badge variant={NOTICE_TAG_VARIANT[resolved]} className={className}>
      {NOTICE_TAG_LABEL[resolved]}
    </Badge>
  );
}
