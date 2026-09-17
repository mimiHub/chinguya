"use client";

import type { InputHTMLAttributes } from "react";

export interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "onChange" | "size"> {
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
}

/**
 * 여러 옵션 중 하나만 고르는 라디오 버튼. Checkbox와 같은 방식 — 진짜 <input
 * type="radio">는 화면에서 숨기고 클릭·키보드 접근성(포커스, 스페이스바 토글, 스크린리더,
 * 같은 name 그룹 안에서 화살표 이동)만 맡긴 뒤, 실제로 보이는 원은 순수 CSS로 그린다.
 * 체크박스는 사각형+체크마크(border-b/border-r 45도 회전)였지만 라디오는 원(rounded-full)
 * 안에 작은 원 하나(선택 시)를 겹치는 형태라 border trick 없이 바로 그릴 수 있다.
 *
 * 그룹으로 묶어 쓸 때는 각 Radio에 동일한 name을 주고, 옵션 개수만큼 checked/onChange를
 * 부모에서 controlled로 관리한다(단일 Checkbox와 동일한 패턴 — 별도 RadioGroup 컴포넌트는
 * 아직 없다. 필요해지면 옵션 배열을 받는 래퍼로 추가한다).
 */
export function Radio({ checked, onChange, className = "", ...rest }: RadioProps) {
  return (
    <label className={`relative inline-flex h-5 w-5 shrink-0 cursor-pointer ${className}`}>
      <input
        type="radio"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        {...rest}
      />
      <span
        aria-hidden="true"
        className={`flex h-5 w-5 items-center justify-center rounded-full border transition-colors ${
          checked ? "border-primary-500 bg-surface" : "border-line bg-surface"
        }`}
      >
        {checked && <span aria-hidden="true" className="h-[10px] w-[10px] rounded-full bg-primary-500" />}
      </span>
    </label>
  );
}
