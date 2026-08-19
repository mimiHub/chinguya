import { Title } from "@chinguya/ui/title";
import { Text } from "@chinguya/ui/text";
import { Table } from "@chinguya/ui/table";
import { StatusBadge } from "@chinguya/ui/badge";
import { NoticeBox } from "@chinguya/ui/notice-box";
import { findRentalProductById, RENTAL_OPTION_LABEL } from "@/data/rentalData";
import { listReservations } from "@/data/reservationData";

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
    <main>
      <Title size="md">대시보드</Title>

      <div className="mt-4 flex gap-4">
        <div className="w-40 rounded-lg border border-line p-4">
          <div className="text-2xl font-bold">{newCount}</div>
          <div className="text-xs text-muted">신규 예약</div>
        </div>
      </div>

      <Text weight="bold" className="mt-6 mb-2">
        오늘 이용자 명단
      </Text>

      <Table
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
      />

      {todayReservations.length === 0 && (
        <Text tone="secondary" className="mt-4">
          오늘 이용 예정인 예약이 없습니다.
        </Text>
      )}

      <NoticeBox tone="gray" className="mt-6">
        여행사 예약은 상태가 단순합니다: 예약 = 즉시 완료 / 취소 = 즉시. 입금 흐름은 없습니다.
      </NoticeBox>
    </main>
  );
}
