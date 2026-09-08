import { Title } from "@chinguya/ui/title";
import { Text } from "@chinguya/ui/text";
import { EmptyState } from "@chinguya/ui/empty-state";
import { Badge } from "@chinguya/ui/badge";
import { Table } from "@chinguya/ui/table";
import { Stack } from "@chinguya/ui/stack";
import { Card } from "@chinguya/ui/card";
import { findRentalProductById, RENTAL_OPTION_LABEL } from "@/data/rentalData";
import { listReservations } from "@/data/reservationData";

/** 이번 달 기준 "전월"(YYYY-MM) — 인보이스는 항상 전월 기준으로 발행한다는 규칙 */
function previousPeriod(now: Date = new Date()): string {
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}`;
}

/** S2-G7 여행사 인보이스. 매월 1일 전월 기준으로 발행되며, 라인아이템은 그 달의 완료된 예약 건이다. */
export default function AgencyInvoicePage() {
  const period = previousPeriod();
  const reservations = listReservations().filter((r) => r.status === "completed" && r.useDate.startsWith(period));
  const total = reservations.reduce((sum, r) => sum + r.amountKrw, 0);

  return (
    <main className="flex h-full min-h-0 flex-col">
      <Stack direction="column" className="min-h-0 flex-1">
        <Title
        size="md"
        action={
          <Badge variant="gray">
            {period} · KRW
          </Badge>
        }
      >
        인보이스
      </Title>

      <Card className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <Table
        className="min-h-0 flex-1 overflow-y-auto"
        columns={[
          { key: "date", label: "일자" },
          { key: "id", label: "예약번호" },
          { key: "product", label: "상품·옵션" },
          { key: "qty", label: "수량" },
          { key: "unitPrice", label: "단가" },
          { key: "amount", label: "금액" },
        ]}
        rows={reservations.map((r) => {
          const product = findRentalProductById(r.productId);
          const unitPrice = r.quantity > 0 ? Math.round(r.amountKrw / r.quantity) : 0;
          return {
            date: r.useDate.slice(5),
            id: r.id,
            product: `${product?.title ?? r.productId} · ${RENTAL_OPTION_LABEL[r.rentalOption]}`,
            qty: r.quantity,
            unitPrice: unitPrice.toLocaleString(),
            amount: r.amountKrw.toLocaleString(),
          };
        })}
        emptyMessage={<EmptyState>{period} 발행 대상 예약이 없습니다.</EmptyState>}
      />
      </Card>
      </Stack>

      {reservations.length > 0 && (
        <div className="mt-2 flex justify-end pr-2">
          <Text weight="bold">합계 ₩{total.toLocaleString()}</Text>
        </div>
      )}
    </main>
  );
}
