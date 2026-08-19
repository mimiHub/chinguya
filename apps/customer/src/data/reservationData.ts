import type { CustomerReservation, CustomerReservationStatus } from "@chinguya/types";

/**
 * 고객 예약 목업 저장소. 실제로는 POST/GET /api/customer/reservations 로 대체될 자리다.
 * 지금은 로그인 기능이 없어서 "이 브라우저 세션에서 만든 예약 전부"를 그냥 "내 예약"으로 취급한다
 * (사용자 구분 없음). 메모리에만 저장되므로 새로고침하면 초기화된다.
 */
/**
 * 화면 확인용 임의 데이터 — 실제로는 로그인한 사용자가 예약을 만들어야 채워지는데, 상태별
 * 배지 색(접수/완료/취소요청/취소)을 한 번에 눈으로 확인하려고 4가지 상태를 하나씩 미리
 * 채워뒀다. 아래 seqByYearMonth 초기화로 이 목업들과 실제로 새로 만드는 예약의 ID가
 * 겹치지 않게 해뒀다.
 */
const reservations: CustomerReservation[] = [
  {
    id: "FR-26080001",
    productId: "bike-electric",
    rentalOption: "1d",
    status: "received",
    passportName: "GILDONG HONG",
    useDate: "2026-08-25",
    quantity: 1,
    amountKrw: 15000,
    createdAt: "2026-08-18T09:00:00.000Z",
  },
  {
    id: "FR-26080002",
    productId: "bike-regular",
    rentalOption: "2d",
    status: "completed",
    passportName: "GILDONG HONG",
    useDate: "2026-08-10",
    useDateEnd: "2026-08-11",
    quantity: 1,
    amountKrw: 14000,
    createdAt: "2026-08-08T09:00:00.000Z",
  },
  {
    id: "FR-26080003",
    productId: "fishing-reel",
    rentalOption: "1d",
    status: "cancel_requested",
    passportName: "GILDONG HONG",
    useDate: "2026-08-22",
    quantity: 2,
    amountKrw: 24000,
    createdAt: "2026-08-15T09:00:00.000Z",
  },
  {
    id: "FR-26080004",
    productId: "fishing-regular",
    rentalOption: "night",
    status: "cancelled",
    passportName: "GILDONG HONG",
    useDate: "2026-08-05",
    quantity: 1,
    amountKrw: 8000,
    cancelFeeRate: 0.1,
    createdAt: "2026-08-03T09:00:00.000Z",
  },
];

const seqByYearMonth = new Map<string, number>([["2608", 4]]);

function generateReservationId(now: Date = new Date()): string {
  const yy = String(now.getFullYear()).slice(2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const key = `${yy}${mm}`;
  const next = (seqByYearMonth.get(key) ?? 0) + 1;
  seqByYearMonth.set(key, next);
  return `FR-${key}${String(next).padStart(4, "0")}`;
}

export interface CreateReservationInput {
  productId: string;
  rentalOption: CustomerReservation["rentalOption"];
  passportName: string;
  useDate: string;
  useDateEnd?: string;
  quantity: number;
  offSiteReturn?: boolean;
  amountKrw: number;
}

/**
 * 예약 하나를 만들어 저장한다. 상태는 바로 "received"(접수)로 시작한다 — 문서 규칙상 "접수"는
 * 예약이 생성된 상태를 뜻하고, 이후 관리자가 입금을 확인하면 "completed"(완료)로 바뀐다.
 */
export function createReservation(input: CreateReservationInput): CustomerReservation {
  const reservation: CustomerReservation = {
    id: generateReservationId(),
    productId: input.productId,
    rentalOption: input.rentalOption,
    status: "received",
    passportName: input.passportName,
    useDate: input.useDate,
    useDateEnd: input.useDateEnd,
    quantity: input.quantity,
    offSiteReturn: input.offSiteReturn,
    amountKrw: input.amountKrw,
    createdAt: new Date().toISOString(),
  };
  reservations.unshift(reservation);
  return reservation;
}

export function findReservationById(id: string): CustomerReservation | undefined {
  return reservations.find((r) => r.id === id);
}

export function findReservationsByIds(ids: string[]): CustomerReservation[] {
  return ids.map((id) => findReservationById(id)).filter((r): r is CustomerReservation => Boolean(r));
}

/** 최신순으로 전체 예약 목록 */
export function listReservations(): CustomerReservation[] {
  return [...reservations];
}

export function updateReservationStatus(id: string, status: CustomerReservationStatus, cancelFeeRate?: number): void {
  const reservation = findReservationById(id);
  if (!reservation) return;
  reservation.status = status;
  if (cancelFeeRate !== undefined) reservation.cancelFeeRate = cancelFeeRate;
}

/** S1-C5 목록 화면의 탭 4개("전체" 포함) */
export type MyReservationTab = "all" | CustomerReservationStatus;

export const MY_RESERVATION_TAB_ORDER: MyReservationTab[] = ["all", "received", "completed", "cancelled"];

export const MY_RESERVATION_TAB_LABEL: Record<MyReservationTab, string> = {
  all: "전체",
  received: "접수",
  completed: "완료",
  cancel_requested: "취소요청",
  cancelled: "취소",
};

export const RESERVATION_STATUS_LABEL: Record<CustomerReservationStatus, string> = {
  received: "접수",
  completed: "완료",
  cancel_requested: "취소요청",
  cancelled: "취소",
};
