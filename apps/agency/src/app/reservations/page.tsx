"use client";

import { useState } from "react";
import { Title } from "@chinguya/ui/title";
import { Text } from "@chinguya/ui/text";
import { EmptyState } from "@chinguya/ui/empty-state";
import { Table } from "@chinguya/ui/table";
import { StatusBadge } from "@chinguya/ui/badge";
import { Button } from "@chinguya/ui/button";
import { Card } from "@chinguya/ui/card";
import { Stack } from "@chinguya/ui/stack";
import { ConfirmPopup } from "@chinguya/ui/confirm-popup";
import { findRentalProductById, RENTAL_OPTION_LABEL } from "@/data/rentalData";
import { listReservations, updateReservationStatus } from "@/data/reservationData";
import type { AgencyReservation } from "@chinguya/types";

// 취소 마감 기준: 이용일 며칠 전까지 취소 가능한지. 기본 3일(D-3)이며 관리자가 유연 조정할 수
// 있다는 게 문서 규칙이지만, 그 조정값을 admin이 아직 노출하지 않아서 여기선 고정값으로 둔다.
const CANCEL_DEADLINE_DAYS = 3;

function daysBeforeUse(useDate: string, now: Date = new Date()): number {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(useDate);
  return Math.round((target.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
}

/** S2-G6 여행사 예약 목록. 취소는 즉시 처리되고(재고 즉시 복원 — 이 스캐폴드엔 재고 연동이 아직 없음), 이용일 D-3까지만 가능하다. */
export default function AgencyReservationsPage() {
  const [, forceRerender] = useState(0);
  const [cancelTarget, setCancelTarget] = useState<AgencyReservation | null>(null);
  const reservations = listReservations();

  const handleConfirmCancel = () => {
    if (cancelTarget) updateReservationStatus(cancelTarget.id, "cancelled");
    setCancelTarget(null);
    forceRerender((n) => n + 1);
  };

  return (
    <main className="flex h-full min-h-0 flex-col">
      <Stack direction="column" className="min-h-0 flex-1">
        <Title size="md">예약 목록</Title>

      <Card className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <Table
        className="min-h-0 flex-1 overflow-y-auto"
        columns={[
          { key: "id", label: "예약번호" },
          { key: "useDate", label: "이용일" },
          { key: "product", label: "상품·수량" },
          { key: "amount", label: "금액" },
          { key: "status", label: "상태" },
          { key: "action", label: "" },
        ]}
        rows={reservations.map((r) => {
          const product = findRentalProductById(r.productId);
          const remaining = daysBeforeUse(r.useDate);
          const cancelable = r.status === "completed" && remaining >= CANCEL_DEADLINE_DAYS;

          return {
            id: r.id,
            useDate: r.useDate,
            product: `${product?.title ?? r.productId} · ${RENTAL_OPTION_LABEL[r.rentalOption]} ×${r.quantity}`,
            amount: `₩${r.amountKrw.toLocaleString()}`,
            status: <StatusBadge status={r.status} />,
            action:
              r.status === "completed" ? (
                cancelable ? (
                  <Button size="sm" variant="secondary" onClick={() => setCancelTarget(r)}>
                    취소
                  </Button>
                ) : (
                  <Text variant="sub" as="span">
                    취소불가(D-{Math.max(remaining, 0)})
                  </Text>
                )
              ) : null,
          };
        })}
        emptyMessage={<EmptyState>아직 예약 내역이 없습니다.</EmptyState>}
      />
      </Card>
      </Stack>

      <ConfirmPopup
        open={Boolean(cancelTarget)}
        message={`${cancelTarget?.id} 예약을 취소할까요? 취소는 즉시 처리되며 되돌릴 수 없습니다.`}
        onConfirm={handleConfirmCancel}
        onClose={() => setCancelTarget(null)}
      />
    </main>
  );
}
