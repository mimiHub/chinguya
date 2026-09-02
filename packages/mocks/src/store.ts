// =============================================================================
// 목 전용 인메모리 상태 저장소 (단일 목 유저 가정 — 스켈레톤 단순화).
//
// 확정 상태 전이(Model B):
//   입금대기(AWAITING_DEPOSIT) → 접수(RECEIVED) → 완료(COMPLETED)
//   ; 취소요청(CANCEL_REQUESTED) → 취소(CANCELLED)
//   · 예약 생성          → AWAITING_DEPOSIT
//   · 고객 입금확인요청  → RECEIVED
//   · (관리자 입금확인   → COMPLETED  : 관리자 API, Slice 1 범위 밖)
//
// v0.4 취소 범위(CancellationScope):
//   · AWAITING_DEPOSIT·RECEIVED → FULL_ONLY(전체 취소만)
//   · COMPLETED                 → ITEM_SELECTABLE(항목 단위 부분취소 가능)
//   부분취소는 별도 BookingStatus 값을 두지 않고 partiallyCancelled 플래그로 표현한다.
// =============================================================================
import type { components } from "./types.gen";
import { products, depositAccountBase, daysRequired } from "./fixtures";

type S = components["schemas"];

const HOLD_TTL_MS = 10 * 60 * 1000; // TODO(협의 1): 홀드 TTL 미확정 — 잠정 10분
const FEE_RATE = 0; // TODO(협의 2): 취소 수수료 요율표 미확정 — 잠정 0%

// 부분취소 없이 전체 취소만 가능한 예약 상태(v0.4 CancellationScope 참고).
const FULL_ONLY_STATUSES: S["BookingStatus"][] = ["AWAITING_DEPOSIT", "RECEIVED"];
// 취소 요청 자체가 가능한 예약 상태.
const CANCELLABLE_STATUSES: S["BookingStatus"][] = ["AWAITING_DEPOSIT", "RECEIVED", "COMPLETED"];

export type StoreError = { status: number; code: string; message: string };
export type Result<T> = { ok: true; value: T } | { ok: false; error: StoreError };

let seq = 1;
const cart: S["CartItem"][] = [];
const bookings = new Map<string, S["Booking"]>();

// ── helpers ──────────────────────────────────────────────────────────────────
function unitPrice(productId: string, opt: S["RentalOptionType"]): number {
  const p = products.find((x) => x.productId === productId);
  return p?.options.find((o) => o.optionType === opt)?.price ?? 0;
}
function extraFee(productId: string, opt: S["RentalOptionType"], cross: boolean): number {
  if (opt !== "DAY_2" || !cross) return 0;
  const p = products.find((x) => x.productId === productId);
  return p?.options.find((o) => o.optionType === "DAY_2")?.crossRegionReturnExtraFee ?? 0;
}
function spanDates(start: string, opt: S["RentalOptionType"]): string[] {
  if (daysRequired(opt) === 1) return [start];
  const next = new Date(start);
  next.setDate(next.getDate() + 1);
  return [start, next.toISOString().slice(0, 10)];
}
function daysToUse(useDate: string): number {
  const today = new Date().toISOString().slice(0, 10);
  const ms = new Date(useDate).getTime() - new Date(today).getTime();
  return Math.max(0, Math.round(ms / (24 * 3600 * 1000)));
}
function activeItems(b: S["Booking"]): S["BookingItem"][] {
  return b.items.filter((i) => i.status === "ACTIVE");
}
function cancellationScope(b: S["Booking"]): S["CancellationScope"] {
  return FULL_ONLY_STATUSES.includes(b.status) ? "FULL_ONLY" : "ITEM_SELECTABLE";
}
// 예약·항목 변경 후 cancellable/cancellationScope/activeTotalAmount를 다시 맞춘다.
function syncDerived(b: S["Booking"]): void {
  b.activeTotalAmount = activeItems(b).reduce((s, i) => s + i.lineTotal, 0);
  b.cancellable = CANCELLABLE_STATUSES.includes(b.status) && activeItems(b).length > 0;
  b.cancellationScope = b.cancellable ? cancellationScope(b) : undefined;
}
// itemIds로 지정된 항목을 찾는다. 예약에 없는 id·이미 취소(요청)된 항목이면 에러.
function resolveTargetItems(
  b: S["Booking"],
  itemIds: string[] | undefined,
  notCancellableStatus: number,
): { items: S["BookingItem"][] } | { error: StoreError } {
  if (!itemIds?.length) return { items: activeItems(b) };
  const items: S["BookingItem"][] = [];
  for (const itemId of itemIds) {
    const item = b.items.find((i) => i.bookingItemId === itemId);
    if (!item) {
      return {
        error: { status: 400, code: "INVALID_BOOKING_ITEM", message: `예약에 속하지 않는 항목입니다: ${itemId}` },
      };
    }
    if (item.status !== "ACTIVE") {
      return {
        error: {
          status: notCancellableStatus,
          code: "ITEM_NOT_CANCELLABLE",
          message: `이미 취소되었거나 취소 요청 중인 항목입니다: ${itemId}`,
        },
      };
    }
    items.push(item);
  }
  return { items };
}

