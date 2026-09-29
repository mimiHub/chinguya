"use client";

import { useCallback, useEffect, useState } from "react";
import { Title, Stat, Stack, Button, IconFace, Toast } from "@chinguya/ui";
import { createApiClient, ApiError, type AdminDashboard } from "@chinguya/api-client";
import { InventoryOverCapacityToast } from "@/components/InventoryOverCapacityToast";
import { DashboardCardList, type DashboardCardItem, type CardAccent } from "@/components/DashboardCardList";

const api = createApiClient();

/**
 * S1-A1 대시보드(`a-dash`). 계약: api-spec/openapi/chinguya-admin-api.yaml.
 *
 * 지표 3개(예약완료/입금확인 요청/취소요청)·재고 초과 날짜·오늘 방문 예약·오늘 질문 목록을
 * `GET /admin/dashboard` 한 번으로 받는다. 오늘 질문 목록 = 오늘(JST) 등록된 질문 + 그 전에 등록됐지만
 * 아직 답변 못 한 질문(등록 최신순) — 어떤 질문을 넣을지도 서버가 정한다.
 *
 * **예약완료 = 오늘(JST) 완료된 고객 예약 + 여행사 예약 합계**(2026-09-28 결정 — '신규 예약' 카드를 교체).
 * 입금확인 요청 = 접수(고객이 입금했다고 알림). 입금 기한이 지난 건은 빼므로, 미입금은 예약 관리의
 * 미입금 탭에서 따로 본다.
 *
 * **'오늘'과 건수를 화면에서 계산하지 않는다.** 예전에는 브라우저 시계로 JST 오늘을 만들고
 * 목업 배열을 세었는데, 이제 서버가 정한 값을 그대로 쓴다 — 자정 근처에서 어긋나지 않는다.
 *
 * 화면 이동(와이어프레임): 예약 카드 → 예약 상세, '예약 관리' 버튼 → 예약 목록(a-res),
 * 지표 → 해당 목록, 재고 초과 토스트 [확인] → 재고 세팅(a-inv)의 해당 날짜,
 * 질문 카드 → 문의 관리의 그 질문 상세, '문의 관리' 버튼 → 문의 목록.
 */
