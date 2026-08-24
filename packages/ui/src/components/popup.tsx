"use client";

import type { MouseEvent, ReactNode } from "react";

export interface PopupProps {
  open?: boolean;
  onClose?: () => void;
  title?: ReactNode;
  className?: string;
  children?: ReactNode;
}

/** 모바일에서는 하단 시트, 768px↑에서는 중앙 모달로 전환되는 공용 팝업. */
export function Popup({ open, onClose, title, className = "", children }: PopupProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-end justify-center bg-black/50 md:items-center"
      onClick={onClose}
    >
      <div
        className={`max-h-[85vh] w-full overflow-y-auto rounded-t-lg bg-surface p-6 md:max-h-[90vh] md:w-[400px] md:max-w-[90vw] md:rounded-lg ${className}`}
        onClick={(e: MouseEvent) => e.stopPropagation()}
      >
        {title && (
          <div className="mb-6 flex items-center justify-between">
            <h3>{title}</h3>
            <span className="cursor-pointer text-lg text-muted hover:text-ink" onClick={onClose}>
              &times;
            </span>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
