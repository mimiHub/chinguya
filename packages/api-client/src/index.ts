import type {
  Product,
  CustomerReservation,
  AgencyReservation,
  Invoice,
  Asset,
  AssetDeletionMode,
  Agency,
  AgencyCreateResult,
  AgencyInvitationResult,
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
        "content-type": "application/json",
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
      create: (name: string) =>
        request<Asset>("/assets", { method: "POST", body: JSON.stringify({ name }) }),
      rename: (assetId: string, name: string) =>
        request<Asset>(`/assets/${assetId}`, { method: "PUT", body: JSON.stringify({ name }) }),
      /** 재고 레코드 유무에 따라 서버가 완전삭제/소프트삭제를 고르고, 어느 쪽이었는지 알려준다. */
      remove: (assetId: string) =>
        request<{ deletion: AssetDeletionMode }>(`/assets/${assetId}`, { method: "DELETE" }),
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
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
