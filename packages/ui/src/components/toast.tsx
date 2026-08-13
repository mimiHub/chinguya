"use client";

import { useEffect } from "react";
import NextLink from "next/link";

export interface ToastProps {
  open: boolean;
  onClose?: () => void;
  message: string;
  actionLabel?: string;
  actionHref?: string;
  /** ms 뒤 onClose가 자동 호출됨 — 실제 사라짐 여부는 open prop으로 부모가 제어. */
  duration?: number;
}

/** 화면 하단에 잠깐 떴다가 자동으로 사라지는 알림(예: "장바구니에 추가되었습니다"). */
export function Toast({ open, onClose, message, actionLabel, actionHref, duration = 3000 }: ToastProps) {
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => onClose?.(), duration);
    return () => clearTimeout(timer);
  }, [open, duration, onClose]);

  if (!open) return null;

  return (
    <div
      role="status"
      className="fixed bottom-[76px] left-1/2 z-[200] flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full bg-ink px-4 py-2 text-sm text-white shadow-[0_4px_16px_rgba(0,0,0,0.2)] md:bottom-6"
    >
      <span>{message}</span>
      {actionLabel && actionHref && (
        <NextLink href={actionHref} className="font-bold underline" onClick={onClose}>
          {actionLabel}
        </NextLink>
      )}
    </div>
  );
}
