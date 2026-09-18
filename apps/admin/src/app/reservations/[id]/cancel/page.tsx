"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  createApiClient,
  ApiError,
  type AdminCancellationDetail,
  type AdminCancellationItem,
  type BookingItemStatus,
} from "@chinguya/api-client";
import { RENTAL_OPTION_LABEL } from "@chinguya/types";
import {
  Title,
  Kv,
  Badge,
  Button,
  Card,
  Text,
  Stack,
  Alert,
  NoticeBox,
  Popup,
  Input,
  LabeledBox,
  FormMessage,
  Toast,
} from "@chinguya/ui";
import { useAdminAuth } from "@/context/AdminAuthContext";

/**
 * S1-A9 취소요청 처리(`a-cancel`).
 *
 * Core API 실연동: GET /admin/bookings/{id} → pendingCancellationId, GET/POST
 * /admin/cancellations/{cancellationId}(/confirm). 계약은 packages/api-spec/openapi/chinguya-admin-api.yaml
 * (2026-09-18 추가 — 스펙은 확정됐지만 백엔드 배포는 별도라 지금은 404가 날 수 있다).
 *
 * - 화면 단위는 예약이 아니라 **취소 요청 1건**(한 예약에 여러 건 생길 수 있다 — 완료 예약은
 *   항목을 나눠서 여러 번 요청 가능). 진입은 예약의 pendingCancellationId로.
 * - 금액·요율은 전부 **고객이 요청한 시점의 스냅샷**이다 — 확정 시 다시 계산하지 않는다.
 * - 처리 버튼은 슈퍼어드민에게만 보인다(서버도 403으로 막는다).
 * - 진입: 예약 관리(취소요청 탭)의 예약 카드, 또는 예약 상세(S1-A7/A8)의 안내 배너.
 */

const api = createApiClient();
const CONFIRM_PHRASE = "환불 처리 했음";

const ITEM_BADGE: Record<BookingItemStatus, { label: string; variant: "success" | "info" | "gray" }> = {
  ACTIVE: { label: "유지", variant: "gray" },
  CANCEL_REQUESTED: { label: "다른 취소요청", variant: "gray" },
  CANCELLED: { label: "취소", variant: "gray" },
};

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

function itemLabel(item: AdminCancellationItem): string {
  return `${item.productName} · ${RENTAL_OPTION_LABEL[item.optionType]}`;
}