export default function AdminDashboardPage() {
  const [dashboard, setDashboard] = useState<AdminDashboard | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    try {
      const response = await api.dashboard.get();
      setLoadError(null);
      setDashboard(response);
    } catch (err) {
      // 서버가 에러 코드와 문구를 보낸 경우만 그 문구를 쓴다. 코드가 없으면(500·네트워크 오류 등)
      // api-client의 "요청 실패: /dashboard" 같은 개발용 문구라 사용자용 안내로 바꾼다.
      setLoadError(
        err instanceof ApiError && err.code ? err.message : "대시보드를 불러오지 못했습니다.",
      );
    }
  }, []);

  // Toast의 useEffect 의존성에 들어가므로 렌더마다 새 함수가 되지 않게 고정한다.
  const clearLoadError = useCallback(() => setLoadError(null), []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const completedCount = dashboard?.completedTodayCount ?? 0;

  const stats = [
    {
      label: "예약완료",
      value: completedCount,
      href: "/reservations?tab=completed",
      tone: "primary" as const,
      large: true,
      icon: <IconFace mood={completedCount > 0 ? "happy" : "sad"} className="h-8 w-8" />,
    },
    {
      label: "입금확인 요청",
      value: dashboard?.depositRequestCount ?? 0,
      href: "/reservations?tab=received",
      tone: "warning" as const,
    },
    {
      label: "취소요청",
      value: dashboard?.cancelRequestCount ?? 0,
      href: "/reservations?tab=cancel_requested",
      tone: "error" as const,
    },
  ];

  // 예약 종류별 태그 색 — 위쪽 수치 카드(Stat)와 같은 계열로 맞췄다:
  //   접수=초록 / 미입금=노랑(입금확인 요청) / 취소요청=빨강(취소요청) / 완료=블루.
  // 카드 배경은 전부 같은 기본색이고 태그만 색이 다르다. 그 외(취소 등)는 회색 태그.
  const cardAccent = (visit: AdminDashboard["todayVisits"][number]): CardAccent | undefined => {
    if (visit.unpaid) return "warning";
    if (visit.status === "AWAITING_DEPOSIT" || visit.status === "RECEIVED") return "primary";
    if (visit.status === "CANCEL_REQUESTED") return "error";
    if (visit.status === "COMPLETED") return "info";
    return undefined;
  };

  /** 태그 문구 — '미입금'은 상태값이 아니라 입금 기한 계산 결과라 서버가 내려준 플래그를 먼저 본다. */
  const tagLabel = (visit: AdminDashboard["todayVisits"][number]): string => {
    if (visit.unpaid) return "미입금";
    return STATUS_LABEL[visit.status];
  };

  const todayVisitItems: DashboardCardItem[] = (dashboard?.todayVisits ?? []).map((visit) => ({
    id: visit.bookingNumber,
    title: visit.bookingNumber,
    sub: `${visit.productSummary} · ${visit.useDate}`,
    href: `/reservations/${visit.bookingNumber}`,
    accent: cardAccent(visit),
    tagLabel: tagLabel(visit),
  }));

  // 답변 상태 태그 — 대기는 처리할 일이라 노랑, 답변완료는 초록(문의 관리 목록과 같은 구분).
  const todayInquiryItems: DashboardCardItem[] = (dashboard?.todayInquiries ?? []).map((inquiry) => ({
    id: inquiry.inquiryId,
    title: inquiry.title,
    sub: `${inquiry.customerLoginId} · ${formatJstDateTime(inquiry.createdAt)}`,
    href: `/inquiries?id=${inquiry.inquiryId}`,
    accent: inquiry.status === "ANSWERED" ? "primary" : "warning",
    tagLabel: inquiry.status === "ANSWERED" ? "답변완료" : "답변대기",
  }));

  return (
    // 페이지 전체가 스크롤되지 않도록 main을 화면(상단 헤더와 하단 메뉴 사이) 높이에 딱 맞추고(h-full), 남는
    // 높이를 "오늘 방문 예약"·"오늘 질문 목록" 상자가 나눠 갖는다(flex-1). 상자 안에서는 목록만 스크롤된다
    // (DashboardCardList). 화면이 아주 작아 상자가 min-h보다 줄어들 때만 페이지가 스크롤된다.
    <main className="mx-auto flex h-full max-w-2xl flex-col px-6 pt-6">
      <div className="flex min-h-0 flex-1 flex-col gap-6">
        <Stat items={stats} />

        {/* 불러오기 실패는 본문 자리를 차지하는 Alert 대신 하단 토스트로 잠깐 보여준다(3초 뒤 자동 닫힘).
            실패 시 dashboard가 null이라 재고 초과 토스트는 안 떠서 두 토스트가 겹치지 않는다. */}
        <Toast
          open={loadError !== null}
          onClose={clearLoadError}
          message={loadError ?? ""}
          status="error"
        />

        <InventoryOverCapacityToast dates={dashboard?.overCapacityDates ?? null} />

        {/* 제목과 목록을 테두리 있는 큰 상자 하나로 묶는다. 안쪽 카드는 이 상자 안에서 한 단계 밝은 배경.
            두 상자(오늘 방문 예약·오늘 질문 목록)가 남는 높이를 반씩 나눠 갖는다(flex-1). */}
        <section className="flex min-h-[240px] flex-1 flex-col rounded-lg border border-card-border p-5">
          <div className="flex min-h-0 flex-1 flex-col gap-4">
            {/* 제목은 왼쪽, 예약 관리 화면으로 가는 버튼은 오른쪽 끝(between 정렬) */}
            <Stack justify="between" align="center">
              <Title size="sm" leaf>
                오늘 방문 예약
              </Title>
              <Button href="/reservations" variant="subtle" size="sm">
                예약 관리
              </Button>
            </Stack>
            <DashboardCardList items={todayVisitItems} emptyMessage="오늘 방문 예약이 없습니다." />
          </div>
        </section>

        {/* 마지막 상자는 아래로 계속 이어지는 시트 모양이라 모서리는 위쪽 두 곳만 둥글고 아래 테두리·모서리는 없다.
            맨 아래 pb-[72px]는 화면에 떠 있는 "재고 초과 날짜" 토스트(하단 메뉴 바로 위)가 상자 안쪽 빈 자리에
            앉도록 남겨둔 공간이라, 토스트가 카드를 가리지 않는다. */}
        <section className="flex min-h-[240px] flex-1 flex-col rounded-t-lg border border-b-0 border-card-border px-5 pb-[72px] pt-5">
          <div className="flex min-h-0 flex-1 flex-col gap-4">
            <Stack justify="between" align="center">
              <Title size="sm" leaf>
                오늘 질문 목록
              </Title>
              <Button href="/inquiries" variant="subtle" size="sm">
                문의 관리
              </Button>
            </Stack>
            <DashboardCardList items={todayInquiryItems} emptyMessage="오늘 확인할 질문이 없습니다." />
          </div>
        </section>
      </div>
    </main>
  );
}

/** 카드 상태 태그 문구. '미입금'은 상태값이 아니라 계산 결과라 여기 없다. */
const STATUS_LABEL: Record<AdminDashboard["todayVisits"][number]["status"], string> = {
  AWAITING_DEPOSIT: "입금대기",
  RECEIVED: "접수",
  COMPLETED: "완료",
  CANCEL_REQUESTED: "취소요청",
  CANCELLED: "취소",
};

/** 질문 등록 시각을 일본 기준 `MM-DD HH:mm` 으로 — 지난 날 등록된 대기 질문도 섞여 날짜까지 적는다. */
function formatJstDateTime(iso: string): string {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Tokyo",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(new Date(iso))
      .map((p) => [p.type, p.value]),
  );
  return `${parts.month}-${parts.day} ${parts.hour}:${parts.minute}`;
}
