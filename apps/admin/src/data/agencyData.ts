import type { Agency } from "@chinguya/types";

/**
 * 여행사(거래처) 목업 데이터.
 * 실제로는 GET/POST/DELETE /api/admin/agencies 로 대체될 자리다.
 */
export const agencies: Agency[] = [
  {
    id: "agency-1",
    name: "제주바다여행사",
    contactName: "이수진",
    contactPhone: "010-1234-5678",
    contactEmail: "sujin@jejusea-travel.co.kr",
    active: true,
  },
  {
    id: "agency-2",
    name: "한라산투어",
    contactName: "정우진",
    contactPhone: "010-9876-5432",
    contactEmail: "wj@hallatour.co.kr",
    active: true,
  },
  {
    id: "agency-3",
    name: "올레트래블",
    contactName: "김하나",
    contactPhone: "010-2222-3333",
    contactEmail: "hana@olletravel.co.kr",
    active: false,
  },
];

export function findAgencyById(id: string): Agency | undefined {
  return agencies.find((a) => a.id === id);
}
