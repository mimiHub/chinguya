import NextLink from "next/link";
import { Title } from "@chinguya/ui/title";
import { Stat } from "@chinguya/ui/stat";
import { Card } from "@chinguya/ui/card";
import { Stack } from "@chinguya/ui/stack";
import { Text } from "@chinguya/ui/text";
import { StatusBadge, Badge } from "@chinguya/ui/badge";
import { adminReservations, getAdminTab } from "@/data/reservationData";

/**
 * S1-A1 대시보드. 와이어프레임 상단 3개 지표(신규 예약/입금확인 요청/취소요청)를
 * adminReservations 목업으로부터 계산한다(원본 cafe-next는 이 세 숫자가 5/3/1로 고정된
 * 하드코딩 값이었는데, 여기서는 실제 데이터에서 파생시켜서 서로 값이 어긋나지 않게 했다).
 */
export default function AdminDashboardPage() {
  const newCount = adminReservations.filter((r) => r.status === "received").length;
  const pendingDepositCount = adminReservations.filter((r) => getAdminTab(r) === "received").length;
  const cancelRequestCount = adminReservations.filter((r) => r.status === "cancel_requested").length;

  const stats = [
    { label: "신규 예약", value: newCount, href: "/reservations?tab=received" },
    { label: "입금확인 요청", value: pendingDepositCount, href: "/reservations?tab=unpaid" },
    { label: "취소요청", value: cancelRequestCount, href: "/reservations?tab=cancel_requested" },
  ];

  // TODO: 실제 연동 시 "오늘"은 일본 기준(JST)으로 판정하고, useDate === 오늘인 건만 필터링한다.
  // 지금 목업 데이터의 useDate는 데모용 미래 날짜라 실제 "오늘"과 비교할 수 없어서, 우선 최근
  // 예약 몇 건만 미리보기로 보여준다.
  const recentReservations = adminReservations.slice(0, 4);

  return (
    <main className="mx-auto max-w-2xl p-6">
      {/* 로고는 이제 모든 화면 공통 상단 헤더(TopHeader)에 떠 있어서, 대시보드 화면 안에는
          따로 다시 넣지 않는다. */}
      <Stack direction="column" gap="lg">
        <Stat items={stats} />

        <Stack direction="column" gap="sm">
          <Title size="sm" leaf>오늘 방문 예약</Title>
          <Stack direction="column" gap="sm">
            {recentReservations.map((r) => (
              <NextLink key={r.id} href={`/reservations/${r.id}`} className="block">
                <Card padding="sm">
                  <Stack justify="between" align="center">
                    <div>
                      <Text weight="bold">{r.id}</Text>
                      <Text variant="sub">
                        {r.product} · {r.useDate}
                      </Text>
                    </div>
                    {getAdminTab(r) === "unpaid" ? (
                      <Badge variant="warning">미입금</Badge>
                    ) : (
                      <StatusBadge status={r.status} />
                    )}
                  </Stack>
                </Card>
              </NextLink>
            ))}
          </Stack>
        </Stack>
      </Stack>
    </main>
  );
}
