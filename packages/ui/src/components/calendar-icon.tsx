"use client";

export interface CalendarIconProps {
  className?: string;
}

/**
 * 캘린더 모양 아이콘(SVG). 날짜 선택 버튼 등에서 "이 버튼을 누르면 캘린더가 열린다"는 걸
 * 어디서든 같은 모양으로 보여주기 위한 공용 아이콘 — 이미지 파일 없이 SVG로 그린다.
 * currentColor를 써서 부모 텍스트 색을 그대로 따라간다.
 */
export function CalendarIcon({ className = "" }: CalendarIconProps) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`h-4 w-4 shrink-0 ${className}`}
      aria-hidden="true"
    >
      <rect x="3" y="4" width="14" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M3 8H17" stroke="currentColor" strokeWidth="1.4" />
      <path d="M6.5 2.5V5.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M13.5 2.5V5.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
