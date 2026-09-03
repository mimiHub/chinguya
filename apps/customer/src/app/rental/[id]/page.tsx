"use client";

import { useState, useMemo } from "react";
import NextLink from "next/link";
import { useParams, useRouter } from "next/navigation";
import type { RentalOptionKey } from "@chinguya/types";
import { OFF_SITE_RETURN_FEE_KRW } from "@chinguya/types";
import { Title } from "@chinguya/ui/title";
import { Text } from "@chinguya/ui/text";
import { Chip } from "@chinguya/ui/chip";
import { Card } from "@chinguya/ui/card";
import { Stack } from "@chinguya/ui/stack";
import { Toggle } from "@chinguya/ui/toggle";
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
import { findRentalProductById, RENTAL_OPTION_LABEL, RENTAL_OPTION_ORDER } from "@/data/rentalData";
import { useCart } from "@/context/CartContext";

/**
 * S3-C1(상품 상세) + S1-C2(예약 · 캘린더) 통합 화면.
 *
 * 원래는 상품 상세에서 "예약하기"를 누르면 /rental/reserve로 넘어가 날짜를 고르는 2단계
 * 흐름이었는데, 비동기 데일리 로그(2026-09-02, "'상품 상세'와 '예약 · 캘린더' 통합")에서
 * "페이지 단계가 많다"는 판단으로 한 화면으로 합치기로 했다 — 옵션·타지역 반납·날짜·수량을
 * 한 화면에서 다 고르고 바로 장바구니/예약까지 간다. /rental/reserve 경로는 완전히 없애지
 * 않고 이 화면으로 리다이렉트만 해준다(남아있을 수 있는 링크 대비, apps/agency의
 * /rental → /book 리다이렉트와 같은 패턴).
 *
 * 옵션을 바꾸면 날짜 선택 모드(단일 날짜 vs 2일 연속 range)도 함께 바뀌므로, 이미 골라둔
 * 날짜·안내 문구는 옵션이 바뀔 때마다 초기화한다(엇갈린 모드로 남아있으면 상태가 꼬인다).
 */

/**
 * 데모용: 실제로는 GET /api/products/{id}/availability?month=YYYY-MM 응답으로 이 함수를 대체한다.
 * status는 "ok"(예약가능) | "zero"(마감) | "disabled"(과거 날짜) 중 하나 — 기획서 기준 캘린더 상태는
 * 예약가능/선택/마감·불가 세 가지뿐이라 짧은 옵션(2시간)도 예약이 닓야로 들어오면 해당 '일' 전체가
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

export default function RentalDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { addItem } = useCart();
  const product = findRentalProductById(params.id);

  // 아래에서 "이른 return"보다 먼저 훅을 다 불러야 해서(React 훅 규칙: 조건부 호출 금지),
  // 상품이 없을 수도 있는 상태 그대로 훅들을 선언해둔다.
  const [option, setOption] = useState<RentalOptionKey>("1d");
  const [offSiteReturn, setOffSiteReturn] = useState(false);

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

  // 관리자가 고객앱 표출을 꺼둔(customerVisible: false) 상품은 목록에 없더라도 주소를 직접
  // 입력해 들어오는 경우까지 막기 위해 여기서도 확인한다.
  if (!product || !product.customerVisible) {
    return <ComingSoon label="존재하지 않는 상품입니다" />;
  }

  const isMultiDay = option === "2d";

  const handleOptionChange = (key: RentalOptionKey) => {
    setOption(key);
    // 타지역 반납은 2일 대여에서만 선택 가능한 옵션 — 다른 옵션으로 바꾸면 선택 해제
    if (key !== "2d") setOffSiteReturn(false);
    // 옵션이 바뀌면 캘린더 선택 모드(단일 ↔ range)도 바뀌므로, 이미 고른 날짜는 초기화한다.
    setRange({ start: null, end: null });
    setMultiDayNotice(null);
  };

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

  // 설명(description)이 있으면 그걸 캡션으로 쓰고, 없으면 상품명(name)에서 타이틀을 뺀
  // 나머지를 캡션으로 대신 쓴다(예: "전기자전거 대여(당일 오후 4시 반납)" → "대여(당일 오후 4시 반납)").
  const subtitle =
    product.description ??
    (product.name.startsWith(product.title) ? product.name.slice(product.title.length).trim() : product.name);

  const unitPrice = product.priceByOption[option].customerPrice;
  const offSiteReturnFee = isMultiDay && offSiteReturn ? OFF_SITE_RETURN_FEE_KRW : 0;
  const rentalDays = range.start && range.end ? range.end - range.start + 1 : 1;
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
      {/* 소메뉴 배너는 상품명이 아니라 소속된 대메뉴("상품/대여서비스")의 이름을 그대로 쓴다 */}
      <Banner size="sm" title="대여서비스" image="/banner-rental.png" />

      <Stack direction="column" className="mx-auto max-w-2xl p-6">
        <Stack direction="column" gap="md">
          <NextLink href="/rental" className="text-sm text-muted hover:underline">
            ← 목록으로
          </NextLink>
          <Stack>
            <div className="w-40 rounded-lg bg-gray-50 p-2 h-20">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={product.image} alt={product.title} className="h-full w-full object-contain" />
            </div>
            <Stack direction="column" gap="sm">
              <Title size="lg">{product.title}</Title>
              <Text variant="sub">{subtitle || `${product.title}와 함께하는 여유로운 시간`}</Text>
            </Stack>
          </Stack>
          <div className="border-t border-line" />
        </Stack>        

        <Stack direction="column" gap="md" className="">
          <Title size="sm" leaf tone="secondary">
            시간 옵션
          </Title>
          <Chip.List>
            {RENTAL_OPTION_ORDER.map((key) => (
              <Chip key={key} on={key === option} onClick={() => handleOptionChange(key)}>
                {RENTAL_OPTION_LABEL[key]}
              </Chip>
            ))}
          </Chip.List>

          {isMultiDay && (
            <Card padding="sm">
              <Stack justify="between" align="center">
                <Stack direction="column" gap="xs">
                  <Text weight="bold">타지역 반납</Text>
                  <Text variant="sub">
                    다른 지점에서 반납할 수 있어요 (+ {OFF_SITE_RETURN_FEE_KRW.toLocaleString()}원)
                  </Text>
                </Stack>
                <Toggle on={offSiteReturn} onChange={setOffSiteReturn} />
              </Stack>
            </Card>
          )}
          <div className="border-t border-line" />
        </Stack>

        <Stack direction="column" gap="sm" className="">
          <Title size="sm" leaf tone="secondary">
            날짜 선택
          </Title>
          <Card>
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
          </Card>

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
          {offSiteReturn && isMultiDay && (
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
    </main>
  );
}
