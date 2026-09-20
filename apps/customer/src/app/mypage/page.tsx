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
import {
  Title,
  Text,
  EmptyState,
  Stack,
  Tab,
  StatusBadge,
  Badge,
  Banner,
  Card,
  Button,
  Toast,
} from "@chinguya/ui";
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
 * - 목록을 못 불러오면(권한 없음 등) 화면 안에 경고 박스를 두지 않고 하단 토스트로 잠깐 알린다.
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
  return booking.itemCount > 1
    ? `${booking.productName} 외 ${booking.itemCount - 1}건`
    : booking.productName;
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
  // 토스트가 사라져도 error(불러오기 실패 여부)는 남겨야 "예약 내역이 없습니다"가 잘못 뜨지 않는다 — 그래서 토스트 표시만 따로 둔다.
  const [errorToastOpen, setErrorToastOpen] = useState(false);

  // 탭이 바뀌거나 페이지를 더 부르면 목록을 읽는다. 0페이지면 새로 채우고, 그 뒤는 이어 붙인다.
  useEffect(() => {
    if (authLoading || !session) return;
    let active = true;
    setLoading(true);
    setError(null);
    setErrorToastOpen(false);
    api.customerBookings
      .list(tab, page, PAGE_SIZE)
      .then((res) => {
        if (!active) return;
        setBookings((prev) => (page === 0 ? res.content : [...prev, ...res.content]));
        setTotal(res.totalElements);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(err instanceof ApiError ? err.message : "예약 목록을 불러오지 못했습니다.");
        setErrorToastOpen(true);
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
        <>
          <Text tone="secondary">내 예약은 로그인 후 확인할 수 있습니다.</Text>
          <Button href={`/login?redirect=${encodeURIComponent("/mypage")}`}>로그인</Button>
        </>
      );
    }
    return (
      <>
        <Tab
          variant="capsule"
          items={TABS}
          activeKey={tab}
          onChange={(key) => changeTab(key as CustomerBookingListStatus)}
        />

        {/* 목록이 비어 있을 땐 그리지 않는다 — 안 그리면 바깥 Stack의 gap에도 끼지 않아 탭과 빈 상태 안내
            사이가 벌어지지 않는다. */}
        {bookings.length > 0 && (
          <Stack direction="column" gap="sm">
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
        )}

        {loading && <Text variant="sub">불러오는 중…</Text>}

        {/* 불러오기에 실패했을 때도 빈 목록과 같은 카드로 안내한다(토스트는 3초 뒤 사라지므로, 화면이 텅 비어 보이지 않게). */}
        {!loading && bookings.length === 0 && (
          <EmptyState variant="card">
            {error
              ? "예약 목록을 불러오지 못했습니다."
              : tab === "ALL"
                ? "아직 예약 내역이 없습니다."
                : "해당 상태의 예약이 없습니다."}
          </EmptyState>
        )}

        {!loading && bookings.length < total && (
          <Button variant="outline" fullWidth onClick={() => setPage((p) => p + 1)}>
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

      {/* 제목·탭·목록·안내 사이 간격은 각 요소에 margin을 따로 주지 않고 이 Stack의 gap 하나로 통일한다.
          (요소마다 mt-*를 주면 조건부로 안 그려지는 요소의 여백이 남아 간격이 들쭉날쭉해진다.) */}
      <div className="mx-auto max-w-2xl p-6">
        <Stack direction="column" gap="md">
          <Title size="lg">내 예약</Title>
          {body}
        </Stack>
      </div>

      <Toast
        open={errorToastOpen}
        onClose={() => setErrorToastOpen(false)}
        message={error ?? ""}
        status="error"
      />
    </main>
  );
}
