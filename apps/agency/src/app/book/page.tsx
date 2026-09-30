"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Title,
  EmptyState,
  Table,
  Kv,
  Button,
  Stack,
  Card,
  Toast,
  Calendar,
  type CalendarDay,
  CalendarIcon,
  Alert,
  HelpTooltip,
  type ToastStatus,
} from "@chinguya/ui";
import { ScrollReveal } from "@/components/ScrollReveal";
import {
  createApiClient,
  ApiError,
  type AgencyProduct,
  type AgencyProductList,
} from "@chinguya/api-client";
import { RENTAL_OPTION_LABEL } from "@chinguya/types";

const api = createApiClient();

// 여행사 예약 가능 기간: 오늘 +3일 ~ +3개월 (packages/types의 BOOKING_WINDOW.agency 규칙과 동일)
const MIN_LEAD_DAYS = 3;
const MAX_MONTHS_AHEAD = 3;

function toDateInputValue(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

/** "YYYY-MM-DD" 문자열을 new Date(string)로 다시 파싱하면 UTC 자정으로 해석돼 타임존에 따라
 *  하루 밀리는 문제가 있다(정오·자정 근처 브라우저 로컬 타임존 이슈) — 그래서 직접 쪼갠다. */
function parseDateInputValue(value: string): { year: number; month: number; day: number } {
  const parts = value.split("-").map(Number);
  return { year: parts[0] ?? 0, month: parts[1] ?? 1, day: parts[2] ?? 1 };
}

function minSelectableDateObj(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + MIN_LEAD_DAYS);
  return d;
}

function maxSelectableDateObj(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setMonth(d.getMonth() + MAX_MONTHS_AHEAD);
  return d;
}

function defaultUseDate(): string {
  return toDateInputValue(minSelectableDateObj());
}

/**
 * 고객 앱 상품 상세(apps/customer/.../rental/[id]/page.tsx)의 예약 캘린더와 같은 방식 —
 * 여행사 예약 가능 기간(오늘 +3일 ~ +3개월) 밖의 날짜는 전부 disabled로 막고, 그 안은 전부
 * ok로 둔다(여행사 예약은 상품별이 아니라 여러 상품을 한 날짜에 묶어 담는 화면이라, 고객
 * 화면과 달리 날짜별 재고 마감(zero) 상태는 이 화면 성격상 없다).
 */
function buildMonthDays(year: number, month: number): CalendarDay[] {
  const min = minSelectableDateObj();
  const max = maxSelectableDateObj();

  const firstWeekday = new Date(year, month - 1, 1).getDay();
  const totalDays = new Date(year, month, 0).getDate();
  const leading: CalendarDay[] = Array.from({ length: firstWeekday }, () => ({
    date: "",
    status: "off",
  }));
  const days: CalendarDay[] = Array.from({ length: totalDays }, (_, i) => {
    const d = i + 1;
    const thisDate = new Date(year, month - 1, d);
    const status: CalendarDay["status"] = thisDate < min || thisDate > max ? "disabled" : "ok";
    return { date: d, status };
  });
  return [...leading, ...days];
}

const WEEKDAY_LABEL = ["일", "월", "화", "수", "목", "금", "토"];

/** 선택한 날짜 표시용 문자열 — "2026-10-03" → "2026. 10. 03. (토)".
 *  요일을 붙여 캘린더를 다른 달로 넘겨 둔 상태에서도 어떤 날인지 바로 알 수 있게 한다. */
function formatDisplayDate(value: string): string {
  const { year, month, day } = parseDateInputValue(value);
  const weekday = WEEKDAY_LABEL[new Date(year, month - 1, day).getDay()] ?? "";
  return `${year}. ${String(month).padStart(2, "0")}. ${String(day).padStart(2, "0")}. (${weekday})`;
}

