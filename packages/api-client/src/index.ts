import type {
  AdminRole,
  CustomerReservation,
  AdminProduct,
  AdminProductCreate,
  AdminProductUpdate,
  Asset,
  AssetCategory,
  RentalOptionKey,
  AssetDeletionMode,
  Agency,
  AgencyCreateResult,
  AgencyInvitationResult,
  DepositAccount,
} from "@chinguya/types";

/**
 * 브라우저에서 부르는 기본 주소. Core API를 직접 부르지 않고 자기 오리진의
 * 프록시 Route Handler를 거친다 — 이유는 `./core-proxy` 참고.
 */
export const DEFAULT_API_BASE_URL = "/api/core";

export interface ApiClientOptions {
  /** 기본값 `/api/core`. 서버사이드에서 절대주소가 필요할 때만 지정한다. */
  baseUrl?: string;
  /** 역할별 토큰 등 요청 헤더 */
  getHeaders?: () => Record<string, string>;
}

/**
 * 여행사 등록·수정 요청 본문(S2-A2/A3). 계약: api-spec/openapi/chinguya-admin-api.yaml.
 *
 * 응답 타입(Agency)과 달리 여기엔 active가 없다 — 사용 가능/불가는 전용 엔드포인트로
 * 다룬다(목록의 토글이 다른 필드를 모르는 채로 불러야 하기 때문).
 */
export interface AgencyInput {
  name: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail: string;
}

/**
 * 날짜별 재고 세팅(S1-A3) API 타입. 도메인 비즈니스 규칙(packages/types)이 아니라 이
 * 엔드포인트의 응답/요청 모양이라 여기 둔다 — 계약 원본은 api-spec/openapi/chinguya-admin-api.yaml.
 */
export interface InventoryDaySnapshot {
  date: string;
  baseline: number;
  totalStock: number;
  /** 고객 가용에서 빠지는 여행사 할당 합. 여행사 예약 마감(D-3) 뒤면 여행사 예약 수만 남는다. */
  allocated: number;
  /** max(totalStock − allocated, 0) */
  customerAvailable: number;
  closed: boolean;
  /** 그날 이 자산을 점유하는 확정 고객 예약 수량(장바구니 홀드는 빼고). */
  reserved: number;
  remaining: number;
  hasAdjustment: boolean;
}

export interface InventoryAdjustment {
  id: string;
  assetId: string;
  /** null이면 보유 조정, 값이 있으면 그 여행사의 할당 조정. */
  agencyId: string | null;
  /** 할당 조정의 대상 여행사명. 보유 조정이면 null. */
  agencyName: string | null;
  tag: string;
  delta: number;
  startDate: string;
  endDate: string | null;
  weekdays: number[];
  memo: string;
  createdAt: string;
}

export interface InventoryDayDetail {
  date: string;
  baseline: number;
  totalStock: number;
  allocated: number;
  /** 여행사 예약 마감(이용일 D-3)이 지나 안 팔린 할당이 고객 가용으로 반환된 날짜인지. */
  allocationReleased: boolean;
  customerAvailable: number;
  closed: boolean;
  reserved: number;
  remaining: number;
  /** 그날 할당이 있거나 할당 조정이 걸린 여행사별 줄(등록 순). */
  allocations: AgencyAllocationLine[];
  /** 보유 조정과 할당 조정이 섞여 있다 — agencyId로 구분한다. */
  adjustments: InventoryAdjustment[];
}

export interface AgencyAllocationLine {
  agencyId: string;
  agencyName: string;
  /** 그 날짜에 적용되던 기준 할당 */
  baseline: number;
  /** 기준 할당 + 그 여행사 할당 조정 합(0 미만 불가) */
  allocated: number;
}

/** 여행사의 "지금"(오늘 기준) 기준 할당 — 기준 카드·A3-M4 모달이 쓴다. */
export interface AgencyAllocation {
  agencyId: string;
  agencyName: string;
  value: number;
}

export interface AllocationChangeRequest {
  agencyId: string;
  value: number;
  startDate: string;
  memo: string;
}

export interface AdjustmentRequest {
  /** 대상. null이면 보유 조정, 값이 있으면 그 여행사의 할당 조정. */
  agencyId: string | null;
  tag: string;
  delta: number;
  startDate: string;
  endDate: string | null;
  weekdays: number[] | null;
  memo: string;
}

export interface OverCapacityDate {
  date: string;
  reserved: number;
  totalStockAfter: number;
  /** 적용 후 여행사 할당 합. totalStockAfter보다 크면 할당 초과. */
  allocated: number;
}

/**
 * 계좌·정책 설정(S1-A10) API 타입. 계약 원본은 api-spec/openapi/chinguya-admin-api.yaml.
 *
 * 요율표 한 구간. 끝 일수·라벨은 서버가 시작 일수로 만든다.
 */
export interface CancellationPolicyTier {
  minDaysBefore: number;
  /** 구간 끝(포함). null이면 상한 없음(마지막 구간). */
  maxDaysBefore: number | null;
  /** 0~1, 소수 셋째 자리까지 */
  feeRate: number;
  /** 예) 당일, D-2~1, D-7 이상 */
  label: string;
}

export interface AdminSettings {
  /** 아직 등록 전이면 null(운영 최초 상태). */
  depositAccount: DepositAccount | null;
  /** 시작 일수 오름차순 */
  cancellationPolicy: CancellationPolicyTier[];
  /** 여행사 취소 마감일(이용일 D-N). 여행사 예약 취소(S2-G6)가 이 값을 쓴다. */
  agencyCancelDeadlineDays: number;
}

/** 저장 요청 — 세 값을 통째로 교체한다. 요율표 순서는 상관없다(서버가 정렬). */
export interface AdminSettingsInput {
  depositAccount: DepositAccount;
  cancellationPolicy: { minDaysBefore: number; feeRate: number }[];
  agencyCancelDeadlineDays: number;
}

/**
 * 관리자 계정 관리(S0-A5/A6) API 타입. 계약 원본은 api-spec/openapi/chinguya-admin-api.yaml.
 */
export interface AdminAccount {
  adminId: string;
  loginId: string;
  role: AdminRole;
}

export interface AdminAccountCreateInput {
  loginId: string;
  password: string;
  role: AdminRole;
}

export interface AdminAccountUpdateInput {
  role: AdminRole;
  /** 생략하면 기존 비밀번호를 유지한다. 아이디는 바꿀 수 없다. */
  password?: string;
}

/**
 * FAQ·콘텐츠 관리(S4-A1/A3) API 타입. 계약 원본은 api-spec/openapi/chinguya-admin-api.yaml.
 *
 * 고객 FAQ(S4-C3)는 displayOrder 없이 순서대로 내려오므로 CustomerFaq를 따로 둔다.
 */
export interface AdminFaq {
  faqId: string;
  question: string;
  answer: string;
  /** 오름차순. 삭제로 번호 사이가 빌 수 있다 — 순서만 의미가 있다. */
  displayOrder: number;
}

export interface FaqInput {
  question: string;
  answer: string;
}

/** 랜딩 히어로 배너 한 장. 3장 고정이라 조회·저장 모두 slot 1·2·3이 하나씩이다. */
export interface HeroBanner {
  slot: number;
  /** 줄바꿈(\n) 보존 */
  title: string;
  subtitle: string | null;
  /**
   * `/content/images/…` = 관리자가 올린 이미지(프록시 경유로 읽는다),
   * 그 밖의 `/…` = 웹앱 정적 파일(초기값).
   */
  pcImageUrl: string;
  mobileImageUrl: string;
}

/**
 * 여행사 상품 조회·예약·예약 목록·취소(S2-G4/G5/G6) API 타입.
 * 계약 원본은 api-spec/openapi/chinguya-agency-api.yaml.
 *
 * packages/types의 AgencyReservation은 아직 목업(대시보드 S2-G3·인보이스 S2-G7)이 쓰는 모양이라
 * 응답 타입을 여기 따로 둔다.
 */
