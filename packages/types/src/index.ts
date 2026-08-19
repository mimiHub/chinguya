/**
 * 친구야 공용 도메인 타입 — 세 앱(customer/admin/agency)의 단일 출처(source of truth).
 * 공통 비즈니스 규칙은 docs/README.md 를 근거로 한다. 규칙이 바뀌면 이 파일을 먼저 갱신한다.
 */

/** 사용자군 접두어: C=고객, A=관리자, G=여행사 */
export type UserRole = "customer" | "admin" | "agency";

/** 관리자 권한: 일반 관리자는 조회 전용, 슈퍼어드민만 쓰기 가능 */
export type AdminLevel = "admin" | "superadmin";

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
 * 보유 자산(자전거/낚싯대 등) — "총 몇 대 갖고 있는지"만 관리하는 단순 대수 기록.
 * 사유(수리/입고/외부임대)는 따로 관리하지 않고, 삭제는 소프트삭제(숫자만 0으로 두거나 표시에서 제외)로 처리한다.
 */
export interface Asset {
  id: string;
  category: RentalCategoryKey;
  /** 자산 이름 (예: "전동자전거", "일반자전거") */
  name: string;
  totalCount: number;
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
