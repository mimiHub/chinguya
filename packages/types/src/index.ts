/**
 * 친구야 공용 도메인 타입 — 세 앱(customer/admin/agency)의 단일 출처(source of truth).
 * 공통 비즈니스 규칙은 docs/README.md 를 근거로 한다. 규칙이 바뀌면 이 파일을 먼저 갱신한다.
 */

/** 사용자군 접두어: C=고객, A=관리자, G=여행사 */
export type UserRole = "customer" | "admin" | "agency";

/**
 * 관리자 등급: STAFF(일반)는 조회 전용, SUPER_ADMIN만 쓰기 가능.
 * 값은 Core API 계약(api-spec/openapi/chinguya-admin-api.yaml)의 AdminRole 을 그대로 따른다 —
 * 서버가 쓰기 메서드를 SUPER_ADMIN으로 제한(403)하므로 프론트가 별도 표기를 쓰면 어긋난다.
 */
export type AdminRole = "SUPER_ADMIN" | "STAFF";

/** 관리자 로그인 세션. GET /admin/auth/me · POST /admin/auth/login 응답과 같은 모양. */
export interface AdminSession {
  adminId: string;
  loginId: string;
  role: AdminRole;
  /** 액세스 토큰 만료 시각(ISO 8601, UTC) */
  expiresAt: string;
}

/**
 * 고객 예약 상태 흐름: 접수 → 완료(입금확인) → 취소요청 → 취소
 */
export type CustomerReservationStatus =
  | "received"
  | "completed"
  | "cancel_requested"
  | "cancelled";

/** 여행사 예약 상태: 예약=즉시 완료 / 취소=즉시 (입금 흐름 없음) */
export type AgencyReservationStatus = "completed" | "cancelled";

/** 가격은 고객가/여행사가 이원화. 여행사가는 고객앱 미노출. 통화는 KRW. */
export interface PriceBook {
  /** 고객 노출가 (KRW) */
  customerPrice: number;
  /** 여행사 정산가 (KRW) — 고객앱에 절대 노출하지 않는다 */
  agencyPrice: number;
}

/**
 * 대여 옵션 종류. 자전거/낚싯대 공통으로 쓰는 고정 옵션이며, 가격은 상품마다 옵션별로 다르게 매겨진다.
 * 화면에 보여줄 한글/일본어 라벨("2시간", "1일" 등)은 여기 두지 않는다 — 사용자 노출 문구는
 * 하드코딩 금지 규칙에 따라 src/locales/{ko,ja} 의 i18n 키로 관리한다.
 */
export type RentalOptionKey = "2h" | "1d" | "2d" | "night";

export const RENTAL_OPTION_KEYS: readonly RentalOptionKey[] = ["2h", "1d", "2d", "night"];

/** 렌탈 상품의 상위 분류. 관리자가 새 카테고리를 자유롭게 만드는 구조가 아니라 기획서에 고정된 두 가지. */
export type RentalCategoryKey = "bike" | "fishing";

/**
 * 상품(대여 품목) — 카탈로그 항목 하나(예: "전동자전거")가 Product 하나다.
 * 옵션(2h/1d/2d/night)별 가격은 이 안의 priceByOption 표로 관리하고, "몇 대 보유하고 있는지"는
 * 이 타입이 아니라 별도의 Asset(총 보유 대수)·Inventory(날짜별 가용 수량)로 관리한다.
 * 즉 Product = "무엇을 얼마에 파는지" 카탈로그/가격 정보, Asset/Inventory = "몇 개 있는지" 재고 정보.
 */
export interface Product {
  id: string;
  category: RentalCategoryKey;
  /** 상세 페이지 상단 굵은 타이틀 (예: "전동자전거") */
  title: string;
  /** 목록/상세의 부제 설명 (예: "전동자전거 대여(당일 오후 4시 반납)") */
  name: string;
  image: string;
  /** 대여 옵션(2h/1d/2d/night)별 가격 — 옵션마다 고객가/여행사가가 따로 있다 */
  priceByOption: Record<RentalOptionKey, PriceBook>;
  /** 상세 페이지 하단 설명. 없으면 설명 영역을 비워둔다 */
  description?: string;
  /** false면 상품을 지우지 않고 고객앱 목록에서만 숨긴다 */
  customerVisible: boolean;
  /** false면 상품을 지우지 않고 여행사앱 목록에서만 숨긴다. customerVisible과 독립적으로 토글 가능 */
  agencyVisible: boolean;
}

