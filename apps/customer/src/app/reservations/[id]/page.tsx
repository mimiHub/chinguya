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
import { RENTAL_OPTION_LABEL, type CustomerReservationStatus } from "@chinguya/types";
import { Title, Text, Stack, Card, Kv, StatusBadge, Badge, Button, Banner, Alert } from "@chinguya/ui";
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
 */

const api = createApiClient();

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

  useEffect(() => {
    if (authLoading || !session) return;
    let active = true;
    api.customerBookings
      .detail(params.id)
      .then((res) => {
        if (active) setBooking(res);
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof ApiError ? err.message : "예약 정보를 불러오지 못했습니다.");
      });
    return () => {
      active = false;
    };
  }, [authLoading, session, params.id]);

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
            className="mt-4"
            items={[
              { key: "여권명", value: booking.passportName },
              { key: "예약일", value: formatDate(booking.createdAt) },
            ]}
          />
        </ScrollReveal>

        <ScrollReveal delay={150}>
          <Stack direction="column" gap="sm" className="mt-4">
            <Text weight="bold">예약 항목 ({booking.items.length}건)</Text>
            {booking.items.map((item) => (
              <ItemCard key={item.bookingItemId} item={item} />
            ))}
            <Kv items={[{ key: "합계(유효 항목)", value: `₩ ${booking.activeTotalAmount.toLocaleString()}` }]} />
          </Stack>
        </ScrollReveal>

        {booking.cancellable && (
          <Button href={`/reservations/${booking.bookingId}/cancel`} fullWidth className="mt-6">
            취소 요청
          </Button>
        )}
      </>
    );
  })();

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