export interface AgencyProduct {
  productId: string;
  /** 연결 자산. 같은 값을 가진 줄끼리 할당을 나눠 쓴다. */
  assetId: string;
  assetName: string;
  category: AssetCategory;
  optionType: RentalOptionKey;
  /** 여행사가(KRW, 1대 기준) */
  agencyPrice: number;
  /** 이 줄만 담는다고 할 때 예약할 수 있는 최대 수량 */
  available: number;
}

export interface AgencyProductList {
  useDate: string;
  /** 매장 휴무일이면 true — 이때 모든 available이 0이다. */
  closed: boolean;
  products: AgencyProduct[];
}

export interface AgencyReservationInput {
  useDate: string;
  /** 같은 productId를 두 번 넣으면 400. 금액은 보내지 않는다(서버가 여행사가로 계산). */
  items: { productId: string; quantity: number }[];
}

export interface AgencyReservationResult {
  reservationId: string;
  reservationNumber: string;
  useDate: string;
  productId: string;
  assetName: string;
  optionType: RentalOptionKey;
  quantity: number;
  /** 예약 시점 여행사가 */
  unitPrice: number;
  amount: number;
  status: AgencyReservationStatus;
  createdAt: string;
}

/**
 * S2-G7 인보이스 라인아이템 1줄 = 그 달에 이용일이 든 **완료 또는 취소** 예약 1건.
 * 단가는 예약 시점 여행사가 스냅샷이라 나중에 가격이 바뀌어도 흔들리지 않는다.
 */
export interface AgencyInvoiceLineItem {
  useDate: string;
  reservationNumber: string;
  assetName: string;
  optionType: RentalOptionKey;
  quantity: number;
  unitPrice: number;
  status: AgencyReservationStatus;
  /**
   * **정산 반영액**이라 status 에 따라 뜻이 다르다 — 완료면 `unitPrice × quantity`,
   * 취소면 **취소 수수료**(취소 시점 스냅샷)다. 화면은 둘을 함께 읽어야 한다.
   */
  amount: number;
}

/**
 * S2-G7 전월 인보이스. 저장된 문서가 아니라 서버가 예약에서 집계한 값이다 —
 * 취소 마감이 이용일 D-3 이라 전월 집계는 더 이상 변하지 않는다.
 *
 * 발행 상태·정산 완료는 여기 없다. 그건 관리자 인보이스 화면(S2-A5/A6)이 쓰는 값이라
 * `AdminInvoiceSummary`·`AdminInvoiceDetail` 에 있다.
 */
export interface AgencyInvoice {
  /** 대상 월(YYYY-MM). 서버가 정한다 — 브라우저 시계로 정하면 월초에 어긋난다. */
  period: string;
  /** KRW 고정. 세금 라인은 없다. */
  currency: "KRW";
  /** 이용일 오름차순 */
  lineItems: AgencyInvoiceLineItem[];
  /** 완료 예약 금액 합 + 취소 예약의 취소 수수료 합. 대상이 없으면 0. */
  totalAmount: number;
}

/** S1-A1 오늘 방문 예약 카드 한 장. 누르면 예약 상세(S1-A7)로 간다. */
export interface AdminDashboardVisit {
  bookingId: string;
  bookingNumber: string;
  /** 카드에 한 줄로 적는 상품 요약. 항목이 여럿이면 `첫 상품명 외 N건` — 서버가 만들어 준다. */
  productSummary: string;
  useDate: string;
  status: "AWAITING_DEPOSIT" | "RECEIVED" | "COMPLETED" | "CANCEL_REQUESTED" | "CANCELLED";
  /** 입금 기한이 지났는지. 저장된 상태가 아니라 계산 결과다(S1-A6 의 unpaid 와 같은 규칙). */
  unpaid: boolean;
}

/** S1-A1 대시보드. 저장된 문서가 아니라 서버가 예약·재고에서 집계한 값이다. */
export interface AdminDashboard {
  /** 서버가 정한 '오늘'(**일본 기준**). 화면은 다시 계산하지 않는다. */
  today: string;
  /** 입금대기 예약 수(기한 내). 0 이면 화면이 큰 카드의 표정을 슬픈 쪽으로 바꾼다. */
  newBookingCount: number;
  /** 접수 예약 수(기한 내) — 고객이 입금했다고 알려 확인이 필요한 건. */
  depositRequestCount: number;
  /** 처리 안 된 취소 요청이 있는 예약 수. */
  cancelRequestCount: number;
  /** 오늘 ~ +3개월 안의 재고 초과 날짜. 오름차순·중복 없음. */
  overCapacityDates: string[];
  /** 오늘 이용을 시작하는 예약. 예약번호 오름차순. */
  todayVisits: AdminDashboardVisit[];
}

/**
 * 공지사항·이벤트 카테고리 — **2개 고정**이다. 관리자가 추가할 수 없고, 고객 화면(S4-C6)의
 * 캡슐 탭이 이 둘에 맞춰져 있다.
 */
export type NoticeCategory = "NOTICE" | "EVENT";

/** 목록 한 줄. 본문·첨부는 없다 — 목록이 무거워지지 않게 상세에서 따로 받는다. */
export interface NoticeSummary {
  noticeId: string;
  category: NoticeCategory;
  title: string;
  /** 작성일(YYYY-MM-DD). 서버가 정하고 관리자가 고치지 않는다. */
  createdAt: string;
  /** 관리자 목록에만 의미가 있다 — 고객 목록에는 공개 글만 와서 늘 true 다. */
  published: boolean;
  /** true 면 목록 맨 위. 순서로 드러나므로 화면이 따로 표시하지 않아도 된다. */
  pinned: boolean;
  /** 이벤트에만 값이 있다. 비우면 '상시'. */
  eventStartDate: string | null;
  /** 이 날짜가 지난 이벤트는 화면이 '종료'로 표시한다. */
  eventEndDate: string | null;
}

/** 글 상세. 관리자 수정 폼(S4-A4)과 고객 상세(S4-C6)가 같이 쓴다. */
export interface NoticeDetail extends NoticeSummary {
  /**
   * 줄바꿈이 보존돼 있다. `![설명](주소)` 표기는 **화면이 이미지로 렌더한다** —
   * 그 외 마크다운 문법은 서버도 화면도 해석하지 않고 글자 그대로 둔다.
   */
  content: string;
  /** 첨부 이미지. 본문 아래에 순서대로 보여준다. */
  imageUrls: string[];
  updatedAt: string;
}

/** 무한 스크롤이 이어 붙이는 한 페이지. 관리자·고객이 같은 모양을 쓴다. */
export interface NoticeListPage {
  content: NoticeSummary[];
  page: number;
  size: number;
  /** 화면이 "더 받을 게 남았는지"를 이 값과 지금까지 받은 개수로 판단한다. */
  totalElements: number;
}

/** 등록·수정 요청. 수정은 이 값으로 **통째로 교체**한다(첨부 배열도 덮어쓴다). */
export interface NoticeInput {
  category: NoticeCategory;
  title: string;
  content: string;
  published: boolean;
  pinned: boolean;
  /** 이벤트에만. 공지사항에 값을 보내면 400. */
  eventStartDate?: string | null;
  eventEndDate?: string | null;
  /** 업로드는 `content.uploadImage` 가 하고, 여기엔 그 주소만 담는다. 최대 5장. */
  imageUrls?: string[];
}

/** 여행사 예약 상태. 입금 흐름이 없어 두 값뿐이다. */
export type AgencyReservationStatus = "COMPLETED" | "CANCELLED";

/**
 * S2-G3 오늘 이용자 명단 한 줄 = 예약 1건.
 *
 * **이용자 이름이 없다.** 여행사 예약은 수량만 받고 이용자 개인을 식별하지 않는다 —
 * 와이어프레임 g-dash 에 있던 '이용자 여권명' 열을 그래서 뺐다(계약 헤더 2026-09-21 참고).
 */
export interface AgencyDashboardUser {
  reservationNumber: string;
  assetName: string;
  optionType: RentalOptionKey;
  quantity: number;
  /** 명단은 완료만 내려오므로 사실상 고정값이다. 화면이 값을 지어내지 않게 서버가 준다. */
  status: AgencyReservationStatus;
}

