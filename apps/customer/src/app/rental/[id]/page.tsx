"use client";

import { useEffect, useMemo, useState } from "react";
import NextLink from "next/link";
import { useParams, useRouter } from "next/navigation";
import { BOOKING_WINDOW, RENTAL_OPTION_LABEL, type RentalOptionKey } from "@chinguya/types";
import {
  createApiClient,
  ApiError,
  DEFAULT_API_BASE_URL,
  type CustomerAvailability,
  type CustomerProductDetail,
} from "@chinguya/api-client";
import { Title, Text, Chip, Card, Stack, Toggle, Calendar, type CalendarDay, type CalendarRange, type DayStatus, Stepper, Kv, Button, FormMessage, Alert, Popup, Toast, ComingSoon, Banner } from "@chinguya/ui";
import { ScrollReveal } from "@/components/ScrollReveal";
import { useCart } from "@/context/CartContext";
import { useCustomerAuth } from "@/context/CustomerAuthContext";

/**
 * 상품 상세 · 예약 `detail`(S3-C1/S1-C2) — 옵션 → 날짜 → 수량을 한 화면에서 고른다.
 *
 * Core API 실연동: GET /v1/products/{id}(상품·옵션), GET /v1/products/{id}/availability(달력),
 * POST /v1/cart/items(담기 = 15분 임시 홀드). 계약은 packages/api-spec/openapi/chinguya-slice1-openapi.yaml.
 *
 * - 옵션 칩 = 이 자산의 '표출 ON' 상품. 옵션이나 타지역 반납을 바꾸면 날짜 선택 방식·가용이 달라져
 *   고른 날짜를 초기화한다.
 * - 달력은 서버가 준 선택 가능 여부만 쓴다 — 2일은 이틀, 2일 + 타지역 반납은 반납 다음 날까지 서버가
 *   따져서 시작일 단위로 알려 준다.
 * - 수량 상한 = 고른 시작일의 잔여. 그 사이 다른 고객이 먼저 잡았으면 담기가 409 → "방금 마감" 팝업.
 * - 담기·바로 예약은 로그인이 필요하다. 비로그인이면 로그인한 뒤 이 화면으로 돌아온다.
 */

const api = createApiClient();

function toDateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/** YYYY-MM-DD 에 n일 더하기(달·해 넘김 포함). */
function addDays(key: string, n: number): string {
  const [y, m, d] = key.split("-").map(Number);
  const date = new Date(Date.UTC(y!, m! - 1, d! + n));
  return date.toISOString().slice(0, 10);
}

/** 처음 고를 옵션 — 1일권이 있으면 1일권(목록의 대표 가격·사진 기준과 같다). */
function initialOption(product: CustomerProductDetail): RentalOptionKey | null {
  return product.options.find((o) => o.optionType === "DAY_1")?.optionType ?? product.options[0]?.optionType ?? null;
}

