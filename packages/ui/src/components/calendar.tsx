"use client";

export type DayStatus = "ok" | "zero" | "disabled" | "holiday" | "off";

export interface CalendarDay {
  date: number | "";
  status?: DayStatus;
  qty?: number;
}

export interface CalendarRange {
  start: number | null;
  end: number | null;
}

export interface CalendarProps {
  year: number;
  month: number;
  days?: CalendarDay[];
  showLegend?: boolean;
  mode?: "single" | "range";
  selected?: number;
  onSelect?: (date: number) => void;
  range?: CalendarRange;
  onRangeChange?: (range: CalendarRange) => void;
  onPrevMonth?: () => void;
  onNextMonth?: () => void;
  canPrevMonth?: boolean;
  canNextMonth?: boolean;
}

// 기획서 기준 캘린더 상태는 예약가능 / 선택 / 마감·불가 세 가지뿐 — 과거 날짜(disabled),
// 마감(zero), 해당 월 예약 불가(holiday)는 사유는 달라도 화면에는 전부 "마감·불가"로 동일하게 표시함.
const dayClass: Record<DayStatus, string> = {
  ok: "bg-success-light text-success",
  zero: "text-gray-400 [background:repeating-linear-gradient(45deg,var(--color-gray-200),var(--color-gray-200)_3px,var(--color-gray-300)_3px,var(--color-gray-300)_6px)] cursor-not-allowed",
  disabled:
    "text-gray-400 [background:repeating-linear-gradient(45deg,var(--color-gray-200),var(--color-gray-200)_3px,var(--color-gray-300)_3px,var(--color-gray-300)_6px)] cursor-not-allowed",
  holiday:
    "text-gray-400 [background:repeating-linear-gradient(45deg,var(--color-gray-200),var(--color-gray-200)_3px,var(--color-gray-300)_3px,var(--color-gray-300)_6px)] cursor-not-allowed",
  off: "bg-transparent cursor-default",
};

const NOT_SELECTABLE: DayStatus[] = ["off", "disabled", "zero", "holiday"];
const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

/** 예약 캘린더. mode="single"은 단일 날짜 선택, mode="range"는 기간(연속일) 선택. */
export function Calendar({
  year,
  month,
  days = [],
  showLegend = true,
  mode = "single",
  selected,
  onSelect,
  range,
  onRangeChange,
  onPrevMonth,
  onNextMonth,
  canPrevMonth = true,
  canNextMonth = true,
}: CalendarProps) {
  const isSelectable = (status: DayStatus) => !NOT_SELECTABLE.includes(status);

  // start~end 사이(양 끝 제외)에 마감/선택불가 날짜가 하나라도 끼어 있으면 그 범위는 막음 —
  // 2시간 대여도 하루 전체를 점유하는 규칙상, 중간에 마감된 날을 건너뛰어 예약할 수 없음
  const hasBlockedDayBetween = (start: number, end: number) =>
    days.some(
      (d) => typeof d.date === "number" && d.date > start && d.date < end && !isSelectable(d.status ?? "ok"),
    );

  const handleClick = (date: number | "") => {
    if (date === "") return;
    if (mode !== "range") {
      onSelect?.(date);
      return;
    }
    if (!range?.start || range.end) {
      onRangeChange?.({ start: date, end: null });
    } else if (date < range.start) {
      onRangeChange?.({ start: date, end: null });
    } else if (hasBlockedDayBetween(range.start, date)) {
      onRangeChange?.({ start: date, end: null });
    } else {
      onRangeChange?.({ start: range.start, end: date });
    }
  };

  const getRangeClass = (date: number | "") => {
    if (mode !== "range" || !range?.start || date === "") return "";
    if (!range.end) return date === range.start ? "bg-primary-500 text-white rounded-l-sm" : "";
    if (date === range.start) return "bg-primary-500 text-white rounded-l-sm";
    if (date === range.end) return "bg-primary-500 text-white rounded-r-sm";
    if (date > range.start && date < range.end) return "bg-primary-100 rounded-none";
    return "";
  };

  return (
    <div className="rounded-md border border-line bg-gray-100 p-2">
      <div className="mb-2 flex items-center justify-between text-sm font-bold">
        <span
          className={canPrevMonth ? "cursor-pointer px-2" : "cursor-not-allowed px-2 text-gray-300"}
          onClick={() => canPrevMonth && onPrevMonth?.()}
        >
          ‹
        </span>
        <span>
          {year}년 {month}월
        </span>
        <span
          className={canNextMonth ? "cursor-pointer px-2" : "cursor-not-allowed px-2 text-gray-300"}
          onClick={() => canNextMonth && onNextMonth?.()}
        >
          ›
        </span>
      </div>
      <div className="grid grid-cols-7 gap-[3px]">
        {WEEKDAYS.map((d) => (
          <span key={d} className="pb-1 text-center text-[10px] text-muted">
            {d}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-[3px]">
        {days.map((day, i) => {
          const status = day.status ?? "ok";
          const isSingleSelected = mode === "single" && selected === day.date;

          return (
            <div
              key={i}
              className={[
                "flex aspect-square flex-col items-center justify-center rounded-sm border border-transparent bg-gray-100 text-[11px] text-ink cursor-pointer",
                dayClass[status] ?? dayClass.ok,
                isSingleSelected ? "bg-secondary-800 text-white border-secondary-800" : "",
                getRangeClass(day.date),
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => isSelectable(status) && handleClick(day.date)}
            >
              {status !== "off" && <span className="text-[9px] leading-tight">{day.date}</span>}
              {day.qty !== undefined && <span className="text-[10px] leading-tight font-bold">{day.qty}</span>}
            </div>
          );
        })}
      </div>
      {showLegend && (
        <div className="mt-2 flex flex-wrap gap-2 font-mono text-[10px] text-muted">
          <span>
            <i className="mr-[3px] inline-block h-[9px] w-[9px] rounded-[3px] align-[-1px] bg-success-light" />
            예약가능
          </span>
          <span>
            <i className="mr-[3px] inline-block h-[9px] w-[9px] rounded-[3px] align-[-1px] bg-secondary-800" />
            선택
          </span>
          <span>
            <i className="mr-[3px] inline-block h-[9px] w-[9px] rounded-[3px] align-[-1px] [background:repeating-linear-gradient(45deg,var(--color-gray-100),var(--color-gray-100)_2px,var(--color-gray-200)_2px,var(--color-gray-200)_4px)]" />
            마감/불가
          </span>
        </div>
      )}
    </div>
  );
}