/** S2-G3 대시보드. 저장된 문서가 아니라 서버가 예약에서 집계한 값이다. */
export interface AgencyDashboard {
  /** 서버가 정한 '오늘'. 브라우저 시계를 쓰면 자정 근처에서 어제·내일 명단을 보게 된다. */
  today: string;
  /** 오늘 등록한 예약 수(취소된 것 포함). 0 이면 화면이 카드 문구·표정을 바꾼다. */
  newReservationCount: number;
  /** 오늘 이용 시작하는 완료 예약. 예약번호 오름차순. 비어 있으면 표에 '데이터 없음'. */
  todayUsers: AgencyDashboardUser[];
}

/** S2-A6 인보이스 라인 1줄. 여행사 화면(S2-G7)의 라인과 같은 모양이다 — 같은 집계라서다. */
export interface AdminInvoiceLineItem {
  useDate: string;
  reservationNumber: string;
  assetName: string;
  optionType: RentalOptionKey;
  quantity: number;
  unitPrice: number;
  status: AgencyReservationStatus;
  /** 정산 반영액 — 완료면 예약 금액 전액, 취소면 취소 수수료. */
  amount: number;
}

/** S2-A5 목록의 발행된 인보이스 카드 한 장. */
export interface AdminInvoiceSummary {
  invoiceId: string;
  agencyId: string;
  agencyName: string;
  /** 대상 월(YYYY-MM) */
  period: string;
  /** 발행일(YYYY-MM-DD). 대상 월 다음 달 1일이다. */
  issuedAt: string;
  amount: number;
  /** 정산(입금) 완료 여부. */
  settled: boolean;
}

/**
 * S2-A5 목록의 '예정' 카드 — 아직 발행 전인 이번 달 사용액.
 *
 * `invoiceId` 가 없는 것이 의도다. 저장된 인보이스가 아니라 집계값이라 상세(S2-A6)로 들어갈
 * 수 없다 — 화면도 이 카드를 링크로 만들지 않는다.
 */
export interface AdminInvoicePending {
  agencyId: string;
  agencyName: string;
  period: string;
  /** 현재까지의 정산 반영액. 이 달 예약은 아직 취소될 수 있어 발행일까지 움직인다. */
  amount: number;
}

export interface AdminInvoiceList {
  invoices: AdminInvoiceSummary[];
  pending: AdminInvoicePending[];
}

/** S2-A6 상세. 라인아이템은 저장돼 있지 않고 서버가 예약에서 집계한 값이다. */
export interface AdminInvoiceDetail {
  invoiceId: string;
  agencyId: string;
  agencyName: string;
  period: string;
  issuedAt: string;
  currency: "KRW";
  lineItems: AdminInvoiceLineItem[];
  /** 화면의 '합계(정산 반영액)'. 여행사 화면(S2-G7)의 totalAmount 와 같은 값이다. */
  totalAmount: number;
  settled: boolean;
  /** 정산 확인 시각. 미정산이면 null. */
  settledAt: string | null;
  /** '입금 확인' 버튼을 띄울지. 화면이 상태를 해석하지 않도록 서버가 내려준다. */
  settleable: boolean;
}

/**
 * S2-G6 예약 목록. 취소 가능 여부는 줄마다 오지 않는다 —
 * `useDate - today >= cancelDeadlineDays` 로 화면이 판정한다.
 */
export interface AgencyReservationList {
  /** 서버 기준 오늘. 브라우저 시계를 쓰면 판정이 서버와 어긋난다. */
  today: string;
  /** 취소 마감 기준 일수. 기본 3(D-3)이고 관리자가 조정한다(S1-A10). */
  cancelDeadlineDays: number;
  reservations: AgencyReservationResult[];
}

/**
 * 고객 상품 조회(S1-C1) 카드 1장. 계약 원본은 api-spec/openapi/chinguya-slice1-openapi.yaml 의
 * ProductSummary.
 *
 * 카드 1개 = 연결 자산 1개라 productId는 **자산 id**다(관리자 상품 id와 다르다).
 */
export interface CustomerProductSummary {
  productId: string;
  /** 자산 명칭 */
  name: string;
  category: AssetCategory;
  /** `/content/images/…`(프록시 경유로 읽는다). 표출 중인 상품에 이미지가 없으면 비어 있다. */
  thumbnailUrl?: string | null;
  /** 표출 중인 상품의 최저 고객가(원) */
  priceFrom: number;
}

/** 고객 FAQ(S4-C3). 계약: api-spec slice1 yaml 의 Faq. 배열 순서가 곧 노출 순서다. */
export interface CustomerFaq {
  faqId: string;
  question: string;
  answer: string;
}

/**
 * 질문하기(S4-C4/C5)·문의 관리(S4-A2) 타입. 계약: slice1 yaml 의 Inquiry*, admin yaml 의 AdminInquiry.
 * 답변이 없으면 WAITING(대기), 있으면 ANSWERED(답변완료).
 */
export type InquiryStatus = "WAITING" | "ANSWERED";

/** 고객 질문 목록 한 줄 — 제목·상태만(전체 공개). mine=false면 화면은 잠금 표시하고 상세를 열지 않는다. */
export interface InquirySummary {
  inquiryId: string;
  title: string;
  status: InquiryStatus;
  mine: boolean;
  createdAt: string;
}

/** 내 질문 상세 — 본인 글에만 내려온다. */
export interface InquiryDetail {
  inquiryId: string;
  title: string;
  content: string;
  status: InquiryStatus;
  answer?: string | null;
  answeredAt?: string | null;
  createdAt: string;
}

export interface InquiryInput {
  title: string;
  content: string;
}

/** 관리자 문의 한 건 — 본인 글 잠금 없이 본문·답변을 모두 담는다. */
export interface AdminInquiry {
  inquiryId: string;
  title: string;
  content: string;
  status: InquiryStatus;
  customerLoginId: string;
  answer?: string | null;
  answeredAt?: string | null;
  createdAt: string;
}

export interface CustomerProductListPage {
  content: CustomerProductSummary[];
  page: number;
  size: number;
  totalElements: number;
}

/** 상품 상세(S3-C1)의 옵션 칩 1개 = 그 자산의 '표출 ON' 상품. 계약: ProductDetail.options[]. */
export interface CustomerRentalOption {
  optionType: RentalOptionKey;
  /** 고객가(원) */
  price: number;
  /** 선택 단위 일수 — 2일 = 2, 그 외 = 1 */
  daysRequired: 1 | 2;
  crossRegionReturnAvailable?: boolean;
  /** 타지역 반납 추가요금(대당, 원). 고를 수 없는 옵션이면 비어 있다. */
  crossRegionReturnExtraFee?: number | null;
  description?: string | null;
  /** `/content/images/…`. 비어 있으면 상품 레벨 imageUrls를 쓴다. */
  imageUrls?: string[];
}

/** 상품 상세(S3-C1). productId는 목록과 같은 자산 id. */
export interface CustomerProductDetail {
  productId: string;
  name: string;
  category: AssetCategory;
  description?: string | null;
  imageUrls?: string[];
  options: CustomerRentalOption[];
}

/** 가용성(S1-C2 캘린더). date는 선택 시작일, remaining은 그날 시작하면 잡을 수 있는 수량 상한. */
export interface CustomerAvailability {
  productId: string;
  optionType: RentalOptionKey;
  daysRequired: 1 | 2;
  crossRegionReturn?: boolean;
  /** 오늘+1(JST) */
  bookableFrom: string;
  /** 오늘+3개월(JST) */
  bookableTo: string;
  dates: { date: string; selectable: boolean; remaining: number }[];
}

/** 장바구니 담기(S1-C2) 요청 — 담는 순간 15분 임시 홀드가 걸린다. */
export interface CustomerCartItemInput {
  productId: string;
  optionType: RentalOptionKey;
  /** YYYY-MM-DD. 2일 옵션이면 다음 날까지 자동으로 잡힌다. */
  startDate: string;
  quantity: number;
  crossRegionReturn?: boolean;
}

