import type {
  Product,
  CustomerReservation,
  AgencyReservation,
  Invoice,
  Asset,
  AssetCategory,
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
  /** ⚠ 예약 백엔드가 없어 항상 0(api-spec 헤더 TODO 7). */
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
  /** 여행사 취소 마감일(이용일 D-N). ⚠ 아직 이 값을 쓰는 서버 로직이 없다(api-spec 헤더 TODO 9). */
  agencyCancelDeadlineDays: number;
}

/** 저장 요청 — 세 값을 통째로 교체한다. 요율표 순서는 상관없다(서버가 정렬). */
export interface AdminSettingsInput {
  depositAccount: DepositAccount;
  cancellationPolicy: { minDaysBefore: number; feeRate: number }[];
  agencyCancelDeadlineDays: number;
}

/**
 * FAQ·콘텐츠 관리(S4-A1/A3) API 타입. 계약 원본은 api-spec/openapi/chinguya-admin-api.yaml.
 *
 * 고객앱 FAQ 목업이 쓰는 도메인 타입(FaqEntry)과 필드명(id/order)이 달라 따로 둔다.
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
    products: {
      list: () => request<Product[]>("/products"),
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
      list: () => request<AgencyReservation[]>("/agency/reservations"),
    },
    invoices: {
      list: () => request<Invoice[]>("/agency/invoices"),
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
