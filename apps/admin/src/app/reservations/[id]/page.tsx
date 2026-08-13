"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import type { CustomerReservationStatus } from "@chinguya/types";
import { Title } from "@chinguya/ui/title";
import { Kv } from "@chinguya/ui/kv";
import { StatusBadge, Badge } from "@chinguya/ui/badge";
import { Button } from "@chinguya/ui/button";
import { ComingSoon } from "@chinguya/ui/coming-soon";
import { Text } from "@chinguya/ui/text";
import { Price } from "@chinguya/ui/price";
import { Toast } from "@chinguya/ui/toast";
import { FormMessage } from "@chinguya/ui/form-message";
import { findAdminReservationById, getElapsedHours, UNPAID_AFTER_HOURS } from "@/data/reservationData";

// 취소 수수료율은 실제로는 이용일까지 남은 일수 기준 차등 요율표(CancellationFeeRule, 관리자 설정)에서
// 가져와야 한다 — 여기서는 화면 데모용으로 20% 고정값을 쓴다.
const DEMO_CANCEL_FEE_RATE = 0.2;

export default function AdminReservationDetailPage() {
  const params = useParams<{ id: string }>();
  const reservation = findAdminReservationById(params.id);

  // 목업 데이터라 실제 서버에 저장되진 않지만, 버튼을 눌렀을 때 상태가 바뀌는 걸
  // 화면에서 바로 확인할 수 있도록 로컬 상태로 흉내낸다.
  const [status, setStatus] = useState<CustomerReservationStatus | undefined>(reservation?.status);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (!reservation || !status) {
    return <ComingSoon label="존재하지 않는 예약입니다" />;
  }

  const cancelFee = Math.round(reservation.amountKrw * DEMO_CANCEL_FEE_RATE);
  const refundAmount = reservation.amountKrw - cancelFee;

  const elapsedHours = getElapsedHours(reservation.createdAt);
  const isUnpaidNow = status === "received" && elapsedHours >= UNPAID_AFTER_HOURS;
  const remainingHours = Math.max(0, UNPAID_AFTER_HOURS - elapsedHours);

  const confirmDeposit = () => {
    // TODO: 실제 연동 시 POST /api/admin/reservations/{id}/confirm-deposit 호출로 교체
    setStatus("completed");
    setToastMessage("입금 확인 처리되었습니다");
  };

  const forceCancel = () => {
    // TODO: 실제 연동 시 POST /api/admin/reservations/{id}/force-cancel 호출로 교체. 재고 즉시 복원.
    setStatus("cancelled");
    setToastMessage("미입금으로 강제 취소 처리되었습니다");
  };

  const confirmCancel = () => {
    // TODO: 실제 연동 시 환불 이체 확인 후 POST /api/admin/reservations/{id}/confirm-cancel. 재고 즉시 복원.
    setStatus("cancelled");
    setToastMessage("취소가 확정되었습니다(환불완료)");
  };

  return (
    <main className="mx-auto max-w-2xl p-6">
      <Title size="md" subtitle={reservation.id}>
        <span className="inline-flex items-center gap-2">
          예약 상세 {isUnpaidNow ? <Badge variant="warning">미입금</Badge> : <StatusBadge status={status} />}
        </span>
      </Title>

      <Kv
        className="mt-4"
        items={[
          { key: "고객 / 여권명", value: `${reservation.customer} / ${reservation.passportName}` },
          { key: "상품 · 수량", value: reservation.product },
          { key: "이용일", value: reservation.useDate },
          { key: "결제액", value: <Price value={reservation.amountKrw} /> },
        ]}
      />

      {status === "received" && (
        <div className="mt-6 flex flex-col gap-2">
          <Button onClick={confirmDeposit}>입금 확인 → 완료 처리</Button>
          <Text variant="sub">
            접수 후 24시간 내 미입금 시 &apos;미입금&apos; 표시 → 강제 취소 가능(재고 즉시 복원). 접수 후{" "}
            {Math.floor(elapsedHours)}시간 경과.
          </Text>
          {!isUnpaidNow && (
            <FormMessage type="helper">
              아직 미입금 처리 시점이 아니에요 — {Math.ceil(remainingHours)}시간 뒤부터 강제 취소할 수 있어요.
            </FormMessage>
          )}
          <Button variant="danger" onClick={forceCancel} disabled={!isUnpaidNow}>
            미입금 강제 취소
          </Button>
        </div>
      )}

      {status === "cancel_requested" && (
        <div className="mt-6">
          <Title size="sm">취소요청 처리</Title>
          <Kv
            className="mt-2"
            items={[
              { key: "결제액", value: <Price value={reservation.amountKrw} /> },
              { key: "취소 수수료(차등)", value: <Price value={cancelFee} sign="− " /> },
              { key: "환불 예정액", value: <Price value={refundAmount} /> },
              { key: "고객 환불계좌", value: "○○ 000-000" },
            ]}
          />
          <Text variant="sub" className="my-2">
            환불 이체는 수동 진행. 이체 후 아래 버튼으로 취소 확정 → 재고 즉시 복원.
          </Text>
          <Button onClick={confirmCancel}>취소 확정(환불완료)</Button>
        </div>
      )}

      <Toast open={!!toastMessage} onClose={() => setToastMessage(null)} message={toastMessage ?? ""} />
    </main>
  );
}
