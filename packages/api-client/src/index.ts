import type {
  Product,
  CustomerReservation,
  AgencyReservation,
  Invoice,
} from "@chinguya/types";

export interface ApiClientOptions {
  baseUrl: string;
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
export function createApiClient(opts: ApiClientOptions) {
  async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${opts.baseUrl}${path}`, {
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
