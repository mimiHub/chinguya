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
import { Title, Text, Card, Stack, Toggle, Calendar, type CalendarDay, type CalendarRange, type DayStatus, Stepper, Kv, Button, FormMessage, Alert, NoticeBox, Popup, Toast, ComingSoon, Banner, Tab, EmptyState } from "@chinguya/ui";
import { BookingDock } from "@/components/BookingDock";
import { UsageGuideSteps } from "@/components/UsageGuideSteps";
import { ScrollReveal } from "@/components/ScrollReveal";
import { useCart } from "@/context/CartContext";
import { useCustomerAuth } from "@/context/CustomerAuthContext";
import { PRODUCT_DESCRIPTION_FALLBACK } from "./product-descriptions";

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
 * - 상품설명은 시간 옵션과 무관하게 상품 단위 문구 하나로 고정이고, "상품설명 / 상품 사용방법" 탭으로 나뉜다.
 *   사용방법(사진+글)은 카테고리별로 data/usageGuides.ts에 있다(고객지원 '사용방법' 탭과 같은 데이터)(지금은 임시 샘플 — 실제 자료가 오면 그 파일만 교체).
 * - 모바일(md 미만)에서는 옵션~버튼 영역이 BookingDock으로 감싸져 본문을 읽는 동안 화면 하단에 붙어 있다가
 *   (접어도 합계·버튼은 남음), 끝까지 내려가면 푸터 바로 앞에서 풀린다(sticky — 그래서 본문의 마지막 자식이어야 한다).
 *   PC(md 이상)는 기존처럼 본문에 그대로 펼쳐 보여준다.
 */

const api = createApiClient();

