"use client";

import type { ReactNode } from "react";

type Type = "helper" | "error" | "success" | "warning" | "info";

const typeClass: Record<Type, string> = {
  error: "text-error",
  success: "text-success",
  warning: "text-warning",
  info: "text-info",
  helper: "text-muted",
};

export interface FormMessageProps {
  type?: Type;
  className?: string;
  children?: ReactNode;
}

/** 폼 필드 아래 도움말/에러/성공 메시지 표시용 */
export function FormMessage({ type = "helper", className = "", children }: FormMessageProps) {
  if (!children) return null;
  return <span className={`mt-2 block text-sm ${typeClass[type]} ${className}`}>{children}</span>;
}