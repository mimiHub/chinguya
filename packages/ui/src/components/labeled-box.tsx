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
  /**
   * 라벨 앞에 강조색 점 대신 나뭇잎 로고를 붙인다(박스·배경 없이 굵은 폰트 + 나뭇잎만).
   * 카드 하나에 필드가 여러 개 붙어 있을 때 필드 타이틀이 서로 구분이 잘 안 된다는
   * 피드백으로 추가됨(상품 등록/수정 화면의 "연결 자산"·"대여 옵션"·"상품 이미지" 등).
   * emphasis처럼 굵고 큰 글씨를 쓰되, 점 대신 나뭇잎을 쓴다는 점만 다르다.
   */
  badge?: boolean;
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
  badge = false,
  children,
}: LabeledBoxProps) {
  const labelContent = (
    <span
      className={`flex items-center gap-1.5 ${emphasis || badge ? "text-base font-bold text-ink" : "text-sm font-medium text-muted"} ${required ? "after:content-['_*'] after:text-error" : ""}`}
    >
      {emphasis && !badge && <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary-500" />}
      {badge && (
        <span
          aria-hidden="true"
          className="inline-block h-[1.4em] w-[0.9em] shrink-0 bg-[url('/logo-mb.png')] bg-contain bg-center bg-no-repeat"
        />
      )}
      {label}
    </span>
  );

  return (
    <div className={`flex flex-col ${emphasis || badge ? "gap-2" : "gap-1"} ${className}`}>
      {label && labelContent}
      {children}
      {error ? <FormMessage type="error">{error}</FormMessage> : <FormMessage type="helper">{helper}</FormMessage>}
    </div>
  );
}