/** 장바구니 항목(S1-C3) = 임시 홀드 1건. 금액은 담은 시점 스냅샷. */
export interface CustomerCartItem {
  cartItemId: string;
  productId: string;
  productName: string;
  optionType: RentalOptionKey;
  /** 실제 이용일(2일 옵션이면 이틀) */
  dates: string[];
  quantity: number;
  crossRegionReturn?: boolean;
  unitPrice?: number;
  /** 타지역 반납 추가요금 합(대당 × 수량) */
  extraFee?: number;
  /** 고객가 × 수량 + extraFee */
  lineTotal: number;
  holdExpiresAt: string;
}

export interface CustomerCart {
  items: CustomerCartItem[];
  totalAmount: number;
  earliestHoldExpiresAt?: string | null;
}

/** 고객 예약 상태(계약 BookingStatus). 생성 = 입금대기 → 입금 확인 요청 = 접수 → 관리자 확인 = 완료. */
export type CustomerBookingStatus = "AWAITING_DEPOSIT" | "RECEIVED" | "COMPLETED" | "CANCEL_REQUESTED" | "CANCELLED";

/** 입금 안내(S1-C4). 입금액 = 유효 항목 합계, 기한 = 예약 생성 + 24시간. */
export interface CustomerDepositInfo {
  bookingNumber: string;
  status: CustomerBookingStatus;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  amount: number;
  dueBy?: string | null;
}

/** 예약 항목 상태(계약 BookingItemStatus). 취소된 항목도 목록에 남는다. */
export type BookingItemStatus = "ACTIVE" | "CANCEL_REQUESTED" | "CANCELLED";

/** 취소 범위(계약 CancellationScope). 완료 이후만 항목 선택, 입금 전에는 전체만. */
export type CancellationScope = "FULL_ONLY" | "ITEM_SELECTABLE";

/** 예약 항목(계약 BookingItem). 1 예약번호 = N 항목. */
export interface CustomerBookingItem {
  bookingItemId: string;
  /** 연결 자산 id(고객앱 상품 id) */
  productId: string;
  productName: string;
  optionType: RentalOptionKey;
  /** 실제 이용일(2일 옵션이면 연속 2일) */
  dates: string[];
  quantity: number;
  crossRegionReturn: boolean;
  lineTotal: number;
  status: BookingItemStatus;
  /** 지금 취소 대상으로 고를 수 있는지 */
  cancellable: boolean;
}

/** 예약(S1-C3 확정 결과 · S1-C6 예약 상세·바우처). 계약: Booking. */
export interface CustomerBooking {
  bookingId: string;
  bookingNumber: string;
  status: CustomerBookingStatus;
  /** 취소 항목 포함, 담은 순 */
  items: CustomerBookingItem[];
  /** 원 결제액 */
  totalAmount: number;
  /** 유효 항목 합계 — 화면 합계는 이 값 */
  activeTotalAmount: number;
  partiallyCancelled: boolean;
  passportName: string;
  /** 취소 요청 버튼 노출 */
  cancellable: boolean;
  /** 취소할 수 없으면 null */
  cancellationScope: CancellationScope | null;
  /** 입금 계좌가 아직 등록되지 않았으면 비어 있다. */
  depositInfo?: CustomerDepositInfo | null;
  createdAt: string;
}

/** 취소 견적 항목 1줄(계약 CancellationQuoteItem). 요율은 항목 시작일까지 남은 일수로 정해진다. */
export interface CustomerCancellationQuoteItem {
  bookingItemId: string;
  productName: string;
  optionType: RentalOptionKey;
  /** 요율 기준 이용일(YYYY-MM-DD) */
  useDate: string;
  /** 이용일까지 남은 일수(당일 0) */
  daysToUse: number;
  /** 0~1 */
  feeRate: number;
  lineAmount: number;
  cancellationFee: number;
  refundAmount: number;
}

/** 취소 견적(S1-C7). 계약: CancellationQuote. 합계는 항목별 값을 더한 것이다. */
export interface CustomerCancellationQuote {
  bookingId: string;
  /** FULL = 유효 항목 전부 */
  scope: "FULL" | "PARTIAL";
  items: CustomerCancellationQuoteItem[];
  /** 예약 원 결제액 */
  paidAmount: number;
  /** 대상 항목 결제액 합계 */
  selectedAmount: number;
  cancellationFee: number;
  refundAmount: number;
}

/** 환불 계좌. 고객이 취소 요청 때 입력한 값(S1-C7)이며, 관리자 취소요청 처리(S1-A9)에도 그대로 내려온다. */
export interface RefundAccount {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
}

/** 취소 요청(S1-C7). itemIds를 생략하면 취소 가능한 항목 전부. 계좌 값은 각각 50자 이하. */
export interface CustomerCancelRequestInput {
  itemIds?: string[];
  refundAccount: RefundAccount;
  reason?: string;
}

/** 내 예약 목록(S1-C5) 탭. 입금대기·취소요청은 탭 없이 '전체' 안에서 상태 태그로만 보인다. */
export type CustomerBookingListStatus = "ALL" | "RECEIVED" | "COMPLETED" | "CANCELLED";

/** 내 예약 목록(S1-C5) 카드 1장. 계약: BookingSummary. */
export interface CustomerBookingSummary {
  bookingId: string;
  bookingNumber: string;
  status: CustomerBookingStatus;
  /** 대표 상품명 — 카드 제목은 "상품명 외 (itemCount - 1)건" */
  productName: string;
  /** 총 항목 수(취소 항목 포함) */
  itemCount: number;
  /** 일부 항목만 취소됨 — '부분취소' 뱃지 */
  partiallyCancelled: boolean;
  /** 항목별 이용일의 합집합(오름차순, YYYY-MM-DD) */
  useDates: string[];
  /** 원 결제액 */
  totalAmount: number;
  /** 유효 항목 합계 */
  activeTotalAmount: number;
  createdAt: string;
}

export interface CustomerBookingListPage {
  content: CustomerBookingSummary[];
  page: number;
  size: number;
  totalElements: number;
}

/** 예약 관리 목록(S1-A6) 탭. UNPAID(미입금)는 '입금대기·접수 + 입금 기한 경과' 계산값이다. */
export type AdminBookingTab = "RECEIVED" | "COMPLETED" | "UNPAID" | "CANCEL_REQUESTED" | "CANCELLED";

/** 예약 관리 목록(S1-A6) 카드 1장. 계약: chinguya-admin-api.yaml AdminBookingSummary. */
export interface AdminBookingSummary {
  bookingId: string;
  bookingNumber: string;
  status: CustomerBookingStatus;
  /** 입금 기한이 지난 입금대기·접수 — '미입금' 표시 */
  unpaid: boolean;
  customerLoginId: string;
  passportName: string;
  productName: string;
  itemCount: number;
  partiallyCancelled: boolean;
  useDates: string[];
  /** 유효 항목 합계(입금액) */
  activeTotalAmount: number;
  depositDueBy?: string | null;
  /** 처리 안 된 취소 요청 id(S1-A9 진입 키). 없으면 null. 여러 건이면 가장 먼저 요청한 것. */
  pendingCancellationId: string | null;
  createdAt: string;
}

/** 예약 상세(S1-A7)의 항목 1줄. 계약: AdminBookingItem. */
export interface AdminBookingItem {
  bookingItemId: string;
  productName: string;
  optionType: RentalOptionKey;
  dates: string[];
  quantity: number;
  crossRegionReturn: boolean;
  lineTotal: number;
  status: BookingItemStatus;
}

/** 예약 상세·입금확인(S1-A7/A8). 계약: AdminBookingDetail. */
export interface AdminBookingDetail {
  bookingId: string;
  bookingNumber: string;
  status: CustomerBookingStatus;
  unpaid: boolean;
  customerLoginId: string;
  passportName: string;
  items: AdminBookingItem[];
  totalAmount: number;
  /** 유효 항목 합계 = 입금액 */
  activeTotalAmount: number;
  partiallyCancelled: boolean;
  /** 입금 확인 → 완료 처리 가능(입금대기·접수) */
  depositConfirmable: boolean;
  /** 미입금 강제 취소 가능(= unpaid) */
  forceCancellable: boolean;
  depositDueBy?: string | null;
  /** 처리 안 된 취소 요청 id(S1-A9 진입 키). 없으면 null. 여러 건이면 가장 먼저 요청한 것. */
  pendingCancellationId: string | null;
  createdAt: string;
}

