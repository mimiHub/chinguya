import { Title, Stat, Stack, Button, IconFace } from "@chinguya/ui";
import { adminReservations, getAdminTab, RESERVATION_STATUS_LABEL } from "@/data/reservationData";
import { InventoryOverCapacityToast } from "@/components/InventoryOverCapacityToast";
import { TodayVisitList, type TodayVisitItem } from "@/components/TodayVisitList";

/**
 * S1-A1 대시보드. 와이어프레임 상단 지표(신규 예약/입금확인 요청/취소요청)를
 * adminReservations 목업으로부터 계산한다(원본 cafe-next는 이 세 숫자가 5/3/1로 고정된
 * 하드코딩 값이었는데, 여기서는 실제 데이터에서 파생시켜서 서로 값이 어긋나지 않게 했다).
 *
 * 비동기 데일리 로그(2026-09-04, 커밋 94119af)로 와이어프레임이 갱신되면서 "미답변 문의"
 * 지표는 빠지고, 그 자리에 "재고 초과 알림"이 새로 생겼다 — 그 날짜의 예약 수가 총 보유를
 * 넘은 날을 알려주는 항목이다. 처음엔 본문의 알림 줄이었다가 지금은 하단에 항상 떠 있는 토스트
 * 팝업("재고 초과 날짜 N건")이다(상세: InventoryOverCapacityToast 컴포넌트 주석).
 *
 * 화면 이동(와이어프레임): 예약 카드 → 예약 상세, 지표 → 해당 목록, 재고 초과 알림 → 재고 세팅의
 * 해당 날짜.
 */
/**
 * "오늘"은 일본 시간(JST) 기준이다(관리자_상세설명.md S1-A1: '오늘 방문 예약' = 오늘 날짜 이용 건,
 * 일본 기준 '오늘'). 서버가 어느 시간대에서 돌든 같은 값이 나오도록 시간대를 못 박아서 YYYY-MM-DD로
 * 만든다("sv-SE" 로케일이 이 형식으로 나온다).
 */
const todayInJapan = () => new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Tokyo" });

/**
 * "오늘"과 "미입금(24시간 경과)" 판정이 요청 시점 기준이라, 빌드 시점에 굳지 않고 요청마다 새로
 * 계산되게 한다.
 */
export const dynamic = "force-dynamic";

export default function AdminDashboardPage() {
  const newCount = adminReservations.filter((r) => r.status === "received").length;
  const pendingDepositCount = adminReservations.filter((r) => getAdminTab(r) === "received").length;
  const cancelRequestCount = adminReservations.filter((r) => r.status === "cancel_requested").length;

  const stats = [
    { label: "신규 예약", value: newCount, href: "/reservations?tab=received", tone: "primary" as const, large: true, icon: <IconFace mood={newCount > 0 ? "happy" : "sad"} className="h-8 w-8" /> },
    { label: "입금확인 요청", value: pendingDepositCount, href: "/reservations?tab=unpaid", tone: "warning" as const },
    { label: "취소요청", value: cancelRequestCount, href: "/reservations?tab=cancel_requested", tone: "error" as const },
  ];

  // '오늘 방문 예약' = 오늘(JST) 이용 건. 한 예약(1 예약번호)에 항목이 여러 개고 항목마다 이용일이
  // 다를 수 있으므로(S1-A7/A8), 예약 대표 이용일이 아니라 "취소되지 않은 유효 항목 중 이용일이 오늘인
  // 것"이 하나라도 있는 예약을 뽑는다. 전 항목이 취소된 예약은 방문하지 않으니 자연히 빠진다.
  const today = todayInJapan();
  const todayReservations = adminReservations.filter((r) =>
    r.items.some((item) => item.status === "active" && item.useDate === today),
  );

  // 예약 종류별 태그 색 — 위쪽 수치 카드(Stat)와 같은 계열로 맞췄다:
  //   접수=초록(신규 예약) / 미입금=노랑(입금확인 요청) / 취소요청=빨강(취소요청) / 완료=블루.
  // 카드 배경은 전부 같은 기본색이고 태그만 색이 다르다. 그 외(취소 등)는 회색 태그.
  const cardAccent = (r: (typeof adminReservations)[number]) => {
    if (getAdminTab(r) === "unpaid") return "warning" as const;
    if (r.status === "received") return "primary" as const;
    if (r.status === "cancel_requested") return "error" as const;
    if (r.status === "completed") return "info" as const;
    return undefined;
  };

  // 목록 컴포넌트(클라이언트)에는 판정이 끝난 값만 넘긴다 — "미입금"은 접수 후 24시간 경과 같은 시간
  // 기준 계산이라 서버에서 한 번만 정하는 게 안전하다.
  const todayVisitItems: TodayVisitItem[] = todayReservations.map((r) => ({
    id: r.id,
    product: r.product,
    useDate: r.useDate,
    accent: cardAccent(r),
    tagLabel: getAdminTab(r) === "unpaid" ? "미입금" : RESERVATION_STATUS_LABEL[r.status],
  }));

  return (
    // 페이지 전체가 스크롤되지 않도록 main을 화면(상단 헤더와 하단 메뉴 사이) 높이에 딱 맞추고(h-full), 남는
    // 높이를 "오늘 방문 예약" 상자가 전부 차지하게 한다(flex-1). 상자 안에서는 예약 목록만 스크롤된다
    // (TodayVisitList). 화면이 아주 작아 상자가 min-h보다 줄어들 때만 페이지가 스크롤된다.
    <main className="mx-auto flex h-full max-w-2xl flex-col px-6 pt-6">
      {/* 로고는 이제 모든 화면 공통 상단 헤더(TopHeader)에 떠 있어서, 대시보드 화면 안에는
          따로 다시 넣지 않는다. */}
      <div className="flex min-h-0 flex-1 flex-col gap-6">
        <Stat items={stats} />

        <InventoryOverCapacityToast />

        {/* 제목과 목록을 테두리 있는 큰 상자 하나로 묶는다. 안쪽 예약 카드는 이 상자 안에서 한 단계 밝은 배경.
            상자는 아래로 계속 이어지는 시트 모양이라 모서리는 위쪽 두 곳만 둥글고 아래 테두리·모서리는 없다.
            맨 아래 pb-[72px]는 화면에 떠 있는 "재고 초과 날짜" 토스트(하단 메뉴 바로 위)가 상자 안쪽 빈 자리에
            앉도록 남겨둔 공간이라, 토스트가 예약 카드를 가리지 않는다. */}
        <section className="flex min-h-[240px] flex-1 flex-col rounded-t-lg border border-b-0 border-card-border px-5 pb-[72px] pt-5">
          <div className="flex min-h-0 flex-1 flex-col gap-4">
            {/* 제목은 왼쪽, 예약 관리 화면으로 가는 버튼은 오른쪽 끝(between 정렬) */}
            <Stack justify="between" align="center">
              <Title size="sm" leaf>오늘 방문 예약</Title>
              <Button href="/reservations" variant="subtle" size="sm">
                예약 관리
              </Button>
            </Stack>
            <TodayVisitList items={todayVisitItems} />
          </div>
        </section>
      </div>
    </main>
  );
}
