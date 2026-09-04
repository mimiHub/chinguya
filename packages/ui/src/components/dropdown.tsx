"use client";

import { useState, type ReactNode } from "react";

export interface DropdownOption<T extends string = string> {
  value: T;
  label: ReactNode;
}

export interface DropdownProps<T extends string = string> {
  options: DropdownOption<T>[];
  value: T | null;
  onChange: (value: T) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

/**
 * 브라우저 기본 <select>는 모바일/모달 안에서 옵션 팝업 위치가 화면 위로 튀거나 엉뚱한 곳에
 * 뜨는 문제가 있어서, 네이티브 select 대신 트리거 버튼 바로 아래에 직접 그리는 드롭다운
 * (절대 위치)이다. 우리가 그리는 DOM이라 위치가 항상 버튼 바로 밑에 고정된다.
 * (원래 allocations 화면의 여행사 선택에서 쓰던 패턴을 공용 컴포넌트로 뺀 것)
 */
export function Dropdown<T extends string = string>({
  options,
  value,
  onChange,
  placeholder = "선택",
  className = "",
  disabled = false,
}: DropdownProps<T>) {
  const [open, setOpen] = useState(false);
  const selected = options.find((opt) => opt.value === value) ?? null;

  return (
    <div className={`relative min-w-0 ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className="flex h-10 w-full min-w-0 items-center justify-between gap-2 rounded-sm border border-line bg-surface px-4 text-left text-base text-ink focus:border-input-focus focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
      >
        <span className="truncate">{selected?.label ?? placeholder}</span>
        {/* 셀렉트박스처럼 보이는 화살표 — 열림/닫힘에 따라 위/아래로 뒤집힌다(순수 CSS 삼각형) */}
        <span
          className={`h-0 w-0 shrink-0 border-x-[5px] border-t-[6px] border-x-transparent border-t-muted transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && !disabled && (
        <>
          {/* 드롭다운 바깥을 누르면 닫히도록 화면 전체를 덮는 투명 레이어 */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-line bg-surface shadow-lg">
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`block w-full px-4 py-2 text-left text-sm hover:bg-gray-100 ${
                  opt.value === value ? "bg-primary-100 text-primary-700" : ""
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