export interface AdminBookingListPage {
  content: AdminBookingSummary[];
  page: number;
  size: number;
  totalElements: number;
}

/**
 * 취소요청 처리(S1-A9)의 항목 1줄. 계약: AdminCancellationItem.
 * `requested=false`면 이 취소 요청에 담기지 않은 항목(유지·이전 취소·다른 요청)이라 요율·금액 필드가 null —
 * 화면에서 흐리게 표시한다.
 */
export interface AdminCancellationItem {
  bookingItemId: string;
  productName: string;
  optionType: RentalOptionKey;
  dates: string[];
  quantity: number;
  lineTotal: number;
  status: BookingItemStatus;
  requested: boolean;
  /** 요율 산정 기준 이용일(항목 시작일) */
  useDate: string | null;
  /** 요청 시점 기준 남은 일수(당일 0) */
  daysToUse: number | null;
  /** 0~1, 요청 시점 요율표 스냅샷 */
  feeRate: number | null;
  cancellationFee: number | null;
  refundAmount: number | null;
}

/**
 * 고객 취소 요청 1건(S1-A9). 계약: AdminCancellationDetail. 진입 키는 예약 목록·상세의
 * `pendingCancellationId`. 금액은 모두 **고객이 요청한 시점의 견적 스냅샷** — 확정 시 다시 계산하지 않는다.
 */
