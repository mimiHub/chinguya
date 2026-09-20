import NextLink from "next/link";
import { Title, Text, EmptyState, Table, StatusBadge, Card, Stack, IconFace } from "@chinguya/ui";
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
        {/* 여행사명(왼쪽) + 신규 예약 지표(오른쪽) 한 줄. 지표를 별도 큰 카드로 세로로 쌓으면 화면을 너무 차지해서,
            알림 목록 항목 같은 가로 카드(표정 아이콘 타일 + 제목·보조 문구 두 줄)로 줄여 제목 오른쪽에 붙였다.
            신규가 있으면 웃는 얼굴, 없으면 시무룩한 얼굴. 누르면 예약 목록으로 이동한다. */}
        <ScrollReveal className="shrink-0">
          <Stack justify="between" align="center">
            <Title size="lg">{CURRENT_AGENCY.name}</Title>
            <NextLink
              href="/reservations"
              className="flex shrink-0 items-center gap-3 rounded-lg bg-surface py-2.5 pl-3 pr-5 text-ink transition-colors hover:bg-bg-light"
            >
              {/* 알림 목록 항목 스타일 — 옅은 초록 정사각 타일 안에 표정 아이콘, 오른쪽에 굵은 제목 + 옅은 보조 문구 두 줄. */}
              <span
                aria-hidden="true"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-stat-primary/20 bg-success-light/60 text-stat-primary"
              >
                <IconFace mood={newCount > 0 ? "happy" : "sad"} className="h-5 w-5" />
              </span>
              <span className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold leading-tight">
                  신규 예약 <span className="text-stat-primary">{newCount}</span>건
                </span>
                <span className="text-xs leading-tight text-muted">
                  {newCount > 0 ? "확인이 필요한 예약이 있어요" : "새로 들어온 예약이 없어요"}
                </span>
              </span>
            </NextLink>
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
