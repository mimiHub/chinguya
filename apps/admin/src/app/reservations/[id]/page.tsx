"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  createApiClient,
  ApiError,
  type AdminBookingDetail,
  type BookingItemStatus,
} from "@chinguya/api-client";
import { RENTAL_OPTION_LABEL, type CustomerReservationStatus } from "@chinguya/types";
import {
  Title,
  Kv,
  StatusBadge,
  Badge,
  Button,
  Card,
  Text,
  Toast,
  FormMessage,
  Stack,
  Alert,
  ConfirmPopup,
} from "@chinguya/ui";
import { useAdminAuth } from "@/context/AdminAuthContext";

/**
 * S1-A7/A8 예약 상세 · 입금확인(`a-resdetail`).
 *
 * Core API 실연동: GET /admin/bookings/{id}, POST /admin/bookings/{id}/deposit-confirm,
 * POST /admin/bookings/{id}/force-cancel. 계약은 packages/api-spec/openapi/chinguya-admin-api.yaml.
 *
 * - 1 예약번호 = N 항목, 입금액은 유효 항목 합계.
 * - 입금 확인 → 완료. 접수 후 24시간(입금 기한)이 지나면 '미입금' → 예약 전체 강제 취소(재고 즉시 복원).
 * - 처리 버튼은 슈퍼어드민에게만 보인다(서버도 403으로 막는다).
 * - 취소요청 처리(S1-A9)는 별도 화면(`/reservations/{id}/cancel`)에서 다룬다 — 처리 안 된
 *   취소 요청이 있으면(`pendingCancellationId`) 아래 안내 배너로 그 화면으로 보낸다.
 */

const api = createApiClient();

const ITEM_STATUS: Record<BookingItemStatus, { label: string; variant: "success" | "info" | "gray" }> = {
  ACTIVE: { label: "유효", variant: "success" },
  CANCEL_REQUESTED: { label: "취소요청", variant: "info" },
  CANCELLED: { label: "취소", variant: "gray" },
};

type Action = "confirm" | "forceCancel";

function StatusTag({ booking }: { booking: AdminBookingDetail }) {
  if (booking.unpaid) return <Badge variant="warning">미입금</Badge>;
  if (booking.status === "AWAITING_DEPOSIT") return <Badge variant="gray">입금대기</Badge>;
  return <StatusBadge status={booking.status.toLowerCase() as CustomerReservationStatus} />;
}

