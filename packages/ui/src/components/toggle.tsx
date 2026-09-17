"use client";

import type { HTMLAttributes, ReactNode } from "react";

export interface ToggleProps extends Omit<HTMLAttributes<HTMLElement>, "onChange"> {
  on?: boolean;
  onChange?: (next: boolean) => void;
  disabled?: boolean;
  className?: string;
  /**
   * 스위치 옆에 나란히 보여줄 라벨. 넘기면 라벨 텍스트까지 포함해서 <label>로 감싸므로
   * 스위치(작은 원형 트랙)뿐 아니라 텍스트를 클릭/탭해도 토글이 함께 동작한다 — 원래는
   * 클릭 가능 영역이 스위치 자신(h-[22px] w-10)뿐이라 모바일에서 누르기 빡빡했다.
   * 생략하면 기존처럼 스위치 단독으로 렌더링(하위 호환).
   */
  label?: ReactNode;
}

/** 어드민 화면의 표출 ON/OFF, 사용 가능/불가 등에 사용 */
export function Toggle({ on = false, onChange, disabled = false, className = "", label, ...rest }: ToggleProps) {
  const switchClassNames = [
    "relative inline-block h-[22px] w-10 shrink-0 rounded-full transition-colors",
    "after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-[left]",
    on ? "bg-toggle-on after:left-[21px]" : "bg-gray-300",
  ].join(" ");

  const handleToggle = () => {
    if (!disabled) onChange?.(!on);
  };

  if (label === undefined) {
    return (
      <span
        role="switch"
        aria-checked={on}
        className={[switchClassNames, disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer", className]
          .filter(Boolean)
          .join(" ")}
        onClick={handleToggle}
        {...rest}
      />
    );
  }

  // label을 주는 경우 — <label>은 원래 안에 진짜 <input>이 있어야 클릭을 위임해 주는데
  // 우리 스위치는 input이 아니라 role="switch" span이라 그 네이티브 동작이 안 걸린다.
  // 그래서 label 자체에 onClick을 달아 텍스트 클릭도 스위치 클릭과 동일하게 처리하고,
  // 안쪽 스위치에는 별도 onClick을 달지 않는다(두 핸들러가 다 걸리면 버블링으로 두 번
  // 호출되어 토글이 두 번 일어나 결과적으로 안 바뀌는 것처럼 보이는 버그가 생긴다).
  return (
    <label
      className={[
        "inline-flex items-center gap-2",
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={(e) => {
        e.preventDefault();
        handleToggle();
      }}
      {...rest}
    >
      <span className="text-sm text-ink">{label}</span>
      <span role="switch" aria-checked={on} className={switchClassNames} />
    </label>
  );
}
