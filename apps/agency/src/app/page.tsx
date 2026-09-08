import { Title } from "@chinguya/ui/title";
import { Text } from "@chinguya/ui/text";
import { EmptyState } from "@chinguya/ui/empty-state";
import { Table } from "@chinguya/ui/table";
import { StatusBadge } from "@chinguya/ui/badge";
import {Card} from "@chinguya/ui/card";
import { findRentalProductById, RENTAL_OPTION_LABEL } from "@/data/rentalData";
import { listReservations } from "@/data/reservationData";
import { CURRENT_AGENCY } from "@/data/authData";

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** S2-G3 여행사 대시보드. 신규 예약 지표와 오늘 이용자 명단을 보여준다. */
export default function AgencyDashboardPage() {
  const reservations = listReservations();
  const today = todayKey();
  const todayReservations = reservations.filter((r) => r.useDate === today);
  const newCount = reservations.filter((r) => r.status === "completed").length;

  return (
    <main className="flex h-full min-h-0 flex-col">
      <Title size="lg">{CURRENT_AGENCY.name}</Title>

      <div className="mt-4 flex shrink-0 gap-4">
        <div className="w-40 rounded-lg border border-line bg-surface p-4">
          <div className="text-2xl font-bold text-center">{newCount}</div>
          <div className="text-xs text-muted text-center">신규 예약</div>
        </div>
      </div>

      <Text weight="bold" leaf className="mt-6 mb-2 shrink-0">
        오늘 이용자 명단
      </Text>

      <Card className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <Table
        className="min-h-0 flex-1 overflow-y-auto"
        columns={[
          { key: "id", label: "예약번호" },
          { key: "product", label: "상품·옵션" },
          { key: "qty", label: "수량" },
          { key: "passport", label: "이용자 여권명" },
          { key: "status", label: "상태" },
        ]}
        rows={todayReservations.map((r) => {
          const product = findRentalProductById(r.productId);
          return {
            id: r.id,
            product: `${product?.title ?? r.productId} · ${RENTAL_OPTION_LABEL[r.rentalOption]}`,
            qty: r.quantity,
            passport: r.passportName,
            status: <StatusBadge status={r.status} />,
          };
        })}
        emptyMessage={<EmptyState>오늘 이용 예정인 예약이 없습니다.</EmptyState>}
      />
      </Card>
    </main>
  );
}