/**
 * 보유 자산(자전거/낚싯대 등) — 자산의 "명칭"만 관리하는 마스터 목록이다(카테고리도 다루지
 * 않는다). 실제 보유 수량(기준 보유량)과 날짜별 재고 조정은 관리자 앱의 날짜별 재고 현황
 * (S1-A3, /inventory)에서 다룬다 — 비동기 데일리 로그(2026-09-03, "S1-A2 자산관리 기획
 * 수정")에 따라 자산 관리를 "명칭 마스터 · 모달 CRUD"로 단순화했다(재고·카테고리 항목 제거).
 *
 * 삭제 규칙: 이 자산을 참조하는 재고 레코드(날짜별 재고 세팅)가 하나도 없으면 완전 삭제,
 * 하나라도 있으면 소프트삭제(deleted 플래그) — 목록 하단에 "삭제됨"으로 노출하고 복원할 수
 * 있다. 활성 자산끼리만 명칭 중복을 검사하므로, 삭제된 자산의 명칭은 새로 등록할 때 재사용
 * 가능하다.
 */
export interface Asset {
  id: string;
  /** 자산 명칭 (예: "전기자전거", "일반자전거") */
  name: string;
  /** 소프트삭제 플래그. true면 "삭제됨"으로 노출하고 재고 화면 선택기에서는 제외한다(복원 가능). */
  deleted?: boolean;
}

/**
 * 2일 대여에서만 선택 가능한 타지역 반납 옵션의 추가요금(KRW). 전 상품 공통 고정값.
 * 지점/거리별로 달라질 수 있게 되면 관리자 설정값(API)으로 바뀔 예정 — 그 전까지는 이 상수가 단일 출처.
 */
export const OFF_SITE_RETURN_FEE_KRW = 5000;

/**
 * 재고 산식: 총 보유 − 여행사 할당 = 고객 가용 (자동, Slice 2부터).
 * Slice 1 에서는 관리자가 customerAvailable 을 직접 세팅한다.
 */
export interface Inventory {
  productId: string;
  /** 특정 일자 (일본 기준 날짜, YYYY-MM-DD) */
  date: string;
  totalStock: number;
  agencyAllocated: number;
  /** 총 보유 − 여행사 할당 (Slice 2 자동 계산) */
  customerAvailable: number;
}

/**
 * 여행사별 할당 세팅. Inventory.agencyAllocated는 "여행사 전체에 할당된 합계"만 갖고 있어서,
 * 그 합계를 어느 여행사에 몇 개씩 나눠줄지는 이 타입으로 별도 관리한다
 * (Inventory.agencyAllocated == 같은 productId·date의 AgencyAllocation.allocatedQty 합계여야 한다).
 */
export interface AgencyAllocation {
  agencyId: string;
  productId: string;
  /** 특정 일자 (일본 기준 날짜, YYYY-MM-DD) */
  date: string;
  allocatedQty: number;
}

/**
 * 예약 가능 기간 정책. '오늘'은 일본 기준.
 * 고객 = 오늘 +1일 ~ +3개월 / 여행사 = 오늘 +3일 ~ +3개월.
 */
export const BOOKING_WINDOW = {
  customer: { minLeadDays: 1, maxMonths: 3 },
  agency: { minLeadDays: 3, maxMonths: 3 },
} as const;

/** 고객 예약 */
export interface CustomerReservation {
  id: string;
  productId: string;
  rentalOption: RentalOptionKey;
  status: CustomerReservationStatus;
  /** 여권 영문명 — 가입이 아닌 예약 시점에 확보 */
  passportName: string;
  useDate: string;
  /** 2일(2d) 옵션일 때만 있는 종료일(useDate 다음날). 그 외 옵션은 useDate 하루로 끝난다 */
  useDateEnd?: string;
  quantity: number;
  /** 2일 대여에서 선택한 타지역 반납 여부 — true면 OFF_SITE_RETURN_FEE_KRW가 amountKrw에 포함돼 있다 */
  offSiteReturn?: boolean;
  /**
   * 예약 확정 시점의 결제 총액(KRW) 스냅샷. priceByOption에서 매번 다시 계산하지 않고 예약 건에
   * 고정해 남겨서, 나중에 상품 가격이 바뀌어도 과거 예약의 결제 금액은 변하지 않게 한다.
   */
  amountKrw: number;
  /**
   * 취소 시점에 적용된 수수료율(0~1) 스냅샷. CancellationFeeRule 표에서 매번 다시 계산하지 않고,
   * 취소 시점 요율을 예약 건에 고정해 남겨서 나중에 요율표가 바뀌어도 과거 예약 내역이 변하지 않게 한다.
   */
  cancelFeeRate?: number;
  createdAt: string;
}

/**
 * 여행사 계정(거래처) 정보. AgencyReservation.agencyId, Invoice.agencyId가 이 id를 참조한다.
 * 지금까지는 예약/인보이스 쪽에 agencyId 문자열만 있고 여행사 자체를 나타내는 타입이 없었는데,
 * 관리자가 여행사를 등록/관리하려면 이름·담당자 연락처 같은 정보가 필요해서 추가했다.
 */