export default function AdminCancelRequestPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { isSuperAdmin } = useAdminAuth();

  const [cancellation, setCancellation] = useState<AdminCancellationDetail | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    api.bookings
      .detail(params.id)
      .then((booking) => {
        if (!active) return;
        if (!booking.pendingCancellationId) {
          setNotFound(true);
          return;
        }
        return api.cancellations.detail(booking.pendingCancellationId).then((c) => {
          if (active) setCancellation(c);
        });
      })
      .catch((err: unknown) => {
        if (active) setLoadError(err instanceof ApiError ? err.message : "취소 요청 정보를 불러오지 못했습니다.");
      });
    return () => {
      active = false;
    };
  }, [params.id]);

  const openModal = () => {
    setConfirmText("");
    setActionError(null);
    setModalOpen(true);
  };

  const handleComplete = async () => {
    if (!cancellation) return;
    setSubmitting(true);
    setActionError(null);
    try {
      const updated = await api.cancellations.confirm(cancellation.cancellationId);
      setCancellation(updated);
      setModalOpen(false);
      setConfirmText("");
      setToast(
        updated.bookingStatus === "CANCELLED"
          ? "취소가 확정되고 환불 처리됐어요. 예약이 취소로 바뀌었어요."
          : "요청 항목만 취소 확정됐어요. 남은 유효 항목은 그대로 유지돼요(부분취소).",
      );
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "처리하지 못했어요.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loadError) {
    return (
      <main className="mx-auto max-w-2xl p-6">
        <Title size="md">취소요청 처리</Title>
        <Alert status="error" className="mt-4">
          {loadError}
        </Alert>
      </main>
    );
  }

  if (notFound) {
    return (
      <main className="mx-auto max-w-2xl p-6">
        <Title size="md">취소요청 처리</Title>
        <Alert status="info" className="mt-4">
          이 예약에 처리할 취소 요청이 없어요. 이미 처리됐거나 취소 요청이 취소됐을 수 있어요.
        </Alert>
        <Button variant="outline" fullWidth className="mt-4" onClick={() => router.push(`/reservations/${params.id}`)}>
          예약 상세로 이동
        </Button>
      </main>
    );
  }

  if (!cancellation) {
    return (
      <main className="mx-auto max-w-2xl p-6">
        <Title size="md">취소요청 처리</Title>
        <Text variant="sub" className="mt-4">
          불러오는 중…
        </Text>
      </main>
    );
  }

  const requestedItems = cancellation.items.filter((i) => i.requested);
  const keptItems = cancellation.items.filter((i) => !i.requested);

  return (
    <main className="mx-auto max-w-2xl p-6">
      <Title size="md" subtitle={cancellation.bookingNumber}>
        <span className="inline-flex items-center gap-2">
          취소요청 처리 <Badge variant="info">취소요청</Badge>
          {!cancellation.confirmable && <Badge variant="gray">처리완료</Badge>}
        </span>
      </Title>

      <Text variant="sub" className="mt-4">
        고객이 취소 요청한 항목 ({requestedItems.length} / {cancellation.items.length}건) · 요청일시{" "}
        {formatDateTime(cancellation.requestedAt)}
      </Text>

      <Stack direction="column" gap="sm" className="mt-2">
        {requestedItems.map((item) => (
          <Card key={item.bookingItemId} padding="sm">
            <Stack direction="column" gap="xs">
              <Stack justify="between" align="center">
                <Text weight="bold">{itemLabel(item)}</Text>
                <Badge variant="info">취소요청</Badge>
              </Stack>
              <Stack justify="between" align="center">
                <Text variant="sub">이용일 · 수량</Text>
                <Text size="sm">
                  {formatDates(item.dates)} · ×{item.quantity}
                </Text>
              </Stack>
              <Stack justify="between" align="center">
                <Text variant="sub">금액 · 수수료율</Text>
                <Text size="sm">
                  ₩ {item.lineTotal.toLocaleString()} · D-{item.daysToUse ?? 0}{" "}
                  {item.feeRate != null ? Math.round(item.feeRate * 1000) / 10 : 0}% (− ₩{" "}
                  {(item.cancellationFee ?? 0).toLocaleString()})
                </Text>
              </Stack>
            </Stack>
          </Card>
        ))}

        {keptItems.map((item) => {
          const badge = ITEM_BADGE[item.status];
          return (
            <Card key={item.bookingItemId} padding="sm" className="opacity-60">
              <Stack direction="column" gap="xs">
                <Stack justify="between" align="center">
                  <Text weight="bold">{itemLabel(item)}</Text>
                  <Badge variant={badge.variant}>{badge.label}</Badge>
                </Stack>
                <Stack justify="between" align="center">
                  <Text variant="sub">이용일 · 수량</Text>
                  <Text size="sm">
                    {formatDates(item.dates)} · ×{item.quantity}
                  </Text>
                </Stack>
              </Stack>
            </Card>
          );
        })}
      </Stack>

      <Kv
        className="mt-4"
        items={[
          { key: "요청 항목 결제액", value: `₩ ${cancellation.selectedAmount.toLocaleString()}` },
          { key: "취소 수수료(항목별 합산)", value: `− ₩ ${cancellation.cancellationFee.toLocaleString()}` },
          { key: "환불 예정액", value: `₩ ${cancellation.refundAmount.toLocaleString()}` },
          {
            key: "고객 환불계좌",
            value: `${cancellation.refundAccount.bankName} ${cancellation.refundAccount.accountNumber} (${cancellation.refundAccount.accountHolder})`,
          },
          ...(cancellation.reason ? [{ key: "취소 사유", value: cancellation.reason }] : []),
        ]}
      />

      <NoticeBox tone="gray" className="mt-4">
        <Text size="sm" variant="sub">
          수수료는 <b>항목별 이용일 기준 차등</b>으로 각각 계산해 <b>합산</b>한다. 환불 이체는 <b>수동</b>,
          이체 후 &apos;취소&apos; 처리 → <b>해당 항목·날짜의 재고만</b> 즉시 복원.
          <br />
          {cancellation.scope === "FULL" ? (
            <>
              요청 항목이 <b>예약 전체</b>라 확정하면 예약 상태가 <b>취소</b>로 바뀐다.
            </>
          ) : (
            <>
              <b>부분취소</b>라 확정해도 남은 유효 항목은 그대로 두고 예약에{" "}
              <b>&apos;부분취소&apos; 뱃지</b>만 붙는다.
            </>
          )}
        </Text>
      </NoticeBox>

      {actionError && (
        <Alert status="error" className="mt-4">
          {actionError}
        </Alert>
      )}

      {!cancellation.confirmable && (
        <Alert status="success" className="mt-6">
          {formatDateTime(cancellation.processedAt ?? cancellation.requestedAt)}에 이미 처리된 취소 요청이에요.
        </Alert>
      )}

      {cancellation.confirmable &&
        (isSuperAdmin ? (
          <Button className="mt-6" fullWidth onClick={openModal} disabled={submitting}>
            요청 항목 취소 확정(환불완료)
          </Button>
        ) : (
          <FormMessage type="helper" className="mt-6 block">
            취소요청 처리는 슈퍼어드민만 할 수 있어요.
          </FormMessage>
        ))}

      <Popup open={modalOpen} onClose={() => setModalOpen(false)} title="취소 확정">
        <Stack direction="column" gap="md">
          <Text>
            고객에게 <b>환불을 완료하셨나요?</b>
          </Text>
          <LabeledBox
            label="확인 문구"
            required
            helper={`입력값이 '${CONFIRM_PHRASE}'과 일치해야 완료 버튼이 활성화돼요.`}
          >
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={CONFIRM_PHRASE}
              disabled={submitting}
            />
          </LabeledBox>
          <Stack gap="sm">
            <Button variant="outline" fullWidth onClick={() => setModalOpen(false)} disabled={submitting}>
              닫기
            </Button>
            <Button
              fullWidth
              disabled={confirmText !== CONFIRM_PHRASE || submitting}
              loading={submitting}
              onClick={handleComplete}
            >
              완료
            </Button>
          </Stack>
        </Stack>
      </Popup>

      <Toast open={!!toast} onClose={() => setToast(null)} message={toast ?? ""} />
    </main>
  );
}
