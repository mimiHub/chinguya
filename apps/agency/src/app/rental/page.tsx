import { redirect } from "next/navigation";

// 이전에 임시로 만들었던 상품 목록 페이지 — 실제 와이어프레임(S2-G4/G5)에 맞춘 예약 화면인
// /book으로 대체됐다. 이 경로로 들어오는 링크가 남아있을 수 있어 리다이렉트만 해준다.
export default function AgencyRentalRedirect() {
  redirect("/book");
}
