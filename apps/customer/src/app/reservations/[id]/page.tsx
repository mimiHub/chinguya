"use client";

import { useEffect, useState } from "react";
import NextLink from "next/link";
import { useParams } from "next/navigation";
import {
  createApiClient,
  ApiError,
  type BookingItemStatus,
  type CustomerBooking,
  type CustomerBookingItem,
  type CustomerBookingStatus,
} from "@chinguya/api-client";
import { RENTAL_OPTION_LABEL, type AssetCategory, type CustomerReservationStatus } from "@chinguya/types";
import { Title, Text, Stack, Card, Kv, StatusBadge, Badge, Button, Banner, Alert, ComingSoon } from "@chinguya/ui";
import { useCustomerAuth } from "@/context/CustomerAuthContext";
import { ScrollReveal } from "@/components/ScrollReveal";

/**
 * S1-C6 예약 상세 · 바우처(`resdetail`). 현장 이용 시 예약번호가 증빙 역할을 한다.
 *
 * Core API 실연동: GET /v1/bookings/{bookingId}. 계약은 packages/api-spec/openapi/chinguya-slice1-openapi.yaml.
 *
 * - 1 예약번호 = N 항목. 항목마다 상품·옵션·이용일이 다를 수 있어 항목별로 보여 준다.
 * - 취소된 항목은 회색·취소 뱃지로 남기고, 합계는 유효 항목만 반영한다.
 * - 일부만 취소된 예약은 '부분취소' 뱃지. 취소 요청 버튼은 서버의 `cancellable`로 노출한다.
 * - 예약한 상품의 "사용방법 보기" 버튼 — 고객지원 '사용방법' 탭(같은 데이터)으로 이어 준다. 예약 항목엔 상품 종류가 없어서
 *   상품 상세(GET /products/{id})로 종류를 알아낸다. 알아내지 못하면(조회 실패 등) 종류를 정하지 않은 버튼 하나만 보여 준다.
 */

const api = createApiClient();

const CATEGORY_LABEL: Record<AssetCategory, string> = { BICYCLE: "자전거", FISHING_ROD: "낚싯대" };

const ITEM_STATUS: Record<BookingItemStatus, { label: string; variant: "success" | "info" | "gray" }> = {
  ACTIVE: { label: "유효", variant: "success" },
  CANCEL_REQUESTED: { label: "취소요청", variant: "info" },
  CANCELLED: { label: "취소", variant: "gray" },
};

function BookingStatusBadge({ status }: { status: CustomerBookingStatus }) {
  if (status === "AWAITING_DEPOSIT") return <Badge variant="gray">입금대기</Badge>;
  return <StatusBadge status={status.toLowerCase() as CustomerReservationStatus} />;
}

