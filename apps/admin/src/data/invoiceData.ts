import type { AgencyReservationStatus, Invoice, RentalOptionKey } from "@chinguya/types";
import { agencies } from "./agencyData";
import { agencyReservations } from "./agencyReservationData";
import { CATALOG_TITLES } from "./productData";

/**
 * 인보이스(정산서) 목업 데이터.
 * 실제로는 GET /api/admin/invoices 로 대체될 자리다.
 *
 * 규칙(packages/types 문서): 매월 1일에 전월 기준으로 발행, 통화는 KRW, 세금 라인 없음,
 * 정산(입금) 확인은 관리자가 수동으로 체크한다(자동 입금 확인 연동 없음).
 *
 * "발행"은 관리자가 여행사·금액을 직접 골라 입력하는 게 아니다 — 그 달이 마감되면(=다음 달 1일이
 * 되면) 그 달 여행사 예약 사용액(agencyReservationData)을 합산해 자동으로 만들어진다. 실제로는
 * 매월 1일에 도는 배치가 할 일이지만, 배치 서버가 없는 프로토타입이라 화면을 열 때마다 "마감은
 * 됐는데 아직 인보이스가 없는 달"을 찾아 그 자리에서 채워 넣는다(issueDueInvoices, 멱등).
 */
export const invoices: Invoice[] = [];

function periodOf(dateStr: string): string {
  return dateStr.slice(0, 7);
}

/** 이번 달(YYYY-MM) — 아직 마감되지 않아 인보이스 발행 대상이 아닌, 진행 중인 기간 */
export function getCurrentPeriod(now: Date = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function sumUsage(agencyId: string, period: string): number {
  return agencyReservations
    .filter((r) => r.status === "completed" && r.agencyId === agencyId && periodOf(r.useDate) === period)
    .reduce((sum, r) => sum + r.amountKrw, 0);
}

/**
 * 마감된(이번 달보다 이전) 기간 중 아직 인보이스가 없는 여행사 · 기간 조합을 찾아 자동으로
 * 발행한다. 이미 있으면 다시 만들지 않는다(멱등) — 화면을 열 때마다 호출해도 중복 발행되지 않는다.
 */
export function issueDueInvoices(now: Date = new Date()): void {
  const currentPeriod = getCurrentPeriod(now);
  const closedPeriods = Array.from(
    new Set(agencyReservations.map((r) => periodOf(r.useDate)).filter((period) => period < currentPeriod)),
  );

  for (const period of closedPeriods) {
    for (const agency of agencies) {
      if (invoices.some((inv) => inv.agencyId === agency.id && inv.period === period)) continue;

      const amountKrw = sumUsage(agency.id, period);
      if (amountKrw <= 0) continue;

      invoices.push({ id: `INV-${period}-${agency.id}`, agencyId: agency.id, period, amountKrw, settled: false });
    }
  }
}

issueDueInvoices();

export function findInvoicesByAgency(agencyId: string): Invoice[] {
  return invoices.filter((inv) => inv.agencyId === agencyId);
}

export function findInvoiceById(id: string): Invoice | undefined {
  return invoices.find((inv) => inv.id === id);
}

/** 인보이스 상세(S2-A6)의 라인아이템 한 건 — 예약번호·상품·수량·금액. */
export interface InvoiceLineItem {
  reservationId: string;
  productTitle: string;
  option: RentalOptionKey;
  quantity: number;
  status: AgencyReservationStatus;
  /** 완료 건은 예약 금액 그대로, 취소 건은 0(아래 규칙 설명 참고) — 합계에 그대로 더하면 된다. */
  amountKrw: number;
}

/**
 * 인보이스 하나(여행사 × 기간)에 속한 여행사 예약 라인아이템 목록을 반환한다. 완료·취소 예약을
 * 모두 보여주되(어떤 예약이 취소됐는지 확인할 수 있도록), 금액은 완료 건만 반영한다.
 *
 * 비동기 데일리 로그(2026-08-24, "인보이스 기획 상세페이지 누락 수정")는 합계를 "완료 예약 금액
 * 합 + 취소 건은 취소 수수료만 반영"으로 정의했다. 하지만 여행사 예약(AgencyReservation)은 고객
 * 예약과 달리 입금 흐름이 없어 "예약=즉시 완료, 취소=즉시"로 단순화된 모델이라 애초에 취소
 * 수수료 개념이 없다(apps/agency/src/data/reservationData.ts 주석 참고, cancelFeeRate 필드도
 * CustomerReservation에만 있다). 그래서 취소 건은 라인에는 표시하되 금액은 0으로 두고, 합계는
 * 완료 예약 금액 합(=invoice.amountKrw)만 더한다 — 여행사 취소 수수료가 실제로 필요해지면
 * AgencyReservation에 별도 필드(예: cancelFeeKrw)를 추가하는 게 먼저다.
 */
export function getInvoiceLineItems(invoice: Invoice): InvoiceLineItem[] {
  return agencyReservations
    .filter((r) => r.agencyId === invoice.agencyId && periodOf(r.useDate) === invoice.period)
    .map((r) => ({
      reservationId: r.id,
      productTitle: CATALOG_TITLES.find((c) => c.slug === r.productId)?.title ?? r.productId,
      option: r.rentalOption,
      quantity: r.quantity,
      status: r.status,
      amountKrw: r.status === "completed" ? r.amountKrw : 0,
    }));
}

export function setInvoiceSettled(id: string, settled: boolean): void {
  const invoice = invoices.find((inv) => inv.id === id);
  if (invoice) invoice.settled = settled;
}

/**
 * 이번 달 들어 여행사가 지금까지 사용한 금액. 아직 마감 전이라 인보이스로 발행되지는 않았지만,
 * 이 달이 끝나면(=다음 달 1일) 이 금액 그대로 인보이스가 자동 발행된다 — 화면에는 "발행예정"으로
 * 표시해 계속 올라가는 진행 중 금액임을 보여준다.
 */
export function getPendingUsage(agencyId: string, now: Date = new Date()): number {
  return sumUsage(agencyId, getCurrentPeriod(now));
}
