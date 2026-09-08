import type {
  Product,
  CustomerReservation,
  AgencyReservation,
  Invoice,
  Asset,
  AssetDeletionMode,
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
 * 날짜별 재고 세팅(S1-A3) API 타입. 도메인 비즈니스 규칙(packages/types)이 아니라 이
 * 엔드포인트의 응답/요청 모양이라 여기 둔다 — 계약 원본은 api-spec/openapi/chinguya-admin-api.yaml.
 */
export interface InventoryDaySnapshot {
  date: string;
  baseline: number;
  totalStock: number;
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
  customerAvailable: number;
  closed: boolean;
  reserved: number;
  remaining: number;
  adjustments: InventoryAdjustment[];
}

export interface AdjustmentRequest {
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
     * 날짜별 재고 세팅(S1-A3). 계약: api-spec/openapi/chinguya-admin-api.yaml.
     *
     * preview 계열(previewAdd/previewEdit)은 아무것도 저장하지 않는 계산 전용이라
     * 서버가 슈퍼어드민이 아니어도 부를 수 있게 허용한다. 그 외 쓰기는 슈퍼어드민만.
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
