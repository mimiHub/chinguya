"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Title } from "@chinguya/ui/title";
import { Text } from "@chinguya/ui/text";
import { Table } from "@chinguya/ui/table";
import { Stepper } from "@chinguya/ui/stepper";
import { Kv } from "@chinguya/ui/kv";
import { Button } from "@chinguya/ui/button";
import { Toast } from "@chinguya/ui/toast";
import { getBookingRows } from "@/data/bookingData";
import { RENTAL_OPTION_LABEL } from "@/data/rentalData";
import { createReservation } from "@/data/reservationData";

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
    <main>
      <Title size="md">상품 예약</Title>

      <div className="mt-4 flex gap-6">
        <div className="flex-1">
          <Text variant="sub" as="span">
            이용 날짜
          </Text>
          <div className="mt-1">
            <input
              type="date"
              value={useDate}
              min={minSelectableDate()}
              max={maxSelectableDate()}
              onChange={(e) => setUseDate(e.target.value)}
              className="h-10 rounded-md border border-line px-3 text-sm"
            />
          </div>
          <Text variant="sub" className="mt-1.5">
            여행사 예약 가능: 오늘 +3일 ~ +3개월.
          </Text>

          <Table
            className="mt-4"
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
        </div>

        <div className="w-64 shrink-0">
          <div className="rounded-lg border border-line p-4">
            <Text weight="bold" className="mb-2">
              예약 요약
            </Text>

            {selectedRows.length === 0 ? (
              <Text variant="sub">담긴 상품이 없습니다.</Text>
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

            <Button fullWidth className="mt-3" disabled={!canSubmit} onClick={handleSubmit}>
              예약 (즉시 완료)
            </Button>
          </div>

          <Text variant="sub" className="mt-3">
            가용 = 여행사 할당 수량 상한. 초과 선택 불가.
          </Text>
        </div>
      </div>

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
