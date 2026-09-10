import type { Agency } from "@chinguya/types";

/**
 * 여행사(거래처) 목업 데이터.
 *
 * ⚠ 여행사 관리(S2-A1/A2/A3)는 이제 Core API에 실연동돼 이 파일을 쓰지 않는다.
 *   아직 목에 머물러 있는 인보이스(S2-A5/A6)·할당 세팅(S2-A4) 화면만 참조한다 —
 *   그 API가 생기면 이 파일은 사라진다(assetData.ts와 같은 처지).
 */
export const agencies: Agency[] = [
  {
    agencyId: "agency-1",
    name: "제주바다여행사",
    contactName: "이수진",
    contactPhone: "010-1234-5678",
    contactEmail: "sujin@jejusea-travel.co.kr",
    active: true,
    accountRegistered: true,
    loginId: "agency01",
    invitationStatus: "ACCEPTED",
    invitationExpiresAt: null,
    deleted: false,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    deletedAt: null,
  },
  {
    agencyId: "agency-2",
    name: "한라산투어",
    contactName: "정우진",
    contactPhone: "010-9876-5432",
    contactEmail: "wj@hallatour.co.kr",
    active: true,
    accountRegistered: false,
    loginId: null,
    invitationStatus: "PENDING",
    invitationExpiresAt: "2026-12-31T00:00:00Z",
    deleted: false,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    deletedAt: null,
  },
  {
    agencyId: "agency-3",
    name: "올레트래블",
    contactName: "김하나",
    contactPhone: "010-2222-3333",
    contactEmail: "hana@olletravel.co.kr",
    active: false,
    accountRegistered: false,
    loginId: null,
    invitationStatus: "EXPIRED",
    invitationExpiresAt: "2026-02-01T00:00:00Z",
    deleted: false,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    deletedAt: null,
  },
];

export function findAgencyById(id: string): Agency | undefined {
  return agencies.find((a) => a.agencyId === id);
}
