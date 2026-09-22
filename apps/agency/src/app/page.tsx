"use client";

import { useCallback, useEffect, useState } from "react";
import NextLink from "next/link";
import { Title, Text, EmptyState, Table, StatusBadge, Card, Stack, IconFace, Alert } from "@chinguya/ui";
import { RENTAL_OPTION_LABEL, type CustomerReservationStatus } from "@chinguya/types";
import { createApiClient, ApiError, type AgencyDashboard } from "@chinguya/api-client";
import { useAgencyAuth } from "@/context/AgencyAuthContext";
import { ScrollReveal } from "@/components/ScrollReveal";

const api = createApiClient();

/**
 * S2-G3 여행사 대시보드(`g-dash`). 신규 예약 지표와 오늘 이용자 명단을 보여준다.
 *
 * Core API(GET /v1/agency/dashboard)에 실연동돼 있다 — 계약은
 * packages/api-spec/openapi/chinguya-agency-api.yaml.
 *
 * '오늘'과 건수를 화면에서 계산하지 않고 서버 값을 그대로 쓴다. 브라우저 시계로 정하면
 * 자정 근처에서 어제·내일 명단을 보게 된다(예약 목록 S2-G6 과 같은 이유).
 *
 * 와이어프레임에 있던 **'이용자 여권명' 열은 뺐다.** 여행사 예약은 수량만 받고 이용자 개인을
 * 식별하지 않아 채울 값이 없다(2026-09-21 결정, 계약 문서 헤더 참고).
 *
 * 여행사명은 이 API가 아니라 세션(useAgencyAuth)에서 온다 — 앱 셸이 화면 이동마다 세션을
 * 다시 부르므로 관리자가 명칭을 바꾸면(S2-A3) 그쪽이 먼저 최신이 된다.
 *
 * 레이아웃은 어드민 대시보드(apps/admin/src/app/page.tsx)와 같은 규칙이다 — 큰 구획 사이는
 * 바깥 Stack gap="lg", "오늘 이용자 명단" 라벨과 그 아래 표처럼 한 묶음인 것들은 안쪽
 * Stack gap="sm"으로 좁게 붙인다.
 */
export default function AgencyDashboardPage() {
  const { session } = useAgencyAuth();
  const [dashboard, setDashboard] = useState<AgencyDashboard | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    try {
      const response = await api.agencyDashboard.get();
      setLoadError(null);
      setDashboard(response);
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : "대시보드를 불러오지 못했습니다.");
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const newCount = dashboard?.newReservationCount ?? 0;

  const tableEmptyMessage = loadError ? (
    <Alert status="error" icon={true}>
      {loadError}
    </Alert>
  ) : dashboard === null ? (
    <EmptyState>오늘 이용자 명단을 불러오는 중입니다.</EmptyState>
  ) : (
    <EmptyState>오늘 이용 예정인 예약이 없습니다.</EmptyState>
  );

  return (
    <main className="flex h-full min-h-0 flex-col">
      <Stack direction="column" gap="lg" className="h-full min-h-0">
        {/* 여행사명(왼쪽) + 신규 예약 지표(오른쪽) 한 줄. 지표를 별도 큰 카드로 세로로 쌓으면 화면을 너무 차지해서,
            알림 목록 항목 같은 가로 카드(표정 아이콘 타일 + 제목·보조 문구 두 줄)로 줄여 제목 오른쪽에 붙였다.
            신규가 있으면 웃는 얼굴, 없으면 시무룩한 얼굴. 누르면 예약 목록으로 이동한다. */}
        <ScrollReveal className="shrink-0">
          <Stack justify="between" align="center">
            <Title size="lg">{session?.agencyName ?? ""}</Title>
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
                    { key: "id", label: "예약번호", width: "20%" },
                    { key: "product", label: "상품·옵션" },
                    { key: "qty", label: "수량", width: "12%", align: "center" },
                    { key: "status", label: "상태", width: "14%", align: "center" },
                  ]}
                  rows={(dashboard?.todayUsers ?? []).map((user) => ({
                    id: user.reservationNumber,
                    product: `${user.assetName} · ${RENTAL_OPTION_LABEL[user.optionType]}`,
                    qty: user.quantity,
                    status: <StatusBadge status={user.status.toLowerCase() as CustomerReservationStatus} />,
                  }))}
                  emptyMessage={tableEmptyMessage}
                />
              </div>
            </Card>
          </ScrollReveal>
        </Stack>
      </Stack>
    </main>
  );
}