/** 상품 정보 영역의 탭 — 상품설명(고정 문구) / 상품 사용방법(카테고리별 사진+글, data/usageGuides.ts — 고객지원 '사용방법' 탭과 같은 데이터). */
type ProductInfoTab = "info" | "usage";
const INFO_TABS: { key: ProductInfoTab; label: string }[] = [
  { key: "info", label: "상품설명" },
  { key: "usage", label: "상품 사용방법" },
];

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
  const [blockedDateNotice, setBlockedDateNotice] = useState(false);
  // 날짜를 안 고르고 담기/예약을 누르면 화면에 안내 박스를 늘 띄워 두는 대신 토스트로 알려 준다.
  const [startDateNotice, setStartDateNotice] = useState(false);
  const [infoTab, setInfoTab] = useState<ProductInfoTab>("info");

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
  // 상품설명은 시간 옵션을 바꿔도 달라지지 않는다 — 상품(자산) 단위 문구 하나로 고정.
  // (예전엔 옵션별 description이 있으면 그걸로 바뀌었는데, 옵션마다 문구가 흔들려서 없앴다.)
  // 서버가 상품설명을 주면 그것을, 비어 있으면 product-descriptions.ts의 임시 문구를 쓴다(실제 문구가 오면 그 파일은 지워도 된다).
  const subtitle = product.description?.trim() || PRODUCT_DESCRIPTION_FALLBACK[product.category] || "";

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
    if (!startKey) {
      setStartDateNotice(true);
      return;
    }
    if (!canSubmit) return;
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
    <main className="flex min-h-[inherit] flex-col">
      {/* min-h-[inherit]+flex-col: layout.tsx가 준 "한 화면 높이" 최소 높이를 이어받아 본문이 짧아도 맨 아래 BookingDock이 화면 하단에 머물게 한다 */}
      {/* 소메뉴 배너는 상품명이 아니라 소속된 대메뉴("상품/대여서비스")의 이름을 그대로 쓴다 */}
      <Banner size="sm" title="대여서비스" image="/banner-rental.png" />

      <Stack direction="column" className="mx-auto w-full max-w-2xl flex-1 p-6">
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
              <Text variant="sub">{`${product.name}와 함께하는 여유로운 시간`}</Text>
            </Stack>
          </Stack>
          <div className="border-t border-line" />
        </Stack>
        </ScrollReveal>
        
        {/* 구역 1 — 상품 정보 탭(상품설명 / 상품 사용방법). 사용방법이 길어서 이 영역은 페이지와 함께 스크롤되고,
            예약(옵션·날짜·수량·합계)은 아래 BookingDock이 모바일에서 항상 화면 하단에 고정해 둔다. */}
        <ScrollReveal delay={125}>
        <Stack direction="column" gap="md">
          {/* 고객지원(FAQ/질문하기) 탭과 같은 알약 모양. self-start: 세로 Stack에서 바가 화면 폭만큼 늘어나지 않고 내용 크기에 맞게 줄어든다. */}
          <Tab
            variant="capsule"
            className="self-start"
            items={INFO_TABS}
            activeKey={infoTab}
            onChange={(key) => setInfoTab(key as ProductInfoTab)}
          />
          {/* 상품설명만 카드 하나로 감싼다. 사용방법 탭은 단계마다 이미 카드라서, 바깥을 또 카드로 감싸면 카드 안에 카드가 들어가
              폴라로이드처럼 겹쳐 보인다 — 그래서 탭 전체가 아니라 상품설명 본문에만 Card를 쓴다. */}
          {infoTab === "info" ? (
            subtitle ? (
              <Card>
                <Text variant="sub" className="whitespace-pre-line">
                  {subtitle}
                </Text>
              </Card>
            ) : (
              <EmptyState variant="card">등록된 상품 설명이 없습니다.</EmptyState>
            )
          ) : (
            <UsageGuideSteps category={product.category} />
          )}
        </Stack>
        </ScrollReveal>

        {/* 구역 2 — 예약 패널(옵션·날짜·수량·합계·버튼). 모바일에서는 스크롤과 상관없이 처음부터 화면 하단에 고정되고
            (접어도 합계·버튼은 남음), PC에서는 본문 흐름 안에 그대로 펼쳐진다. 자세한 동작은 BookingDock 참고. */}
        <BookingDock
          popupClassName="-mx-6 -mb-6 mt-auto"
          footer={(popup) => (
            <Stack direction="column" gap={popup ? "sm" : "md"}>
              {crossRegion && (
                <>
                  <Stack justify="end">
                    <Text variant="sub" tone="accent">
                      타지역 반납 포함 (+ {(extraFeePerUnit * qty).toLocaleString()}원)
                    </Text>
                  </Stack>
                  {/* 하단 팝업에서는 추가요금 안내와 합계 사이를 구분선으로 나눈다(PC는 기존처럼 없음). */}
                  {popup && <div className="border-t border-line" />}
                </>
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
                {/* 날짜를 아직 안 골랐을 땐 버튼을 막지 않고 눌렀을 때 토스트로 안내한다(막아 두면 왜 안 눌리는지 알 수 없다).
                    날짜는 골랐는데 잔여가 없거나 담는 중일 때만 비활성. */}
                <Button variant="outline" className="flex-1" disabled={Boolean(startKey) && !canSubmit} onClick={() => handleAddToCart(false)}>
                  장바구니 담기
                </Button>
                <Button className="flex-1" disabled={Boolean(startKey) && !canSubmit} onClick={() => handleAddToCart(true)}>
                  바로 예약
                </Button>
              </Stack>
            </Stack>
          )}
        >
        <ScrollReveal delay={100}>
        <Stack direction="column" gap="md" className="">
          <Title size="sm" leaf tone="secondary">
            시간 옵션
          </Title>
          <Stack direction="column" gap="sm">
            {product.options.map((o) => {
              const isOn = o.optionType === option.optionType;
              return (
                <div
                  key={o.optionType}
                  role="radio"
                  aria-checked={isOn}
                  tabIndex={0}
                  onClick={() => handleOptionChange(o.optionType)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleOptionChange(o.optionType);
                    }
                  }}
                  className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg border px-4 py-3 shadow-[0_2px_10px_rgba(0,0,0,0.05)] transition-colors ${
                    isOn ? "border-accent-300 bg-accent-300" : "border-card-border bg-surface"
                  }`}
                >
                  <Stack align="center" gap="sm">
                    <span
                      aria-hidden="true"
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                        isOn ? "border-accent-700" : "border-line"
                      }`}
                    >
                      {isOn && <span className="h-2.5 w-2.5 rounded-full bg-accent-700" />}
                    </span>
                    <Text>{RENTAL_OPTION_LABEL[o.optionType]}</Text>
                  </Stack>
                  <Text weight="bold">{o.price.toLocaleString()}원</Text>
                </div>
              );
            })}
          </Stack>
          {/* 렌탈 목록 화면의 "이용 안내"(rental/page.tsx)와 같은 디자인 — 잎 아이콘 제목 + 점 목록. 배경은 페이지 베이지(bg-bg)보다 한 단계 진한 bg-bg-light 토큰 */}
          <NoticeBox
            title={
              <Title size="sm" leaf tone="secondary">
                이용 안내
              </Title>
            }
            tone="none"
            className="bg-bg-light"
          >
            <ul className="flex list-disc flex-col gap-1 pl-4 text-sm text-muted">
              <li>옵션을 바꾸면 아래 날짜 선택은 초기화돼요.</li>
              <li>옵션마다 선택 가능한 일수가 달라요.</li>
            </ul>
          </NoticeBox>

          {option.crossRegionReturnAvailable && (
            <Card padding="sm">
              <Toggle
                on={offSiteReturn}
                onChange={handleOffSiteReturnChange}
                className="w-full justify-between"
                label={
                  <Stack direction="column" gap="xs">
                    <Text weight="bold">타지역 반납</Text>
                    <Text variant="sub">
                      다른 지점에서 반납할 수 있어요 (대당 + {(option.crossRegionReturnExtraFee ?? 0).toLocaleString()}원)
                    </Text>
                  </Stack>
                }
              />
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
            onBlockedSelect={isMultiDay ? () => setBlockedDateNotice(true) : undefined}
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
        </Stack>
        </ScrollReveal>
        </BookingDock>
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

      <Toast
        open={startDateNotice}
        onClose={() => setStartDateNotice(false)}
        message={isMultiDay ? "대여 시작일을 먼저 선택해 주세요." : "대여 날짜를 먼저 선택해 주세요."}
      />

      <Toast
        open={blockedDateNotice}
        onClose={() => setBlockedDateNotice(false)}
        message="예약가능한 날짜를 시작일로 선택해 주세요."
        status="error"
      />
    </main>
  );
}