export default function RentalDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { session } = useCustomerAuth();
  const { addItem } = useCart();

  const [product, setProduct] = useState<CustomerProductDetail | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [optionType, setOptionType] = useState<RentalOptionKey | null>(null);
  const [offSiteReturn, setOffSiteReturn] = useState(false);

  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth() + 1);
  const [availability, setAvailability] = useState<CustomerAvailability | null>(null);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  // 담기 실패(마감)·성공 뒤 달력을 다시 읽기 위한 신호
  const [availabilityVersion, setAvailabilityVersion] = useState(0);

  const [range, setRange] = useState<CalendarRange>({ start: null, end: null });
  const [qty, setQty] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [conflictMessage, setConflictMessage] = useState<string | null>(null);
  const [addedToast, setAddedToast] = useState(false);

  useEffect(() => {
    let active = true;
    api.customerProducts
      .detail(params.id)
      .then((detail) => {
        if (!active) return;
        setProduct(detail);
        setOptionType(initialOption(detail));
      })
      .catch(() => {
        if (active) setNotFound(true);
      });
    return () => {
      active = false;
    };
  }, [params.id]);

  const option = product?.options.find((o) => o.optionType === optionType) ?? null;
  const isMultiDay = option?.daysRequired === 2;
  const crossRegion = Boolean(option?.crossRegionReturnAvailable && offSiteReturn);

  useEffect(() => {
    if (!product || !optionType) return;
    // 옵션·달을 빠르게 바꾸면 늦게 온 이전 응답이 달력을 덮을 수 있어 버린다.
    let active = true;
    setAvailability(null);
    setAvailabilityError(null);
    api.customerProducts
      .availability(product.productId, {
        optionType,
        from: toDateKey(viewYear, viewMonth, 1),
        to: toDateKey(viewYear, viewMonth, daysInMonth(viewYear, viewMonth)),
        crossRegionReturn: crossRegion,
      })
      .then((res) => {
        if (active) setAvailability(res);
      })
      .catch((err: unknown) => {
        if (active) setAvailabilityError(err instanceof ApiError ? err.message : "예약 가능 날짜를 불러오지 못했습니다.");
      });
    return () => {
      active = false;
    };
  }, [product, optionType, crossRegion, viewYear, viewMonth, availabilityVersion]);

  const dateInfo = useMemo(
    () => new Map((availability?.dates ?? []).map((d) => [d.date, d])),
    [availability],
  );

  // 서버가 준 날짜만 고를 수 있다 — 없는 날(과거·예약 가능 기간 밖)은 불가, selectable=false는 마감.
  const days = useMemo<CalendarDay[]>(() => {
    const leading: CalendarDay[] = Array.from({ length: new Date(viewYear, viewMonth - 1, 1).getDay() }, () => ({
      date: "",
      status: "off",
    }));
    const cells: CalendarDay[] = Array.from({ length: daysInMonth(viewYear, viewMonth) }, (_, i) => {
      const info = dateInfo.get(toDateKey(viewYear, viewMonth, i + 1));
      const status: DayStatus = !info ? "disabled" : info.selectable ? "ok" : "zero";
      return { date: i + 1, status };
    });
    return [...leading, ...cells];
  }, [dateInfo, viewYear, viewMonth]);

  if (notFound) {
    return <ComingSoon label="존재하지 않는 상품입니다" />;
  }
  if (!product || !option) {
    return (
      <main className="mx-auto max-w-2xl p-6">
        <Text variant="sub">불러오는 중…</Text>
      </main>
    );
  }

  const startKey = range.start ? toDateKey(viewYear, viewMonth, range.start) : null;
  const endKey = startKey ? addDays(startKey, option.daysRequired - 1) : null;
  const maxQty = startKey ? (dateInfo.get(startKey)?.remaining ?? 0) : 0;
  const hasBookableDay = (availability?.dates ?? []).some((d) => d.selectable);

  const monthIndex = viewYear * 12 + viewMonth;
  const currentMonthIndex = now.getFullYear() * 12 + now.getMonth() + 1;
  const canPrevMonth = monthIndex > currentMonthIndex;
  const canNextMonth = monthIndex < currentMonthIndex + BOOKING_WINDOW.customer.maxMonths;

  const extraFeePerUnit = crossRegion ? (option.crossRegionReturnExtraFee ?? 0) : 0;
  const total = (option.price + extraFeePerUnit) * qty;
  const canSubmit = Boolean(startKey && maxQty >= 1 && !submitting);

  const imageUrl = option.imageUrls?.[0] ?? product.imageUrls?.[0];
  const subtitle = option.description || product.description || "";

  const resetSelection = () => {
    setRange({ start: null, end: null });
    setQty(1);
    setSubmitError(null);
  };

  const handleOptionChange = (key: RentalOptionKey) => {
    setOptionType(key);
    // 타지역 반납은 그 옵션이 허용할 때만 — 다른 옵션으로 바꾸면 해제한다.
    const next = product.options.find((o) => o.optionType === key);
    if (!next?.crossRegionReturnAvailable) setOffSiteReturn(false);
    resetSelection();
  };

  const handleOffSiteReturnChange = (on: boolean) => {
    setOffSiteReturn(on);
    resetSelection();
  };

  /**
   * "2일"은 정확히 이틀이라, 시작일을 고르는 즉시 끝날짜를 다음날로 고정한다. 시작일로 고를 수
   * 있는지(다음날 잔여 포함)는 서버가 이미 따져서 달력에 표시했다. 월말 시작이면 다음날은 다음 달이라
   * 달력에는 시작일만 칠해진다.
   */
  const handleRangeSelect = (next: CalendarRange) => {
    if (!next.start) {
      resetSelection();
      return;
    }
    setRange({ start: next.start, end: Math.min(next.start + 1, daysInMonth(viewYear, viewMonth)) });
    setQty(1);
    setSubmitError(null);
  };

  const moveMonth = (delta: number) => {
    const index = monthIndex - 1 + delta;
    setViewYear(Math.floor(index / 12));
    setViewMonth((index % 12) + 1);
    resetSelection();
  };

  const loginAndReturn = () => {
    router.push(`/login?redirect=${encodeURIComponent(`/rental/${params.id}`)}`);
  };

  const handleAddToCart = async (navigateToCart: boolean) => {
    if (!startKey || !canSubmit) return;
    if (!session) {
      loginAndReturn();
      return;
    }
    setSubmitting(true);
    try {
      await addItem({
        productId: product.productId,
        optionType: option.optionType,
        startDate: startKey,
        quantity: qty,
        crossRegionReturn: crossRegion,
      });
      if (navigateToCart) {
        router.push("/cart");
        return;
      }
      setAddedToast(true);
      resetSelection();
      setAvailabilityVersion((v) => v + 1);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        loginAndReturn();
      } else if (err instanceof ApiError && err.code === "OUT_OF_STOCK") {
        setConflictMessage(err.message);
        resetSelection();
        setAvailabilityVersion((v) => v + 1);
      } else {
        setSubmitError(err instanceof ApiError ? err.message : "장바구니에 담지 못했습니다.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main>
      {/* 소메뉴 배너는 상품명이 아니라 소속된 대메뉴("상품/대여서비스")의 이름을 그대로 쓴다 */}
      <Banner size="sm" title="대여서비스" image="/banner-rental.png" />

      <Stack direction="column" className="mx-auto max-w-2xl p-6">
        <ScrollReveal>
        <Stack direction="column" gap="md">
          <NextLink href="/rental" className="text-sm text-muted hover:underline">
            ← 목록으로
          </NextLink>
          <Stack>
            <div className="w-40 rounded-lg bg-gray-50 p-2 h-20">
              {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={`${DEFAULT_API_BASE_URL}${imageUrl}`} alt={product.name} className="h-full w-full object-contain" />
              ) : (
                <div className="h-full w-full rounded-md bg-gray-100" aria-hidden />
              )}
            </div>
            <Stack direction="column" gap="sm">
              <Title size="lg">{product.name}</Title>
              <Text variant="sub">{subtitle || `${product.name}와 함께하는 여유로운 시간`}</Text>
            </Stack>
          </Stack>
          <div className="border-t border-line" />
        </Stack>
        </ScrollReveal>

        <ScrollReveal delay={100}>
        <Stack direction="column" gap="md" className="">
          <Title size="sm" leaf tone="secondary">
            시간 옵션
          </Title>
          <Chip.List>
            {product.options.map((o) => (
              <Chip key={o.optionType} on={o.optionType === option.optionType} onClick={() => handleOptionChange(o.optionType)}>
                {RENTAL_OPTION_LABEL[o.optionType]} · {o.price.toLocaleString()}원
              </Chip>
            ))}
          </Chip.List>

          {option.crossRegionReturnAvailable && (
            <Card padding="sm">
              <Stack justify="between" align="center">
                <Stack direction="column" gap="xs">
                  <Text weight="bold">타지역 반납</Text>
                  <Text variant="sub">
                    다른 지점에서 반납할 수 있어요 (대당 + {(option.crossRegionReturnExtraFee ?? 0).toLocaleString()}원)
                  </Text>
                </Stack>
                <Toggle on={offSiteReturn} onChange={handleOffSiteReturnChange} />
              </Stack>
            </Card>
          )}
          <div className="border-t border-line" />
        </Stack>
        </ScrollReveal>

        <ScrollReveal delay={150}>
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
            onSelect={
              isMultiDay
                ? undefined
                : (date) => {
                    setRange({ start: date, end: date });
                    setQty(1);
                    setSubmitError(null);
                  }
            }
            range={isMultiDay ? range : undefined}
            onRangeChange={isMultiDay ? handleRangeSelect : undefined}
            onPrevMonth={() => canPrevMonth && moveMonth(-1)}
            onNextMonth={() => canNextMonth && moveMonth(1)}
            canPrevMonth={canPrevMonth}
            canNextMonth={canNextMonth}
          />
          </Card>

          {availabilityError && (
            <Alert status="error" icon={false}>
              {availabilityError}
            </Alert>
          )}

          {availability && !hasBookableDay && (
            <FormMessage type="helper">이 달은 예약 가능한 날짜가 없습니다. 다른 달을 확인해 주세요.</FormMessage>
          )}

          {startKey &&
            endKey &&
            (isMultiDay ? (
              <Text variant="sub">
                {startKey}부터 {endKey}까지 · 총 2일 대여{crossRegion ? " · 타지역 반납" : ""}
              </Text>
            ) : (
              <Text variant="sub">
                {startKey} · {RENTAL_OPTION_LABEL[option.optionType]} 대여
              </Text>
            ))}
        </Stack>
        </ScrollReveal>

        <ScrollReveal delay={200}>
        <Stack direction="column" gap="md" className="mt-6">
          <Stack justify="between" align="center">
            <Text variant="sub" as="span">
              수량
            </Text>
            <Stepper value={qty} onChange={setQty} min={1} max={startKey ? Math.max(maxQty, 1) : 1} />
          </Stack>
          <div className="border-t border-line" />
          {crossRegion && (
            <Stack justify="end">
              <Text variant="sub" tone="accent">
                타지역 반납 포함 (+ {(extraFeePerUnit * qty).toLocaleString()}원)
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
          {!startKey && (
            <FormMessage type="helper">
              {isMultiDay ? "대여 시작일을 먼저 선택해 주세요." : "대여 날짜를 먼저 선택해 주세요."}
            </FormMessage>
          )}
        </Stack>
        </ScrollReveal>
      </Stack>

      <Popup open={Boolean(conflictMessage)} onClose={() => setConflictMessage(null)} title="앗, 방금 마감되었습니다">
        <Stack direction="column" gap="md">
          <Text variant="sub">
            {conflictMessage} 다른 고객이 먼저 예약했을 수 있어요. 날짜나 수량을 다시 선택해 주세요.
          </Text>
          <Button fullWidth onClick={() => setConflictMessage(null)}>
            확인
          </Button>
        </Stack>
      </Popup>

      <Toast
        open={addedToast}
        onClose={() => setAddedToast(false)}
        message="장바구니에 추가되었습니다"
        status="success"
        actionLabel="장바구니 보기"
        actionHref="/cart"
      />

      <Toast open={!!submitError} onClose={() => setSubmitError(null)} message={submitError ?? ""} status="error" />
    </main>
  );
}
