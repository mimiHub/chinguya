"use client";

import type { ReactNode } from "react";

export type AlertStatus = "success" | "warning" | "error" | "info";

/**
 * success/warning/error/info 네 가지 상태를 위한 공용 안내 박스.
 * 배경색·글자색·아이콘을 한 세트로 묶어서 관리한다 — 예전엔 NoticeBox(배경 박스)와
 * Text(글자색)를 매번 같은 tone으로 따로따로 맞춰 써야 했는데(예: tone="warning" 두 번),
 * 그러다 하나만 바꾸고 다른 하나를 깜빡하면 배경은 노란데 글자는 검정인 식으로 어긋나기
 * 쉬웠다. Alert 하나로 합쳐서 "상태" 하나만 정하면 배경·글자·아이콘이 항상 같이 맞게 나온다.
 *
 * 색상은 packages/tailwind-config/theme.css 의 시맨틱 토큰(--color-success 등)을 그대로 쓴다.
 * 값을 바꾸고 싶으면 이 파일이 아니라 theme.css 쪽을 고친다.
 */
// info 상태는 문자 "ℹ"(글꼴마다 모양이 들쭉날쭉하고 두께도 얇아 잘 안 보임) 대신, 동그라미
// 안에 i가 든 흔한 인포 아이콘을 SVG로 직접 그려서 쓴다 — 원(stroke)·점(dot)·막대(stem)
// 세 도형만 조합해서 아이콘 폰트나 외부 라이브러리 없이 만들 수 있다.
const infoIcon = (
  <svg viewBox="0 0 20 20" fill="none" aria-hidden="true" className="h-4 w-4">
    <circle cx="10" cy="10" r="8.25" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="10" cy="6.5" r="1.1" fill="currentColor" />
    <rect x="9.1" y="9" width="1.8" height="5.5" rx="0.9" fill="currentColor" />
  </svg>
);

const statusClass: Record<AlertStatus, { box: string; text: string; icon: ReactNode }> = {
  success: { box: "bg-success-light", text: "text-success", icon: "✓" },
  warning: { box: "bg-warning-light", text: "text-warning", icon: "⚠" },
  error: { box: "bg-error-light", text: "text-error", icon: "✕" },
  info: { box: "bg-info-light", text: "text-info", icon: infoIcon },
};

export interface AlertProps {
  /** "success" | "warning" | "error" | "info" — 네 상태 중 하나, 배경·글자·아이콘이 한 번에 맞춰진다 */
  status: AlertStatus;
  title?: ReactNode;
  /** 기본 true. 상태별 기본 아이콘(✓/⚠/✕/동그라미 i)을 숨기고 싶으면 false */
  icon?: boolean;
  className?: string;
  children?: ReactNode;
}

export function Alert({ status, title, icon = true, className = "", children }: AlertProps) {
  const s = statusClass[status];

  return (
    <div className={`flex items-start gap-2 rounded-md px-4 py-2 text-sm ${s.box} ${s.text} ${className}`}>
      {icon && (
        <span aria-hidden="true" className="mt-0.5 shrink-0">
          {s.icon}
        </span>
      )}
      <div className="flex flex-1 flex-col gap-1">
        {title && <p className="font-bold">{title}</p>}
        {children}
      </div>
    </div>
  );
}
