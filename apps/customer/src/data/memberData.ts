/**
 * 고객 계정 목업 저장소(S0-C3 회원정보, S0-C2 가입 완료). 실제로는 로그인한 사용자 계정
 * API(GET/PATCH /api/customer/member)로 대체될 자리다. "이 브라우저 세션의 고정 사용자
 * 한 명"만 다루고, 메모리에만 저장되므로 새로고침하면 초기화된다 —
 * reservationData.ts/CartContext.tsx와 같은 한계. 로그인 여부 자체는 이 파일이 아니라
 * authData.ts가 다룬다(회원 정보와 로그인 세션은 별개 개념이라 분리).
 */
export interface Member {
  email: string;
  connectedSocial: string;
  passportName: string;
}

const member: Member = {
  email: "gmj0503@gmail.com",
  connectedSocial: "카카오",
  // 예약 시점에 입력한 값이 있으면 그걸로 미리 채워주는 게 자연스럽지만, 그 연동은 로그인이
  // 붙어야 의미가 있어서(지금은 예약마다 여권명을 따로 받음) 일단 빈 값으로 시작한다.
  passportName: "",
};

export function getMember(): Member {
  return member;
}

/** 저장(S0-C3 '저장' 버튼) — 실제로는 여기서 PATCH 호출로 교체한다. */
export function updatePassportName(name: string): void {
  member.passportName = name;
}

/** 가입 완료(S0-C2 '가입 완료' 버튼) — 실제로는 회원가입 API 응답으로 대체된다. */
export function completeMemberSignup(loginId: string, connectedSocial: string): void {
  member.email = loginId;
  member.connectedSocial = connectedSocial;
  member.passportName = "";
}