// ── cart / 임시 홀드 ─────────────────────────────────────────────────────────
export function getCart(): S["Cart"] {
  const totalAmount = cart.reduce((s, i) => s + (i.lineTotal ?? 0), 0);
  const earliest = cart.map((i) => i.holdExpiresAt).sort()[0];
  return { items: cart, totalAmount, earliestHoldExpiresAt: earliest };
}

export function addCartItem(dto: S["CartItemCreate"]): S["CartItem"] {
  const dates = spanDates(dto.startDate, dto.optionType);
  const unit = unitPrice(dto.productId, dto.optionType);
  const extra = extraFee(dto.productId, dto.optionType, !!dto.crossRegionReturn);
  const line = (unit + extra) * dto.quantity;
  const item: S["CartItem"] = {
    cartItemId: `ci-${seq++}`,
    productId: dto.productId,
    productName: products.find((p) => p.productId === dto.productId)?.name ?? "",
    optionType: dto.optionType,
    dates,
    quantity: dto.quantity,
    crossRegionReturn: !!dto.crossRegionReturn,
    unitPrice: unit,
    extraFee: extra,
    lineTotal: line,
    holdExpiresAt: new Date(Date.now() + HOLD_TTL_MS).toISOString(),
  };
  cart.push(item);
  return item;
}

export function removeCartItem(id: string): void {
  const i = cart.findIndex((c) => c.cartItemId === id);
  if (i >= 0) cart.splice(i, 1);
}

// ── bookings ─────────────────────────────────────────────────────────────────
export function createBooking(dto: S["BookingCreate"]): S["Booking"] | null {
  const chosen = dto.cartItemIds?.length
    ? cart.filter((c) => dto.cartItemIds!.includes(c.cartItemId))
    : [...cart];
  if (chosen.length === 0) return null;

  const now = new Date();
  const total = chosen.reduce((s, i) => s + (i.lineTotal ?? 0), 0);
  const id = `bk-${seq++}`;
  const booking: S["Booking"] = {
    bookingId: id,
    bookingNumber: `CG${now.getFullYear()}${String(seq).padStart(4, "0")}`,
    status: "AWAITING_DEPOSIT", // 생성 직후 = 입금대기
    items: chosen.map((c) => ({
      bookingItemId: c.cartItemId,
      productId: c.productId,
      productName: c.productName,
      optionType: c.optionType,
      dates: c.dates,
      quantity: c.quantity,
      crossRegionReturn: c.crossRegionReturn,
      lineTotal: c.lineTotal!,
      status: "ACTIVE",
    })),
    totalAmount: total,
    activeTotalAmount: total,
    passportName: dto.passportName ?? "",
    cancellable: true,
    depositInfo: {
      ...depositAccountBase,
      amount: total,
      dueBy: new Date(now.getTime() + 24 * 3600 * 1000).toISOString(), // 생성+24h
    },
    createdAt: now.toISOString(),
  };
  syncDerived(booking);
  bookings.set(id, booking);
  chosen.forEach((c) => removeCartItem(c.cartItemId)); // 확정 항목은 장바구니에서 제거
  return booking;
}

export function getBooking(id: string): S["Booking"] | null {
  return bookings.get(id) ?? null;
}

export function getDepositInfo(id: string): S["DepositInfo"] | null {
  return bookings.get(id)?.depositInfo ?? null;
}

export function requestDeposit(id: string): S["Booking"] | null {
  const b = bookings.get(id);
  if (!b || b.status !== "AWAITING_DEPOSIT") return null; // 입금대기에서만
  b.status = "RECEIVED"; // 입금대기 → 접수
  syncDerived(b);
  return b;
}

export function listBookings(status: string): S["BookingListPage"] {
  const all = [...bookings.values()];
  // 탭 매핑: 취소 = 취소요청+취소 / 그 외는 정확 일치 / ALL = 전체(입금대기 포함)
  const filtered =
    status === "ALL"
      ? all
      : status === "CANCELLED" || status === "CANCEL_REQUESTED"
        ? all.filter((b) => b.status === "CANCEL_REQUESTED" || b.status === "CANCELLED")
        : all.filter((b) => b.status === status);

  const content: S["BookingSummary"][] = filtered.map((b) => ({
    bookingId: b.bookingId,
    bookingNumber: b.bookingNumber,
    status: b.status,
    productName: b.items[0]?.productName ?? "",
    itemCount: b.items.length,
    useDates: b.items.flatMap((i) => i.dates),
    totalAmount: b.totalAmount,
    createdAt: b.createdAt,
  }));
  return { content, page: 0, size: 20, totalElements: content.length };
}

