"use client";

import type { ReactNode } from "react";
import { StatusIcon } from "./status-icon";

export type AlertStatus = "success" | "warning" | "error" | "info";
export type AlertTone = "light" | "dark";

/**
 * success/warning/error/info 네 가지 상태를 위한 공용 안내 박스.
 * 배경색·글자색·아이콘을 한 세트로 묶어서 관리한다 — 예전엔 NoticeBox(배경 박스)와
 * Text(글자색)를 매번 같은 tone으로 따로따로 맞춰 써야 했는데(예: tone="warning" 두 번),
 * 그러다 하나만 바꾸고 다른 하나를 깜빡하면 배경은 노란데 글자는 검정인 식으로 어긋나기
 * 쉬웠다. Alert 하나로 합쳐서 "상태" 하나만 정하면 배경·글자·아이콘이 항상 같이 맞게 나온다.
 *
 * 아이콘은 status-icon.tsx의 공용 배지(색 채워진 도형 + 흰 글리프)를 Toast와 함께 쓴다.
 *
 * 배경·글자 색은 packages/tailwind-config/theme.css 의 시맨틱 토큰(--color-success 등)을 그대로
 * 쓴다. 값을 바꾸고 싶으면 이 파일이 아니라 theme.css 쪽을 고친다.
 *
 * tone(기본 "light")은 배경 톤을 고른다 — "light"는 지금까지의 옅은 상태색 배경(페이지 중간
 * 안내 배너용, 기존 화면 전부 이 모양 그대로 유지됨). "dark"는 Toast(packages/ui/src/components
 * /toast.tsx)와 같은 어두운 배경(--color-toast-bg) + 흰 글자 + 상태색 아이콘 조합이다 — 대시보드
 * 알림처럼 Toast 디자인과 톤을 맞춰야 하는 "상시 노출 배너"에 쓴다. dark tone은 light tone보다
 * 아이콘을 크게 세로 중앙정렬하고, 타이틀을 더 크게, 본문은 더 얇게 보여준다(레퍼런스 디자인
 * 반영 — light tone의 기존 17곳 사용처는 이 변경의 영향을 받지 않는다).
 */
/** light tone에서만 쓴다 — 배경·글자색이 한 세트로 묶여 있다(엷은 배경 + 진한 상태색 글자). */
const lightClass: Record<AlertStatus, { box: string; text: string }> = {
  success: { box: "bg-success-light", text: "text-success" },
  warning: { box: "bg-warning-light", text: "text-warning" },
  error: { box: "bg-error-light", text: "text-error" },
  info: { box: "bg-info-light", text: "text-info" },
};

/** dark tone에서 아이콘만 상태색을 낸다(글자는 흰색 고정). */
const darkIconColor: Record<AlertStatus, string> = {
  success: "text-success",
  warning: "text-warning",
  error: "text-error",
  info: "text-info",
};

export interface AlertProps {
  /** "success" | "warning" | "error" | "info" — 네 상태 중 하나, 배경·글자·아이콘이 한 번에 맞춰진다 */
  status: AlertStatus;
  title?: ReactNode;
  /** 기본 true. 상태별 기본 아이콘(색 채워진 배지)을 숨기고 싶으면 false */
  icon?: boolean;
  className?: string;
  children?: ReactNode;
  /** 기본 "light". "dark"는 Toast와 같은 어두운 배경+흰 글자+상태색 아이콘 조합(상시 노출 배너용). */
  tone?: AlertTone;
}

export function Alert({ status, title, icon = true, className = "", children, tone = "light" }: AlertProps) {
  const isDark = tone === "dark";
  const box = isDark
    ? "items-center rounded-2xl bg-toast-bg text-white"
    : `items-start rounded-md ${lightClass[status].box} ${lightClass[status].text}`;
  const iconClass = isDark ? darkIconColor[status] : "";

  return (
    <div className={`flex gap-3 px-4 py-3 text-sm ${box} ${className}`}>
      {icon && (
        <span aria-hidden="true" className={`shrink-0 ${isDark ? "" : "mt-0.5"} ${iconClass}`}>
          <StatusIcon status={status} className={isDark ? "h-6 w-6" : "h-4 w-4"} />
        </span>
      )}
      <div className="flex flex-1 flex-col gap-1">
        {title && <p className={isDark ? "text-base font-bold" : "font-bold"}>{title}</p>}
        {isDark ? <div className="font-light">{children}</div> : children}
      </div>
    </div>
  );
}