/**
 * 수량 입력칸(2026-09-30 — +/- 스테퍼 대신 숫자를 직접 입력).
 *
 * - type="text" + inputMode="numeric": 모바일에서 숫자 키패드가 뜨고, type="number" 의 위아래 화살표·
 *   마우스 휠로 값이 바뀌는 문제·"e" 입력 허용 같은 부작용이 없다. 숫자가 아닌 글자는 입력 즉시 걸러낸다.
 * - 입력 즉시 0 ~ max 로 맞춘다(가용 5개인데 12 를 치면 5). 그래서 예약 요약·합계가 항상 유효한 값이다.
 * - 0 은 빈 칸(placeholder "0")으로 보여서, 칸을 눌러 바로 숫자를 치면 "01" 처럼 되지 않는다.
 * - 가용이 0 이면 입력 자체를 막는다(disabled). 오른쪽 "/ max" 는 입력 가능한 최대 개수 안내.
 */
function QtyInput({
  label,
  value,
  max,
  onChange,
}: {
  label: string;
  value: number;
  max: number;
  onChange: (qty: number) => void;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {/* 공용 Input 은 size="sm" 도 높이 32px·좌우 여백 16px 이라 표 칸에서 숫자가 잘려 보였다.
          여백(px)은 className 으로 덮어쓰면 기본값과 충돌해 적용이 불안정해서, 여기만 기본 input 에
          공용 입력칸과 같은 테두리·포커스·비활성 색을 직접 준다 — 높이 28px(h-7)·폭 44px(w-11)·여백 4px(px-1).
          글자는 오른쪽 "/ max" 안내와 같은 스타일(text-[12px] text-muted)로 맞췄다. */}
      <input
        type="text"
        inputMode="numeric"
        aria-label={label}
        placeholder="0"
        disabled={max === 0}
        value={value === 0 ? "" : String(value)}
        onChange={(e) => {
          const digits = e.target.value.replace(/\D/g, "");
          const next = digits === "" ? 0 : Number(digits);
          onChange(Math.min(Math.max(next, 0), max));
        }}
        onFocus={(e) => e.target.select()}
        className="h-7 w-11 rounded-sm border border-line bg-surface px-1 text-center text-[12px] text-muted transition-colors placeholder:text-muted focus:border-input-focus focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-muted"
      />
      <span className="text-[12px] text-muted">/ {max}</span>
    </span>
  );
}

function productLabel(product: AgencyProduct, separator = " · "): string {
  return `${product.assetName}${separator}${RENTAL_OPTION_LABEL[product.optionType]}`;
}

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback;
}

/**
 * S2-G4/G5 상품 조회 · 예약(`g-book`). 여행사 할당 범위(가용) 내에서 상품별 수량을 골라 한 번에
 * "예약(즉시 완료)"한다 — 고객 예약과 달리 입금 절차 없이 바로 완료 상태가 된다.
 *
 * Core API(GET /v1/agency/products, POST /v1/agency/reservations)에 실연동돼 있다 — 계약은
 * packages/api-spec/openapi/chinguya-agency-api.yaml. 가격·가용·금액은 전부 서버 값이다.
 *
 * 할당은 자산 단위라 같은 자산의 상품끼리 나눠 쓴다. 그래서 스테퍼 상한에서 같은 자산의 다른 줄에
 * 담은 수량을 뺀다. 그래도 그사이 다른 예약이 할당을 썼으면 서버가 409로 막는다.
 */
