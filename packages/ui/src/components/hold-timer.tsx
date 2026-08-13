"use client";

export interface HoldTimerProps {
  /** 남은 시간(초). 실제 카운트다운 로직은 백엔드 연동 시 붙이면 됨(지금은 표시만). */
  seconds?: number;
  label?: string;
}

/** 장바구니/예약 확인 화면에서 "임시 홀드 중 · 남은시간 09:57" 표시용. */
export function HoldTimer({ seconds = 0, label = "임시 홀드 중" }: HoldTimerProps) {
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <div className="my-2 rounded-sm border border-dashed border-line px-4 py-2 text-center font-mono text-sm text-muted">
      ⏱ {label} · 남은 시간 <b className="text-warning">{mm}:{ss}</b> — 중복 예약 방지
    </div>
  );
}