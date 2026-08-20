// =============================================================================
// 목 전용 인메모리 상태 저장소 (단일 목 유저 가정 — 스켈레톤 단순화).
//
// 확정 상태 전이(Model B):
//   입금대기(AWAITING_DEPOSIT) → 접수(RECEIVED) → 완료(COMPLETED)
//   ; 취소요청(CANCEL_REQUESTED) → 취소(CANCELLED)
//   · 예약 생성          → AWAITING_DEPOSIT
//   · 고객 입금확인요청  → RECEIVED
//   · (관리자 입금확인   → COMPLETED  : 관리자 API, Slice 1 범위 밖)
//   · 취소요청은 입금대기·접수에서만 진입
// =============================================================================
import type { components } from "./types.gen";
import { products, depositAccountBase, daysRequired } from "./fixtures";

type S = components["schemas"];

const HOLD_TTL_MS = 10 * 60 * 1000; // TODO(협의 1): 홀드 TTL 미확정 — 잠정 10분
const FEE_RATE = 0; // TODO(협의 2): 취소 수수료 요율표 미확정 — 잠정 0%

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
      productId: c.productId,
      productName: c.productName,
      optionType: c.optionType,
      dates: c.dates,
      quantity: c.quantity,
      crossRegionReturn: c.crossRegionReturn,
      lineTotal: c.lineTotal!,
    })),
    totalAmount: total,
    passportName: dto.passportName ?? "",
    cancellable: true,
    depositInfo: {
      ...depositAccountBase,
      amount: total,
      dueBy: new Date(now.getTime() + 24 * 3600 * 1000).toISOString(), // 생성+24h
    },
    createdAt: now.toISOString(),
  };
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
    useDates: b.items.flatMap((i) => i.dates),
    totalAmount: b.totalAmount,
    createdAt: b.createdAt,
  }));
  return { content, page: 0, size: 20, totalElements: content.length };
}

// ── cancellation ─────────────────────────────────────────────────────────────
export function cancellationQuote(id: string): S["CancellationQuote"] | null {
  const b = bookings.get(id);
  if (!b) return null;
  const fee = Math.round(b.totalAmount * FEE_RATE);
  return {
    paidAmount: b.totalAmount,
    cancellationFee: fee,
    feeRate: FEE_RATE,
    refundAmount: b.totalAmount - fee,
    basedOnUseDate: b.items[0]?.dates[0],
  };
}

export function cancelRequest(id: string, _dto: S["CancelRequest"]): S["Booking"] | null {
  const b = bookings.get(id);
  if (!b) return null;
  if (b.status !== "AWAITING_DEPOSIT" && b.status !== "RECEIVED") return null; // 입금대기·접수에서만
  b.status = "CANCEL_REQUESTED";
  b.cancellable = false;
  return b;
}

// 테스트 격리용 리셋
export function __reset(): void {
  seq = 1;
  cart.length = 0;
  bookings.clear();
}
