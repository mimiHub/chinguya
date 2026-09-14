"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import NextLink from "next/link";
import { StatusIcon } from "./status-icon";

export type ToastStatus = "info" | "success" | "warning" | "error";

export interface ToastProps {
  open: boolean;
  onClose?: () => void;
  message: string;
  actionLabel?: string;
  actionHref?: string;
  /** ms 뒤 onClose가 자동 호출됨 — 실제 사라짐 여부는 open prop으로 부모가 제어. */
  duration?: number;
  /**
   * 기본 "info" — "복사됨" 같은 특정 동작을 가정하지 않는, 어떤 메시지에나 두루 쓰이는 종(알림)
   * 아이콘을 쓴다. success/warning/error를 주면 Alert과 같은 의미의 색 배지 아이콘으로 바뀐다.
   */
  status?: ToastStatus;
}

// 종(알림) 아이콘 — Toast의 기본(info) 상태 아이콘. 디자인 레퍼런스의 "링크가 복사되었어요"
// 예시는 클립보드 아이콘을 썼지만, Toast는 메시지가 매번 달라서 특정 동작(복사 등)을 가정한
// 아이콘 대신 범용적인 "알림" 모양을 기본값으로 쓴다.
const bellIcon = (
  <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="h-4 w-4">
    <path
      d="M10 2.5c-2 0-3.5 1.6-3.5 3.6v2.1c0 .4-.15.8-.43 1.1L4.8 10.7c-.5.55-.13 1.45.62 1.45h9.16c.75 0 1.12-.9.62-1.45l-1.27-1.4a1.6 1.6 0 0 1-.43-1.1V6.1C13.5 4.1 12 2.5 10 2.5Z"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinejoin="round"
    />
    <path d="M8.3 14.2a1.7 1.7 0 0 0 3.4 0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
  </svg>
);

// info(기본값)만 흰 종 아이콘(고유), 나머지 셋은 Alert과 같은 status-icon.tsx의 공용 색 배지를
// 쓴다 — 그래야 "성공/경고/실패"가 Alert이든 Toast든 항상 같은 아이콘 모양으로 보인다.
const statusClass: Record<ToastStatus, { text: string; icon: ReactNode }> = {
  info: { text: "text-white", icon: bellIcon },
  success: { text: "text-success", icon: <StatusIcon status="success" /> },
  warning: { text: "text-warning", icon: <StatusIcon status="warning" /> },
  error: { text: "text-error", icon: <StatusIcon status="error" /> },
};

/** 화면 하단에 잠깐 떴다가 자동으로 사라지는 알림(예: "장바구니에 추가되었습니다"). */
export function Toast({
  open,
  onClose,
  message,
  actionLabel,
  actionHref,
  duration = 3000,
  status = "info",
}: ToastProps) {
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => onClose?.(), duration);
    return () => clearTimeout(timer);
  }, [open, duration, onClose]);

  if (!open) return null;

  const s = statusClass[status];

  return (
    <div
      role="status"
      className="fixed bottom-[76px] left-1/2 z-[200] flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full bg-toast-bg px-4 py-2 text-sm text-white shadow-[0_4px_16px_rgba(0,0,0,0.2)] md:bottom-6"
    >
      <span aria-hidden="true" className={`shrink-0 ${s.text}`}>
        {s.icon}
      </span>
      <span>{message}</span>
      {actionLabel && actionHref && (
        <NextLink href={actionHref} className="font-bold underline" onClick={onClose}>
          {actionLabel}
        </NextLink>
      )}
    </div>
  );
}
