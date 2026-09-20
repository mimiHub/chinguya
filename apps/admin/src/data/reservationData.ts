import type { CustomerReservationStatus } from "@chinguya/types";

/**
 * 관리자용 예약 목업 데이터 (cafe-next 프로토타입에서 이관).
 * 실제 백엔드 연동 시 이 파일 대신 API 응답(GET /api/admin/reservations)으로 교체한다.
 *
 * 상태값은 cafe-next 원본처럼 "접수"/"완료" 같은 한글 문자열을 직접 쓰지 않고,
 * packages/types 의 CustomerReservationStatus(단일 출처)를 그대로 쓴다 — 고객앱의 예약 상태와
 * 관리자 화면의 예약 상태가 같은 값이어야 하기 때문에, 두 곳에서 각자 다른 문자열을 쓰면
 * 나중에 어긋나기 쉽다.
 */
/** 예약 항목(1 예약번호 = N 항목) 하나의 유효/취소 여부. 별도 상태값 없이 이 값으로만
 * "부분취소" 뱃지를 계산한다 — packages/mocks의 BookingItemStatus와 같은 개념. */
export type ReservationItemStatus = "active" | "cancelled";

/** 예약 항목 하나 — 항목마다 상품·옵션·이용일·수량·금액이 다를 수 있다(관리자_상세설명.md S1-A7/A8). */
export interface AdminReservationItem {
  id: string;
  productName: string;
  /** 대여 옵션 표기(예: "1일", "2시간") — 상품명과 붙여 "상품 · 옵션"으로 보여준다. */
  optionLabel: string;
  useDate: string;
  quantity: number;
  amountKrw: number;
  status: ReservationItemStatus;
}

export interface AdminReservationRow {
  id: string;
  customer: string;
  passportName: string;
  /** 대표 상품명 · 이용일 · 결제액(예약 목록 카드 표기용) — 항목 리스트는 items 참고. */
  product: string;
  useDate: string;
  amountKrw: number;
  status: CustomerReservationStatus;
  /** 접수(예약 생성) 시각 — "미입금" 경과 시간 계산의 기준 */
  createdAt: string;
  /** 예약 항목 리스트(취소된 항목도 포함). 1 예약번호 = N 항목. */
  items: AdminReservationItem[];
}

/** 유효 항목(status="active") 금액 합계 — 예약 상세의 "입금액(유효 항목)". */
export function activeItemsTotal(row: AdminReservationRow): number {
  return row.items.filter((it) => it.status === "active").reduce((sum, it) => sum + it.amountKrw, 0);
}

/** 일부 항목만 취소된 예약인지 — true면 "부분취소" 뱃지(별도 상태값 없음). */
export function isPartiallyCancelled(row: AdminReservationRow): boolean {
  const hasActive = row.items.some((it) => it.status === "active");
  const hasCancelled = row.items.some((it) => it.status === "cancelled");
  return hasActive && hasCancelled;
}

const hoursAgo = (h: number) => new Date(Date.now() - h * 60 * 60 * 1000).toISOString();

/**
 * 오늘로부터 n일 후 날짜(YYYY-MM-DD). 취소 수수료 차등 요율(daysBeforeUse) 데모가 의미
 * 있으려면 "이용일까지 남은 일수"가 테스트 시점과 무관하게 항상 그럴듯해야 하는데, 다른
 * 항목들처럼 고정된 미래 날짜(예: "2027-07-09")를 쓰면 테스트하는 날짜에 따라 남은 일수가
 * 계속 달라져 버린다(예: 요율표 최상위 구간에 걸려 늘 0%로만 보일 수 있음). 그래서 취소
 * 수수료 화면이 실제로 보여지는 예약(FR-27060999)만 상대 날짜로 만든다.
 */
const daysFromNow = (d: number) => {
  const date = new Date();
  date.setDate(date.getDate() + d);
  return date.toISOString().slice(0, 10);
};

