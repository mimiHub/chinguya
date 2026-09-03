import type { InquiryEntry } from "@chinguya/types";

/**
 * 1:1 문의 목업 데이터(S4-A2 문의 관리).
 *
 * 고객앱 문의(S4-C4 질문하기, apps/customer/src/data/inquiryData.ts)와 같은 시드로
 * 시작한다 — 실제로는 한 백엔드(GET/POST /api/admin/inquiries)를 공유해서 고객이 쓴 문의가
 * 그대로 여기 뜨고, 여기서 등록한 답변도 그대로 고객 화면에 반영돼야 한다. 지금은 앱마다
 * 독립된 프로토타입이라 한쪽에서 바뀐 내용이 다른 쪽에 반영되지 않는다.
 *
 * 고객앱은 비공개 글을 4자리 비밀번호로 잠그지만, 관리자는 답변을 위해 항상 전체 내용을
 * 볼 수 있어야 하므로 그 잠금은 여기서는 적용하지 않는다(isPublic·pin 필드는 참고용으로만
 * 남겨둔다).
 */
export const initialInquiries: InquiryEntry[] = [
  {
    id: "qna-1",
    title: "대여 취소 시 환불은 언제 되나요?",
    content: "취소 신청을 했는데 환불은 언제쯤 받을 수 있나요?",
    isPublic: true,
    answer: "무통장 입금 취소 건은 확인 후 영업일 기준 3일 이내로 입금하신 계좌로 환불해 드리고 있어요.",
    answeredAt: "2027-06-21T11:00:00+09:00",
    createdAt: "2027-06-20T10:00:00+09:00",
  },
  {
    id: "qna-2",
    title: "여권 사본도 미리 보내야 하나요?",
    content: "여권 사본을 미리 이메일로 보내둬야 할까요?",
    isPublic: false,
    pin: "1234",
    answer: "아니요, 예약 확정 안내와 함께 사본 제출 링크를 보내드리니 그때 보내주시면 됩니다.",
    answeredAt: "2027-06-22T09:30:00+09:00",
    createdAt: "2027-06-21T18:20:00+09:00",
  },
  {
    id: "qna-3",
    title: "자전거 대여 시 헬멧도 포함인가요?",
    content: "자전거 대여할 때 헬멧도 같이 대여할 수 있나요?",
    isPublic: true,
    answer: "네, 전 상품에 헬멧이 기본 포함되어 있어요. 사이즈가 필요하시면 현장에서 요청해 주세요.",
    answeredAt: "2027-06-23T14:10:00+09:00",
    createdAt: "2027-06-23T13:40:00+09:00",
  },
  {
    id: "qna-4",
    title: "결제 관련 문의",
    content: "해외에서도 입금(결제)할 수 있는 방법이 있을까요?",
    isPublic: false,
    pin: "1234",
    createdAt: "2027-06-24T08:15:00+09:00",
  },
];
