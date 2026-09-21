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
 * 값 표기는 Core API 계약(RentalOptionType)·DB CHECK 제약과 동일하게 맞춘다.
 */
export type RentalOptionKey = "HOURS_2" | "DAY_1" | "DAY_2" | "NIGHT";

export const RENTAL_OPTION_KEYS: readonly RentalOptionKey[] = ["HOURS_2", "DAY_1", "DAY_2", "NIGHT"];

/**
 * 옵션의 화면 노출 라벨. 카테고리 라벨과 같은 이유로 여기 둔다 — 세 앱이 같은 문구를 쓰고,
 * 상품명 `자산명 · 옵션` 의 뒷부분을 서버도 이 표기로 만든다(i18n 도입 전까지의 단일 출처).
 */
export const RENTAL_OPTION_LABEL: Record<RentalOptionKey, string> = {
  HOURS_2: "2시간",
  DAY_1: "1일",
  DAY_2: "2일",
  NIGHT: "야간",
};

/** 선택 가능한 옵션은 연결 자산의 카테고리가 정한다(S1-A5). */
export const OPTIONS_BY_CATEGORY: Record<AssetCategory, readonly RentalOptionKey[]> = {
  BICYCLE: ["HOURS_2", "DAY_1", "DAY_2", "NIGHT"],
  FISHING_ROD: ["DAY_1", "DAY_2"],
};

/**
 * 자산의 상위 분류. 관리자가 새 카테고리를 자유롭게 만드는 구조가 아니라 기획서에 고정된 두 가지.
 * 값 표기는 Core API 계약(api-spec의 ProductCategory)·DB CHECK 제약과 동일하게 맞춘다.
 */
export type AssetCategory = "BICYCLE" | "FISHING_ROD";

/** 카테고리의 화면 노출 라벨. i18n 도입 전까지 세 앱이 공유하는 단일 출처다. */
export const ASSET_CATEGORY_LABEL: Record<AssetCategory, string> = {
  BICYCLE: "자전거",
  FISHING_ROD: "낚싯대",
};

/**
 * 상품(대여 품목) — 카탈로그 항목 하나(예: "전동자전거")가 Product 하나다.
 * 옵션(2h/1d/2d/night)별 가격은 이 안의 priceByOption 표로 관리하고, "몇 대 보유하고 있는지"는
 * 이 타입이 아니라 별도의 Asset(총 보유 대수)·Inventory(날짜별 가용 수량)로 관리한다.
 * 즉 Product = "무엇을 얼마에 파는지" 카탈로그/가격 정보, Asset/Inventory = "몇 개 있는지" 재고 정보.
 */
