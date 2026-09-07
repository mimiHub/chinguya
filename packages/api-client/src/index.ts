import type {
  Product,
  CustomerReservation,
  AgencyReservation,
  Invoice,
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

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
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
      throw new ApiError(res.status, `요청 실패: ${path}`);
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
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
