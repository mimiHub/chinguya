import type { Agency } from "@chinguya/types";

/**
 * 초대 상태 배지의 문구·색. 목록(S2-A1)과 상세(S2-A3)가 같은 표기를 써야 해서 한 곳에 둔다.
 *
 * NONE 이 "미발송"인 것이 중요하다 — 등록은 됐지만 메일이 나가지 않은 상태이므로
 * 관리자가 상세에서 재발송해야 한다는 신호다.
 */
export function invitationBadge(agency: Agency): {
  label: string;
  variant: "success" | "info" | "warning" | "gray";
} {
  switch (agency.invitationStatus) {
    case "ACCEPTED":
      return { label: "계정 등록됨", variant: "success" };
    case "PENDING":
      return { label: "초대중", variant: "info" };
    case "EXPIRED":
      return { label: "초대 만료", variant: "warning" };
    default:
      return { label: "초대 미발송", variant: "gray" };
  }
}
