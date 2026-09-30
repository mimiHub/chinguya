"use client";

import type { ReactNode } from "react";

export type EmergencyBarTone = "urgent" | "incident" | "maintenance";

// 톤별 색 — 흰 글씨는 배경과 명암비 4.5:1 이상인 색에만 올린다(WCAG AA).
//   urgent(긴급)      : error(#a8564a) + 흰 글씨 ≈ 7:1
//   maintenance(점검) : info(#5f6b7a) + 흰 글씨 ≈ 5.4:1
//   incident(장애)    : warning(#a67c4d)은 흰 글씨가 3.7:1로 부족해서 글씨를 ink(짙은 먹색)로 둔다 ≈ 4.6:1
const toneClass: Record<EmergencyBarTone, { bar: string; chip: string; close: string }> = {
  urgent: {
    bar: "bg-error text-white",
    chip: "bg-white/20 text-white",
    close: "text-white/80 hover:bg-white/15 hover:text-white",
  },
  incident: {
    bar: "bg-warning text-ink",
    chip: "bg-ink/15 text-ink",
    close: "text-ink/70 hover:bg-ink/10 hover:text-ink",
  },
  maintenance: {
    bar: "bg-info text-white",
    chip: "bg-white/20 text-white",
    close: "text-white/80 hover:bg-white/15 hover:text-white",
  },
};

export interface EmergencyBarProps {
  /** 색 — "urgent"(긴급, 레드) | "incident"(장애, 오렌지) | "maintenance"(점검, 블루그레이) */
  tone?: EmergencyBarTone;
  /** 앞쪽 작은 뱃지 글자(예: "긴급"). 없으면 뱃지를 그리지 않는다. */
  label?: ReactNode;
  /** 한 줄 문구. 길면 말줄임(…)으로 자른다 — 바 높이는 항상 한 줄로 고정. */
  message: ReactNode;
  /**
   * 오른쪽 이동 링크 자리(예: "자세히 ›"). ui 패키지는 라우터를 모르므로
   * 앱에서 NextLink 등을 만들어 넣는다.
   */
  action?: ReactNode;
  /** 닫기(X) 버튼을 눌렀을 때. 없으면 닫기 버튼을 그리지 않는다. */
  onClose?: () => void;
  className?: string;
}

/**
 * 상단 한 줄 긴급 공지 바(Top Emergency Notification Bar).
 * 서비스 장애·시스템 점검처럼 사용자가 바로 알아야 하는 소식을 화면 맨 위에 한 줄로 띄운다.
 *
 * - 높이 36px(h-9) 한 줄 고정: 문구가 길어도 줄바꿈하지 않고 truncate — 헤더 높이가 흔들리지 않게.
 * - 접근성: 스크린리더가 바로 읽도록 role="alert"(긴급·장애) / role="status"(점검 — 덜 급해서 끼어들지 않음).
 * - 위치(고정·sticky 등)는 이 컴포넌트가 정하지 않는다 — 놓는 쪽(헤더 등)이 정한다.
 */
export function EmergencyBar({
  tone = "urgent",
  label,
  message,
  action,
  onClose,
  className = "",
}: EmergencyBarProps) {
  const t = toneClass[tone];
  return (
    <div
      role={tone === "maintenance" ? "status" : "alert"}
      className={`relative w-full text-sm ${t.bar} ${className}`}
    >
      <div className="mx-auto flex h-9 max-w-5xl items-center gap-2 px-4">
        {label && (
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${t.chip}`}>{label}</span>
        )}
        {/* min-w-0 + flex-1 + truncate: 남는 폭만큼만 쓰고 넘치면 … 처리(뱃지·링크·닫기는 밀려나지 않는다) */}
        <p className="min-w-0 flex-1 truncate font-medium">{message}</p>
        {action && <span className="shrink-0 text-xs font-medium underline-offset-2 hover:underline">{action}</span>}
        {onClose && (
          // IconX 는 기본 색(text-muted·hover:text-error)이 박혀 있어 색 바 위에서 덮어쓰기가 불안정하다 —
          // 같은 "막대 두 개를 ±45도" 방식으로 여기서 직접 그린다(색은 톤별 close 클래스).
          <button
            type="button"
            aria-label="긴급 공지 닫기"
            onClick={onClose}
            className={`relative inline-flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors ${t.close}`}
          >
            <span className="absolute h-[1.5px] w-3 rotate-45 bg-current" />
            <span className="absolute h-[1.5px] w-3 -rotate-45 bg-current" />
          </button>
        )}
      </div>
    </div>
  );
}