export default function AgencyBookPage() {
  const router = useRouter();
  const [useDate, setUseDate] = useState(defaultUseDate());
  const [productList, setProductList] = useState<AgencyProductList | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [qtyByProduct, setQtyByProduct] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastStatus, setToastStatus] = useState<ToastStatus>("info");

  // 모바일·태블릿(lg 미만) 하단 예약 요약 시트의 펼침 여부. 처음엔 접힘(합계·버튼만 보임) —
  // 들어오자마자 시트가 표를 가리지 않게 하기 위해서다. PC에서는 쓰지 않는다(오른쪽 열에 항상 펼쳐짐).
  const [sheetOpen, setSheetOpen] = useState(false);

  // 시트가 펼쳐져 있을 때 Esc 로 접는다(배경 딤을 눌러도 접힌다).
  useEffect(() => {
    if (!sheetOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSheetOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sheetOpen]);

  // 캘린더가 처음 보여줄 달 — 오늘이 아니라 기본 선택일(오늘 +3일)이 속한 달로 시작해서,
  // 열자마자 선택된 날짜가 바로 보이게 한다(월말에 +3일 하면 다음 달로 넘어갈 수 있어서).
  const defaultView = parseDateInputValue(defaultUseDate());
  const [viewYear, setViewYear] = useState(defaultView.year);
  const [viewMonth, setViewMonth] = useState(defaultView.month);

  const days = useMemo(() => buildMonthDays(viewYear, viewMonth), [viewYear, viewMonth]);

  const parsedUseDate = parseDateInputValue(useDate);
  const selectedDay =
    parsedUseDate.year === viewYear && parsedUseDate.month === viewMonth
      ? parsedUseDate.day
      : undefined;

  const now = new Date();
  const monthOffset = (viewYear - now.getFullYear()) * 12 + (viewMonth - (now.getMonth() + 1));
  const canPrevMonth = monthOffset > 0;
  const canNextMonth = monthOffset < MAX_MONTHS_AHEAD;

  const goPrevMonth = () => {
    if (!canPrevMonth) return;
    if (viewMonth === 1) {
      setViewYear((y) => y - 1);
      setViewMonth(12);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const goNextMonth = () => {
    if (!canNextMonth) return;
    if (viewMonth === 12) {
      setViewYear((y) => y + 1);
      setViewMonth(1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  // 날짜를 빠르게 바꾸면 늦게 온 이전 날짜의 응답이 표를 덮어쓸 수 있어, 마지막으로 요청한 날짜만 반영한다.
  const latestDateRef = useRef(useDate);

  const loadProducts = useCallback(async (date: string) => {
    latestDateRef.current = date;
    try {
      const list = await api.agencyProducts.list(date);
      if (latestDateRef.current !== date) return;
      setLoadError(null);
      setProductList(list);
    } catch (err) {
      if (latestDateRef.current !== date) return;
      setLoadError(errorMessage(err, "상품을 불러오지 못했습니다."));
    }
  }, []);

  // 날짜가 바뀌면 가용이 달라지므로 담은 수량을 비우고 다시 조회한다.
  useEffect(() => {
    setProductList(null);
    setLoadError(null);
    setQtyByProduct({});
    void loadProducts(useDate);
  }, [useDate, loadProducts]);

  const rows = productList?.products ?? [];
  const qtyOf = (productId: string) => qtyByProduct[productId] ?? 0;
  const selectedRows = rows.filter((row) => qtyOf(row.productId) > 0);
  const total = selectedRows.reduce((sum, row) => sum + row.agencyPrice * qtyOf(row.productId), 0);
  const canSubmit = selectedRows.length > 0 && !submitting;

  /** 같은 자산의 다른 줄에 담은 수량을 뺀 스테퍼 상한 — 할당이 자산 단위라서. */
  const maxQtyOf = (row: AgencyProduct) => {
    const usedBySameAsset = rows
      .filter((other) => other.assetId === row.assetId && other.productId !== row.productId)
      .reduce((sum, other) => sum + qtyOf(other.productId), 0);
    return Math.max(row.available - usedBySameAsset, 0);
  };

  const setQty = (productId: string, qty: number) => {
    setQtyByProduct((prev) => ({ ...prev, [productId]: qty }));
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await api.agencyReservations.create({
        useDate,
        items: selectedRows.map((row) => ({
          productId: row.productId,
          quantity: qtyOf(row.productId),
        })),
      });
      setQtyByProduct({});
      setToastMessage("예약이 완료되었습니다");
      setToastStatus("success");
    } catch (err) {
      setToastMessage(errorMessage(err, "예약하지 못했습니다. 잠시 후 다시 시도해 주세요."));
      setToastStatus("error");
    } finally {
      setSubmitting(false);
      // 성공이면 방금 쓴 할당이, 실패(409)면 그사이 다른 예약이 가용을 바꿨다 — 어느 쪽이든 다시 읽는다.
      void loadProducts(useDate);
    }
  };

  const tableEmptyMessage = loadError ? (
    <Alert status="error" icon={true}>
      {loadError}
    </Alert>
  ) : productList === null ? (
    <EmptyState>상품을 불러오는 중입니다.</EmptyState>
  ) : (
    <EmptyState>예약할 수 있는 상품이 없습니다.</EmptyState>
  );

  // 예약 요약 목록·예약 버튼 — PC 오른쪽 카드와 모바일 하단 시트 두 곳에서 같이 쓴다.
  const summaryList =
    selectedRows.length === 0 ? (
      <EmptyState>담긴 상품이 없습니다.</EmptyState>
    ) : (
      <Kv
        items={[
          ...selectedRows.map((row) => ({
            key: `${productLabel(row, "·")} ×${qtyOf(row.productId)}`,
            value: `${(row.agencyPrice * qtyOf(row.productId)).toLocaleString()}`,
          })),
          { key: "합계", value: `₩${total.toLocaleString()}` },
        ]}
      />
    );
  const submitButton = (
    <Button fullWidth disabled={!canSubmit} onClick={handleSubmit}>
      {submitting ? "예약 중…" : "예약 (즉시 완료)"}
    </Button>
  );

  return (
    <main className="flex min-h-0 flex-col lg:h-full">
      {/* 높이 고정(h-full)은 PC(lg~)에서만 — 표·요약이 화면 높이 안에서 각자 스크롤되는 구조.
          모바일·태블릿은 캘린더까지 위아래로 쌓여 화면 높이를 넘으므로, 높이를 고정하지 않고 내용만큼 늘려
          바깥(AgencyShell 콘텐츠 영역)이 통째로 스크롤되게 한다 — 고정하면 표가 남는 틈으로 찌그러진다. */}
      <Stack direction="column" className="min-h-0 flex-1">
        <ScrollReveal className="shrink-0">
          <Title size="md">상품 예약</Title>
        </ScrollReveal>
        {/* ★ 반응형 분기점 — 이용 날짜(캘린더)·상품 표·예약 요약 세 덩어리를 어떻게 놓을지 정하는 곳.
            기본(1023px 이하, 모바일·태블릿): flex-col → 코드 순서대로 위아래로 쌓인다(날짜 → 표 → 요약).
            lg(1024px~, PC): grid 2열로 바꾼다.
              ┌──────────────┬──────────┐
              │              │ 이용 날짜 │  ← 오른쪽 1행(내용 높이만큼, auto)
              │   상품 표     ├──────────┤
              │ (2행 모두 차지)│ 예약 요약 │  ← 오른쪽 2행(남은 높이 전부)
              └──────────────┴──────────┘
            오른쪽 열 폭 23rem(368px) = 캘린더 320px + 카드 좌우 여백(p-6 = 24px×2). 캘린더 폭을 바꾸면 이 값도 같이.
            각 덩어리의 자리는 아래 ScrollReveal 들의 lg:col-start / lg:row-start 로 정한다.
            (grid 를 쓰는 이유: 모바일에선 '날짜 → 표' 순서, PC에선 '날짜가 오른쪽 위'여야 해서
             DOM 순서를 바꾸지 않고 자리만 옮길 수 있는 grid 배치가 가장 간단하다.) */}
        <div className="flex min-h-0 w-full flex-1 flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_23rem] lg:grid-rows-[auto_minmax(0,1fr)]">
          <ScrollReveal delay={80} className="shrink-0 lg:col-start-2 lg:row-start-1">
            {/* tint="primary"(웜 베이지 카드색): 흰 카드 위에 흰 캘린더를 두면 제목과 캘린더 경계가 안 보여서,
                카드만 톤을 깔아 흰 캘린더 판이 떠 보이게 한다. */}
            <Card tint="primary" className="shrink-0">
              <Stack direction="column" gap="sm">
                {/* 오른쪽 열 두 카드(이용 날짜·예약 요약)의 제목은 '이용 날짜' 원래 모양으로 통일한다 —
                    Title size="sm" leaf tone="secondary" divider(작은 갈색 글씨 + 나뭇잎 + 아래 구분선).
                    선택한 날짜는 Title 의 action 자리에 넣어 오른쪽 끝에 둔다(action 이 있으면 Title 이
                    제목·action 을 space-between 으로 벌려 준다).
                    예약 가능 기간 안내는 제목 옆 "?"(HelpTooltip) 말풍선으로 보여 준다. */}
                <Title
                  size="sm"
                  leaf
                  tone="secondary"
                  action={
                    // 선택한 날짜 — 달력 아이콘 + 날짜(브랜드 브라운 굵게). 배경 박스 없이 글자만 둔다(2026-09-30 요청).
                    // aria-live: 캘린더에서 날짜를 바꾸면 스크린리더가 바뀐 날짜를 읽어 준다.
                    <span
                      aria-live="polite"
                      className="inline-flex shrink-0 items-center gap-1.5 text-xs"
                    >
                      <CalendarIcon className="text-primary-500" />
                      <span className="sr-only">선택한 날짜</span>
                      <span className="font-bold text-primary-500">
                        {formatDisplayDate(useDate)}
                      </span>
                    </span>
                  }
                >
                  <span className="inline-flex items-center gap-1">
                    이용 날짜
                    <HelpTooltip>예약 가능 기간은 오늘 +3일 ~ +3개월 입니다.</HelpTooltip>
                  </span>
                </Title>
                {/* 구분선: Title 의 divider(border-line)는 흰 카드 기준 색이라 베이지 카드 위에선 거의 안 보인다.
                    그래서 이 카드만 직접 긋고 색을 한 단계 진하게(ink 15%) 한다. 간격은 Stack gap(8px)이
                    Title divider 의 mt-2(8px)와 같아서, 아래 '예약 요약' 구분선과 위치가 똑같이 맞는다. */}
                <div aria-hidden="true" className="w-full border-b border-ink/15" />
                {/* 2026-09-30: 날짜 버튼을 눌러 팝업으로 여는 방식 → 캘린더를 카드 안에 항상 펼쳐 두는 방식으로 변경.
                          고른 날짜는 캘린더 위에 글자로 한 번 더 보여 준다(선택 칸이 다른 달이면 캘린더만으론 안 보이므로).
                          캘린더는 폭 고정(w-60 = 240px) — 100%로 두면 PC에서 칸이 너무 커진다. 그보다 좁은 화면에서만 max-w-full로 줄어든다.
                          mx-auto: 카드(열) 안에서 캘린더를 가운데 정렬 — 좌우 남는 여백을 똑같이 나눈다.
                          rounded-lg bg-surface: Calendar 자체는 배경이 투명이라, 베이지 카드 위에 흰 판을 깔아 준다.
                          mt-2: 위 제목 줄과의 간격 — 카드 안 기본 간격(gap-sm 8px)에 8px 더해 16px. 더 벌리려면 mt-3(12px)·mt-4(16px). */}
                <div className="mx-auto mt-2 w-60 max-w-full rounded-lg bg-surface">
                  <Calendar
                    year={viewYear}
                    month={viewMonth}
                    days={days}
                    mode="single"
                    selected={selectedDay}
                    onSelect={(day) => {
                      setUseDate(toDateInputValue(new Date(viewYear, viewMonth - 1, day)));
                    }}
                    onPrevMonth={goPrevMonth}
                    onNextMonth={goNextMonth}
                    canPrevMonth={canPrevMonth}
                    canNextMonth={canNextMonth}
                  />
                </div>
                {productList?.closed ? (
                  <Alert status="warning" icon={true}>
                    매장 휴무일이라 이 날짜는 예약할 수 없습니다.
                  </Alert>
                ) : null}
              </Stack>
            </Card>
          </ScrollReveal>
          {/* 스크롤은 Card(둥근 모서리+테두리가 있는 바깥 박스)가 아니라 Table 자신의
                  안쪽(각 없는) div가 담당한다 — overflow-y-auto를 둥근 모서리 요소에 바로
                  주면 브라우저 스크롤바가 카드 모서리를 파고들어 보이는 문제가 있었다. Card는
                  overflow-hidden으로 둥근 모양대로 잘라내는 역할만 한다. */}
          <ScrollReveal
            delay={160}
            className="flex min-h-0 w-full flex-1 flex-col lg:col-start-1 lg:row-span-2 lg:row-start-1"
          >
            <Card className="flex min-h-0 w-full flex-1 flex-col overflow-hidden">
              <Table
                className="min-h-0 flex-1 overflow-y-auto"
                columns={[
                  { key: "product", label: "상품" },
                  { key: "price", label: "여행사가", width: "18%", align: "right" },
                  { key: "available", label: "가용(할당)", width: "16%", align: "center" },
                  // 수량 열 폭: +/- 스테퍼(148px) → 입력칸(44px) + "/ 5" 안내가 들어가는 96px 로 줄였다.
                  // 모바일에서 열이 넓으면 상품 열이 눌리고 표가 카드 밖으로 밀려 잘려 보였다.
                  { key: "qty", label: "수량", width: "96px", align: "center" },
                ]}
                emptyMessage={tableEmptyMessage}
                rows={rows.map((row) => ({
                  product: productLabel(row),
                  price: `₩${row.agencyPrice.toLocaleString()}`,
                  available: row.available,
                  qty: (
                    <QtyInput
                      label={`${productLabel(row)} 수량`}
                      value={qtyOf(row.productId)}
                      max={maxQtyOf(row)}
                      onChange={(v) => setQty(row.productId, v)}
                    />
                  ),
                }))}
              />
            </Card>
          </ScrollReveal>
          <ScrollReveal
            delay={240}
            className="hidden min-h-0 w-full flex-col lg:col-start-2 lg:row-start-2 lg:flex"
          >
            {/* PC(lg~) 전용 — 모바일·태블릿에서는 숨기고, 아래 하단 시트가 대신 보여 준다. */}
            <Stack direction="column" className="min-h-0 w-full flex-1">
              <Card className="flex min-h-0 flex-1 flex-col">
                <Stack direction="column" justify="between" className="min-h-0 flex-1">
                  <Stack direction="column" gap="sm" className="min-h-0 overflow-y-auto">
                    {/* 제목 모양은 위 '이용 날짜' 카드와 통일(작은 갈색 글씨 + 나뭇잎 + 아래 구분선) */}
                    <Title size="sm" leaf tone="secondary" divider>
                      예약 요약
                    </Title>
                    {summaryList}
                  </Stack>
                  {/* 위에 있는 예약 목록(overflow-y-auto)이 스크롤될 때, 버튼과 목록이
                      같은 평면처럼 붙어 보이지 않도록 버튼 쪽에 위로 향하는 그림자를 줘서
                      "목록 위에 버튼이 얹혀 있는" 레이어 차이를 낸다 — box-shadow의 y 오프셋을
                      음수로 주면 그림자가 위쪽으로 생긴다. */}
                  <div className="shadow-[0_-6px_8px_-6px_rgba(0,0,0,0.18)]">{submitButton}</div>
                </Stack>
              </Card>
            </Stack>
          </ScrollReveal>
        </div>
        {/* 모바일 하단 시트가 접혀 있어도 합계·버튼 높이만큼은 화면 아래를 덮는다 —
            페이지 끝에 그만큼 빈 공간을 둬서, 맨 아래 표 줄까지 시트에 가리지 않고 스크롤해 볼 수 있게 한다. */}
        <div aria-hidden="true" className="h-40 shrink-0 lg:hidden" />
      </Stack>

      {/* ── 모바일·태블릿(lg 미만) 하단 예약 요약 시트 ─────────────────────────────
          화면 아래에 고정(fixed)해 두고, 위쪽 손잡이로 접고 편다. 고객 앱 상품 상세의 하단 시트(BookingDock)와
          같은 모양이다.
            · 접힘(기본): 손잡이 + 합계 + 예약 버튼만 — 표·캘린더는 뒤에서 자유롭게 스크롤된다.
            · 펼침: 담은 상품 목록이 나타난다(화면 절반까지, 넘치면 시트 안에서만 스크롤 — overscroll-contain 으로
              끝에 닿아도 뒤 페이지가 같이 스크롤되지 않게). 뒤에 반투명 배경을 깔고, 배경을 누르거나 Esc 로 접는다.
          ScrollReveal 밖에 둔 이유: ScrollReveal 은 transform(translate)을 쓰는데, 조상에 transform 이 있으면
          position: fixed 가 화면이 아니라 그 조상 기준으로 붙어 버린다. */}
      {sheetOpen && (
        <div
          aria-hidden="true"
          onClick={() => setSheetOpen(false)}
          className="fixed inset-0 z-[90] bg-black/40 lg:hidden"
        />
      )}
      <section
        aria-label="예약 요약"
        className="fixed inset-x-0 bottom-0 z-[95] rounded-t-2xl bg-surface shadow-[0_-8px_24px_rgba(0,0,0,0.12)] lg:hidden"
      >
        <button
          type="button"
          aria-expanded={sheetOpen}
          onClick={() => setSheetOpen((v) => !v)}
          className="flex w-full cursor-pointer flex-col items-center gap-1 pt-2 pb-1 text-xs text-muted"
        >
          <span aria-hidden="true" className="h-1 w-10 rounded-full bg-line" />
          <span>
            {sheetOpen ? "접기" : "예약 요약 펼치기"}
            {selectedRows.length > 0 && ` · ${selectedRows.length}개 상품`}
          </span>
        </button>
        {sheetOpen && (
          <div className="flex max-h-[50vh] flex-col gap-2 overflow-y-auto overscroll-contain px-5 pb-3">
            {/* flex-col gap-2: 제목 구분선과 목록 사이 간격(8px) — PC 카드의 Stack gap="sm" 과 같은 값.
              (Title 에 mb-2 를 주면 구분선이 아니라 제목 글자에 붙어서 간격이 안 생긴다 — 구분선은 Title 바깥 div 에 그려짐) */}
            <Title size="sm" leaf tone="secondary" divider>
              예약 요약
            </Title>
            {summaryList}
          </div>
        )}
        <div className="flex flex-col gap-3 border-t border-line px-5 pt-3 pb-5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted">합계</span>
            <span className="font-bold">₩{total.toLocaleString()}</span>
          </div>
          {submitButton}
        </div>
      </section>

      <Toast
        open={!!toastMessage}
        onClose={() => {
          const wasSuccess = toastStatus === "success";
          setToastMessage(null);
          if (wasSuccess) router.push("/reservations");
        }}
        message={toastMessage ?? ""}
        status={toastStatus}
        {...(toastStatus === "success"
          ? { actionLabel: "예약 목록 보기", actionHref: "/reservations" }
          : {})}
      />
    </main>
  );
}