export interface Agency {
  id: string;
  name: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  /** false면 이 여행사 계정으로 여행사앱 로그인/예약이 막힌다(계약 종료 등) */
  active: boolean;
}

/** 여행사 예약. 예약=즉시 완료 / 취소=즉시(입금 흐름 없음)라 고객 예약보다 상태가 단순하다. */
export interface AgencyReservation {
  id: string;
  agencyId: string;
  productId: string;
  rentalOption: RentalOptionKey;
  status: AgencyReservationStatus;
  passportName: string;
  useDate: string;
  quantity: number;
  /** 예약 시점의 결제 총액(KRW, 여행사가 기준) 스냅샷 — 인보이스 라인아이템 금액의 근거가 된다 */
  amountKrw: number;
  createdAt: string;
}

/** 취소 수수료: 이용일 기준 차등 요율(관리자 세팅). 환불 이체는 관리자 수동. */
export interface CancellationFeeRule {
  /** 이용일까지 남은 일수 하한 (이 값 이상이면 해당 요율 적용) */
  daysBeforeUse: number;
  /** 수수료율 0~1 */
  feeRate: number;
}

/**
 * 입금 계좌 정보(관리자 설정, S1-A10). 고객이 예약 후 이 계좌로 직접 입금하는 방식이라
 * 관리자 화면뿐 아니라 고객앱 예약 완료 화면에도 그대로 노출돼야 하는 값이라 packages/types에 둔다.
 * (아직 고객앱 예약 완료 화면에는 연결 안 함 — 계좌 정보 노출 UI는 추후 작업)
 */
export interface DepositAccount {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
}

/** 인보이스: 매월 1일 전월 기준 발행, KRW, 세금 라인 없음, 정산 수동 확인 */
export interface Invoice {
  id: string;
  agencyId: string;
  /** 대상 월 (YYYY-MM) */
  period: string;
  amountKrw: number;
  settled: boolean;
}

/**
 * FAQ 항목(S4-C3 고객 노출 / S4-A1·A3 관리자 CMS-lite 편집). 카테고리·검색 없이
 * 노출 순서(order, 오름차순)로만 정렬해서 보여준다.
 */
export interface FaqEntry {
  id: string;
  question: string;
  answer: string;
  /** 노출 순서(오름차순). 관리자가 순서를 바꾸면 이 값을 다시 매긴다. */
  order: number;
}

/**
 * 고객 1:1 문의(S4-C4 질문하기 / S4-A2 문의 관리). 로그인 기능이 없어 비공개 글은
 * 4자리 비밀번호로 열람을 제한한다 — 이 잠금은 고객앱에서만 적용하고, 관리자는 답변을
 * 위해 항상 전체 내용을 볼 수 있어야 하므로 관리자 화면에는 적용하지 않는다.
 */
export interface InquiryEntry {
  id: string;
  title: string;
  content: string;
  isPublic: boolean;
  /** 비공개 글의 열람용 비밀번호(4자리). 공개 글이면 없음. */
  pin?: string;
  /** 관리자 답변. 없으면 "답변 대기". 답변 등록 시 고객에게 카카오 알림톡 발송(알림 인터페이스, 실발송 이연). */
  answer?: string;
  answeredAt?: string;
  /** 답변을 본 뒤 같은 글에 이어서 남긴 추가 질문들. */
  followUps?: string[];
  createdAt: string;
}

/**
 * 랜딩 히어로 배너 한 장(S4-A1/A3 관리자 콘텐츠 관리에서 편집 / 고객앱 홈 캐러셀·여행사앱
 * 로그인 배경에 노출). 값 자체는 `packages/catalog-data`가 단일 출처로 갖고 있고, 세 앱
 * (admin/customer/agency) 모두 거기서 읽어온다 — admin에서 이 값을 고치면(실제 저장 연동
 * 전까지는 그 세션 안에서만) customer 홈 배너와 agency 로그인 배경이 같은 이미지·문구를
 * 보여주게 된다.
 *
 * 배너마다 PC용과 모바일용 이미지가 따로 필요하다 — 반응형으로 한 이미지를 늘리고 줄이는
 * 방식이 아니라, 화면 폭에 맞는 이미지를 통째로 다르게 보여주는 방식이라서다. 여행사앱은
 * 데스크톱 전용이라 pcImage만 쓴다.
 */
export interface HeroBannerSlide {
  id: string;
  title: string;
  /** 부제. 첫 배너처럼 없을 수도 있다 */
  subtitle?: string;
  pcImage: string;
  mobileImage: string;
}