export interface AdminCancellationDetail {
  cancellationId: string;
  bookingId: string;
  bookingNumber: string;
  bookingStatus: CustomerBookingStatus;
  partiallyCancelled: boolean;
  customerLoginId: string;
  passportName: string;
  /** 요청 당시 유효 항목 전부(FULL)인지 일부(PARTIAL)인지 */
  scope: "FULL" | "PARTIAL";
  /** 예약 항목 전체(담은 순) — requested 개수 / 전체 개수로 "(2 / 3건)" 표시 */
  items: AdminCancellationItem[];
  /** 요청 항목 결제액 합계 */
  selectedAmount: number;
  /** 취소 수수료 합계(항목별 산정 후 합산) */
  cancellationFee: number;
  /** 환불 예정액 합계 = selectedAmount − cancellationFee */
  refundAmount: number;
  refundAccount: RefundAccount;
  /** 고객이 적은 취소 사유(선택) */
  reason?: string | null;
  requestedAt: string;
  /** 취소 확정(환불 완료) 시각. 처리 전이면 null. */
  processedAt: string | null;
  /** true면 아직 미확정 — '요청 항목 취소 확정' 버튼 노출 */
  confirmable: boolean;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    /** Core의 도메인 에러 코드(예: DUPLICATE_ASSET_NAME). 본문을 못 읽으면 undefined. */
    public code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * 얇은 타입드 fetch 래퍼. 실제 엔드포인트는 백엔드 확정 시 채운다.
 * 세 앱이 동일한 클라이언트를 공유해 응답 타입 불일치를 방지한다.
 */
export function createApiClient(opts: ApiClientOptions = {}) {
  const baseUrl = opts.baseUrl ?? DEFAULT_API_BASE_URL;

  async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: {
        // FormData(파일 업로드)는 브라우저가 boundary가 붙은 content-type을 직접 넣어야 한다.
        ...(init?.body instanceof FormData ? {} : { "content-type": "application/json" }),
        ...(opts.getHeaders?.() ?? {}),
        ...(init?.headers ?? {}),
      },
    });
    if (!res.ok) {
      // Core는 실패를 {code, message}로 내려준다(api-spec의 Error 스키마). 화면이 서버 문구를
      // 그대로 쓸 수 있게 흘려보내고, 본문이 없거나 JSON이 아니면 경로만 남긴다.
      const body = (await res.json().catch(() => null)) as { code?: string; message?: string } | null;
      throw new ApiError(res.status, body?.message ?? `요청 실패: ${path}`, body?.code);
    }
    // 204/205는 본문이 없다 — res.json()을 부르면 빈 본문 파싱 실패로 예외가 난다.
    if (res.status === 204 || res.status === 205) {
      return undefined as T;
    }
    return (await res.json()) as T;
  }

  return {
    request,
    /**
     * 고객 상품 조회(S1-C1). 고객 앱 프록시가 `/v1` 프리픽스를 붙인다 — 계약은
     * api-spec/openapi/chinguya-slice1-openapi.yaml 의 GET /products. 비로그인도 부를 수 있다.
     */
    customerProducts: {
      list: (category: AssetCategory, page = 0, size = 20) =>
        request<CustomerProductListPage>(`/products?category=${category}&page=${page}&size=${size}`),
      /** 상품 상세(S3-C1). 표출 ON 상품이 없는 자산이면 404(PRODUCT_NOT_FOUND). */
      detail: (productId: string) => request<CustomerProductDetail>(`/products/${productId}`),
      /** 가용성(S1-C2). from·to는 YYYY-MM-DD — 서버가 예약 가능 기간으로 잘라 준다. */
      availability: (
        productId: string,
        params: { optionType: RentalOptionKey; from: string; to: string; crossRegionReturn?: boolean },
      ) => {
        const query = new URLSearchParams({
          optionType: params.optionType,
          from: params.from,
          to: params.to,
          crossRegionReturn: String(Boolean(params.crossRegionReturn)),
        });
        return request<CustomerAvailability>(`/products/${productId}/availability?${query}`);
      },
    },
    /** 고객 FAQ(S4-C3). 관리자 FAQ 관리(S4-A1) 목록을 노출 순서대로 준다. 비로그인도 부를 수 있다. */
    customerFaqs: {
      list: () => request<CustomerFaq[]>("/faqs"),
    },
    /**
     * 고객 랜딩 콘텐츠(안 A). 비로그인 열람 허용이고, 관리자 콘텐츠 관리(S4-A3)가 저장한
     * 값을 그대로 받는다 — 응답 모양도 관리자와 같은 `HeroBanner` 다.
     *
     * 서비스 소개(S4-C2)는 없다 — 관리자 페이지에서 관리하지 않기로 했고(2026-09-21),
     * 화면이 문구를 직접 들고 있다.
     */
    customerContent: {
      /** 히어로 배너 3장(slot 오름차순). */
      banners: () => request<HeroBanner[]>("/content/banners"),
    },
    /**
     * 고객 공지사항·이벤트(S4-C6). 비로그인 열람 허용이고 **공개 글만** 온다.
     * 숨긴 글은 상세도 404 다 — 주소를 직접 쳐도 보이지 않는다.
     */
    customerNotices: {
      /** 무한 스크롤이 page 를 올려 가며 이어 붙인다. */
      list: (params: { category?: NoticeCategory; page?: number; size?: number } = {}) => {
        const query = new URLSearchParams({
          page: String(params.page ?? 0),
          size: String(params.size ?? 20),
        });
        if (params.category) query.set("category", params.category);
        return request<NoticeListPage>(`/notices?${query.toString()}`);
      },
      detail: (noticeId: string) => request<NoticeDetail>(`/notices/${noticeId}`),
    },
    /**
     * 질문하기(S4-C4 목록 / S4-C5 상세·작성). 전부 고객 로그인 필요(비로그인 401).
     * 상세·삭제는 본인 글만 — 남의 글·없는 글은 404(INQUIRY_NOT_FOUND).
     */
    customerInquiries: {
      list: () => request<InquirySummary[]>("/inquiries"),
      create: (body: InquiryInput) =>
        request<InquiryDetail>("/inquiries", { method: "POST", body: JSON.stringify(body) }),
      detail: (inquiryId: string) => request<InquiryDetail>(`/inquiries/${inquiryId}`),
      remove: (inquiryId: string) => request<void>(`/inquiries/${inquiryId}`, { method: "DELETE" }),
    },
    /**
     * 장바구니 = 임시 홀드(S1-C2 담기 / S1-C3). 고객 로그인이 필요하다(비로그인 401).
     * 잔여가 모자라면 409(OUT_OF_STOCK), 예약 가능 기간 밖이면 400(DATE_NOT_BOOKABLE).
     */
    customerCart: {
      get: () => request<CustomerCart>("/cart"),
      addItem: (body: CustomerCartItemInput) =>
        request<CustomerCartItem>("/cart/items", { method: "POST", body: JSON.stringify(body) }),
      removeItem: (cartItemId: string) => request<void>(`/cart/items/${cartItemId}`, { method: "DELETE" }),
    },
    /**
     * 예약 확정·입금 안내(S1-C3/C4). 고객 로그인이 필요하다(비로그인 401).
     * 홀드가 만료됐으면 확정이 409(HOLD_EXPIRED), 입금대기가 아니면 입금 확인 요청이 409(INVALID_BOOKING_STATUS).
     */
    customerBookings: {
      /** cartItemIds를 생략하면 장바구니 전체. passportName은 저장값이 있으면 생략할 수 있다. */
      create: (body: { passportName?: string; cartItemIds?: string[] }) =>
        request<CustomerBooking>("/bookings", { method: "POST", body: JSON.stringify(body) }),
      depositInfo: (bookingId: string) => request<CustomerDepositInfo>(`/bookings/${bookingId}/deposit-info`),
      requestDeposit: (bookingId: string) =>
        request<CustomerBooking>(`/bookings/${bookingId}/deposit-request`, { method: "POST" }),
      /** S1-C6 예약 상세·바우처(취소 항목 포함). 남의 예약은 404. */
      detail: (bookingId: string) => request<CustomerBooking>(`/bookings/${bookingId}`),
      /** S1-C5 내 예약 목록(최근 예약 먼저). */
      list: (status: CustomerBookingListStatus = "ALL", page = 0, size = 20) =>
        request<CustomerBookingListPage>(`/bookings?status=${status}&page=${page}&size=${size}`),
      /**
       * S1-C7 취소 견적. itemIds를 생략하면 취소 가능한 항목 전부.
       * 취소할 수 없는 예약이면 409(INVALID_BOOKING_STATUS), 입금 전 일부 선택이면 409(PARTIAL_CANCEL_NOT_ALLOWED).
       */
      cancellationQuote: (bookingId: string, itemIds?: string[]) =>
        request<CustomerCancellationQuote>(
          `/bookings/${bookingId}/cancellation-quote${itemIds?.length ? `?itemIds=${itemIds.join(",")}` : ""}`,
        ),
      /** S1-C7 취소 요청. 갱신된 예약을 돌려준다(유효 항목 전부면 상태 = CANCEL_REQUESTED). */
      requestCancel: (bookingId: string, body: CustomerCancelRequestInput) =>
        request<CustomerBooking>(`/bookings/${bookingId}/cancel-request`, {
          method: "POST",
          body: JSON.stringify(body),
        }),
    },
    customerReservations: {
      list: () => request<CustomerReservation[]>("/customer/reservations"),
      create: (body: Partial<CustomerReservation>) =>
        request<CustomerReservation>("/customer/reservations", {
          method: "POST",
          body: JSON.stringify(body),
        }),
    },
    agencyReservations: {
      /** S2-G6 예약 목록. 취소된 예약도 포함하고, 이용일 내림차순이다. */
      list: () => request<AgencyReservationList>("/agency/reservations"),
      /**
       * S2-G5 예약(즉시 완료). 줄마다 예약 1건이 생기고, 전부 성공하거나 전부 실패한다.
       * 가용을 넘으면 409(ALLOCATION_EXCEEDED), 매장 휴무일이면 409(STORE_CLOSED).
       */
      create: (body: AgencyReservationInput) =>
        request<AgencyReservationResult[]>("/agency/reservations", {
          method: "POST",
          body: JSON.stringify(body),
        }),
      /**
       * S2-G6 즉시 취소. 마감(기본 D-3)이 지났거나 이미 취소됐으면 409,
       * 남의 예약이면 404. 재고는 서버에서 바로 복원된다.
       */
      cancel: (reservationId: string) =>
        request<AgencyReservationResult>(`/agency/reservations/${reservationId}/cancel`, {
          method: "POST",
        }),
    },
    /** S2-G4 이용 날짜별 예약 가능 상품. 여행사 앱 프록시가 `/v1` 프리픽스를 붙인다. */
    agencyProducts: {
      list: (useDate: string) => request<AgencyProductList>(`/agency/products?useDate=${useDate}`),
    },
    invoices: {
      /**
       * S2-G7 전월 인보이스. 기간 파라미터가 없는 것은 화면에 월 선택 UI 가 없기 때문이다.
       * 대상 예약이 없어도 200 이고, lineItems 가 빈 배열·totalAmount 가 0 으로 온다.
       */
      previousMonth: () => request<AgencyInvoice>("/agency/invoices"),
    },
    /**
     * 여행사 대시보드(S2-G3). 계약: api-spec/openapi/chinguya-agency-api.yaml.
     *
     * 여행사명은 여기 없다 — 세션(`/agency/auth/me`)이 이미 주고 앱 셸이 그걸 쓴다.
     */
    agencyDashboard: {
      /** 오늘 이용자 명단 + 신규 예약 건수. 오늘 이용 예정이 없어도 200(빈 배열)이다. */
      get: () => request<AgencyDashboard>("/agency/dashboard"),
    },
    /**
     * 관리자 자산 관리(S1-A2). 관리자 앱의 프록시가 `/admin` 프리픽스를 붙이므로
     * 여기서는 그 뒤 경로만 적는다 — 계약은 api-spec/openapi/chinguya-admin-api.yaml.
     *
     * 쓰기(등록·수정·삭제·복원)는 서버가 슈퍼어드민만 허용한다(403). 화면의 버튼 숨김은
     * 정합성을 맞추는 것일 뿐 보안 경계가 아니다.
     */
    assets: {
      /** includeDeleted=true면 '삭제됨' 자산까지 포함한다(자산 관리 화면이 쓰는 형태). */
      list: (includeDeleted = false) =>
        request<Asset[]>(`/assets?includeDeleted=${includeDeleted}`),
      /** 카테고리는 등록 때만 보낸다 — 수정·복원에는 없고 서버가 기존 값을 유지한다. */
      create: (name: string, category: AssetCategory) =>
        request<Asset>("/assets", { method: "POST", body: JSON.stringify({ name, category }) }),
      /** 명칭만 바꾼다. 카테고리는 서버가 받지 않는다(A2-M2에서 읽기 전용). */
      rename: (assetId: string, name: string) =>
        request<Asset>(`/assets/${assetId}`, { method: "PUT", body: JSON.stringify({ name }) }),
      /** 재고 레코드 유무에 따라 서버가 완전삭제/소프트삭제를 고르고, 어느 쪽이었는지 알려준다. */
      remove: (assetId: string) =>
        request<{ deletion: AssetDeletionMode }>(`/assets/${assetId}`, { method: "DELETE" }),
      /** 명칭만 보낸다 — 카테고리는 삭제 전 값을 그대로 승계한다. */
      restore: (assetId: string, name: string) =>
        request<Asset>(`/assets/${assetId}/restore`, {
          method: "POST",
          body: JSON.stringify({ name }),
        }),
    },
    /**
     * 관리자 상품 관리(S1-A4 목록·표출 토글 / S1-A5 등록·수정·삭제).
     *
     * 상품 = 연결 자산 1개 + 대여 옵션 1개. 목록은 자산·여행사와 같이 페이지네이션 없이
     * 전량 반환하고, 화면(S1-A4)이 카테고리 탭 → 자산별 묶음으로 그린다.
     */
    products: {
      /** category·assetId 로 거른다. includeDeleted=true 면 소프트 삭제된 상품까지. */
      list: (params: { category?: AssetCategory; assetId?: string; includeDeleted?: boolean } = {}) => {
        const query = new URLSearchParams();
        if (params.category) query.set("category", params.category);
        if (params.assetId) query.set("assetId", params.assetId);
        if (params.includeDeleted) query.set("includeDeleted", "true");
        const qs = query.toString();
        return request<AdminProduct[]>(`/products${qs ? `?${qs}` : ""}`);
      },
      get: (productId: string) => request<AdminProduct>(`/products/${productId}`),
      /** 연결 자산·옵션은 여기서만 정한다. 활성 자산만, 카테고리가 허용하는 옵션만. */
      create: (body: AdminProductCreate) =>
        request<AdminProduct>("/products", { method: "POST", body: JSON.stringify(body) }),
      /** 연결 자산·옵션은 못 바꾼다. 이미지는 보낸 배열로 통째 교체된다. */
      update: (productId: string, body: AdminProductUpdate) =>
        request<AdminProduct>(`/products/${productId}`, { method: "PUT", body: JSON.stringify(body) }),
      /** 소프트 삭제만 한다(예약 이력 보존). 복원 API는 없다. */
      remove: (productId: string) =>
        request<void>(`/products/${productId}`, { method: "DELETE" }),
      /** S1-A4 표출 토글. 고객앱·여행사앱이 독립이라 한쪽만 보내도 된다. */
      setVisibility: (productId: string, body: { customerVisible?: boolean; agencyVisible?: boolean }) =>
        request<AdminProduct>(`/products/${productId}/visibility`, {
          method: "PATCH",
          body: JSON.stringify(body),
        }),
    },
    /**
     * 관리자 여행사 관리(S2-A1 목록·토글 / S2-A2 등록·초대 / S2-A3 상세·수정).
     * 자산과 같이 관리자 앱 프록시가 `/admin` 프리픽스를 붙이므로 그 뒤 경로만 적는다.
     *
     * 여행사 계정을 만드는 API는 여기 없다 — 아이디·비밀번호는 담당자가 초대 링크로
     * 직접 정한다(S2-G1, 여행사 앱 소관). 관리자가 하는 일은 초대 발송까지다.
     */
    agencies: {
      /** includeDeleted=true면 소프트 삭제된 여행사까지 포함한다. */
      list: (includeDeleted = false) =>
        request<Agency[]>(`/agencies?includeDeleted=${includeDeleted}`),
      detail: (agencyId: string) => request<Agency>(`/agencies/${agencyId}`),
      /**
       * 등록 + 초대 메일 발송. 메일 실패는 에러가 아니라 `invitation.sent === false`로
       * 온다 — 여행사 행은 커밋됐으므로 화면은 재발송을 안내하면 된다.
       */
      create: (body: AgencyInput) =>
        request<AgencyCreateResult>("/agencies", { method: "POST", body: JSON.stringify(body) }),
      update: (agencyId: string, body: AgencyInput) =>
        request<Agency>(`/agencies/${agencyId}`, { method: "PUT", body: JSON.stringify(body) }),
      setActive: (agencyId: string, active: boolean) =>
        request<Agency>(`/agencies/${agencyId}/active`, {
          method: "PATCH",
          body: JSON.stringify({ active }),
        }),
      /** 항상 소프트 삭제다(복원 API 없음) — 인보이스가 여행사 이름을 잃으면 안 되기 때문. */
      remove: (agencyId: string) => request<void>(`/agencies/${agencyId}`, { method: "DELETE" }),
      /** 새 토큰을 끊어 다시 보낸다. 이전 링크는 이 순간 무효가 된다. */
      resendInvitation: (agencyId: string) =>
        request<AgencyInvitationResult>(`/agencies/${agencyId}/invitations`, { method: "POST" }),
    },
    /**
     * 관리자 예약 관리(S1-A6 목록 / S1-A7 상세 / S1-A8 입금확인·강제취소). 관리자 앱 프록시가 `/admin` 프리픽스를 붙인다.
     * 고객 예약만 다룬다(여행사 예약 제외). 목록은 관리자 API 중 유일하게 페이지네이션한다.
     */
    bookings: {
      /** keyword는 예약번호·여권 영문명 부분 일치(대소문자 무시). */
      list: (params: { tab: AdminBookingTab; keyword?: string; page?: number; size?: number }) => {
        const query = new URLSearchParams({
          tab: params.tab,
          page: String(params.page ?? 0),
          size: String(params.size ?? 20),
        });
        if (params.keyword?.trim()) query.set("keyword", params.keyword.trim());
        return request<AdminBookingListPage>(`/bookings?${query.toString()}`);
      },
      /** S1-A7 예약 상세. */
      detail: (bookingId: string) => request<AdminBookingDetail>(`/bookings/${bookingId}`),
      /** S1-A8 입금 확인 → 완료. 입금대기·접수가 아니면 409(INVALID_BOOKING_STATUS). 슈퍼어드민 전용. */
      confirmDeposit: (bookingId: string) =>
        request<AdminBookingDetail>(`/bookings/${bookingId}/deposit-confirm`, { method: "POST" }),
      /** S1-A8 미입금 강제 취소(예약 전체, 재고 즉시 복원). 미입금이 아니면 409. 슈퍼어드민 전용. */
      forceCancel: (bookingId: string) =>
        request<AdminBookingDetail>(`/bookings/${bookingId}/force-cancel`, { method: "POST" }),
    },
    /**
     * 관리자 취소요청 처리(S1-A9, a-cancel). 관리자 앱 프록시가 `/admin` 프리픽스를 붙인다.
     * 진입 키는 예약 목록·상세(`bookings.list`/`bookings.detail`)의 `pendingCancellationId`.
     */
    cancellations: {
      /** 취소 요청 1건 상세 — 요청 시점 견적 스냅샷 + 예약 항목 전체. */
      detail: (cancellationId: string) =>
        request<AdminCancellationDetail>(`/cancellations/${cancellationId}`),
      /**
       * A9-M1 완료 — 고객 계좌로 수동 이체를 마친 뒤 호출. 요청 항목만 취소 확정하고 해당
       * 항목·날짜의 재고를 즉시 복원한다. 이미 처리된 요청이면 409(CANCELLATION_ALREADY_PROCESSED).
       * 슈퍼어드민 전용.
       */
      confirm: (cancellationId: string) =>
        request<AdminCancellationDetail>(`/cancellations/${cancellationId}/confirm`, { method: "POST" }),
    },
    /**
     * 관리자 여행사 인보이스(S2-A5/A6). 여행사가 자기 것을 보는 `invoices` 와 다른 계약이다 —
     * 이쪽만 발행 상태·정산 완료를 가진다.
     *
     * 발행은 자동·멱등이라 등록 호출이 없다. `list()` 를 부르면 서버가 밀린 달을 그 자리에서
     * 발행한다(와이어프레임 a-invoice: 수동 등록 없음).
     */
    adminInvoices: {
      /** `agencyId` 를 비우면 전체. 없는 여행사 id 면 빈 목록이다(404 아님). */
      list: (agencyId?: string) =>
        request<AdminInvoiceList>(`/invoices${agencyId ? `?agencyId=${encodeURIComponent(agencyId)}` : ""}`),
      detail: (invoiceId: string) => request<AdminInvoiceDetail>(`/invoices/${invoiceId}`),
      /**
       * 입금(정산) 확인 → 정산 완료. 되돌리는 호출은 없다. 이미 정산된 건이면
       * 409(INVOICE_ALREADY_SETTLED). 슈퍼어드민 전용.
       */
      settle: (invoiceId: string) =>
        request<AdminInvoiceDetail>(`/invoices/${invoiceId}/settle`, { method: "POST" }),
    },
    /**
     * 날짜별 재고 세팅(S1-A3, 여행사 할당 포함). 계약: api-spec/openapi/chinguya-admin-api.yaml.
     *
     * preview 계열(previewAdd/previewEdit)은 아무것도 저장하지 않는 계산 전용이라
     * 서버가 슈퍼어드민이 아니어도 부를 수 있게 허용한다. 그 외 쓰기는 슈퍼어드민만.
     * 할당을 늘리는 쓰기가 할당 합 > 총 보유를 만들면 409(ALLOCATION_EXCEEDS_STOCK).
     */
    inventory: {
      snapshot: (assetId: string, year: number, month: number) =>
        request<InventoryDaySnapshot[]>(`/inventory/assets/${assetId}/snapshot?year=${year}&month=${month}`),
      day: (assetId: string, date: string) =>
        request<InventoryDayDetail>(`/inventory/assets/${assetId}/days/${date}`),
      currentBaseline: (assetId: string) =>
        request<{ value: number }>(`/inventory/assets/${assetId}/baseline/current`),
      changeBaseline: (assetId: string, value: number, startDate: string, memo: string) =>
        request<{ value: number }>(`/inventory/assets/${assetId}/baseline`, {
          method: "POST",
          body: JSON.stringify({ value, startDate, memo }),
        }),
      currentAllocations: (assetId: string) =>
        request<AgencyAllocation[]>(`/inventory/assets/${assetId}/allocations/current`),
      changeAllocation: (assetId: string, body: AllocationChangeRequest) =>
        request<AgencyAllocation[]>(`/inventory/assets/${assetId}/allocations`, {
          method: "POST",
          body: JSON.stringify(body),
        }),
      addAdjustment: (assetId: string, body: AdjustmentRequest) =>
        request<InventoryAdjustment>(`/inventory/assets/${assetId}/adjustments`, {
          method: "POST",
          body: JSON.stringify(body),
        }),
      previewAdd: (assetId: string, body: AdjustmentRequest) =>
        request<OverCapacityDate[]>(`/inventory/assets/${assetId}/adjustments/preview`, {
          method: "POST",
          body: JSON.stringify(body),
        }),
      updateAdjustment: (adjustmentId: string, body: AdjustmentRequest) =>
        request<InventoryAdjustment>(`/inventory/adjustments/${adjustmentId}`, {
          method: "PUT",
          body: JSON.stringify(body),
        }),
      previewEdit: (adjustmentId: string, body: AdjustmentRequest) =>
        request<OverCapacityDate[]>(`/inventory/adjustments/${adjustmentId}/preview`, {
          method: "PUT",
          body: JSON.stringify(body),
        }),
      removeAdjustment: (adjustmentId: string) =>
        request<void>(`/inventory/adjustments/${adjustmentId}`, { method: "DELETE" }),
      setClosure: (date: string, closed: boolean) =>
        request<{ date: string; closed: boolean }>(`/inventory/closures/${date}`, {
          method: "PUT",
          body: JSON.stringify({ closed }),
        }),
    },
    /**
     * 계좌·정책 설정(S1-A10). 조회는 관리자 누구나, 저장은 슈퍼어드민만(403).
     * 요율표에 당일(0일) 구간이 없거나 시작 일수가 겹치면 400(INVALID_CANCELLATION_POLICY).
     */
    settings: {
      get: () => request<AdminSettings>("/settings"),
      update: (body: AdminSettingsInput) =>
        request<AdminSettings>("/settings", { method: "PUT", body: JSON.stringify(body) }),
    },
    /**
     * 관리자 계정 관리(S0-A5/A6). 조회는 관리자 누구나, 쓰기는 슈퍼어드민만(403).
     * 아이디가 겹치면(삭제된 계정 포함) 409(DUPLICATE_LOGIN_ID), 마지막 슈퍼어드민을 내리거나
     * 삭제하면 409(LAST_SUPER_ADMIN). 삭제는 소프트 삭제다.
     */
    /**
     * 공지사항·이벤트 관리(S4-A4). 목록은 **숨긴 글도 함께** 온다(화면이 토글로 다시 공개한다).
     *
     * 첨부 이미지 업로드는 이 네임스페이스가 하지 않는다 — `content.uploadImage` 로 올린 뒤
     * 받은 주소를 `imageUrls` 에 담는다(배너와 같은 저장소를 쓴다).
     */
    notices: {
      list: (params: { category?: NoticeCategory; page?: number; size?: number } = {}) => {
        const query = new URLSearchParams({
          page: String(params.page ?? 0),
          size: String(params.size ?? 20),
        });
        if (params.category) query.set("category", params.category);
        return request<NoticeListPage>(`/notices?${query.toString()}`);
      },
      detail: (noticeId: string) => request<NoticeDetail>(`/notices/${noticeId}`),
      create: (body: NoticeInput) =>
        request<NoticeDetail>("/notices", { method: "POST", body: JSON.stringify(body) }),
      /** 통째로 교체한다. 첨부를 한 장 빼려면 나머지만 담아 보낸다. */
      update: (noticeId: string, body: NoticeInput) =>
        request<NoticeDetail>(`/notices/${noticeId}`, { method: "PUT", body: JSON.stringify(body) }),
      /** 완전 삭제(복원 없음). 잠시 내리는 용도로는 published: false 를 쓴다. */
      remove: (noticeId: string) => request<void>(`/notices/${noticeId}`, { method: "DELETE" }),
    },
    /**
     * 관리자 대시보드(S1-A1). 지표·재고 초과 날짜·오늘 방문 예약을 한 번에 받는다 —
     * 예전에는 화면이 자산 목록을 받아 자산×월마다 재고 스냅샷을 따로 불렀다.
     */
    dashboard: {
      get: () => request<AdminDashboard>("/dashboard"),
    },
    admins: {
      list: () => request<AdminAccount[]>("/admins"),
      create: (body: AdminAccountCreateInput) =>
        request<AdminAccount>("/admins", { method: "POST", body: JSON.stringify(body) }),
      update: (adminId: string, body: AdminAccountUpdateInput) =>
        request<AdminAccount>(`/admins/${adminId}`, { method: "PUT", body: JSON.stringify(body) }),
      remove: (adminId: string) => request<void>(`/admins/${adminId}`, { method: "DELETE" }),
    },
    /**
     * FAQ 관리(S4-A1). 조회는 관리자 누구나, 쓰기는 슈퍼어드민만(403).
     * 새 항목은 맨 뒤에 붙고, 순서는 reorder로만 바꾼다.
     */
    faqs: {
      list: () => request<AdminFaq[]>("/faqs"),
      create: (body: FaqInput) =>
        request<AdminFaq>("/faqs", { method: "POST", body: JSON.stringify(body) }),
      update: (faqId: string, body: FaqInput) =>
        request<AdminFaq>(`/faqs/${faqId}`, { method: "PUT", body: JSON.stringify(body) }),
      remove: (faqId: string) => request<void>(`/faqs/${faqId}`, { method: "DELETE" }),
      /** 전체 id를 원하는 순서대로 보낸다. 그 사이 등록·삭제가 있었으면 409(FAQ_ORDER_MISMATCH). */
      reorder: (faqIds: string[]) =>
        request<AdminFaq[]>("/faqs/order", { method: "PUT", body: JSON.stringify({ faqIds }) }),
    },
    /**
     * 문의 관리(S4-A2-1 목록 / S4-A2-2 상세·답변). 조회는 관리자 누구나, 답변은 슈퍼어드민만(403).
     * 답변은 질문당 하나라 다시 보내면 덮어쓴다.
     */
    inquiries: {
      list: () => request<AdminInquiry[]>("/inquiries"),
      detail: (inquiryId: string) => request<AdminInquiry>(`/inquiries/${inquiryId}`),
      answer: (inquiryId: string, answer: string) =>
        request<AdminInquiry>(`/inquiries/${inquiryId}/answer`, { method: "PUT", body: JSON.stringify({ answer }) }),
    },
    /**
     * 콘텐츠 관리(S4-A3) — 랜딩 히어로 배너 3장·서비스 소개 본문. 쓰기는 슈퍼어드민만(403).
     * 새 이미지는 uploadImage로 먼저 올리고, 받은 주소를 updateBanners에 넣어야 반영된다.
     */
    content: {
      banners: () => request<HeroBanner[]>("/content/banners"),
      updateBanners: (banners: HeroBanner[]) =>
        request<HeroBanner[]>("/content/banners", { method: "PUT", body: JSON.stringify({ banners }) }),
      intro: () => request<{ body: string }>("/content/intro"),
      updateIntro: (body: string) =>
        request<{ body: string }>("/content/intro", { method: "PUT", body: JSON.stringify({ body }) }),
      /** PNG·JPG·WEBP, 10MB까지. 형식이 틀리면 400(INVALID_IMAGE), 크면 413(IMAGE_TOO_LARGE). */
      uploadImage: (file: File) => {
        const form = new FormData();
        form.append("file", file);
        return request<{ imageUrl: string }>("/content/images", { method: "POST", body: form });
      },
    },
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