function formatDates(dates: string[]): string {
  const first = dates[0] ?? "";
  const last = dates[dates.length - 1] ?? "";
  return dates.length > 1 ? `${first} ~ ${last}` : first;
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function priceText(value: number) {
  return (
    <Text as="span" size="sm" weight="bold">
      ₩ {value.toLocaleString()}
    </Text>
  );
}

export default function AdminReservationDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { isSuperAdmin } = useAdminAuth();
  const [booking, setBooking] = useState<AdminBookingDetail | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pending, setPending] = useState<Action | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; nextTab: string } | null>(null);

  useEffect(() => {
    let active = true;
    api.bookings
      .detail(params.id)
      .then((res) => {
        if (active) setBooking(res);
      })
      .catch((err: unknown) => {
        if (active) setLoadError(err instanceof ApiError ? err.message : "예약 정보를 불러오지 못했습니다.");
      });
    return () => {
      active = false;
    };
  }, [params.id]);

  const runAction = async () => {
    if (!booking || !pending) return;
    setSubmitting(true);
    setActionError(null);
    try {
      if (pending === "confirm") {
        setBooking(await api.bookings.confirmDeposit(booking.bookingId));
        setToast({ message: "입금 확인 처리되었습니다", nextTab: "completed" });
      } else {
        setBooking(await api.bookings.forceCancel(booking.bookingId));
        setToast({ message: "미입금으로 강제 취소 처리되었습니다", nextTab: "cancelled" });
      }
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "처리하지 못했습니다.");
    } finally {
      setSubmitting(false);
      setPending(null);
    }
  };

  if (loadError) {
    return (
      <main className="mx-auto max-w-2xl p-6">
        <Title size="md">예약 상세</Title>
        <Alert status="error" className="mt-4">
          {loadError}
        </Alert>
      </main>
    );
  }

  if (!booking) {
    return (
      <main className="mx-auto max-w-2xl p-6">
        <Title size="md">예약 상세</Title>
        <Text variant="sub" className="mt-4">
          불러오는 중…
        </Text>
      </main>
    );
  }

  const remainingHours = booking.depositDueBy
    ? Math.max(0, Math.ceil((new Date(booking.depositDueBy).getTime() - Date.now()) / (60 * 60 * 1000)))
    : null;

  return (
    <main className="mx-auto max-w-2xl p-6">
      <Title size="md" subtitle={booking.bookingNumber}>
        <span className="inline-flex items-center gap-2">
          예약 상세 <StatusTag booking={booking} />
          {booking.partiallyCancelled && <Badge variant="gray">부분취소</Badge>}
        </span>
      </Title>

      <Kv
        className="mt-4"
        items={[
          { key: "고객 / 여권명", value: `${booking.customerLoginId} / ${booking.passportName}` },
          { key: "예약 시각", value: formatDateTime(booking.createdAt) },
          ...(booking.depositDueBy ? [{ key: "입금 기한", value: formatDateTime(booking.depositDueBy) }] : []),
        ]}
      />

      <Stack direction="column" gap="sm" className="mt-4">
        <Text weight="bold">예약 항목 ({booking.items.length}건)</Text>
        {booking.items.map((item) => {
          const status = ITEM_STATUS[item.status];
          return (
            <Card key={item.bookingItemId} padding="sm" className={item.status === "CANCELLED" ? "opacity-50" : undefined}>
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
                  {priceText(item.lineTotal)}
                </Stack>
              </Stack>
            </Card>
          );
        })}
        <Kv items={[{ key: "입금액(유효 항목)", value: priceText(booking.activeTotalAmount) }]} />
      </Stack>

      {booking.pendingCancellationId && (
        <Alert status="info" className="mt-4">
          <Stack direction="column" gap="sm">
            <Text size="sm">취소 요청된 항목이 있어요. 항목별 수수료·환불액을 확인하고 처리하세요.</Text>
            <Button size="sm" onClick={() => router.push(`/reservations/${booking.bookingId}/cancel`)}>
              취소요청 처리하러 가기
            </Button>
          </Stack>
        </Alert>
      )}

      {actionError && (
        <Alert status="error" className="mt-4">
          {actionError}
        </Alert>
      )}

      {booking.depositConfirmable && (
        <Stack direction="column" gap="sm" className="mt-6">
          {isSuperAdmin ? (
            <>
              <Button onClick={() => setPending("confirm")} disabled={submitting}>
                입금 확인 → 완료 처리
              </Button>
              <Text variant="sub">
                접수 후 24시간 내 미입금 시 &apos;미입금&apos; 표시 → 강제 취소 가능(예약 전체, 재고 즉시 복원).
              </Text>
              <Button
                variant="subtle"
                onClick={() => setPending("forceCancel")}
                disabled={!booking.forceCancellable || submitting}
              >
                미입금 강제 취소
              </Button>
              {!booking.forceCancellable && remainingHours !== null && (
                <FormMessage type="helper">
                  아직 미입금 처리 시점이 아니에요.
                  <br />
                  {remainingHours}시간 뒤부터 강제 취소할 수 있어요.
                </FormMessage>
              )}
            </>
          ) : (
            <FormMessage type="helper">입금 확인·강제 취소는 슈퍼어드민만 할 수 있어요.</FormMessage>
          )}
        </Stack>
      )}

      <ConfirmPopup
        open={pending === "confirm"}
        title="입금 확인"
        message={`${booking.bookingNumber} 예약을 입금 확인하고 완료 처리할까요? (입금액 ₩ ${booking.activeTotalAmount.toLocaleString()})`}
        confirmLabel="완료 처리"
        onConfirm={runAction}
        onClose={() => setPending(null)}
      />
      <ConfirmPopup
        open={pending === "forceCancel"}
        title="미입금 강제 취소"
        message={`${booking.bookingNumber} 예약 전체를 취소하고 재고를 복원합니다. 되돌릴 수 없어요.`}
        confirmLabel="강제 취소"
        danger
        onConfirm={runAction}
        onClose={() => setPending(null)}
      />

      <Toast
        open={!!toast}
        onClose={() => {
          const nextTab = toast?.nextTab;
          setToast(null);
          if (nextTab) router.push(`/reservations?tab=${nextTab}`);
        }}
        message={toast?.message ?? ""}
      />
    </main>
  );
}
