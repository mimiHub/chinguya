import type { Invoice } from "@chinguya/types";
import { agencies } from "./agencyData";
import { agencyReservations } from "./agencyReservationData";

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

/**
 * 이번 달 들어 여행사가 지금까지 사용한 금액. 아직 마감 전이라 인보이스로 발행되지는 않았지만,
 * 이 달이 끝나면(=다음 달 1일) 이 금액 그대로 인보이스가 자동 발행된다 — 화면에는 "발행예정"으로
 * 표시해 계속 올라가는 진행 중 금액임을 보여준다.
 */
export function getPendingUsage(agencyId: string, now: Date = new Date()): number {
  return sumUsage(agencyId, getCurrentPeriod(now));
}
