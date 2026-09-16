import { Title, Text, EmptyState, Table, StatusBadge, Card, Stack } from "@chinguya/ui";
import { findRentalProductById } from "@/data/rentalData";
import { RENTAL_OPTION_LABEL } from "@chinguya/types";
import { listReservations } from "@/data/reservationData";
import { CURRENT_AGENCY } from "@/data/authData";
import { ScrollReveal } from "@/components/ScrollReveal";

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * S2-G3 여행사 대시보드. 신규 예약 지표와 오늘 이용자 명단을 보여준다.
 *
 * 레이아웃은 직접 마진(mt-4/mt-6/mb-2)을 주는 대신, 어드민 대시보드(apps/admin/src/app/page.tsx)와
 * 같은 규칙으로 Stack을 써서 정렬한다 — 큰 구획(제목/지표/목록 묶음) 사이는 바깥 Stack
 * gap="lg", "오늘 이용자 명단" 라벨과 그 아래 표처럼 한 묶음으로 붙어 있어야 하는 것들은
 * 안쪽 Stack gap="sm"으로 좁게 붙인다. ScrollReveal 각각의 delay는 그대로 둬서 순서대로
 * 나타나는 애니메이션은 유지한다.
 */
export default function AgencyDashboardPage() {
  const reservations = listReservations();
  const today = todayKey();
  const todayReservations = reservations.filter((r) => r.useDate === today);
  const newCount = reservations.filter((r) => r.status === "completed").length;

  return (
    <main className="flex h-full min-h-0 flex-col">
      <Stack direction="column" gap="lg" className="h-full min-h-0">
        <ScrollReveal>
          <Title size="lg">{CURRENT_AGENCY.name}</Title>
        </ScrollReveal>

        <ScrollReveal delay={80} className="shrink-0">
          <Stack gap="md">
            <div className="w-40 rounded-lg border border-line bg-surface p-4">
              <div className="text-2xl font-bold text-center">{newCount}</div>
              <div className="text-xs text-muted text-center">신규 예약</div>
            </div>
          </Stack>
        </ScrollReveal>

        {/* 표 영역은 flex-1/min-h-0로 자기 안에서만 스크롤되는 레이아웃이라, ScrollReveal에도
            Card가 원래 갖던 flex/min-h-0/flex-1 클래스를 그대로 넘겨줘야 스크롤 체인이 안 깨진다. */}
        <Stack direction="column" gap="sm" className="min-h-0 flex-1">
          <ScrollReveal delay={160} className="shrink-0">
            <Text weight="bold" leaf>
              오늘 이용자 명단
            </Text>
          </ScrollReveal>

          <ScrollReveal delay={240} className="flex min-h-0 flex-1 flex-col">
            <Card className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden">
                <Table
                  className="min-h-0 flex-1 overflow-y-auto"
                  columns={[
                    { key: "id", label: "예약번호", width: "16%" },
                    { key: "product", label: "상품·옵션" },
                    { key: "qty", label: "수량", width: "10%", align: "center" },
                    { key: "passport", label: "이용자 여권명", width: "20%" },
                    { key: "status", label: "상태", width: "12%", align: "center" },
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
              </div>
            </Card>
          </ScrollReveal>
        </Stack>
      </Stack>
    </main>
  );
}
