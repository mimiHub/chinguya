import type { InquiryEntry } from "@chinguya/types";

/**
 * 1:1 문의 목업(S4-C4 질문하기). 로그인 기능이 없어서 "이 브라우저 세션에서 쓴 글 전부"를
 * 본인 글로 취급한다 — 새로고침하면 이 초기값으로 되돌아간다.
 *
 * 관리자 쪽(apps/admin/src/data/inquiryData.ts)이 같은 시드를 따로 들고 있다 — 실제로는
 * 한 백엔드(GET/POST /api/inquiries)를 공유해서 고객이 쓴 문의가 그대로 관리자 화면에
 * 뜨고, 관리자 답변도 그대로 여기 반영돼야 한다. 지금은 앱마다 독립된 프로토타입이라
 * 한쪽에서 바뀐 내용이 다른 쪽에 반영되지 않는다.
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