export interface Product {
  id: string;
  category: AssetCategory;
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
 *
 * 필드 구성은 Core API 계약(api-spec/openapi/chinguya-admin-api.yaml 의 Asset 스키마)을
 * 그대로 따른다 — 계약이 먼저 바뀌고 이 타입이 뒤따른다.
 */
export interface Asset {
  /** 자산 PK. Core는 숫자 PK를 문자열로 직렬화해 내려준다. */
  assetId: string;
  /** 자산 명칭 (예: "전기자전거", "일반자전거") */
  name: string;
  /**
   * 자산의 카테고리. **등록(A2-M1) 때만 정하고 이후 바꿀 수 없다** — 수정(A2-M2)에서는
   * 읽기 전용이고, 복원(A2-M4)해도 기존 값을 그대로 승계한다. 연결 상품의 선택 가능
   * 옵션이 이 값을 따라가기 때문이다.
   */
  category: AssetCategory;
  /** 소프트삭제 플래그. true면 "삭제됨"으로 노출하고 재고 화면 선택기에서는 제외한다(복원 가능). */
  deleted: boolean;
  /**
   * 이 자산을 참조하는 날짜별 재고 레코드가 1건 이상인지. 삭제 모달(A2-M3)이 삭제를
   * 호출하기 전에 CASE 1(완전 삭제) / CASE 2(소프트삭제) 문구를 고르는 데 쓴다.
   *
   * ⚠ 재고 테이블(S1-A3)이 아직 없어 서버가 항상 false로 내려준다 — 그래서 현재
   * 삭제는 늘 완전 삭제다(api-spec 헤더 TODO 6).
   */
  hasInventoryRecords: boolean;
  /**
   * 이 자산에 연결된 삭제되지 않은 상품 수. 자산 카드의 '연결 상품 N개'이고,
   * 1 이상이면 삭제 모달이 **CASE 0**(삭제 불가 — 상품 먼저 삭제)로 간다(S1-A2).
   */
  productCount: number;
  createdAt: string;
  updatedAt: string;
  /** 소프트삭제 시각(ISO). deleted가 false면 null. */
  deletedAt: string | null;
}

/**
 * 관리자 상품(S1-A4/A5) — **연결 자산 1개 + 대여 옵션 1개**.
 *
 * 자산 1개에 상품이 여러 개 달린다(예: 전기자전거 → 1일·2일·야간). 수량 필드가 없는 것이
 * 의도다 — 예약은 연결 자산의 재고(S1-A3)를 쓰고, 같은 자산의 상품끼리 재고를 함께 쓴다.
 */
export interface AdminProduct {
  productId: string;
  /** 연결 자산. **등록 때만 정해지고 이후 바뀌지 않는다.** */
  assetId: string;
  /** 연결 자산의 명칭. 목록(S1-A4)이 자산별로 묶을 때 소제목으로 쓴다. */
  assetName: string;
  /** 연결 자산의 카테고리. 상품이 따로 갖는 값이 아니라 자산에서 따라온다. */
  category: AssetCategory;
  /** 대여 옵션. assetId와 마찬가지로 등록 때만 정해진다. */
  optionType: RentalOptionKey;
  /** `자산명 · 옵션` 형태로 서버가 만들어 주는 상품명(입력 항목 아님). */
  displayName: string;
  customerPrice: number;
  /** 여행사 정산가. **고객앱에 절대 노출하지 않는다.** */
  agencyPrice: number;
  customerVisible: boolean;
  agencyVisible: boolean;
  /** 타지역 반납 추가요금. 2일(DAY_2) 상품에만 값이 있고 그 외에는 null. */
  crossRegionReturnExtraFee: number | null;
  description: string | null;
  /** 배열 순서가 표시 순서이고 0번이 대표 이미지. */
  imageUrls: string[];
  deleted: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

/** 상품 등록(S1-A5). assetId·optionType은 등록 때만 보낸다. */
export interface AdminProductCreate {
  assetId: string;
  optionType: RentalOptionKey;
  customerPrice: number;
  agencyPrice: number;
  customerVisible: boolean;
  agencyVisible: boolean;
  crossRegionReturnExtraFee?: number | null;
  description?: string | null;
  imageUrls?: string[];
}

/** 상품 수정(S1-A5). 연결 자산·옵션이 없다 — 등록 때 정한 값이 그대로 간다. */
export type AdminProductUpdate = Omit<AdminProductCreate, "assetId" | "optionType">;

/** 자산 삭제(A2-M3)가 실제로 어떻게 처리됐는지. 화면은 이 값으로 토스트 문구를 고른다. */
export type AssetDeletionMode = "HARD" | "SOFT";

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
 * 여행사의 최신 초대 상태(S2-A1/A3 배지). 계약: api-spec/openapi/chinguya-admin-api.yaml.
 *
 * - `NONE` — 초대를 보낸 적이 없다(등록 직후 메일 발송에 실패한 경우도 여기).
 * - `PENDING` — 살아 있는 초대가 있다(미사용·미만료).
 * - `EXPIRED` — 마지막 초대가 만료됐다. 재발송이 필요하다.
 * - `ACCEPTED` — 담당자가 링크로 계정 등록을 마쳤다.
 */
export type AgencyInvitationStatus = "NONE" | "PENDING" | "EXPIRED" | "ACCEPTED";

/**
 * 여행사 계정(거래처) 정보. AgencyReservation.agencyId, Invoice.agencyId가 이 agencyId를 참조한다.
 *
 * 여행사와 로그인 계정은 생애주기가 다르다 — 관리자가 여행사를 등록하면(S2-A2) 초대 메일만
 * 나가고, 담당자가 링크로 아이디·비밀번호를 직접 정할 때(S2-G1) 비로소 계정이 생긴다.
 * 그래서 여기에 비밀번호 필드가 없고, 계정 존재 여부는 `accountRegistered`·`loginId`로만 비친다.
 */
export interface Agency {
  /** 여행사 PK. Core는 숫자 PK를 문자열로 직렬화해 내려준다(Asset.assetId와 같은 방식). */
  agencyId: string;
  name: string;
  /** 담당자명. 미입력이면 빈 문자열. */
  contactName: string;
  /** 담당자 연락처. 미입력이면 빈 문자열. */
  contactPhone: string;
  /** 담당자 이메일. 초대 메일 수신 주소. 서버가 소문자로 정규화해 저장한다. */
  contactEmail: string;
  /** false면 이 여행사 계정으로 여행사앱 로그인/예약이 막힌다(계약 종료 등) */
  active: boolean;
  /** 담당자가 초대 링크로 아이디·비밀번호를 설정했는지(S2-G1 완료 여부). */
  accountRegistered: boolean;
  /** 등록된 계정의 아이디. accountRegistered가 false면 null. */
  loginId: string | null;
  invitationStatus: AgencyInvitationStatus;
  /** 최신 초대의 만료 시각(ISO). PENDING·EXPIRED일 때만 값이 있다. */
  invitationExpiresAt: string | null;
  /** 소프트 삭제 여부. 여행사는 항상 소프트 삭제되고 복원 API는 없다. */
  deleted: boolean;
  createdAt: string;
  updatedAt: string;
  /** 소프트 삭제 시각(ISO). deleted가 false면 null. */
  deletedAt: string | null;
}

/**
 * 초대 발송 시도의 결과(S2-A2).
 *
 * 메일 실패를 에러 응답으로 만들지 않기 위한 타입이다 — 여행사 등록 자체는 성공했는데
 * SMTP만 죽은 상황을 화면이 구분해 "재발송해 주세요"로 안내할 수 있어야 한다.
 */
export interface AgencyInvitationResult {
  sent: boolean;
  /**
   * - `MAIL_SEND_FAILED` — SMTP 오류. 재발송으로 다시 시도할 수 있다.
   * - `MAIL_DISABLED` — 서버 설정으로 발송을 끈 환경(로컬 개발). 토큰 자체는 정상 발급됐다.
   */
  skippedReason: "MAIL_SEND_FAILED" | "MAIL_DISABLED" | null;
  /** 발급된 초대의 만료 시각(ISO, 발급 +7일). 발급 자체가 없었으면 null. */
  expiresAt: string | null;
}

/** 여행사 등록(S2-A2) 응답 — 등록과 초대 발송이 한 요청이라 결과도 함께 온다. */
export interface AgencyCreateResult {
  agency: Agency;
  invitation: AgencyInvitationResult;
}

/**
 * 여행사 로그인 세션(S2-G2). AdminSession과 대칭.
 *
 * agencyName이 여기 있는 이유: 관리자가 명칭을 바꾸면(S2-A3) 4시간짜리 토큰 안에 낡은
 * 이름이 남으므로, 서버가 토큰이 아니라 DB에서 읽어 매번 내려준다.
 */
export interface AgencySession {
  agencyId: string;
  agencyName: string;
  accountId: string;
  loginId: string;
  /** 액세스 토큰 만료 시각(ISO 8601, UTC) */
  expiresAt: string;
}

/**
 * 고객 아이디 규칙(S0-C2): 영문 소문자+숫자 4~20자. 중복 불가, 가입 후 변경 불가.
 * 표시·식별용이며 로그인 수단이 아니다(로그인은 소셜로만). 서버 검증·DB CHECK(V10)와 같은 값.
 */
export const CUSTOMER_LOGIN_ID_PATTERN = /^[a-z0-9]{4,20}$/;

/** 고객 소셜 제공자. Core API 계약(slice1 openapi의 SocialProvider)과 같다. 연동은 KAKAO만 되어 있다. */
export type CustomerSocialProvider = "KAKAO" | "NAVER" | "GOOGLE";

/** 소셜 제공자의 화면 노출 라벨(S0-C3 '연결 소셜'). */
export const CUSTOMER_SOCIAL_PROVIDER_LABEL: Record<CustomerSocialProvider, string> = {
  KAKAO: "카카오",
  NAVER: "네이버",
  GOOGLE: "구글",
};

/** 고객 로그인 세션(S0-C3). GET /v1/auth/me · POST /v1/auth/signup 응답과 같은 모양. */
export interface CustomerSession {
  customerId: string;
  loginId: string;
  socialProvider: CustomerSocialProvider;
  /**
   * 저장된 여권 영문명(S0-C3에서 편집). 한 번도 저장하지 않았으면 null이다.
   * 예약 확정 시 이 값이 예약의 여권명으로 스냅샷 복사되므로, 여기서 바꿔도
   * 이미 만들어진 예약은 바뀌지 않는다 — 다음 예약의 기본값이다.
   */
  passportName: string | null;
  /** 액세스 토큰 만료 시각(ISO 8601, UTC) */
  expiresAt: string;
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
