import { Title } from "@chinguya/ui/title";
import { Text } from "@chinguya/ui/text";
import { EmptyState } from "@chinguya/ui/empty-state";
import { Table } from "@chinguya/ui/table";
import { Stack } from "@chinguya/ui/stack";
import { Card } from "@chinguya/ui/card";
import { findRentalProductById, RENTAL_OPTION_LABEL } from "@/data/rentalData";
import { listReservations } from "@/data/reservationData";
import { ScrollReveal } from "@/components/ScrollReveal";

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
        <ScrollReveal className="shrink-0">
        <div className="flex items-center gap-2">
          <Title size="md">인보이스</Title>
          {/* 참고 디자인("Nagual" + "PRO" 배지)처럼, 제목 바로 옆에 진한 배경 + 흰 글씨의
              작은 사각 배지로 붙인다 — 기존 Badge 컴포넌트는 rounded-full(알약형) + 옅은
              배경(gray-100)이라 이 느낌과 달라서, 여기서는 그 컴포넌트를 쓰지 않고 직접
              스타일을 준다. */}
          <span className="inline-flex items-center rounded-md bg-gray-700 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
            {period} · KRW
          </span>
        </div>
        </ScrollReveal>

      <ScrollReveal delay={80} className="flex min-h-0 flex-1 flex-col">
      <Card className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden">
          <Table
        className="min-h-0 flex-1 overflow-y-auto"
        columns={[
          { key: "date", label: "일자", width: "10%" },
          { key: "id", label: "예약번호", width: "14%" },
          { key: "product", label: "상품·옵션" },
          { key: "qty", label: "수량", width: "8%", align: "center" },
          { key: "unitPrice", label: "단가", width: "14%", align: "right" },
          { key: "amount", label: "금액", width: "14%", align: "right" },
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
        </div>
      </Card>
      </ScrollReveal>
      </Stack>

      {reservations.length > 0 && (
        <div className="mt-2 flex justify-end pr-2">
          <Text weight="bold">합계 ₩{total.toLocaleString()}</Text>
        </div>
      )}
    </main>
  );
}
