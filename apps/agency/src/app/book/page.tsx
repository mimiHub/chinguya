"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Title } from "@chinguya/ui/title";
import { EmptyState } from "@chinguya/ui/empty-state";
import { Table } from "@chinguya/ui/table";
import { Stepper } from "@chinguya/ui/stepper";
import { Kv } from "@chinguya/ui/kv";
import { Button } from "@chinguya/ui/button";
import { Stack } from "@chinguya/ui/stack";
import { Card } from "@chinguya/ui/card";
import { Toast } from "@chinguya/ui/toast";
import { getBookingRows } from "@/data/bookingData";
import { RENTAL_OPTION_LABEL } from "@/data/rentalData";
import { createReservation } from "@/data/reservationData";
import { Alert } from "@chinguya/ui/alert";

// 여행사 예약 가능 기간: 오늘 +3일 ~ +3개월 (packages/types의 BOOKING_WINDOW.agency 규칙과 동일)
const MIN_LEAD_DAYS = 3;
const MAX_MONTHS_AHEAD = 3;

function toDateInputValue(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function defaultUseDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + MIN_LEAD_DAYS);
  return toDateInputValue(d);
}

function minSelectableDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + MIN_LEAD_DAYS);
  return toDateInputValue(d);
}

function maxSelectableDate(): string {
  const d = new Date();
  d.setMonth(d.getMonth() + MAX_MONTHS_AHEAD);
  return toDateInputValue(d);
}

/**
 * S2-G4/G5 상품 조회 · 예약. 여행사 할당 범위(가용) 내에서 상품별 수량을 골라 한 번에
 * "예약(즉시 완료)"한다 — 고객 예약과 달리 입금 절차 없이 바로 완료 상태가 된다.
 */
export default function AgencyBookPage() {
  const router = useRouter();
  const rows = useMemo(() => getBookingRows(), []);
  const [useDate, setUseDate] = useState(defaultUseDate());
  const [qtyByRow, setQtyByRow] = useState<Record<string, number>>({});
  const [toastOpen, setToastOpen] = useState(false);

  const selectedRows = rows.filter((row) => (qtyByRow[row.id] ?? 0) > 0);
  const total = selectedRows.reduce((sum, row) => sum + row.agencyPrice * (qtyByRow[row.id] ?? 0), 0);
  const canSubmit = selectedRows.length > 0;

  const setQty = (rowId: string, qty: number) => {
    setQtyByRow((prev) => ({ ...prev, [rowId]: qty }));
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    selectedRows.forEach((row) => {
      const qty = qtyByRow[row.id] ?? 0;
      createReservation({
        productId: row.productId,
        rentalOption: row.option,
        useDate,
        quantity: qty,
        amountKrw: row.agencyPrice * qty,
      });
    });
    setQtyByRow({});
    setToastOpen(true);
  };

  return (
    <main className="flex h-full min-h-0 flex-col">
      <Stack direction="column" className="min-h-0 flex-1">
        <Title size="md">상품 예약</Title>
        <Stack className="min-h-0 flex-1  flex gap-6">
          <Stack direction="column" className="min-h-0 flex-1">
            
            <Card className="shrink-0">
              <Stack direction="column" gap="sm">
                <Title as="label" htmlFor="use-date" size="sm" leaf tone="secondary">
                이용 날짜
              </Title>
              <div>
                <input
                  id="use-date"
                  type="date"
                  value={useDate}
                  min={minSelectableDate()}
                  max={maxSelectableDate()}
                  onChange={(e) => setUseDate(e.target.value)}
                  className="h-10 rounded-md border border-line px-3 text-sm"
                />
              </div>
              <Alert status="info" icon={true}>
                  예약 가능 기간 오늘 +3일 ~ +3개월 입니다.
              </Alert>
              </Stack>
            </Card>

            <Stack className="min-h-0 flex-1">
              {/* 스크롤은 Card(둥근 모서리+테두리가 있는 바깥 박스)가 아니라 Table 자신의
                  안쪽(각 없는) div가 담당한다 — overflow-y-auto를 둥근 모서리 요소에 바로
                  주면 브라우저 스크롤바가 카드 모서리를 파고들어 보이는 문제가 있었다. Card는
                  overflow-hidden으로 둥근 모양대로 잘라내는 역할만 한다. */}
              <Card className="flex min-h-0 w-full flex-1 flex-col overflow-hidden">
                  <Table
                    className="min-h-0 flex-1 overflow-y-auto"
                    columns={[
                      { key: "product", label: "상품" },
                      { key: "price", label: "여행사가" },
                      { key: "available", label: "가용(할당)" },
                      { key: "qty", label: "수량" },
                    ]}
                    rows={rows.map((row) => ({
                      product: `${row.title} · ${RENTAL_OPTION_LABEL[row.option]}`,
                      price: `₩${row.agencyPrice.toLocaleString()}`,
                      available: row.allocatedQty,
                      qty: (
                        <Stepper
                          value={qtyByRow[row.id] ?? 0}
                          min={0}
                          max={row.allocatedQty}
                          onChange={(v) => setQty(row.id, v)}
                        />
                      ),
                    }))}
                  />
              </Card>
              <Stack direction="column" className="min-h-0 w-64 shrink-0">
              <Card className="flex min-h-0 flex-1 flex-col">
                <Stack direction="column" justify="between" className="min-h-0 flex-1">
                   <Stack direction="column" gap="sm" className="min-h-0 overflow-y-auto">
                    <Title leaf divider size="md">
                      예약 요약
                    </Title>
                    {selectedRows.length === 0 ? (
                      <EmptyState>담긴 상품이 없습니다.</EmptyState>
                    ) : (
                      <Kv
                        items={[
                          ...selectedRows.map((row) => ({
                            key: `${row.title}·${RENTAL_OPTION_LABEL[row.option]} ×${qtyByRow[row.id]}`,
                            value: `${(row.agencyPrice * (qtyByRow[row.id] ?? 0)).toLocaleString()}`,
                          })),
                          { key: "합계", value: `₩${total.toLocaleString()}` },
                        ]}
                      />
                    )}

                   </Stack>
                  <Button fullWidth  disabled={!canSubmit} onClick={handleSubmit}>
                    예약 (즉시 완료)
                  </Button>
                </Stack>
              </Card>          
              </Stack>
            </Stack>
          </Stack>

          
        </Stack>
      </Stack>

      <Toast
        open={toastOpen}
        onClose={() => {
          setToastOpen(false);
          router.push("/reservations");
        }}
        message="예약이 완료되었습니다"
        actionLabel="예약 목록 보기"
        actionHref="/reservations"
      />
    </main>
  );
}
