import type { AgencyReservation } from "@chinguya/types";

/**
 * 여행사 예약 "사용액" 목업(관리자 조회용).
 * 여행사 예약 자체는 각 여행사가 agency 앱에서 만들지만, 그 데이터는 로그인한 자기 여행사 것만
 * 보이는 agency 앱 안에만 있다. 관리자가 인보이스를 자동으로 집계·발행하려면 "모든 여행사"의
 * 사용 내역을 봐야 하므로, 실제로는 GET /api/admin/agency-reservations 로 대체될 자리를 이 파일이
 * 대신한다. invoiceData.ts가 이 데이터를 합산해서 인보이스 금액을 계산한다.
 */
function dateInPeriod(period: string, day: number): string {
  return `${period}-${String(day).padStart(2, "0")}`;
}

const now = new Date();
const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
const previousPeriod = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, "0")}`;

export const agencyReservations: AgencyReservation[] = [
  // agency-1 · 전월분 — 이미 마감된 달이라 화면을 열면 자동으로 인보이스가 발행된다.
  {
    id: "AG-P1-01",
    agencyId: "agency-1",
    productId: "bike-electric",
    rentalOption: "1d",
    status: "completed",
    passportName: "KIM MINSU",
    useDate: dateInPeriod(previousPeriod, 5),
    quantity: 3,
    amountKrw: 24000,
    createdAt: new Date().toISOString(),
  },
  {
    id: "AG-P1-02",
    agencyId: "agency-1",
    productId: "bike-regular",
    rentalOption: "1d",
    status: "completed",
    passportName: "LEE JIWON",
    useDate: dateInPeriod(previousPeriod, 18),
    quantity: 2,
    amountKrw: 10000,
    createdAt: new Date().toISOString(),
  },
  // agency-2 · 전월분
  {
    id: "AG-P2-01",
    agencyId: "agency-2",
    productId: "fishing-regular",
    rentalOption: "2h",
    status: "completed",
    passportName: "PARK SOYEON",
    useDate: dateInPeriod(previousPeriod, 12),
    quantity: 4,
    amountKrw: 32000,
    createdAt: new Date().toISOString(),
  },
  // agency-1 · 이번 달분 — 아직 마감 전이라 "발행예정" 진행 중 금액으로만 보인다.
  {
    id: "AG-C1-01",
    agencyId: "agency-1",
    productId: "bike-electric",
    rentalOption: "1d",
    status: "completed",
    passportName: "CHOI YUNA",
    useDate: dateInPeriod(currentPeriod, 3),
    quantity: 1,
    amountKrw: 8000,
    createdAt: new Date().toISOString(),
  },
  // agency-2 · 이번 달분
  {
    id: "AG-C2-01",
    agencyId: "agency-2",
    productId: "fishing-reel",
    rentalOption: "night",
    status: "completed",
    passportName: "JUNG WOOJIN",
    useDate: dateInPeriod(currentPeriod, 8),
    quantity: 2,
    amountKrw: 20000,
    createdAt: new Date().toISOString(),
  },
];
