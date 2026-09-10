"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Title } from "@chinguya/ui/title";
import { EmptyState } from "@chinguya/ui/empty-state";
import { Table } from "@chinguya/ui/table";
import { Stepper } from "@chinguya/ui/stepper";
import { Kv } from "@chinguya/ui/kv";
import { Button } from "@chinguya/ui/button";
import { Stack } from "@chinguya/ui/stack";
import { Card } from "@chinguya/ui/card";
import { Toast } from "@chinguya/ui/toast";
import { Calendar, type CalendarDay } from "@chinguya/ui/calendar";
import { CalendarIcon } from "@chinguya/ui/calendar-icon";
import { Popup } from "@chinguya/ui/popup";
import { ScrollReveal } from "@/components/ScrollReveal";
import { getBookingRows } from "@/data/bookingData";
import { RENTAL_OPTION_LABEL } from "@/data/rentalData";
import { createReservation } from "@/data/reservationData";
import { Alert } from "@chinguya/ui/alert";

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
  const leading: CalendarDay[] = Array.from({ length: firstWeekday }, () => ({ date: "", status: "off" }));
  const days: CalendarDay[] = Array.from({ length: totalDays }, (_, i) => {
    const d = i + 1;
    const thisDate = new Date(year, month - 1, d);
    const status: CalendarDay["status"] = thisDate < min || thisDate > max ? "disabled" : "ok";
    return { date: d, status };
  });
  return [...leading, ...days];
}

/** 버튼에 보여줄 표시용 날짜 문자열 — "2026-09-13" → "2026. 09. 13." (브라우저 기본
 *  date input이 쓰던 표기와 동일하게 맞췄다). */
function formatDisplayDate(value: string): string {
  const { year, month, day } = parseDateInputValue(value);
  return `${year}. ${String(month).padStart(2, "0")}. ${String(day).padStart(2, "0")}.`;
}

/**
 * S2-G4/G5 상품 조회 · 예약. 여행사 할당 범위(가용) 내에서 상품별 수량을 골라 한 번에
 * "예약(즉시 완료)"한다 — 고객 예약과 달리 입금 절차 없이 바로 완료 상태가 된다.
 */
