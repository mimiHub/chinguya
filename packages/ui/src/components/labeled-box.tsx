"use client";

import type { ReactNode } from "react";
import { FormMessage } from "./form-message";

export interface LabeledBoxProps {
  label?: ReactNode;
  required?: boolean;
  error?: ReactNode;
  helper?: ReactNode;
  className?: string;
  children?: ReactNode;
}

/** 폼 필드를 라벨 + 입력 + 도움말/에러로 감싸는 공용 레이아웃 */
export function LabeledBox({ label, required = false, error, helper, className = "", children }: LabeledBoxProps) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <span className={`text-sm font-medium text-muted ${required ? "after:content-['_*'] after:text-error" : ""}`}>
          {label}
        </span>
      )}
      {children}
      {error ? <FormMessage type="error">{error}</FormMessage> : <FormMessage type="helper">{helper}</FormMessage>}
    </div>
  );
}