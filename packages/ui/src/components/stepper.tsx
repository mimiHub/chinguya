"use client";

export interface StepperProps {
  value?: number;
  min?: number;
  max?: number;
  onChange?: (next: number) => void;
}

/** 수량 선택(예약 수량, 할당 수량 등). max 넘으면 + 버튼 비활성화. */
export function Stepper({ value = 0, min = 0, max, onChange }: StepperProps) {
  const canDecrease = value > min;
  const canIncrease = max === undefined || value < max;

  const btnClass = (disabled: boolean) =>
    `inline-flex h-[26px] w-[26px] items-center justify-center rounded-sm border border-line bg-gray-100 text-base select-none ${
      disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer hover:bg-gray-200"
    }`;

  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={btnClass(!canDecrease)} onClick={() => canDecrease && onChange?.(value - 1)}>
        −
      </span>
      <span className="min-w-[20px] text-center text-sm">{value}</span>
      <span className={btnClass(!canIncrease)} onClick={() => canIncrease && onChange?.(value + 1)}>
        ＋
      </span>
      {max !== undefined && <span className="text-[12px] text-muted">/ {max}</span>}
    </span>
  );
}