/**
 * 일본 시간(JST) 기준 오늘로부터 n일 후 날짜(YYYY-MM-DD). 대시보드의 "오늘 방문 예약"이 일본 기준
 * '오늘'로 판정되므로(관리자_상세설명.md S1-A1), 데모 데이터도 같은 기준으로 만든다 — 위 daysFromNow는
 * UTC 날짜라 한국·일본 새벽(0~9시)에는 하루 전 날짜가 나와서 "오늘"과 어긋난다. JST는 UTC+9라
 * 시각에 9시간을 더한 뒤 날짜 부분만 자른다.
 */
const jstDaysFromNow = (d: number) => new Date(Date.now() + 9 * 60 * 60 * 1000 + d * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

/**
 * "오늘 방문 예약" 데모용 예약 한 건을 만든다(이용일 = 오늘 JST, 항목 1건). 목록이 5건을 넘을 때의
 * "더 보기" 동작을 확인할 수 있게 여러 건이 필요해서, 같은 모양의 행을 손으로 반복해 적는 대신 이
 * 함수로 만든다. hoursOld는 접수 후 경과 시간이라 24 이상이면 접수 상태가 "미입금"으로 보인다.
 */
const todayVisit = (o: {
  id: string;
  customer: string;
  passportName: string;
  productName: string;
  optionLabel: string;
  amountKrw: number;
  status: CustomerReservationStatus;
  hoursOld: number;
}): AdminReservationRow => ({
  id: o.id,
  customer: o.customer,
  passportName: o.passportName,
  product: `${o.productName} ${o.optionLabel} × 1`,
  useDate: jstDaysFromNow(0),
  amountKrw: o.amountKrw,
  status: o.status,
  createdAt: hoursAgo(o.hoursOld),
  items: [
    {
      id: `${o.id}-1`,
      productName: o.productName,
      optionLabel: o.optionLabel,
      useDate: jstDaysFromNow(0),
      quantity: 1,
      amountKrw: o.amountKrw,
      status: "active",
    },
  ],
});

export const adminReservations: AdminReservationRow[] = [
  {
    id: "FR-27070001",
    customer: "gildong",
    passportName: "GILDONG HONG",
    product: "전기자전거 1일 × 2",
    useDate: "2027-07-07",
    amountKrw: 30000,
    status: "received",
    createdAt: hoursAgo(2), // 방금 접수 — 아직 미입금 아님
    // 항목 2건 데모(관리자_상세설명.md 예시) — 같은 상품·이용일이라도 항목은 나뉠 수 있다.
    items: [
      { id: "FR-27070001-1", productName: "전기자전거", optionLabel: "1일", useDate: "2027-07-07", quantity: 1, amountKrw: 15000, status: "active" },
      { id: "FR-27070001-2", productName: "전기자전거", optionLabel: "1일", useDate: "2027-07-07", quantity: 1, amountKrw: 15000, status: "active" },
    ],
  },
  {
    id: "FR-27060777",
    customer: "seojun",
    passportName: "SEOJUN LEE",
    product: "일반자전거 2시간 × 1",
    useDate: "2027-07-10",
    amountKrw: 3000,
    status: "received",
    createdAt: hoursAgo(30), // 24시간 지남 — "미입금" 탭에 노출
    items: [
      { id: "FR-27060777-1", productName: "일반자전거", optionLabel: "2시간", useDate: "2027-07-10", quantity: 1, amountKrw: 3000, status: "active" },
    ],
  },
  {
    id: "FR-27070002",
    customer: "minsu",
    passportName: "MINSU KIM",
    product: "일반자전거 1일 × 1",
    useDate: "2027-07-08",
    amountKrw: 8000,
    status: "completed",
    createdAt: hoursAgo(20),
    items: [
      { id: "FR-27070002-1", productName: "일반자전거", optionLabel: "1일", useDate: "2027-07-08", quantity: 1, amountKrw: 8000, status: "active" },
    ],
  },
  {
    id: "FR-27060999",
    customer: "jiwon",
    passportName: "JIWON LEE",
    product: "전기자전거 2일 × 1",
    useDate: daysFromNow(5), // 취소 수수료 차등 요율 데모용 상대 날짜 — daysFromNow 주석 참고
    amountKrw: 27000,
    status: "cancel_requested",
    createdAt: hoursAgo(40),
    items: [
      { id: "FR-27060999-1", productName: "전기자전거", optionLabel: "2일", useDate: daysFromNow(5), quantity: 1, amountKrw: 27000, status: "active" },
    ],
  },
  {
    id: "FR-27060888",
    customer: "yuna",
    passportName: "YUNA PARK",
    product: "릴낚시대 2시간 × 1",
    useDate: "2027-06-25",
    amountKrw: 5000,
    status: "cancelled",
    createdAt: hoursAgo(200),
    // 예약 전체 취소 — 항목도 전부 취소 상태로 남긴다(바우처에서 회색·취소 뱃지로 표시하는 것과 동일한 원칙).
    items: [
      { id: "FR-27060888-1", productName: "릴낚시대", optionLabel: "2시간", useDate: "2027-06-25", quantity: 1, amountKrw: 5000, status: "cancelled" },
    ],
  },
  // ─── "오늘 방문 예약" 데모 데이터 ───────────────────────────────────────────────
  // 대시보드 "오늘 방문 예약"(= 오늘 JST 이용 건)이 비어 보이지 않게, 이용일이 항상 "오늘"인 예약을
  // 상태별(접수/미입금/완료/취소요청)로 하나씩 넣어 둔다. 실제 백엔드가 연동되면 이 데이터는 API
  // 응답으로 대체된다.
  {
    id: "FR-26092001",
    customer: "haneul",
    passportName: "HANEUL JUNG",
    product: "전기자전거 1일 × 2",
    useDate: jstDaysFromNow(0),
    amountKrw: 30000,
    status: "received",
    createdAt: hoursAgo(3), // 방금 접수 — 아직 미입금 아님(접수)
    items: [
      { id: "FR-26092001-1", productName: "전기자전거", optionLabel: "1일", useDate: jstDaysFromNow(0), quantity: 1, amountKrw: 15000, status: "active" },
      { id: "FR-26092001-2", productName: "전기자전거", optionLabel: "1일", useDate: jstDaysFromNow(0), quantity: 1, amountKrw: 15000, status: "active" },
    ],
  },
  {
    id: "FR-26091903",
    customer: "doyun",
    passportName: "DOYUN CHOI",
    product: "일반자전거 2시간 × 1",
    useDate: jstDaysFromNow(0),
    amountKrw: 3000,
    status: "received",
    createdAt: hoursAgo(28), // 24시간 지남 — 미입금
    items: [
      { id: "FR-26091903-1", productName: "일반자전거", optionLabel: "2시간", useDate: jstDaysFromNow(0), quantity: 1, amountKrw: 3000, status: "active" },
    ],
  },
  {
    id: "FR-26091801",
    customer: "soyeon",
    passportName: "SOYEON HAN",
    // 한 예약에 항목 2건(상품이 서로 다름) — 카드에는 "대표 상품명 외 N건"으로 표기(관리자_상세설명.md S1-A6)
    product: "전기자전거 1일 외 1건",
    useDate: jstDaysFromNow(0),
    amountKrw: 25000,
    status: "completed",
    createdAt: hoursAgo(22),
    items: [
      { id: "FR-26091801-1", productName: "전기자전거", optionLabel: "1일", useDate: jstDaysFromNow(0), quantity: 1, amountKrw: 15000, status: "active" },
      { id: "FR-26091801-2", productName: "릴낚시대", optionLabel: "1일", useDate: jstDaysFromNow(0), quantity: 1, amountKrw: 10000, status: "active" },
    ],
  },
  {
    id: "FR-26091802",
    customer: "jihoon",
    passportName: "JIHOON YOO",
    product: "일반자전거 1일 × 1",
    useDate: jstDaysFromNow(0),
    amountKrw: 8000,
    status: "completed",
    createdAt: hoursAgo(26),
    items: [
      { id: "FR-26091802-1", productName: "일반자전거", optionLabel: "1일", useDate: jstDaysFromNow(0), quantity: 1, amountKrw: 8000, status: "active" },
    ],
  },
  {
    id: "FR-26091701",
    customer: "harin",
    passportName: "HARIN SONG",
    product: "전기자전거 1일 × 1",
    useDate: jstDaysFromNow(0),
    amountKrw: 15000,
    status: "cancel_requested",
    createdAt: hoursAgo(50),
    items: [
      { id: "FR-26091701-1", productName: "전기자전거", optionLabel: "1일", useDate: jstDaysFromNow(0), quantity: 1, amountKrw: 15000, status: "active" },
    ],
  },
  // 아래는 "더 보기" 동작 확인용으로 더 넣은 오늘 방문 예약(총 12건: 위 5건 + 7건).
  todayVisit({ id: "FR-26092002", customer: "yerin", passportName: "YERIN OH", productName: "전기자전거", optionLabel: "1일", amountKrw: 15000, status: "received", hoursOld: 1 }),
  todayVisit({ id: "FR-26092003", customer: "minjae", passportName: "MINJAE BAE", productName: "릴낚시대", optionLabel: "1일", amountKrw: 10000, status: "completed", hoursOld: 18 }),
  todayVisit({ id: "FR-26091904", customer: "chaewon", passportName: "CHAEWON KANG", productName: "일반자전거", optionLabel: "1일", amountKrw: 8000, status: "received", hoursOld: 27 }),
  todayVisit({ id: "FR-26091803", customer: "junseo", passportName: "JUNSEO YOON", productName: "전기자전거", optionLabel: "1일", amountKrw: 15000, status: "completed", hoursOld: 23 }),
  todayVisit({ id: "FR-26091702", customer: "sua", passportName: "SUA LIM", productName: "일반자전거", optionLabel: "2시간", amountKrw: 3000, status: "cancel_requested", hoursOld: 44 }),
  todayVisit({ id: "FR-26092004", customer: "taeyang", passportName: "TAEYANG SEO", productName: "릴낚시대", optionLabel: "2시간", amountKrw: 5000, status: "received", hoursOld: 5 }),
  todayVisit({ id: "FR-26091804", customer: "arin", passportName: "ARIN JEON", productName: "일반자전거", optionLabel: "1일", amountKrw: 8000, status: "completed", hoursOld: 21 }),
];

export function findAdminReservationById(id: string): AdminReservationRow | undefined {
  return adminReservations.find((r) => r.id === id);
}

/** 접수 후 이 시간이 지나면 관리자 화면에 "미입금"으로 표시(강제 취소 가능) — packages/types 문서의 규칙 */
export const UNPAID_AFTER_HOURS = 24;

/** 접수 시각으로부터 지금까지 몇 시간 지났는지 */
export function getElapsedHours(createdAt: string, now: Date = new Date()): number {
  return (now.getTime() - new Date(createdAt).getTime()) / (60 * 60 * 1000);
}

/** "미입금" 여부 — 상태값이 아니라 "접수 상태 + 24시간 경과"를 계산한 결과 */
export function isUnpaid(row: AdminReservationRow, now: Date = new Date()): boolean {
  return row.status === "received" && getElapsedHours(row.createdAt, now) >= UNPAID_AFTER_HOURS;
}

/**
 * 관리자 목록 화면의 탭 5개. "미입금"은 CustomerReservationStatus에 없는 값이라
 * (실제로 저장되는 상태가 아니라 계산된 라벨이라서) 화면 전용 타입으로 별도 정의한다.
 */
export type AdminReservationTab = CustomerReservationStatus | "unpaid";

export const ADMIN_TAB_ORDER: AdminReservationTab[] = [
  "received",
  "completed",
  "unpaid",
  "cancel_requested",
  "cancelled",
];

export const ADMIN_TAB_LABEL: Record<AdminReservationTab, string> = {
  received: "접수",
  completed: "완료",
  unpaid: "미입금",
  cancel_requested: "취소요청",
  cancelled: "취소",
};

/** 이 예약이 지금 어느 탭에 속하는지. "접수"인데 미입금 조건을 만족하면 "미입금" 탭으로 옮겨간다. */
export function getAdminTab(row: AdminReservationRow, now: Date = new Date()): AdminReservationTab {
  return isUnpaid(row, now) ? "unpaid" : row.status;
}

/** 화면에 보여줄 한글 라벨(저장 상태값 기준). packages/types 의 CustomerReservationStatus 값(영문 식별자)엔 글자가 없다. */
export const RESERVATION_STATUS_LABEL: Record<CustomerReservationStatus, string> = {
  received: "접수",
  completed: "완료",
  cancel_requested: "취소요청",
  cancelled: "취소",
};
