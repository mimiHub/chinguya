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
// 각 항목은 bg/text/border/cursor를 전부 포함한 "완결된" 클래스 묶음이다 — 아래 셀 렌더링에서
// 이 중 정확히 하나만 골라 쓰고 다른 상태 클래스와 절대 섞지 않는다(섞으면 서로 배경/글자색을
// 덮어쓰려는 유틸리티 클래스가 같은 className 안에 공존하게 되어, 실제로 어느 쪽이 이길지
// Tailwind 빌드 결과 순서에 좌우되는 버그가 난다 — 선택 색이 안 보이던 문제의 원인이었다).
const dayClass: Record<DayStatus, string> = {
  ok: "bg-success-light text-success border-transparent cursor-pointer",
  zero: "text-gray-400 border-transparent bg-stripe-muted cursor-not-allowed",
  disabled: "text-gray-400 border-transparent bg-stripe-muted cursor-not-allowed",
  holiday: "text-gray-400 border-transparent bg-stripe-muted cursor-not-allowed",
  off: "bg-transparent text-ink border-transparent cursor-default",
};

// 선택된 날짜(단일 선택이든, 기간의 시작·끝이든) 색은 하나로 통일한다.
const SELECTED_CLASS = "bg-secondary-800 text-white border-secondary-800 cursor-pointer";
// 기간 선택에서 시작~끝 "사이" 날짜(끝은 아니지만 범위에 포함됨을 보여주는 톤)
const RANGE_MIDDLE_CLASS = "bg-primary-100 text-ink border-transparent cursor-pointer rounded-none";

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

  // 그 날짜가 기간 선택에서 어떤 역할인지("시작"/"끝"/"사이"/해당 없음)만 알려준다.
  // 실제 클래스 조립은 렌더링하는 쪽에서 dayClass/SELECTED_CLASS 중 딱 하나만 골라 한다.
  const getRangeRole = (date: number | ""): "start" | "end" | "middle" | "none" => {
    if (mode !== "range" || !range?.start || date === "") return "none";
    if (!range.end) return date === range.start ? "start" : "none";
    if (date === range.start) return "start";
    if (date === range.end) return "end";
    if (date > range.start && date < range.end) return "middle";
    return "none";
  };

  return (
    // Calendar는 항상 Card나 Popup처럼 이미 테두리·배경을 가진 컨테이너 안에서만 쓰인다 —
    // 여기서도 자체 테두리·배경(border-line, bg-gray-100)을 또 그리면 "카드 안에 카드"처럼
    // 이중 박스로 보인다. 그래서 레이아웃만 남기고 테두리·배경은 부모에게 맡긴다.
    <div className="p-2">
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
          const rangeRole = getRangeRole(day.date);
          const isSelectedCell = isSingleSelected || rangeRole === "start" || rangeRole === "end";

          // bg/text/border/cursor를 함께 담은 상태 클래스 묶음을 "딱 하나"만 고른다
          // (선택됨 > 기간 사이 > 상태별 기본). 서로 다른 묶음을 섞어 쓰지 않는다.
          const stateClass = isSelectedCell
            ? [SELECTED_CLASS, rangeRole === "start" ? "rounded-l-sm" : rangeRole === "end" ? "rounded-r-sm" : ""]
                .filter(Boolean)
                .join(" ")
            : rangeRole === "middle"
              ? RANGE_MIDDLE_CLASS
              : (dayClass[status] ?? dayClass.ok);

          return (
            <div
              key={i}
              className={["flex aspect-square flex-col items-center justify-center rounded-sm border text-[11px]", stateClass]
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
        <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-muted">
          <span>
            <i className="mr-[3px] inline-block h-[9px] w-[9px] rounded-[3px] align-[-1px] bg-success-light" />
            예약가능
          </span>
          <span>
            <i className="mr-[3px] inline-block h-[9px] w-[9px] rounded-[3px] align-[-1px] bg-secondary-800" />
            선택
          </span>
          <span>
            <i className="mr-[3px] inline-block h-[9px] w-[9px] rounded-[3px] align-[-1px] bg-stripe-muted-light" />
            마감/불가
          </span>
        </div>
      )}
    </div>
  );
}
