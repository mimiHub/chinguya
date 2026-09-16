"use client";

import { useEffect, useState } from "react";
import NextLink from "next/link";
import {
  createApiClient,
  ApiError,
  type CustomerBookingListStatus,
  type CustomerBookingStatus,
  type CustomerBookingSummary,
} from "@chinguya/api-client";
import type { CustomerReservationStatus } from "@chinguya/types";
import { Title, Text, EmptyState, Stack, Tab, StatusBadge, Badge, Banner, Card, Button, Alert } from "@chinguya/ui";
import { useCustomerAuth } from "@/context/CustomerAuthContext";
import { ScrollReveal } from "@/components/ScrollReveal";

/**
 * S1-C5 예약 목록(내 예약). 로그인한 고객의 예약을 상태 탭(전체/접수/완료/취소)으로 조회한다.
 *
 * Core API 실연동: GET /v1/bookings?status=&page=&size= (최근 예약 먼저).
 * 계약은 packages/api-spec/openapi/chinguya-slice1-openapi.yaml.
 *
 * - 입금대기·취소요청은 별도 탭 없이 '전체' 안에서 상태 태그로만 보인다.
 * - 한 예약에 항목이 여럿이면 카드 제목을 "대표 상품명 외 N건"으로, 일부만 취소됐으면 '부분취소' 뱃지.
 */

const api = createApiClient();
const PAGE_SIZE = 20;

const TABS: { key: CustomerBookingListStatus; label: string }[] = [
  { key: "ALL", label: "전체" },
  { key: "RECEIVED", label: "접수" },
  { key: "COMPLETED", label: "완료" },
  { key: "CANCELLED", label: "취소" },
];

function BookingStatusBadge({ status }: { status: CustomerBookingStatus }) {
  if (status === "AWAITING_DEPOSIT") return <Badge variant="gray">입금대기</Badge>;
  return <StatusBadge status={status.toLowerCase() as CustomerReservationStatus} />;
}

function cardTitle(booking: CustomerBookingSummary): string {
  return booking.itemCount > 1 ? `${booking.productName} 외 ${booking.itemCount - 1}건` : booking.productName;
}

function formatUseDates(dates: string[]): string {
  const first = dates[0] ?? "";
  return dates.length > 1 ? `${first} 외 ${dates.length - 1}일` : first;
}

export default function MyPage() {
  const { session, loading: authLoading } = useCustomerAuth();
  const [tab, setTab] = useState<CustomerBookingListStatus>("ALL");
  const [bookings, setBookings] = useState<CustomerBookingSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 탭이 바뀌거나 페이지를 더 부르면 목록을 읽는다. 0페이지면 새로 채우고, 그 뒤는 이어 붙인다.
  useEffect(() => {
    if (authLoading || !session) return;
    let active = true;
    setLoading(true);
    setError(null);
    api.customerBookings
      .list(tab, page, PAGE_SIZE)
      .then((res) => {
        if (!active) return;
        setBookings((prev) => (page === 0 ? res.content : [...prev, ...res.content]));
        setTotal(res.totalElements);
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof ApiError ? err.message : "예약 목록을 불러오지 못했습니다.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [authLoading, session, tab, page]);

  const changeTab = (key: CustomerBookingListStatus) => {
    setTab(key);
    setPage(0);
    setBookings([]);
  };

  const body = (() => {
    if (authLoading) return null;
    if (!session) {
      return (
        <Stack direction="column" gap="md" className="mt-6">
          <Text tone="secondary">내 예약은 로그인 후 확인할 수 있습니다.</Text>
          <Button href={`/login?redirect=${encodeURIComponent("/mypage")}`}>로그인</Button>
        </Stack>
      );
    }
    return (
      <>
        <Tab
          variant="capsule"
          items={TABS}
          activeKey={tab}
          onChange={(key) => changeTab(key as CustomerBookingListStatus)}
          className="mt-4"
        />

        {error && (
          <Alert status="error" className="mt-4">
            {error}
          </Alert>
        )}

        <Stack direction="column" gap="sm" className="mt-4">
          {bookings.map((booking, i) => (
            // 카드 자체가 이미 그림자·둥근 모서리로 구분되는 목록이라 divider(점선 구분선)는
            // 켜지 않는다 — 켜면 그림자 카드 사이에 어색하게 선이 겹쳐 보인다.
            <ScrollReveal key={booking.bookingId} delay={Math.min(i, 10) * 60}>
              <NextLink href={`/reservations/${booking.bookingId}`} className="block">
                <Card className="flex items-center justify-between gap-2 py-3 text-sm">
                  <Stack direction="column" gap="xs">
                    <Text weight="medium">{cardTitle(booking)}</Text>
                    <Text variant="sub">
                      {booking.bookingNumber} · {formatUseDates(booking.useDates)} · ₩{" "}
                      {booking.activeTotalAmount.toLocaleString()}
                    </Text>
                  </Stack>
                  <Stack gap="xs" align="center" className="shrink-0">
                    <BookingStatusBadge status={booking.status} />
                    {booking.partiallyCancelled && <Badge variant="warning">부분취소</Badge>}
                  </Stack>
                </Card>
              </NextLink>
            </ScrollReveal>
          ))}
        </Stack>

        {loading && (
          <Text variant="sub" className="mt-4">
            불러오는 중…
          </Text>
        )}

        {!loading && !error && bookings.length === 0 && (
          <EmptyState className="mt-8">
            {tab === "ALL" ? "아직 예약 내역이 없습니다." : "해당 상태의 예약이 없습니다."}
          </EmptyState>
        )}

        {!loading && bookings.length < total && (
          <Button variant="outline" fullWidth className="mt-4" onClick={() => setPage((p) => p + 1)}>
            더 보기
          </Button>
        )}
      </>
    );
  })();

  return (
    <main>
      {/* 하단 탭 대메뉴 화면(내 예약)이라 배너를 크게 쓴다 */}
      <Banner size="lg" title="예약 목록" image="/banner-mypage.png" />

      <div className="mx-auto max-w-2xl p-6">
        <Title size="lg">내 예약</Title>
        {body}
      </div>
    </main>
  );
}
