/**
 * 로그인 이후 화면들이 "현재 로그인한 여행사"로 쓰는 값.
 *
 * ⚠ 로그인(S2-G2)은 이제 Core API에 실연동돼 있다 — 실제 세션은
 *   useAgencyAuth().session 에 있고, 계정 목업(agencyAccounts/findAgencyAccount)은
 *   그래서 삭제했다.
 *
 *   다만 예약 목록(S2-G6)이 아직 목 데이터라 "어느 여행사의 예약인가"를 가릴 값이
 *   필요해 이 상수만 남긴다. 여행사 예약 API가 생기면 서버가 세션으로 필터링하므로
 *   이 파일 자체가 사라진다.
 *
 *   시드 DB의 제주바다여행사(db/seed-dev/R__dev_seed.sql)와 같은 여행사를 가리킨다.
 */
export const CURRENT_AGENCY = { id: "agency-1", name: "제주바다여행사" };
