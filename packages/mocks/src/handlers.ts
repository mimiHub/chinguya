// =============================================================================
// MSW 핸들러 — Slice 1 고객 Core API 13종.
// 응답 본문 타입은 전부 OpenAPI 생성 타입(components["schemas"])에 고정.
//
// baseUrl 기본값은 운영 Core API. 로컬(BFF 우회) 개발은 makeHandlers()에
// "http://localhost:8080/v1" 등을 넘겨 재등록한다.
//   예) const handlers = makeHandlers("http://localhost:8080/v1")
// =============================================================================
import { http, HttpResponse } from "msw";
import type { components } from "./types.gen";
import * as store from "./store";
import { products, buildAvailability } from "./fixtures";

type S = components["schemas"];

function err(code: string, message: string): S["Error"] {
  return { code, message };
}

export function makeHandlers(baseUrl = "https://api.chinguya.co.kr/v1") {
  return [
    // ── S1-C1 상품 목록 ──────────────────────────────────────────────────────
    http.get(`${baseUrl}/products`, ({ request }) => {
      const category = new URL(request.url).searchParams.get("category");
      const content: S["ProductSummary"][] = products
        .filter((p) => !category || p.category === category)
        .map((p) => ({
          productId: p.productId,
          name: p.name,
          category: p.category,
          priceFrom: Math.min(...p.options.map((o) => o.price)),
        }));
      const body: S["ProductListPage"] = { content, page: 0, size: 20, totalElements: content.length };
      return HttpResponse.json(body);
    }),

    // ── S3-C1 상품 상세 ──────────────────────────────────────────────────────
    http.get(`${baseUrl}/products/:productId`, ({ params }) => {
      const p = products.find((x) => x.productId === params.productId);
      return p
        ? HttpResponse.json(p)
        : HttpResponse.json(err("NOT_FOUND", "상품을 찾을 수 없습니다."), { status: 404 });
    }),

    // ── S1-C2 가용성 ─────────────────────────────────────────────────────────
    http.get(`${baseUrl}/products/:productId/availability`, ({ params, request }) => {
      const sp = new URL(request.url).searchParams;
      const optionType = (sp.get("optionType") ?? "DAY_1") as S["RentalOptionType"];
      const cross = sp.get("crossRegionReturn") === "true";
      return HttpResponse.json(buildAvailability(String(params.productId), optionType, cross));
    }),

    // ── S1-C3 장바구니 조회 ──────────────────────────────────────────────────
    http.get(`${baseUrl}/cart`, () => HttpResponse.json(store.getCart())),

    // ── S1-C2 장바구니 담기 = 임시 홀드 생성 ─────────────────────────────────
    http.post(`${baseUrl}/cart/items`, async ({ request }) => {
      const dto = (await request.json()) as S["CartItemCreate"];
      const item = store.addCartItem(dto);
      return HttpResponse.json(item, { status: 201 });
    }),

    // ── 장바구니 항목 제거(홀드 해제) ─────────────────────────────────────────
    http.delete(`${baseUrl}/cart/items/:cartItemId`, ({ params }) => {
      store.removeCartItem(String(params.cartItemId));
      return new HttpResponse(null, { status: 204 });
    }),

    // ── S1-C3 예약 확정 (생성 직후 = 입금대기) ───────────────────────────────
    http.post(`${baseUrl}/bookings`, async ({ request }) => {
      const dto = (await request.json()) as S["BookingCreate"];
      if (!dto.passportName) {
        return HttpResponse.json(err("PASSPORT_NAME_REQUIRED", "여권 영문명이 필요합니다."), { status: 400 });
      }
      const b = store.createBooking(dto);
      return b
        ? HttpResponse.json(b, { status: 201 })
        : HttpResponse.json(err("HOLD_EXPIRED", "홀드 만료 또는 빈 장바구니."), { status: 409 });
    }),

    // ── S1-C5 내 예약 목록 ───────────────────────────────────────────────────
    http.get(`${baseUrl}/bookings`, ({ request }) => {
      const status = new URL(request.url).searchParams.get("status") ?? "ALL";
      return HttpResponse.json(store.listBookings(status));
    }),

    // ── S1-C6 예약 상세·바우처 ───────────────────────────────────────────────
    http.get(`${baseUrl}/bookings/:bookingId`, ({ params }) => {
      const b = store.getBooking(String(params.bookingId));
      return b
        ? HttpResponse.json(b)
        : HttpResponse.json(err("NOT_FOUND", "예약을 찾을 수 없습니다."), { status: 404 });
    }),

    // ── S1-C4 입금 안내 조회 ─────────────────────────────────────────────────
    http.get(`${baseUrl}/bookings/:bookingId/deposit-info`, ({ params }) => {
      const d = store.getDepositInfo(String(params.bookingId));
      return d
        ? HttpResponse.json(d)
        : HttpResponse.json(err("NOT_FOUND", "예약을 찾을 수 없습니다."), { status: 404 });
    }),

    // ── S1-C4 입금 확인 요청 (입금대기 → 접수) ───────────────────────────────
    http.post(`${baseUrl}/bookings/:bookingId/deposit-request`, ({ params }) => {
      const b = store.requestDeposit(String(params.bookingId));
      return b
        ? HttpResponse.json(b)
        : HttpResponse.json(err("INVALID_STATE", "입금대기 상태가 아닙니다."), { status: 409 });
    }),

    // ── S1-C7 취소 견적 (v0.4: itemIds로 항목 지정, 생략 시 전체) ─────────────
    http.get(`${baseUrl}/bookings/:bookingId/cancellation-quote`, ({ params, request }) => {
      const itemIdsParam = new URL(request.url).searchParams.get("itemIds");
      const itemIds = itemIdsParam ? itemIdsParam.split(",").filter(Boolean) : undefined;
      const result = store.cancellationQuote(String(params.bookingId), itemIds);
      return result.ok
        ? HttpResponse.json(result.value)
        : HttpResponse.json(err(result.error.code, result.error.message), { status: result.error.status });
    }),

    // ── S1-C7 취소 요청 제출 (v0.4: itemIds 지정 시 부분취소) ─────────────────
    http.post(`${baseUrl}/bookings/:bookingId/cancel-request`, async ({ params, request }) => {
      const dto = (await request.json()) as S["CancelRequest"];
      const result = store.cancelRequest(String(params.bookingId), dto);
      return result.ok
        ? HttpResponse.json(result.value)
        : HttpResponse.json(err(result.error.code, result.error.message), { status: result.error.status });
    }),
  ];
}

export const handlers = makeHandlers();
