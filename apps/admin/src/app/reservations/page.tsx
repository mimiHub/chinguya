"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import NextLink from "next/link";
import {
  createApiClient,
  ApiError,
  type AdminBookingSummary,
  type AdminBookingTab,
} from "@chinguya/api-client";
import type { CustomerReservationStatus } from "@chinguya/types";
import { Title, Chip, Input, Card, Stack, Text, EmptyState, StatusBadge, Badge, Button, Alert } from "@chinguya/ui";

/**
 * S1-A6 예약 관리 목록. 고객 예약을 탭(접수/완료/미입금/취소요청/취소)별로 조회·검색한다.
 *
 * Core API 실연동: GET /admin/bookings?tab=&keyword=&page=&size= (최근 예약 먼저).
 * 계약은 packages/api-spec/openapi/chinguya-admin-api.yaml.
 *
 * - 접수 탭 = 입금대기·접수 중 입금 기한(생성+24시간) 안. 입금대기는 카드 태그로 구분한다.
 * - 미입금 탭 = 입금대기·접수인데 기한이 지난 예약(서버 계산값 `unpaid`).
 * - 카드 제목은 예약번호 + "대표 상품명 외 N건", 일부 항목만 취소됐으면 '부분취소' 뱃지.
 */

const api = createApiClient();
const PAGE_SIZE = 20;
const SEARCH_DELAY_MS = 300;

const TABS: { key: AdminBookingTab; label: string }[] = [
  { key: "RECEIVED", label: "접수" },
  { key: "COMPLETED", label: "완료" },
  { key: "UNPAID", label: "미입금" },
  { key: "CANCEL_REQUESTED", label: "취소요청" },
  { key: "CANCELLED", label: "취소" },
];

function StatusTag({ booking }: { booking: AdminBookingSummary }) {
  if (booking.unpaid) return <Badge variant="warning">미입금</Badge>;
  if (booking.status === "AWAITING_DEPOSIT") return <Badge variant="gray">입금대기</Badge>;
  return <StatusBadge status={booking.status.toLowerCase() as CustomerReservationStatus} />;
}

function cardTitle(booking: AdminBookingSummary): string {
  return booking.itemCount > 1 ? `${booking.productName} 외 ${booking.itemCount - 1}건` : booking.productName;
}

function formatUseDates(dates: string[]): string {
  const first = dates[0] ?? "";
  return dates.length > 1 ? `${first} 외 ${dates.length - 1}일` : first;
}

// useSearchParams()를 쓰는 컴포넌트는 Next.js가 정적 프리렌더링을 시도할 때 Suspense 경계 안에
// 있어야 한다(없으면 빌드 에러) — 그래서 실제 내용은 내부 컴포넌트로 분리하고, 기본 export에서
// Suspense로 감싼다.
export default function AdminReservationsPage() {
  return (
    <Suspense fallback={null}>
      <AdminReservationsPageInner />
    </Suspense>
  );
}

function AdminReservationsPageInner() {
  // 대시보드 지표 카드(신규예약/입금확인요청/취소요청)에서 넘어올 때 ?tab=unpaid 처럼
  // 쿼리스트링으로 어느 탭을 열어둘지 지정한다 — 값이 없거나 잘못된 값이면 기본값("접수") 사용.
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab")?.toUpperCase();
  const [tab, setTab] = useState<AdminBookingTab>(
    TABS.find((t) => t.key === initialTab)?.key ?? "RECEIVED",
  );
  const [keyword, setKeyword] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [bookings, setBookings] = useState<AdminBookingSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 입력이 멈춘 뒤에 검색한다 — 글자마다 서버를 부르지 않게.
  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(keyword.trim());
      setPage(0);
    }, SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [keyword]);

  // 0페이지면 새로 채우고, '더 보기'로 넘어간 페이지는 이어 붙인다.
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    api.bookings
      .list({ tab, keyword: query, page, size: PAGE_SIZE })
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
  }, [tab, query, page]);

  const changeTab = (key: AdminBookingTab) => {
    setTab(key);
    setPage(0);
    setBookings([]);
  };

  return (
    <main className="mx-auto max-w-2xl p-6">
      <Stack direction="column" gap="sm">
        <Title size="md">예약 관리</Title>
      </Stack>

      <Stack direction="column" gap="md" className="mt-4">
        <Chip.List scrollArrows>
          {TABS.map((t) => (
            <Chip key={t.key} on={tab === t.key} onClick={() => changeTab(t.key)}>
              {t.label}
            </Chip>
          ))}
        </Chip.List>

        <Input
          placeholder="검색 (예약번호·여권명)"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />

        {error && <Alert status="error">{error}</Alert>}

        <Stack direction="column" gap="sm">
          {!loading && !error && bookings.length === 0 && (
            <EmptyState>{query ? "검색 결과가 없습니다." : "해당 상태의 예약이 없습니다."}</EmptyState>
          )}
          {bookings.map((b) => (
            <NextLink key={b.bookingId} href={`/reservations/${b.bookingId}`} className="block">
              <Card padding="sm">
                <Stack justify="between" align="center">
                  <div className="min-w-0">
                    <Text weight="bold">
                      {b.bookingNumber}{" "}
                      <Text as="span" variant="sub">
                        · {cardTitle(b)}
                      </Text>
                    </Text>
                    <Text variant="sub">
                      {b.passportName} · {formatUseDates(b.useDates)} · ₩ {b.activeTotalAmount.toLocaleString()}
                    </Text>
                  </div>
                  <Stack gap="xs" align="center" className="shrink-0">
                    <StatusTag booking={b} />
                    {b.partiallyCancelled && <Badge variant="warning">부분취소</Badge>}
                  </Stack>
                </Stack>
              </Card>
            </NextLink>
          ))}
          {loading && <Text variant="sub">불러오는 중…</Text>}
          {!loading && bookings.length < total && (
            <Button variant="outline" fullWidth onClick={() => setPage((p) => p + 1)}>
              더 보기
            </Button>
          )}
        </Stack>
      </Stack>
    </main>
  );
}
