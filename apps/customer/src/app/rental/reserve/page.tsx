import { redirect } from "next/navigation";

/**
 * 이전에는 상품 상세에서 "예약하기"를 누르면 이 페이지(/rental/reserve?product=...&option=...)로
 * 이동해 별도 화면에서 캘린더·수량·합계를 보여줬다. 비동기 데일리 로그(2026-09-02, "'상품 상세'와
 * '예약 · 캘린더' 통합")에 따라 그 내용이 /rental/[id] 한 화면으로 합쳐졌다. 이 경로로 들어오는 옛
 * 링크(북마크, 공유 링크 등)가 남아있을 수 있어 상품 상세 화면으로 리다이렉트만 해준다.
 */
export default async function RentalReserveRedirect({
  searchParams,
}: {
  searchParams: Promise<{ product?: string }>;
}) {
  const { product } = await searchParams;
  redirect(product ? `/rental/${product}` : "/rental");
}
