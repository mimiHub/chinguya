import type { AgencyReservation, AgencyReservationStatus } from "@chinguya/types";
import { CURRENT_AGENCY } from "./authData";

/**
 * 여행사 예약 목업 저장소. 실제로는 POST/GET /api/agency/reservations 로 대체될 자리다.
 * 여행사 예약은 고객 예약과 달리 입금 흐름이 없어서 상태가 단순하다: 예약=즉시 완료, 취소=즉시.
 * 메모리에만 저장되므로 새로고침하면 초기화된다(다른 목업 저장소들과 같은 한계).
 *
 * 데모를 바로 확인할 수 있도록 오늘 이용 예정 건 2개를 미리 넣어뒀다(대시보드의
 * "오늘 이용자 명단"이 빈 화면으로 보이지 않게).
 */
function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const reservations: AgencyReservation[] = [
  {
    id: "AG-27070011",
    agencyId: CURRENT_AGENCY.id,
    productId: "bike-electric",
    rentalOption: "1d",
    status: "completed",
    passportName: "KIM MINSU",
    useDate: todayKey(),
    quantity: 2,
    amountKrw: 16000,
    createdAt: new Date().toISOString(),
  },
  {
    id: "AG-27070012",
    agencyId: CURRENT_AGENCY.id,
    productId: "bike-regular",
    rentalOption: "1d",
    status: "completed",
    passportName: "LEE JIWON",
    useDate: todayKey(),
    quantity: 1,
    amountKrw: 5000,
    createdAt: new Date().toISOString(),
  },
];

const seqByYearMonth = new Map<string, number>();

function generateReservationId(now: Date = new Date()): string {
  const yy = String(now.getFullYear()).slice(2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const key = `${yy}${mm}`;
  const next = (seqByYearMonth.get(key) ?? 0) + 1;
  seqByYearMonth.set(key, next);
  return `AG-${key}${String(next).padStart(4, "0")}`;
}

export interface CreateAgencyReservationInput {
  productId: string;
  rentalOption: AgencyReservation["rentalOption"];
  useDate: string;
  quantity: number;
  amountKrw: number;
  /** 여권 영문명은 실제로는 이용자마다 입력받아야 하지만, 지금 예약 화면(S2-G4/G5)엔
   * 그 입력칸이 없어서 임시로 "미입력"을 채워둔다 — 실제 연동 시 여행사 담당자가 여러 이용자를
   * 한 번에 예약할 때 각 인원의 여권명을 입력하는 UI가 추가돼야 한다. */
  passportName?: string;
}

/** 예약을 만든다. 여행사 예약은 규칙상 생성 즉시 "완료" 상태다(입금 확인 절차가 없음). */
export function createReservation(input: CreateAgencyReservationInput): AgencyReservation {
  const reservation: AgencyReservation = {
    id: generateReservationId(),
    agencyId: CURRENT_AGENCY.id,
    productId: input.productId,
    rentalOption: input.rentalOption,
    status: "completed",
    passportName: input.passportName ?? "미입력",
    useDate: input.useDate,
    quantity: input.quantity,
    amountKrw: input.amountKrw,
    createdAt: new Date().toISOString(),
  };
  reservations.unshift(reservation);
  return reservation;
}

export function listReservations(): AgencyReservation[] {
  return [...reservations].filter((r) => r.agencyId === CURRENT_AGENCY.id);
}

export function findReservationById(id: string): AgencyReservation | undefined {
  return reservations.find((r) => r.id === id);
}

export function updateReservationStatus(id: string, status: AgencyReservationStatus): void {
  const reservation = findReservationById(id);
  if (reservation) reservation.status = status;
}

export const RESERVATION_STATUS_LABEL: Record<AgencyReservationStatus, string> = {
  completed: "완료",
  cancelled: "취소",
};
