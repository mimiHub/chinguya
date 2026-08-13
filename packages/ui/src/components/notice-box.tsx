"use client";

import type { ReactNode } from "react";

type Tone = "gray" | "white" | "warning";

const toneClass: Record<Tone, string> = {
  gray: "bg-gray-100",
  white: "bg-white",
  warning: "bg-warning-light",
};

export interface NoticeBoxProps {
  title?: ReactNode;
  /** "gray"(기본, 관리자 답변 등) | "white"(FAQ 답변 등) | "warning"(주의 안내) */
  tone?: Tone;
  className?: string;
  children?: ReactNode;
}

/** 안내/답변류 박스 공통 컴포넌트 — 배경색 박스 안에 (선택적) 굵은 타이틀 + 본문을 세로 배치 */
export function NoticeBox({ title, tone = "gray", className = "", children }: NoticeBoxProps) {
  return (
    <div className={`flex flex-col gap-1 rounded-md px-4 py-2 ${toneClass[tone]} ${className}`}>
      {title && <p className="font-bold">{title}</p>}
      {children}
    </div>
  );
}