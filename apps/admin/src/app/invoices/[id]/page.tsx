"use client";

import { useState } from "react";
import NextLink from "next/link";
import { useParams } from "next/navigation";
import { Title } from "@chinguya/ui/title";
import { Text } from "@chinguya/ui/text";
import { Card } from "@chinguya/ui/card";
import { Stack } from "@chinguya/ui/stack";
import { Badge } from "@chinguya/ui/badge";
import { Kv } from "@chinguya/ui/kv";
import { Button } from "@chinguya/ui/button";
import { ComingSoon } from "@chinguya/ui/coming-soon";
import { ConfirmPopup } from "@chinguya/ui/confirm-popup";
import { Toast } from "@chinguya/ui/toast";
import { agencies } from "@/data/agencyData";
import { findInvoiceById, getInvoiceLineItems, setInvoiceSettled } from "@/data/invoiceData";
import { RENTAL_OPTION_LABEL } from "@/data/productData";

/**
 * 인보이스 상세(S2-A6). 목록(S2-A5)에서 카드를 눌러 들어온다. 전월 여행사 예약 라인아이템
 * (예약번호·상품·수량·금액)을 보여주고, 합계는 완료 예약 금액 합만 반영한다(취소 건은 라인엔
 * 보이되 금액 0 — invoiceData.getInvoiceLineItems의 주석 참고: 여행사 예약엔 취소 수수료 개념이
 * 없다). 발행된 인보이스에 한해 입금 미완료일 때만 '입금 확인' 버튼을 노출하고, 컨펌 후 인보이스
 * 단위로 정산 완료 처리한다.
 */
export default function AdminInvoiceDetailPage() {
  const params = useParams<{ id: string }>();
  const invoice = findInvoiceById(params.id);

  const [settled, setSettled] = useState(invoice?.settled ?? false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (!invoice) {
    return <ComingSoon label="존재하지 않는 인보이스입니다" />;
  }

  const agencyName = agencies.find((a) => a.id === invoice.agencyId)?.name ?? invoice.agencyId;
  const lineItems = getInvoiceLineItems(invoice);

  const handleConfirmDeposit = () => {
    // TODO: 실제 연동 시 POST /api/admin/invoices/{id}/confirm-deposit 호출로 교체
    setInvoiceSettled(invoice.id, true);
    setSettled(true);
    setConfirmOpen(false);
    setToastMessage("입금 확인 처리되었습니다");
  };

  return (
    <main className="mx-auto max-w-2xl p-6">
      <Stack direction="column" gap="sm">
        <NextLink href="/invoices" className="text-sm text-muted hover:underline">
          ← 인보이스 목록으로
        </NextLink>
        <Title size="md" subtitle={invoice.period}>
          <span className="inline-flex items-center gap-2">
            {agencyName} <Badge variant={settled ? "success" : "gray"}>{settled ? "정산완료" : "미정산"}</Badge>
          </span>
        </Title>
      </Stack>

      <Stack direction="column" gap="md" className="mt-4">
        <Text weight="bold" leaf>
          예약 라인아이템
        </Text>

        <Card padding="sm">
          {lineItems.map((item) => (
            <div
              key={item.reservationId}
              className="flex items-center justify-between gap-2 border-b border-dashed border-line py-3 text-sm last:border-b-0"
            >
              <Stack direction="column" gap="xs">
                <Text weight="bold">{item.reservationId}</Text>
                <Text variant="sub">
                  {item.productTitle} · {RENTAL_OPTION_LABEL[item.option]} × {item.quantity}
                </Text>
              </Stack>
              <Stack direction="column" gap="xs" className="items-end">
                <Text weight="bold">{item.amountKrw.toLocaleString()}원</Text>
                {item.status === "cancelled" && <Badge variant="gray">취소</Badge>}
              </Stack>
            </div>
          ))}

          {lineItems.length === 0 && <Text variant="sub">해당 기간에 예약 내역이 없습니다.</Text>}
        </Card>

        <Kv items={[{ key: "합계(완료 예약 금액 합)", value: `₩ ${invoice.amountKrw.toLocaleString()}` }]} />

        {!settled && (
          <Stack direction="column" gap="sm">
            <Button onClick={() => setConfirmOpen(true)}>입금 확인</Button>
            <Text variant="sub">여행사로부터 인보이스 금액 입금을 확인한 뒤 눌러주세요. PG 미사용, 관리자 수동 확인.</Text>
          </Stack>
        )}
      </Stack>

      <ConfirmPopup
        open={confirmOpen}
        title="정말 입금을 확인했습니까?"
        message="입금을 확인하셨다면 확인 버튼을 눌러주세요."
        confirmLabel="확인"
        danger={false}
        onConfirm={handleConfirmDeposit}
        onClose={() => setConfirmOpen(false)}
      />
      <Toast open={!!toastMessage} onClose={() => setToastMessage(null)} message={toastMessage ?? ""} />
    </main>
  );
}
