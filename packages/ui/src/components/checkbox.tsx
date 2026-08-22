"use client";

import type { InputHTMLAttributes } from "react";

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "onChange" | "size"> {
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
}

/**
 * 전체 선택/개별 선택용 체크박스.
 *
 * 처음엔 브라우저 기본 체크박스에 accent-color만 입혀서 썼는데, 그러면 체크마크 두께 같은
 * 세부 스타일은 브라우저/OS가 그려주는 대로 나와서 우리가 손댈 수 없었다. 그래서 진짜
 * <input type="checkbox">는 화면에 안 보이게 숨겨서 클릭·키보드 접근성(포커스, 스페이스바
 * 토글, 스크린리더)만 맡기고, 실제로 보이는 네모 박스+체크 표시는 순수 CSS로 그린다 —
 * SVG 없이, 작은 사각형의 아래·오른쪽 테두리(border-b, border-r)만 남기고 45도 돌리면
 * 체크마크 모양이 된다. 두께는 border 두께 하나로만 정해져서 항상 일정하게 나온다.
 */
export function Checkbox({ checked, onChange, className = "", ...rest }: CheckboxProps) {
  return (
    <label className={`relative inline-flex h-5 w-5 shrink-0 cursor-pointer ${className}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        {...rest}
      />
      <span
        aria-hidden="true"
        className={`flex h-5 w-5 items-center justify-center rounded-[4px] border transition-colors ${
          checked ? "border-primary-500 bg-primary-500" : "border-line bg-white"
        }`}
      >
        {checked && (
          <span
            aria-hidden="true"
            className="mb-0.5 h-[12px] w-[6px] rotate-45 border-r-[2px] border-b-[2px] border-white"
          />
        )}
      </span>
    </label>
  );
}
