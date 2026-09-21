// =============================================================================
// 픽스처 데이터 — PM(민철) 소유. 목 응답 '값'을 바꾸려면 이 파일만 수정한다.
// 타입은 OpenAPI 생성 타입(types.gen.ts)에 고정 → 목이 spec을 벗어나지 못한다.
// =============================================================================
import type { components } from "./types.gen";

type S = components["schemas"];

// ── 상품(자전거) : 기본가 10,000원 기준, 옵션별 요금 ───────────────────────────
export const products: S["ProductDetail"][] = [
  {
    productId: "bike-001",
    name: "시티 크루저",
    category: "BICYCLE",
    description: "가벼운 시티형 자전거. 초보자용.",
    imageUrls: [],
    options: [
      { optionType: "HOURS_2", price: 10000, daysRequired: 1 },
      { optionType: "DAY_1", price: 18000, daysRequired: 1 },
      {
        optionType: "DAY_2",
        price: 30000,
        daysRequired: 2,
        crossRegionReturnAvailable: true,
        crossRegionReturnExtraFee: 5000,
      },
      { optionType: "NIGHT", price: 12000, daysRequired: 1 },
    ],
  },
  {
    productId: "bike-002",
    name: "MTB 산악용",
    category: "BICYCLE",
    description: "산악 지형용 자전거.",
    imageUrls: [],
    options: [
      { optionType: "HOURS_2", price: 12000, daysRequired: 1 },
      { optionType: "DAY_1", price: 22000, daysRequired: 1 },
      { optionType: "DAY_2", price: 38000, daysRequired: 2, crossRegionReturnAvailable: false },
    ],
  },
];

// ── 입금 안내 계좌(관리자 설정 1개) ──────────────────────────────────────────
/** S4-C3 FAQ — 배열 순서가 곧 노출 순서. */
export const faqs: S["Faq"][] = [
  {
    faqId: "1",
    question: "대여 시간은 언제까지 연장할 수 있나요?",
    answer:
      "영업 종료 시간까지 매장에 방문해 반납 전 연장 요청을 주시면 됩니다. 예약된 다음 이용자가 있는 경우 연장이 어려울 수 있어요.",
  },
  {
    faqId: "2",
    question: "결제 수단은 어떤 게 있나요?",
    answer: "예약 후 안내되는 계좌로 무통장 입금만 가능합니다. 현장 카드 결제는 아직 준비 중이에요.",
  },
];

export const depositAccountBase = {
  bankName: "우리은행",
  accountNumber: "1002-000-000000",
  accountHolder: "친구야",
};

// 옵션 → 요구 일수 (2일=2, 그 외=1)
export function daysRequired(opt: S["RentalOptionType"]): 1 | 2 {
  return opt === "DAY_2" ? 2 : 1;
}

// ── 가용성 생성 : 오늘+1 ~ +30일, 잠정 재고 5 ────────────────────────────────
// TODO(협의 3): 2일+타지역반납 '익일·익익일 자동마감' 표기, JST 경계 처리는 백엔드 확정 후 반영.
export function buildAvailability(
  productId: string,
  optionType: S["RentalOptionType"],
  crossRegionReturn: boolean,
): S["Availability"] {
  const start = new Date();
  start.setDate(start.getDate() + 1); // 오늘+1(JST 근사)
  const end = new Date();
  end.setMonth(end.getMonth() + 3); // 오늘+3개월

  const dates: S["AvailabilityDate"][] = [];
  for (let i = 0; i < 30; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    dates.push({ date: iso(d), selectable: true, remaining: 5 });
  }

  return {
    productId,
    optionType,
    daysRequired: daysRequired(optionType),
    crossRegionReturn,
    bookableFrom: iso(start),
    bookableTo: iso(end),
    dates,
  };
}

export function iso(d: Date): string {
  return d.toISOString().slice(0, 10);
}