// ── cancellation (v0.4 항목 단위) ───────────────────────────────────────────
function toQuoteItem(i: S["BookingItem"]): S["CancellationQuoteItem"] {
  const useDate = i.dates[0] ?? "";
  const fee = Math.round(i.lineTotal * FEE_RATE);
  return {
    bookingItemId: i.bookingItemId,
    productName: i.productName,
    optionType: i.optionType,
    useDate,
    daysToUse: daysToUse(useDate),
    feeRate: FEE_RATE,
    lineAmount: i.lineTotal,
    cancellationFee: fee,
    refundAmount: i.lineTotal - fee,
  };
}

export function cancellationQuote(id: string, itemIds?: string[]): Result<S["CancellationQuote"]> {
  const b = bookings.get(id);
  if (!b) return { ok: false, error: { status: 404, code: "NOT_FOUND", message: "예약을 찾을 수 없습니다." } };

  const resolved = resolveTargetItems(b, itemIds, 400); // 견적 조회에서는 400 ITEM_NOT_CANCELLABLE
  if ("error" in resolved) return { ok: false, error: resolved.error };

  const active = activeItems(b);
  if (cancellationScope(b) === "FULL_ONLY" && resolved.items.length !== active.length) {
    return {
      ok: false,
      error: {
        status: 409,
        code: "PARTIAL_CANCEL_NOT_ALLOWED",
        message: "입금대기·접수 상태에서는 전체 취소 견적만 조회할 수 있습니다.",
      },
    };
  }

  const items = resolved.items.map(toQuoteItem);
  const selectedAmount = items.reduce((s, i) => s + i.lineAmount, 0);
  const cancellationFee = items.reduce((s, i) => s + i.cancellationFee, 0);
  return {
    ok: true,
    value: {
      bookingId: id,
      scope: resolved.items.length === active.length ? "FULL" : "PARTIAL",
      items,
      paidAmount: b.totalAmount,
      selectedAmount,
      cancellationFee,
      refundAmount: selectedAmount - cancellationFee,
    },
  };
}

export function cancelRequest(id: string, dto: S["CancelRequest"]): Result<S["Booking"]> {
  const b = bookings.get(id);
  if (!b) return { ok: false, error: { status: 404, code: "NOT_FOUND", message: "예약을 찾을 수 없습니다." } };
  if (!CANCELLABLE_STATUSES.includes(b.status)) {
    return { ok: false, error: { status: 409, code: "INVALID_STATE", message: "취소할 수 없는 상태입니다." } };
  }

  const resolved = resolveTargetItems(b, dto.itemIds, 409); // 취소 요청에서는 409 ITEM_NOT_CANCELLABLE
  if ("error" in resolved) return { ok: false, error: resolved.error };

  const active = activeItems(b);
  if (resolved.items.length === 0) {
    return { ok: false, error: { status: 409, code: "INVALID_STATE", message: "취소할 유효 항목이 없습니다." } };
  }
  if (cancellationScope(b) === "FULL_ONLY" && resolved.items.length !== active.length) {
    return {
      ok: false,
      error: {
        status: 409,
        code: "PARTIAL_CANCEL_NOT_ALLOWED",
        message: "입금대기·접수 상태에서는 전체 취소만 가능합니다.",
      },
    };
  }

  const targetIds = new Set(resolved.items.map((i) => i.bookingItemId));
  b.items.forEach((i) => {
    if (targetIds.has(i.bookingItemId)) i.status = "CANCEL_REQUESTED";
  });

  const fullyCancelled = activeItems(b).length === 0;
  if (fullyCancelled) {
    b.status = "CANCEL_REQUESTED"; // 전체 항목 취소 요청 → 예약 상태도 전이
    b.partiallyCancelled = false; // 더 이상 '일부'가 아니라 전체 취소이므로 뱃지 해제
  } else {
    b.partiallyCancelled = true; // 일부만 취소 요청 → 예약 상태는 유효 항목 기준 유지
  }
  syncDerived(b);
  return { ok: true, value: b };
}

// 관리자 입금확인(COMPLETED) 전이는 이 Core API 범위 밖이지만, v0.4 부분취소(ITEM_SELECTABLE)는
// COMPLETED 이후에만 열리므로 목에서 로컬 시나리오 테스트를 위해 열어둔 헬퍼.
export function __completeBooking(id: string): S["Booking"] | null {
  const b = bookings.get(id);
  if (!b || b.status !== "RECEIVED") return null;
  b.status = "COMPLETED";
  syncDerived(b);
  return b;
}

// 테스트 격리용 리셋
export function __reset(): void {
  seq = 1;
  cart.length = 0;
  bookings.clear();
}
