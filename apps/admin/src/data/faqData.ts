import type { FaqEntry } from "@chinguya/types";

/**
 * FAQ 목업 데이터(S4-A1/A3 FAQ · 콘텐츠 관리, CMS-lite).
 *
 * 고객앱 FAQ(S4-C3, apps/customer/src/data/faqData.ts)와 같은 시드(id·순서)로 시작한다 —
 * 실제로는 한 백엔드(GET/POST/PUT/DELETE /api/admin/faq)를 공유해서 여기서 등록·수정·삭제·
 * 순서 변경을 하면 고객앱에도 바로 반영돼야 한다. 지금은 앱마다 독립된 프로토타입이라
 * 여기서 편집해도 고객앱 화면에는 반영되지 않는다(계좌·정책 설정과 같은 한계).
 */
export const initialFaqEntries: FaqEntry[] = [
  {
    id: "faq-1",
    order: 1,
    question: "대여 시간은 언제까지 연장할 수 있나요?",
    answer:
      "영업 종료 시간까지 매장에 방문해 반납 전 연장 요청을 주시면 됩니다. 예약된 다음 이용자가 있는 경우 연장이 어려울 수 있어요.",
  },
  {
    id: "faq-2",
    order: 2,
    question: "예약 없이 현장에서 바로 대여할 수 있나요?",
    answer: "가능합니다. 다만 재고가 남아 있을 때만 현장 대여가 가능해서, 미리 예약해 두시는 걸 권장드려요.",
  },
  {
    id: "faq-3",
    order: 3,
    question: "우천 시에도 자전거 대여가 가능한가요?",
    answer: "우천 시에는 안전을 위해 자전거 대여가 제한될 수 있어요. 낚싯대는 우천 시에도 정상적으로 대여됩니다.",
  },
  {
    id: "faq-4",
    order: 4,
    question: "결제 수단은 어떤 게 있나요?",
    answer: "예약 후 안내되는 계좌로 무통장 입금만 가능합니다. 현장 카드 결제는 아직 준비 중이에요.",
  },
  {
    id: "faq-5",
    order: 5,
    question: "여권 정보는 왜 입력해야 하나요?",
    answer: "예약자 본인 확인을 위해 여권 영문명을 받고 있어요. 대여하실 때 실물 여권을 함께 보여주시면 됩니다.",
  },
];
