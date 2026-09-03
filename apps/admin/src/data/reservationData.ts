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
export interface AdminReservationRow {
  id: string;
  customer: string;
  passportName: string;
  product: string;
  useDate: string;
  amountKrw: number;
  status: CustomerReservationStatus;
  /** 접수(예약 생성) 시각 — "미입금" 경과 시간 계산의 기준 */
  createdAt: string;
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
  },
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