export default function AgencyBookPage() {
  const router = useRouter();
  const rows = useMemo(() => getBookingRows(), []);
  const [useDate, setUseDate] = useState(defaultUseDate());
  const [qtyByRow, setQtyByRow] = useState<Record<string, number>>({});
  const [toastOpen, setToastOpen] = useState(false);

  // 날짜 필드를 누르면 브라우저 기본 달력 대신, 관리자 앱 재고 할당 화면(allocations/page.tsx)과
  // 같은 방식 — 버튼 + CalendarIcon을 누르면 Popup(제목+닫기 X 기본 제공) 안에 Calendar를
  // 띄운다 — 으로 통일한다.
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  // 캘린더가 처음 보여줄 달 — 오늘이 아니라 기본 선택일(오늘 +3일)이 속한 달로 시작해서,
  // 열자마자 선택된 날짜가 바로 보이게 한다(월말에 +3일 하면 다음 달로 넘어갈 수 있어서).
  const defaultView = parseDateInputValue(defaultUseDate());
  const [viewYear, setViewYear] = useState(defaultView.year);
  const [viewMonth, setViewMonth] = useState(defaultView.month);

  const days = useMemo(() => buildMonthDays(viewYear, viewMonth), [viewYear, viewMonth]);

  const parsedUseDate = parseDateInputValue(useDate);
  const selectedDay =
    parsedUseDate.year === viewYear && parsedUseDate.month === viewMonth ? parsedUseDate.day : undefined;

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

  const selectedRows = rows.filter((row) => (qtyByRow[row.id] ?? 0) > 0);
  const total = selectedRows.reduce((sum, row) => sum + row.agencyPrice * (qtyByRow[row.id] ?? 0), 0);
  const canSubmit = selectedRows.length > 0;

  const setQty = (rowId: string, qty: number) => {
    setQtyByRow((prev) => ({ ...prev, [rowId]: qty }));
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    selectedRows.forEach((row) => {
      const qty = qtyByRow[row.id] ?? 0;
      createReservation({
        productId: row.productId,
        rentalOption: row.option,
        useDate,
        quantity: qty,
        amountKrw: row.agencyPrice * qty,
      });
    });
    setQtyByRow({});
    setToastOpen(true);
  };

  return (
    <main className="flex h-full min-h-0 flex-col">
      <Stack direction="column" className="min-h-0 flex-1">
        <ScrollReveal className="shrink-0">
          <Title size="md">상품 예약</Title>
        </ScrollReveal>
        <Stack className="min-h-0 flex-1  flex gap-6">
          <Stack direction="column" className="min-h-0 flex-1">
            
            <ScrollReveal delay={80} className="shrink-0">
            <Card className="shrink-0">
              <Stack direction="column" gap="sm">
                <Title as="label" htmlFor="use-date" size="sm" leaf tone="secondary">
                이용 날짜
              </Title>
              {/* 관리자 앱 재고 할당 화면(allocations/page.tsx)의 날짜 선택 버튼과 같은 모양 —
                  알약형 버튼에 날짜 + CalendarIcon을 두고, 누르면 Popup(제목 + 기본 제공되는
                  닫기 X) 안에 Calendar를 띄운다. */}
              <button
                id="use-date"
                type="button"
                onClick={() => setDatePickerOpen(true)}
                className="flex h-8 w-fit shrink-0 items-center gap-1.5 rounded-full border border-line bg-surface px-4 text-sm text-ink"
              >
                {formatDisplayDate(useDate)}
                <CalendarIcon />
              </button>
              <Popup open={datePickerOpen} onClose={() => setDatePickerOpen(false)} title="날짜 선택">
                <Calendar
                  year={viewYear}
                  month={viewMonth}
                  days={days}
                  mode="single"
                  selected={selectedDay}
                  onSelect={(day) => {
                    setUseDate(toDateInputValue(new Date(viewYear, viewMonth - 1, day)));
                    setDatePickerOpen(false);
                  }}
                  onPrevMonth={goPrevMonth}
                  onNextMonth={goNextMonth}
                  canPrevMonth={canPrevMonth}
                  canNextMonth={canNextMonth}
                />
              </Popup>
              <Alert status="info" icon={true}>
                  예약 가능 기간 오늘 +3일 ~ +3개월 입니다.
              </Alert>
              </Stack>
            </Card>
            </ScrollReveal>

            <Stack className="min-h-0 flex-1">
              {/* 스크롤은 Card(둥근 모서리+테두리가 있는 바깥 박스)가 아니라 Table 자신의
                  안쪽(각 없는) div가 담당한다 — overflow-y-auto를 둥근 모서리 요소에 바로
                  주면 브라우저 스크롤바가 카드 모서리를 파고들어 보이는 문제가 있었다. Card는
                  overflow-hidden으로 둥근 모양대로 잘라내는 역할만 한다. */}
              <ScrollReveal delay={160} className="flex min-h-0 w-full flex-1 flex-col">
              <Card className="flex min-h-0 w-full flex-1 flex-col overflow-hidden">
                  <Table
                    className="min-h-0 flex-1 overflow-y-auto"
                    columns={[
                      { key: "product", label: "상품" },
                      { key: "price", label: "여행사가", width: "18%", align: "right" },
                      { key: "available", label: "가용(할당)", width: "16%", align: "center" },
                      { key: "qty", label: "수량", width: "20%", align: "center" },
                    ]}
                    rows={rows.map((row) => ({
                      product: `${row.title} · ${RENTAL_OPTION_LABEL[row.option]}`,
                      price: `₩${row.agencyPrice.toLocaleString()}`,
                      available: row.allocatedQty,
                      qty: (
                        <Stepper
                          value={qtyByRow[row.id] ?? 0}
                          min={0}
                          max={row.allocatedQty}
                          onChange={(v) => setQty(row.id, v)}
                        />
                      ),
                    }))}
                  />
              </Card>
              </ScrollReveal>
              <ScrollReveal delay={240} className="flex min-h-0 w-64 shrink-0 flex-col">
              <Stack direction="column" className="min-h-0 w-64 flex-1 shrink-0">
              <Card className="flex min-h-0 flex-1 flex-col">
                <Stack direction="column" justify="between" className="min-h-0 flex-1">
                   <Stack direction="column" gap="sm" className="min-h-0 overflow-y-auto">
                    <Title leaf divider size="md">
                      예약 요약
                    </Title>
                    {selectedRows.length === 0 ? (
                      <EmptyState>담긴 상품이 없습니다.</EmptyState>
                    ) : (
                      <Kv
                        items={[
                          ...selectedRows.map((row) => ({
                            key: `${row.title}·${RENTAL_OPTION_LABEL[row.option]} ×${qtyByRow[row.id]}`,
                            value: `${(row.agencyPrice * (qtyByRow[row.id] ?? 0)).toLocaleString()}`,
                          })),
                          { key: "합계", value: `₩${total.toLocaleString()}` },
                        ]}
                      />
                    )}

                   </Stack>
                  {/* 위에 있는 예약 목록(overflow-y-auto)이 스크롤될 때, 버튼과 목록이
                      같은 평면처럼 붙어 보이지 않도록 버튼 쪽에 위로 향하는 그림자를 줘서
                      "목록 위에 버튼이 얹혀 있는" 레이어 차이를 낸다 — box-shadow의 y 오프셋을
                      음수로 주면 그림자가 위쪽으로 생긴다. */}
                  <div className="shadow-[0_-6px_8px_-6px_rgba(0,0,0,0.18)]">
                    <Button fullWidth disabled={!canSubmit} onClick={handleSubmit}>
                      예약 (즉시 완료)
                    </Button>
                  </div>
                </Stack>
              </Card>          
              </Stack>
              </ScrollReveal>
            </Stack>
          </Stack>

          
        </Stack>
      </Stack>

      <Toast
        open={toastOpen}
        onClose={() => {
          setToastOpen(false);
          router.push("/reservations");
        }}
        message="예약이 완료되었습니다"
        actionLabel="예약 목록 보기"
        actionHref="/reservations"
      />
    </main>
  );
}
