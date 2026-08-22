"use client";

import { Suspense, useMemo, useState } from "react";
import NextLink from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { RentalOptionKey } from "@chinguya/types";
import { OFF_SITE_RETURN_FEE_KRW } from "@chinguya/types";
import { Title } from "@chinguya/ui/title";
import { Text } from "@chinguya/ui/text";
import { Badge } from "@chinguya/ui/badge";
import { Card } from "@chinguya/ui/card";
import { Stack } from "@chinguya/ui/stack";
import { Calendar, type CalendarDay } from "@chinguya/ui/calendar";
import { Stepper } from "@chinguya/ui/stepper";
import { Kv } from "@chinguya/ui/kv";
import { Button } from "@chinguya/ui/button";
import { FormMessage } from "@chinguya/ui/form-message";
import { Alert } from "@chinguya/ui/alert";
import { Popup } from "@chinguya/ui/popup";
import { Toast } from "@chinguya/ui/toast";
import { ComingSoon } from "@chinguya/ui/coming-soon";
import { Banner } from "@chinguya/ui/banner";
import { findRentalProductById, RENTAL_OPTION_LABEL } from "@/data/rentalData";
import { useCart } from "@/context/CartContext";

/**
 * 데모용: 실제로는 GET /api/products/{id}/availability?month=YYYY-MM 응답으로 이 함수를 대체한다.
 * status는 "ok"(예약가능) | "zero"(마감) | "disabled"(과거 날짜) 중 하나 — 기획서 기준 캘린더 상태는
 * 예약가능/선택/마감·불가 세 가지뿐이라 짧은 옵션(2시간 등)도 예약이 들어오면 해당 '일' 전체가
 * 마감 처리되어야 한다(시간 슬롯이 아니라 하루 단위로 재고를 점유하는 서비스 규칙).
 */
function buildMonthDays(year: number, month: number): CalendarDay[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const firstWeekday = new Date(year, month - 1, 1).getDay();
  const totalDays = new Date(year, month, 0).getDate();
  const leading: CalendarDay[] = Array.from({ length: firstWeekday }, () => ({ date: "", status: "off" }));
  const days: CalendarDay[] = Array.from({ length: totalDays }, (_, i) => {
    const d = i + 1;
    const thisDate = new Date(year, month - 1, d);
    const status: CalendarDay["status"] = thisDate < today ? "disabled" : d % 7 === 3 ? "zero" : "ok";
    return { date: d, status };
  });
  return [...leading, ...days];
}

// 예약 가능 기간: 오늘 ~ +3개월 (packages/types의 BOOKING_WINDOW.customer.maxMonths 규칙과 동일)
const MAX_MONTHS_AHEAD = 3;

// 데모/QA용: 이 날짜를 시작일로 선택하고 예약하면 "방금 마감되었습니다" 충돌 상황을 재현한다.
// 실제 연동 시엔 이 상수 대신 서버 응답의 실제 충돌(409 등)로만 판단하도록 교체한다.
const CONFLICT_DEMO_DAY = 20;

// 데모용 가용 수량. 실제로는 선택한 날짜·옵션 기준 재고 응답(Inventory.customerAvailable)으로 교체한다.
const AVAILABLE_QTY_DEMO = 5;

function toDateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function ReserveForm() {
  const params = useSearchParams();
  const router = useRouter();
  const { addItem } = useCart();
  const productId = params.get("product");
  const option = (params.get("option") as RentalOptionKey | null) ?? "1d";
  const isMultiDay = option === "2d";
  const offSiteReturn = isMultiDay && params.get("offSiteReturn") === "1";
  const offSiteReturnFee = offSiteReturn ? OFF_SITE_RETURN_FEE_KRW : 0;

  const product = productId ? findRentalProductById(productId) : undefined;

  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth() + 1);
  const [range, setRange] = useState<{ start: number | null; end: number | null }>({ start: null, end: null });
  const [qty, setQty] = useState(1);
  const [conflictOpen, setConflictOpen] = useState(false);
  const [addedToast, setAddedToast] = useState(false);
  // "2일" 옵션에서 연속 이틀 예약이 불가능한 시작일을 골랐을 때 보여줄 안내 문구
  const [multiDayNotice, setMultiDayNotice] = useState<string | null>(null);

  const days = useMemo(() => buildMonthDays(viewYear, viewMonth), [viewYear, viewMonth]);
  const hasBookableDay = days.some((d) => d.status === "ok");
  const isDaySelectable = (status: CalendarDay["status"]) => !["off", "disabled", "zero", "holiday"].includes(status ?? "ok");

  /**
   * Calendar 컴포넌트의 range 모드는 "며칠이든 자유롭게" 기간을 고를 수 있는 범용 기능이라,
   * 시작일을 클릭한 뒤 아무 날짜나 다시 클릭하면 그게 끝날짜가 돼버린다(예: 25일→27일 선택 가능).
   * 하지만 "2일" 옵션은 말 그대로 정확히 이틀이어야 하므로, 시작일을 고르는 즉시 끝날짜를
   * 다음날로 자동 고정하고, 다음날이 마감·불가 상태면 그 날짜는 시작일로 선택할 수 없게 막는다.
   */
  const handleRangeSelect = (next: { start: number | null; end: number | null }) => {
    if (!next.start) {
      setRange({ start: null, end: null });
      setMultiDayNotice(null);
      return;
    }

    const endDate = next.start + 1;
    const endDay = days.find((d) => d.date === endDate);

    if (!endDay || !isDaySelectable(endDay.status)) {
      setRange({ start: null, end: null });
      setMultiDayNotice("다음날까지 연속으로 예약 가능한 날짜를 시작일로 선택해 주세요.");
      return;
    }

    setMultiDayNotice(null);
    setRange({ start: next.start, end: endDate });
  };

  const monthOffset = (viewYear - now.getFullYear()) * 12 + (viewMonth - (now.getMonth() + 1));
  const canPrevMonth = monthOffset > 0;
  const canNextMonth = monthOffset < MAX_MONTHS_AHEAD;

  const goPrevMonth = () => {
    if (!canPrevMonth) return;
    setRange({ start: null, end: null });
    setMultiDayNotice(null);
    if (viewMonth === 1) {
      setViewYear((y) => y - 1);
      setViewMonth(12);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const goNextMonth = () => {
    if (!canNextMonth) return;
    setRange({ start: null, end: null });
    setMultiDayNotice(null);
    if (viewMonth === 12) {
      setViewYear((y) => y + 1);
      setViewMonth(1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  if (!product) {
    return <ComingSoon label="선택한 상품 정보를 찾을 수 없습니다" />;
  }

  const unitPrice = product.priceByOption[option].customerPrice;
  const rentalDays = range.start && range.end ? range.end - range.start + 1 : 1;
  // 타지역 반납은 수량·대여일수와 무관하게 건당 1회만 붙는 고정 추가요금
  const total = unitPrice * qty * rentalDays + offSiteReturnFee;
  const canSubmit = Boolean(range.start && range.end);

  const buildCartLine = () => {
    if (!range.start || !range.end) return null;
    return {
      productId: product.id,
      option,
      useDateStart: toDateKey(viewYear, viewMonth, range.start),
      useDateEnd: toDateKey(viewYear, viewMonth, range.end),
      qty,
      offSiteReturn,
    };
  };

  const handleAddToCart = (navigateToCart: boolean) => {
    if (!canSubmit) return;

    // 캘린더에서 이미 막고 있지만, 갱신 지연 등으로 화면이 최신 상태가 아닐 수 있어
    // 담는 시점에 한 번 더 확인한다(데모: 고정된 날짜를 선택하면 항상 충돌로 재현).
    if (range.start === CONFLICT_DEMO_DAY) {
      setConflictOpen(true);
      setRange({ start: null, end: null });
      return;
    }

    const line = buildCartLine();
    if (!line) return;
    addItem(line);

    if (navigateToCart) {
      router.push("/cart");
    } else {
      setAddedToast(true);
    }
  };

  return (
    <main>
      {/* 소메뉴 배너는 소속된 대메뉴("상품/대여서비스")의 이름을 그대로 쓴다 */}
      <Banner size="sm" title="대여서비스" image="/banner-rental.png" />

      <div className="mx-auto max-w-2xl p-6">
      <Stack direction="column" gap="sm">
        <NextLink href={`/rental/${product.id}`} className="text-sm text-muted hover:underline">
          ← 이전으로
        </NextLink>

        <Title size="lg">예약 / 날짜 선택</Title>
      </Stack>

      <Card className="mt-2">
        <Stack gap="md" align="center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={product.image} alt={product.title} className="h-16 w-16 rounded-md object-cover" />
          <Stack direction="column" gap="xs">
            <Text weight="bold">{product.name}</Text>
            <Text variant="sub">
              {RENTAL_OPTION_LABEL[option]} 기준 {unitPrice.toLocaleString()}원~
            </Text>            
            <Stack direction="row" gap="sm" align="center">
              <Badge variant="secondary">선택옵션</Badge>
              <Text as="b" weight="bold" size="sm" >
                {RENTAL_OPTION_LABEL[option]}
              </Text>              
            </Stack>
          </Stack>
        </Stack>        
      </Card>

      <Stack direction="column" gap="sm" className="mt-4">
        <Calendar
          year={viewYear}
          month={viewMonth}
          days={days}
          mode={isMultiDay ? "range" : "single"}
          selected={isMultiDay ? undefined : (range.start ?? undefined)}
          onSelect={isMultiDay ? undefined : (date) => setRange({ start: date, end: date })}
          range={isMultiDay ? range : undefined}
          onRangeChange={isMultiDay ? handleRangeSelect : undefined}
          onPrevMonth={goPrevMonth}
          onNextMonth={goNextMonth}
          canPrevMonth={canPrevMonth}
          canNextMonth={canNextMonth}
        />

        {!hasBookableDay && (
          <FormMessage type="helper">이 달은 예약 가능한 날짜가 없습니다. 다른 달을 확인해 주세요.</FormMessage>
        )}

        {multiDayNotice && (
          <Alert status="error" icon={false}>
            {multiDayNotice}
          </Alert>
        )}

        {range.start &&
          range.end &&
          (isMultiDay ? (
            <Text variant="sub">
              {viewMonth}월 {range.start}일부터 {range.end}일까지 · 총 {rentalDays}일 대여
            </Text>
          ) : (
            <Text variant="sub">
              {viewMonth}월 {range.start}일 · {RENTAL_OPTION_LABEL[option]} 대여
            </Text>
          ))}        
      </Stack>

      <Stack direction="column" gap="md" className="mt-6">
        <Stack justify="between" align="center">
          <Text variant="sub" as="span">
            수량
          </Text>
          <Stepper value={qty} onChange={setQty} min={1} max={AVAILABLE_QTY_DEMO} />
        </Stack>
        <div className="border-t border-line" />
        {offSiteReturn && (
          <Stack justify="end">
            <Text variant="sub" tone="accent">
            타지역 반납 포함 (+ {offSiteReturnFee.toLocaleString()}원)
            </Text>
          </Stack>
        )}

        <Kv
          items={[
            {
              key: "합계",
              value: (
                <Text as="span" size="sm" weight="bold">
                  ₩ {total.toLocaleString()}
                </Text>
              ),
            },
          ]}
        />

        <Stack gap="sm">
          <Button variant="outline" className="flex-1" disabled={!canSubmit} onClick={() => handleAddToCart(false)}>
            장바구니 담기
          </Button>
          <Button className="flex-1" disabled={!canSubmit} onClick={() => handleAddToCart(true)}>
            바로 예약
          </Button>
        </Stack>
        {!canSubmit && (
          <FormMessage type="helper">
            {isMultiDay ? "대여 시작일과 종료일을 먼저 선택해 주세요." : "대여 날짜를 먼저 선택해 주세요."}
          </FormMessage>
        )}
      </Stack>

      <Popup open={conflictOpen} onClose={() => setConflictOpen(false)} title="앗, 방금 마감되었습니다">
        <Stack direction="column" gap="md">
          <Text variant="sub">
            다른 고객이 방금 먼저 예약해서 선택하신 날짜가 마감됐어요. 다른 날짜로 다시 선택해 주세요.
          </Text>
          <Button fullWidth onClick={() => setConflictOpen(false)}>
            확인
          </Button>
        </Stack>
      </Popup>

      <Toast
        open={addedToast}
        onClose={() => setAddedToast(false)}
        message="장바구니에 추가되었습니다"
        actionLabel="장바구니 보기"
        actionHref="/cart"
      />
      </div>
    </main>
  );
}

export default function RentalReservePage() {
  return (
    <Suspense fallback={null}>
      <ReserveForm />
    </Suspense>
  );
}
