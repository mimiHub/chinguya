"use client";

import type { ReactNode } from "react";
import { FormMessage } from "./form-message";

export interface LabeledBoxProps {
  label?: ReactNode;
  required?: boolean;
  error?: ReactNode;
  helper?: ReactNode;
  className?: string;
  /**
   * 카드 안에 필드 여러 개가 붙어 있어 라벨이 입력값·본문과 잘 구분되지 않는 경우를 위한
   * 강조 스타일(라벨 앞 강조색 점 + 더 크고 굵은 글씨). 기본은 꺼져 있어 기존 폼(로그인·설정
   * 등)의 라벨 모양은 그대로다 — 필요한 화면에서만 opt-in으로 켠다.
   */
  emphasis?: boolean;
  children?: ReactNode;
}

/** 폼 필드를 라벨 + 입력 + 도움말/에러로 감싸는 공용 레이아웃 */
export function LabeledBox({
  label,
  required = false,
  error,
  helper,
  className = "",
  emphasis = false,
  children,
}: LabeledBoxProps) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <span
          className={`flex items-center gap-1.5 ${emphasis ? "text-base font-bold text-ink" : "text-sm font-medium text-muted"} ${required ? "after:content-['_*'] after:text-error" : ""}`}
        >
          {emphasis && <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary-500" />}
          {label}
        </span>
      )}
      {children}
      {error ? <FormMessage type="error">{error}</FormMessage> : <FormMessage type="helper">{helper}</FormMessage>}
    </div>
  );
}