function formatDates(dates: string[]): string {
  const first = dates[0] ?? "";
  const last = dates[dates.length - 1] ?? "";
  return dates.length > 1 ? `${first} ~ ${last}` : first;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function ItemCard({ item }: { item: CustomerBookingItem }) {
  const status = ITEM_STATUS[item.status];
  return (
    <Card padding="sm" className={item.status === "CANCELLED" ? "opacity-50" : undefined}>
      <Stack direction="column" gap="xs">
        <Stack justify="between" align="center">
          <Text weight="bold">
            {item.productName} · {RENTAL_OPTION_LABEL[item.optionType]}
            {item.crossRegionReturn ? " · 타지역 반납" : ""}
          </Text>
          <Badge variant={status.variant}>{status.label}</Badge>
        </Stack>
        <Stack justify="between" align="center">
          <Text variant="sub">
            {formatDates(item.dates)} · {item.quantity}개
          </Text>
          <Text size="sm" weight="bold">
            ₩ {item.lineTotal.toLocaleString()}
          </Text>
        </Stack>
      </Stack>
    </Card>
  );
}

export default function ReservationDetailPage() {
  const params = useParams<{ id: string }>();
  const { session, loading: authLoading } = useCustomerAuth();
  const [booking, setBooking] = useState<CustomerBooking | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  // 이 예약에 든 상품 종류(중복 없이, 항목 순서대로). 상품 상세 조회가 끝나기 전·실패했을 땐 비어 있다.
  const [categories, setCategories] = useState<AssetCategory[]>([]);

  useEffect(() => {
    if (authLoading || !session) return;
    let active = true;
    api.customerBookings
      .detail(params.id)
      .then((res) => {
        if (active) setBooking(res);
      })
      .catch((err: unknown) => {
        if (!active) return;
        if (err instanceof ApiError && err.status === 404) {
          setNotFound(true);
        } else {
          setError(err instanceof ApiError ? err.message : "예약 정보를 불러오지 못했습니다.");
        }
      });
    return () => {
      active = false;
    };
  }, [authLoading, session, params.id]);

  // 예약이 로드되면 항목의 상품 종류를 알아낸다(같은 상품은 한 번만 조회). 실패한 상품은 건너뛴다.
  useEffect(() => {
    if (!booking) return;
    let active = true;
    const productIds = [...new Set(booking.items.map((item) => item.productId))];
    Promise.allSettled(productIds.map((id) => api.customerProducts.detail(id))).then((results) => {
      if (!active) return;
      const found: AssetCategory[] = [];
      for (const result of results) {
        if (result.status === "fulfilled" && !found.includes(result.value.category)) found.push(result.value.category);
      }
      setCategories(found);
    });
    return () => {
      active = false;
    };
  }, [booking]);

  const body = (() => {
    if (authLoading) return null;
    if (!session) {
      return (
        <Stack direction="column" gap="md" className="mt-6">
          <Text tone="secondary">예약 상세는 로그인 후 확인할 수 있습니다.</Text>
          <Button href={`/login?redirect=${encodeURIComponent(`/reservations/${params.id}`)}`}>로그인</Button>
        </Stack>
      );
    }
    if (error) {
      return (
        <Alert status="error" className="mt-4">
          {error}
        </Alert>
      );
    }
    if (!booking) {
      return (
        <Text variant="sub" className="mt-4">
          불러오는 중…
        </Text>
      );
    }
    return (
      <>
        <ScrollReveal>
          <Card className="mt-4 text-center">
            <Text variant="sub">예약번호</Text>
            <Text size="xl" weight="bold" className="mt-1">
              {booking.bookingNumber}
            </Text>
            <Stack gap="xs" justify="center" className="mt-2">
              <BookingStatusBadge status={booking.status} />
              {booking.partiallyCancelled && <Badge variant="warning">부분취소</Badge>}
            </Stack>
            <Text variant="sub" className="mt-2">
              현장에서 이 예약번호를 보여 주세요.
            </Text>
          </Card>
        </ScrollReveal>

        <ScrollReveal delay={100}>
          <Kv
            dot
            className="mt-4"
            items={[
              { key: "여권명", value: booking.passportName },
              { key: "예약일", value: formatDate(booking.createdAt) },
            ]}
          />
        </ScrollReveal>

        <ScrollReveal delay={150}>
          <Stack direction="column" gap="sm" className="mt-4">
            <Title size="sm" leaf tone="secondary">
              예약 항목 ({booking.items.length}건)
            </Title>
            {booking.items.map((item) => (
              <ItemCard key={item.bookingItemId} item={item} />
            ))}
            {/* 합계 위 구분선 — 위 Kv(여권명/예약일)의 구분선과 같은 점선. border-line은 색만 정하므로 굵기(border-t)가 꼭 있어야 그려진다. */}
            <div className="border-t border-line" />
            {/* 합계 금액은 이 화면에서 가장 중요한 숫자라 다른 값보다 크고 굵게(값만 — 라벨은 그대로). */}
            <Kv
              items={[
                {
                  key: "합계 :",
                  value: (
                    <Text as="span" size="lg" weight="extrabold">
                      ₩ {booking.activeTotalAmount.toLocaleString()}
                    </Text>
                  ),
                },
              ]}
            />
          </Stack>
        </ScrollReveal>

        {/* 예약한 뒤에도 사용법을 바로 찾을 수 있게 — 고객지원 '사용방법' 탭으로 이어진다. */}
        <ScrollReveal delay={200}>
          <Stack direction="column" gap="sm" className="mt-6">
            {categories.length > 0 ? (
              categories.map((category) => (
                <Button key={category} href={`/contact?tab=usage&category=${category}`} variant="outline" fullWidth>
                  {CATEGORY_LABEL[category]} 사용방법 보기
                </Button>
              ))
            ) : (
              <Button href="/contact?tab=usage" variant="outline" fullWidth>
                사용방법 보기
              </Button>
            )}
            {booking.cancellable && (
              <Button href={`/reservations/${booking.bookingId}/cancel`} fullWidth >
                취소 요청
              </Button>
            )}
          </Stack>
        </ScrollReveal>

        
      </>
    );
  })();

  // 존재하지 않는 예약은 /menu(splash 첫 사례)와 같은 이유로 페이지 전체를 이 화면으로
  // 채운다 — 짙은 배경의 랜딩 화면 위에 밝은 소메뉴 배너·"이전 페이지로 이동" 링크가 겹치면
  // 어색해서, Banner도 본문 wrapper(max-w-2xl)도 없이 통째로 반환한다.
  if (notFound) {
    return (
      <ComingSoon
        variant="splash"
        image="/reservation-not-found-bg.jpg"
        title="예약을 찾을 수 없어요"
        label={
          <>
            현재 예약이 존재하지 않습니다.
            <br />
            예약번호나 링크를 다시 확인해 주세요.
          </>
        }
      />
    );
  }

  return (
    <main>
      {/* 소메뉴 배너는 소속된 대메뉴("내정보/내 예약")의 이름을 그대로 쓴다 */}
      <Banner size="sm" title="내 예약" image="/banner-contact.png" />

      <div className="mx-auto max-w-2xl p-6">
        <Stack direction="column" gap="sm">
          <NextLink href="/mypage" className="text-sm text-muted hover:underline">
            ← 이전 페이지로 이동
          </NextLink>
          <Title size="lg">예약 상세</Title>
        </Stack>

        {body}
      </div>
    </main>
  );
}
