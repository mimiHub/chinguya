import type { Invoice } from "@chinguya/types";

/**
 * 인보이스(정산서) 목업 데이터.
 * 실제로는 GET/POST /api/admin/invoices 로 대체될 자리다.
 *
 * 규칙(packages/types 문서): 매월 1일에 전월 기준으로 발행, 통화는 KRW, 세금 라인 없음,
 * 정산 여부(settled)는 관리자가 수동으로 확인해서 체크한다(자동 입금 확인 연동 없음).
 */
export const invoices: Invoice[] = [
  { id: "INV-2027-06-agency-1", agencyId: "agency-1", period: "2027-06", amountKrw: 420000, settled: true },
  { id: "INV-2027-06-agency-2", agencyId: "agency-2", period: "2027-06", amountKrw: 180000, settled: false },
];

export function findInvoicesByAgency(agencyId: string): Invoice[] {
  return invoices.filter((inv) => inv.agencyId === agencyId);
}

/** 이번 달 기준 "전월"(YYYY-MM) — 인보이스는 항상 전월 기준으로 발행한다는 규칙 */
export function getPreviousPeriod(now: Date = new Date()): string {
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}`;
}
