"use client";

import { useCallback, useEffect, useState } from "react";
import NextLink from "next/link";
import { useParams } from "next/navigation";
import {
  Title,
  Text,
  EmptyState,
  Card,
  Stack,
  Badge,
  Kv,
  Button,
  ConfirmPopup,
  Toast,
  Alert,
  FormMessage,
  type ToastStatus,
} from "@chinguya/ui";
import { INVOICE_SETTLEMENT_LABEL, RENTAL_OPTION_LABEL } from "@chinguya/types";
import { createApiClient, ApiError, type AdminInvoiceDetail } from "@chinguya/api-client";
import { useAdminAuth } from "@/context/AdminAuthContext";

const api = createApiClient();

/**
 * 인보이스 상세(`a-invoicedetail`, S2-A6). 목록(S2-A5)에서 카드를 눌러 들어온다.
 * 계약: api-spec/openapi/chinguya-admin-api.yaml.
 *
 * 라인 = 그 달에 이용일이 든 **완료·취소** 예약 1건. 합계(정산 반영액)는
 * **완료 예약 금액 합 + 취소 예약의 취소 수수료 합**이다 — 취소 건은 예약 금액이 아니라
 * 수수료만 반영되므로, 줄마다 status 를 함께 읽어야 금액의 뜻이 정해진다.
 *
 * 합계를 화면에서 더하지 않고 서버의 `totalAmount` 를 그대로 쓴다. 여행사가 보는 인보이스
 * (S2-G7)와 같은 집계라, 화면이 각자 더하면 두 값이 어긋날 수 있다.
 *
 * '입금 확인' 노출은 서버 플래그 `settleable` 로 가른다(S1-A7 `depositConfirmable` 과 같은
 * 관례 — 화면이 상태를 해석하지 않는다). 슈퍼어드민만 누를 수 있고, 버튼 숨김은 정합성용이며
 * 최종 차단은 서버 403 이다.
 */
export default function AdminInvoiceDetailPage() {
  const params = useParams<{ id: string }>();
  const { isSuperAdmin } = useAdminAuth();

  const [invoice, setInvoice] = useState<AdminInvoiceDetail | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastStatus, setToastStatus] = useState<ToastStatus>("success");

  const loadInvoice = useCallback(async () => {
    try {
      const response = await api.adminInvoices.detail(params.id);
      setLoadError(null);
      setInvoice(response);
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : "인보이스를 불러오지 못했습니다.");
    }
  }, [params.id]);

  useEffect(() => {
    void loadInvoice();
  }, [loadInvoice]);

  const handleConfirmDeposit = async () => {
    setConfirmOpen(false);
    setSubmitting(true);
    try {
      // 로컬에서 낙관적으로 바꾸지 않고 서버 응답으로 갈아끼운다 — 정산 시각도 서버 값이다.
      setInvoice(await api.adminInvoices.settle(params.id));
      setToastStatus("success");
      setToastMessage("입금 확인 처리되었습니다");
    } catch (err) {
      // 그사이 다른 관리자가 먼저 확인했을 수 있다(409) — 서버 문구를 그대로 보여준다.
      setToastStatus("error");
      setToastMessage(err instanceof ApiError ? err.message : "입금 확인에 실패했습니다.");
      void loadInvoice();
    } finally {
      setSubmitting(false);
    }
  };

  if (loadError) {
    return (
      <main className="mx-auto max-w-2xl p-6">
        <NextLink href="/invoices" className="text-sm text-muted hover:underline">
          ← 인보이스 목록으로
        </NextLink>
        <Alert status="error" icon={true} className="mt-4">
          {loadError}
        </Alert>
      </main>
    );
  }

  if (!invoice) {
    return (
      <main className="mx-auto max-w-2xl p-6">
        <Text variant="sub">불러오는 중…</Text>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl p-6">
      <Stack direction="column" gap="sm">
        <NextLink href="/invoices" className="text-sm text-muted hover:underline">
          ← 인보이스 목록으로
        </NextLink>
        <Title size="md" subtitle={invoice.period}>
          <span className="inline-flex items-center gap-2">
            {invoice.agencyName}{" "}
            <Badge variant={invoice.settled ? "success" : "warning"}>
              {invoice.settled ? INVOICE_SETTLEMENT_LABEL.settled : INVOICE_SETTLEMENT_LABEL.unsettled}
            </Badge>
          </span>
        </Title>
      </Stack>

      <Stack direction="column" gap="md" className="mt-4">
        <Kv
          items={[
            { key: "여행사 / 대상 월", value: `${invoice.agencyName} / ${invoice.period}` },
            { key: "발행일", value: invoice.issuedAt },
          ]}
        />

        <Text weight="bold" leaf>
          예약 라인아이템
        </Text>

        <Card padding="sm">
          {invoice.lineItems.map((item) => {
            const cancelled = item.status === "CANCELLED";
            return (
              <div
                key={item.reservationNumber}
                className="flex items-center justify-between gap-2 border-b border-dashed border-line py-3 text-sm last:border-b-0"
              >
                <Stack direction="column" gap="xs">
                  <Text weight="bold">{item.reservationNumber}</Text>
                  <Text variant="sub">
                    {item.assetName} · {RENTAL_OPTION_LABEL[item.optionType]} × {item.quantity}
                  </Text>
                  {/* 금액이 예약가인지 수수료인지 줄마다 밝혀 준다(와이어프레임 문구). */}
                  <Text variant="sub">{cancelled ? "취소 수수료만 반영" : "예약 금액 반영"}</Text>
                </Stack>
                <Stack direction="column" gap="xs" className="items-end">
                  <Text weight="bold">{item.amount.toLocaleString()}원</Text>
                  <Badge variant={cancelled ? "error" : "success"}>{cancelled ? "취소" : "완료"}</Badge>
                </Stack>
              </div>
            );
          })}

          {invoice.lineItems.length === 0 && <EmptyState>해당 기간에 예약 내역이 없습니다.</EmptyState>}
        </Card>

        <Kv items={[{ key: "합계 (정산 반영액)", value: `₩ ${invoice.totalAmount.toLocaleString()}` }]} />

        {invoice.settleable && (
          <Stack direction="column" gap="sm">
            {isSuperAdmin ? (
              <>
                <Button onClick={() => setConfirmOpen(true)} disabled={submitting}>
                  입금 확인
                </Button>
                <Text variant="sub">
                  여행사로부터 인보이스 금액 입금을 확인한 뒤 눌러주세요. PG 미사용, 관리자 수동 확인.
                </Text>
              </>
            ) : (
              <FormMessage type="helper">입금 확인은 슈퍼어드민만 할 수 있습니다.</FormMessage>
            )}
          </Stack>
        )}
      </Stack>

      <ConfirmPopup
        open={confirmOpen}
        title="정말 입금을 확인했습니까?"
        message="입금을 확인하셨다면 확인 버튼을 눌러주세요. 되돌릴 수 없습니다."
        confirmLabel="확인"
        danger={false}
        onConfirm={() => void handleConfirmDeposit()}
        onClose={() => setConfirmOpen(false)}
      />
      <Toast
        open={!!toastMessage}
        status={toastStatus}
        onClose={() => setToastMessage(null)}
        message={toastMessage ?? ""}
      />
    </main>
  );
}
