"use client";

export type DayStatus = "ok" | "low" | "zero" | "over" | "holiday" | "disabled" | "off";

export interface CalendarDay {
  date: number | "";
  status?: DayStatus;
  /** 기존: 셀에 표시할 단일 숫자(다른 화면 — 고객 예약 캘린더 등 — 호환용). remaining이 함께
   *  오면 "remaining/qty" 분수 형식으로 표시되고, 혼자 오면 이 값 하나만 표시된다. */
  qty?: number;
  /** 재고 세팅(S1-A3) 전용 — 있으면 qty와 함께 "잔여/고객가용" 분수로 표시된다(예: 4/6). */
  remaining?: number;
  /** 있으면 숫자 대신 이 문자열을 표시한다(예: "휴무"). */
  label?: string;
  /** true면 셀 우측 상단에 점을 찍는다 — 그 날짜에 재고 조정 이력이 있음을 표시(S1-A3). */
  hasAdjustment?: boolean;
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
  /** "booking"(기본) = 고객 예약 캘린더용 3항목 범례(예약가능/선택/마감·불가).
   *  "inventory" = 재고 세팅(S1-A3)용 6항목 범례(여유/임박/마감(0)/초과/매장 휴무/재고 조정 있음). */
  legend?: "booking" | "inventory";
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

// 기획서 기준 캘린더 상태는 화면마다 다르다 — 고객 예약 캘린더는 예약가능/선택/마감·불가
// 세 가지뿐이라 과거 날짜(disabled), 마감(zero), 해당 월 예약 불가(holiday)를 화면에서는
// 전부 "마감·불가" 하나로 동일하게 보여준다. 반면 재고 세팅(S1-A3)은 잔여 수량 기준으로
// 여유(ok)/임박(low)/마감(zero, 0개)/초과(over, 음수)/매장 휴무(holiday)를 전부 다른 색으로
// 구분해서 보여준다 — 그래서 zero/holiday를 서로 다른 스타일로 분리해뒀다(zero=민무늬 회색,
// holiday=대각선 줄무늬). 각 항목은 bg/text/border/cursor를 전부 포함한 "완결된" 클래스
// 묶음이다 — 아래 셀 렌더링에서 이 중 정확히 하나만 골라 쓰고 다른 상태 클래스와 절대 섞지
// 않는다(섞으면 서로 배경/글자색을 덮어쓰려는 유틸리티 클래스가 같은 className 안에 공존하게
// 되어, 실제로 어느 쪽이 이길지 Tailwind 빌드 결과 순서에 좌우되는 버그가 난다 — 선택 색이
// 안 보이던 문제의 원인이었다).
const dayClass: Record<DayStatus, string> = {
  ok: "bg-success-light text-success border-transparent cursor-pointer",
  low: "bg-warning-light text-warning border-transparent cursor-pointer",
  // gray-100 배경이 다크 테마(admin)에서 페이지 배경과 명도 차이가 거의 없어(disabled 입력창과
  // 같은 문제) 마감(0) 칸이 배경에 묻혀 안 보였다. 외곽선을 넣어서 배경색이 얼마나 가깝든
  // 칸 경계 자체는 항상 드러나게 한다(초과=빨간 테두리와 구분되는 중립 회색 테두리).
  zero: "bg-gray-100 text-gray-400 border-gray-400 cursor-not-allowed",
  over: "bg-error-light text-error border-error cursor-pointer",
  holiday: "text-gray-400 border-transparent bg-stripe-muted cursor-not-allowed",
  disabled: "text-gray-400 border-transparent bg-stripe-muted cursor-not-allowed",
  off: "bg-transparent text-ink border-transparent cursor-default",
};

// 선택된 날짜(단일 선택이든, 기간의 시작·끝이든) 색은 하나로 통일한다.
const SELECTED_CLASS = "bg-secondary-800 text-white border-secondary-800 cursor-pointer";
// 기간 선택에서 시작~끝 "사이" 날짜(끝은 아니지만 범위에 포함됨을 보여주는 톤)
const RANGE_MIDDLE_CLASS = "bg-primary-100 text-ink border-transparent cursor-pointer rounded-none";

// 예약(booking) 캘린더는 마감(zero)/휴무(holiday)/과거(disabled)를 눌러도 아무 의미가 없어
// 클릭 자체를 막는다. 반면 재고 세팅(inventory) 캘린더는 정반대로, 마감·휴무인 날짜야말로
// 관리자가 들어가서 재고 조정을 확인·수정하거나 휴무를 해제해야 하는 날짜라 전부 클릭 가능해야
// 한다 — 안 그러면 한 번 마감/휴무로 찍힌 날짜는 영영 손댈 수 없게 된다(실제로 이 문제가 있었다).
// 그래서 "off"(달력 앞쪽 빈 칸)만 공통으로 막고, 나머지는 legend로 화면 성격을 구분해서 정한다.
const NOT_SELECTABLE_BOOKING: DayStatus[] = ["off", "disabled", "zero", "holiday"];
const NOT_SELECTABLE_INVENTORY: DayStatus[] = ["off"];
const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

/** 예약/재고 세팅 캘린더. mode="single"은 단일 날짜 선택, mode="range"는 기간(연속일) 선택. */
export function Calendar({
  year,
  month,
  days = [],
  showLegend = true,
  legend = "booking",
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
  const notSelectable = legend === "inventory" ? NOT_SELECTABLE_INVENTORY : NOT_SELECTABLE_BOOKING;
  const isSelectable = (status: DayStatus) => !notSelectable.includes(status);

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
          const baseStateClass = isSelectedCell
            ? [SELECTED_CLASS, rangeRole === "start" ? "rounded-l-sm" : rangeRole === "end" ? "rounded-r-sm" : ""]
                .filter(Boolean)
                .join(" ")
            : rangeRole === "middle"
              ? RANGE_MIDDLE_CLASS
              : (dayClass[status] ?? dayClass.ok);
          // dayClass의 zero/holiday는 예약 캘린더 기준으로 cursor-not-allowed가 박혀 있는데,
          // 재고 세팅(inventory) 캘린더에서는 그 상태들도 클릭 가능해서(위 notSelectable 참고)
          // 커서만 포인터로 바꿔준다 — 배경/글자색 등 나머지 스타일은 그대로 유지.
          const stateClass =
            isSelectable(status) && baseStateClass.includes("cursor-not-allowed")
              ? baseStateClass.replace("cursor-not-allowed", "cursor-pointer")
              : baseStateClass;

          const qtyLine =
            day.label !== undefined
              ? day.label
              : day.remaining !== undefined && day.qty !== undefined
                ? `${day.remaining}/${day.qty}`
                : day.qty !== undefined
                  ? `${day.qty}`
                  : null;

          return (
            <div
              key={i}
              className={[
                "relative flex aspect-square flex-col items-center justify-center rounded-sm border text-[11px]",
                stateClass,
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => isSelectable(status) && handleClick(day.date)}
            >
              {day.hasAdjustment && (
                <span className="absolute top-[3px] right-[3px] h-[5px] w-[5px] rounded-full bg-error" />
              )}
              {status !== "off" && <span className="text-[9px] leading-tight">{day.date}</span>}
              {qtyLine !== null && <span className="text-[10px] leading-tight font-bold">{qtyLine}</span>}
            </div>
          );
        })}
      </div>
      {showLegend && legend === "booking" && (
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
      {showLegend && legend === "inventory" && (
        <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-muted">
          <span>
            <i className="mr-[3px] inline-block h-[9px] w-[9px] rounded-[3px] align-[-1px] bg-success-light" />
            여유
          </span>
          <span>
            <i className="mr-[3px] inline-block h-[9px] w-[9px] rounded-[3px] align-[-1px] bg-warning-light" />
            임박
          </span>
          <span>
            <i className="mr-[3px] inline-block h-[9px] w-[9px] rounded-[3px] border border-gray-400 align-[-1px] bg-gray-100" />
            마감(0)
          </span>
          <span>
            <i className="mr-[3px] inline-block h-[9px] w-[9px] rounded-[3px] border border-error align-[-1px] bg-error-light" />
            초과
          </span>
          <span>
            <i className="mr-[3px] inline-block h-[9px] w-[9px] rounded-[3px] align-[-1px] bg-stripe-muted-light" />
            매장 휴무
          </span>
          <span>
            <i className="mr-[3px] inline-block h-[5px] w-[5px] rounded-full align-[-1px] bg-error" />
            재고 조정 있음
          </span>
        </div>
      )}
    </div>
  );
}
