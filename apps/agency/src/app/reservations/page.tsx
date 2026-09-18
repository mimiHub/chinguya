"use client";

import { useCallback, useEffect, useState } from "react";
import { Title, Text, EmptyState, Table, StatusBadge, Button, Card, Stack, ConfirmPopup, Alert, Toast, type ToastStatus } from "@chinguya/ui";
import { RENTAL_OPTION_LABEL, type CustomerReservationStatus } from "@chinguya/types";
import { createApiClient, ApiError, type AgencyReservationList, type AgencyReservationResult } from "@chinguya/api-client";
import { ScrollReveal } from "@/components/ScrollReveal";

const api = createApiClient();

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback;
}

/** "YYYY-MM-DD" 두 개의 날짜 차이(일). new Date(string)는 UTC 자정으로 해석돼 타임존에 따라
 *  하루 밀리므로, 숫자로 쪼개 UTC 기준으로만 계산한다(book 화면과 같은 이유). */
function daysBetween(from: string, to: string): number {
  const utc = (value: string) => {
    const [year = 0, month = 1, day = 1] = value.split("-").map(Number);
    return Date.UTC(year, month - 1, day);
  };
  return Math.round((utc(to) - utc(from)) / (24 * 60 * 60 * 1000));
}

/**
 * S2-G6 여행사 예약 목록(`g-list`). 예약 내역을 보고 **즉시 취소**한다 — 고객처럼 '취소 요청 →
 * 관리자 승인'이 아니라 바로 확정되고, 재고도 서버에서 즉시 복원된다.
 *
 * Core API(GET /v1/agency/reservations, POST …/{id}/cancel)에 실연동돼 있다 — 계약은
 * packages/api-spec/openapi/chinguya-agency-api.yaml.
 *
 * 취소 마감은 기본 D-3 이고 관리자가 조정한다(S1-A10). 그래서 기준 일수를 화면에 박지 않고
 * 목록 응답의 `cancelDeadlineDays` 를 쓴다. 남은 일수도 브라우저 시계가 아니라 응답의 `today`
 * 로 센다 — 규칙상 '오늘'은 일본 기준이라 사용자 PC 시계로 세면 하루 어긋날 수 있다.
 */
export default function AgencyReservationsPage() {
  const [list, setList] = useState<AgencyReservationList | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<AgencyReservationResult | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastStatus, setToastStatus] = useState<ToastStatus>("success");

  const loadReservations = useCallback(async () => {
    try {
      const response = await api.agencyReservations.list();
      setLoadError(null);
      setList(response);
    } catch (err) {
      setLoadError(errorMessage(err, "예약 목록을 불러오지 못했습니다."));
    }
  }, []);

  useEffect(() => {
    void loadReservations();
  }, [loadReservations]);

  const handleConfirmCancel = async () => {
    if (!cancelTarget) return;
    // 팝업을 먼저 닫는다 — 응답을 기다리는 동안 확인 버튼이 두 번 눌리면 두 번째는 409다.
    const target = cancelTarget;
    setCancelTarget(null);
    try {
      await api.agencyReservations.cancel(target.reservationId);
      setToastMessage("예약이 취소되었습니다");
      setToastStatus("success");
    } catch (err) {
      // 마감이 지났거나(409) 그사이 누가 먼저 취소했을 수 있다 — 서버 문구를 그대로 보여준다.
      setToastMessage(errorMessage(err, "취소하지 못했습니다. 잠시 후 다시 시도해 주세요."));
      setToastStatus("error");
    } finally {
      void loadReservations();
    }
  };

  const rows = (list?.reservations ?? []).map((r) => {
    const remaining = list ? daysBetween(list.today, r.useDate) : 0;
    const cancelable = r.status === "COMPLETED" && list !== null && remaining >= list.cancelDeadlineDays;

    return {
      id: r.reservationNumber,
      useDate: r.useDate,
      product: `${r.assetName} · ${RENTAL_OPTION_LABEL[r.optionType]} ×${r.quantity}`,
      amount: `₩${r.amount.toLocaleString()}`,
      status: <StatusBadge status={r.status.toLowerCase() as CustomerReservationStatus} />,
      action:
        r.status === "COMPLETED" ? (
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
  });

  const tableEmptyMessage = loadError ? (
    <Alert status="error" icon={true}>
      {loadError}
    </Alert>
  ) : list === null ? (
    <EmptyState>예약 목록을 불러오는 중입니다.</EmptyState>
  ) : (
    <EmptyState>아직 예약 내역이 없습니다.</EmptyState>
  );

  return (
    <main className="flex h-full min-h-0 flex-col">
      <Stack direction="column" className="min-h-0 flex-1">
        <ScrollReveal className="shrink-0">
          <Title size="md">예약 목록</Title>
        </ScrollReveal>

      <ScrollReveal delay={80} className="flex min-h-0 flex-1 flex-col">
      <Card className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <Table
        className="min-h-0 flex-1 overflow-y-auto"
        columns={[
          { key: "id", label: "예약번호", width: "14%" },
          { key: "useDate", label: "이용일", width: "12%" },
          { key: "product", label: "상품·수량" },
          { key: "amount", label: "금액", width: "12%", align: "right" },
          { key: "status", label: "상태", width: "10%", align: "center" },
          { key: "action", label: "", width: "10%", align: "center" },
        ]}
        rows={rows}
        emptyMessage={tableEmptyMessage}
      />
      </Card>
      </ScrollReveal>
      </Stack>

      <ConfirmPopup
        open={Boolean(cancelTarget)}
        message={`${cancelTarget?.reservationNumber} 예약을 취소할까요? 취소는 즉시 처리되며 되돌릴 수 없습니다.`}
        onConfirm={handleConfirmCancel}
        onClose={() => setCancelTarget(null)}
      />

      <Toast
        open={!!toastMessage}
        onClose={() => setToastMessage(null)}
        message={toastMessage ?? ""}
        status={toastStatus}
      />
    </main>
  );
}
