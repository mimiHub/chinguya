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
        error: {
          status: 400,
          code: "INVALID_BOOKING_ITEM",
          message: `예약에 속하지 않는 항목입니다: ${itemId}`,
        },
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
      bookingNumber: `CG${now.getFullYear()}${String(seq).padStart(4, "0")}`,
      status: "AWAITING_DEPOSIT",
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
  const b = bookings.get(id);
  // 상태는 입금 확인 요청으로 바뀌므로 예약에서 다시 읽는다.
  return b?.depositInfo
    ? { ...b.depositInfo, bookingNumber: b.bookingNumber, status: b.status }
    : null;
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

  // 최근 예약 먼저(계약: GET /bookings 는 최신순).
  const content: S["BookingSummary"][] = filtered
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((b) => ({
      bookingId: b.bookingId,
      bookingNumber: b.bookingNumber,
      status: b.status,
      productName: (activeItems(b)[0] ?? b.items[0])?.productName ?? "",
      itemCount: b.items.length,
      partiallyCancelled: b.partiallyCancelled ?? false,
      // 항목별 이용일의 합집합(오름차순)
      useDates: [...new Set(b.items.flatMap((i) => i.dates))].sort(),
      totalAmount: b.totalAmount,
      activeTotalAmount: b.activeTotalAmount,
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
  if (!b)
    return {
      ok: false,
      error: { status: 404, code: "NOT_FOUND", message: "예약을 찾을 수 없습니다." },
    };

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
  if (!b)
    return {
      ok: false,
      error: { status: 404, code: "NOT_FOUND", message: "예약을 찾을 수 없습니다." },
    };
  if (!CANCELLABLE_STATUSES.includes(b.status)) {
    return {
      ok: false,
      error: { status: 409, code: "INVALID_STATE", message: "취소할 수 없는 상태입니다." },
    };
  }

  const resolved = resolveTargetItems(b, dto.itemIds, 409); // 취소 요청에서는 409 ITEM_NOT_CANCELLABLE
  if ("error" in resolved) return { ok: false, error: resolved.error };

  const active = activeItems(b);
  if (resolved.items.length === 0) {
    return {
      ok: false,
      error: { status: 409, code: "INVALID_STATE", message: "취소할 유효 항목이 없습니다." },
    };
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

// ── 데모 시드 ────────────────────────────────────────────────────────────────
// 화면 확인용 임시 예약 3건(입금대기·접수·완료 각 1건). 목 환경(pnpm dev:mock)에서 "내 예약" 목록·예약 상세·
// 사용방법 버튼 등을 Core 없이 눈으로 볼 수 있게 처음부터 들어 있다. 이용일은 오늘 기준 며칠 뒤로 잡아 항상 미래다.
// __reset()은 시드까지 지운다(테스트 격리용).
function isoDay(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

function seedDemoBookings(): void {
  const now = Date.now();
  const year = new Date(now).getFullYear();
  const demo: {
    id: string;
    no: number;
    status: S["BookingStatus"];
    createdAgoDays: number;
    items: {
      productId: string;
      optionType: S["RentalOptionType"];
      startOffset: number;
      quantity: number;
      crossRegionReturn?: boolean;
    }[];
  }[] = [
    {
      id: "demo-bk-1",
      no: 9001,
      status: "AWAITING_DEPOSIT",
      createdAgoDays: 0,
      items: [{ productId: "bike-001", optionType: "DAY_1", startOffset: 7, quantity: 2 }],
    },
    {
      id: "demo-bk-2",
      no: 9002,
      status: "RECEIVED",
      createdAgoDays: 1,
      items: [
        { productId: "bike-002", optionType: "DAY_2", startOffset: 10, quantity: 1 },
        { productId: "bike-001", optionType: "HOURS_2", startOffset: 10, quantity: 1 },
      ],
    },
    {
      id: "demo-bk-3",
      no: 9003,
      status: "COMPLETED",
      createdAgoDays: 3,
      items: [
        {
          productId: "bike-001",
          optionType: "DAY_2",
          startOffset: 14,
          quantity: 1,
          crossRegionReturn: true,
        },
      ],
    },
  ];

  for (const d of demo) {
    const items: S["BookingItem"][] = d.items.map((it, i) => {
      const dates = spanDates(isoDay(it.startOffset), it.optionType);
      const product = products.find((p) => p.productId === it.productId);
      return {
        bookingItemId: `${d.id}-i${i + 1}`,
        productId: it.productId,
        productName: product?.name ?? "",
        optionType: it.optionType,
        dates,
        quantity: it.quantity,
        crossRegionReturn: !!it.crossRegionReturn,
        lineTotal:
          (unitPrice(it.productId, it.optionType) +
            extraFee(it.productId, it.optionType, !!it.crossRegionReturn)) *
          it.quantity,
        status: "ACTIVE",
      };
    });
    const total = items.reduce((sum, i) => sum + i.lineTotal, 0);
    const createdAt = new Date(now - d.createdAgoDays * 24 * 3600 * 1000).toISOString();
    const booking: S["Booking"] = {
      bookingId: d.id,
      bookingNumber: `CG${year}${d.no}`,
      status: d.status,
      items,
      totalAmount: total,
      activeTotalAmount: total,
      passportName: "GILDONG HONG",
      cancellable: true,
      depositInfo: {
        bookingNumber: `CG${year}${d.no}`,
        status: d.status,
        ...depositAccountBase,
        amount: total,
        dueBy: new Date(now + 24 * 3600 * 1000).toISOString(),
      },
      createdAt,
    };
    syncDerived(booking);
    bookings.set(d.id, booking);
  }
}

seedDemoBookings();

// ── S4-C4/C5 질문하기 ────────────────────────────────────────────────────────
// 단일 목 유저 가정이라 mine=true 인 글이 "내 글"이다. 남의 글은 목록에만 보이고 상세는 404.
type MockInquiry = S["InquiryDetail"] & { mine: boolean };
const inquiries: MockInquiry[] = [];
let inquirySeq = 100;

function seedDemoInquiries(): void {
  const now = Date.now();
  inquiries.push(
    {
      inquiryId: String(inquirySeq++),
      title: "대여 취소 시 환불은 언제 되나요?",
      content: "취소 신청을 했는데 환불은 언제쯤 받을 수 있나요?",
      status: "ANSWERED",
      answer: "확인 후 영업일 기준 3일 이내로 입금하신 계좌로 환불해 드려요.",
      answeredAt: new Date(now - 24 * 3600 * 1000).toISOString(),
      createdAt: new Date(now - 2 * 24 * 3600 * 1000).toISOString(),
      mine: false,
    },
    {
      inquiryId: String(inquirySeq++),
      title: "자전거 대여 시 헬멧도 포함인가요?",
      content: "자전거 대여할 때 헬멧도 같이 대여할 수 있나요?",
      status: "WAITING",
      answer: null,
      answeredAt: null,
      createdAt: new Date(now - 3600 * 1000).toISOString(),
      mine: true,
    },
  );
}

seedDemoInquiries();

export function listInquiries(): S["InquirySummary"][] {
  return [...inquiries]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map(({ inquiryId, title, status, mine, createdAt }) => ({ inquiryId, title, status, mine, createdAt }));
}

export function createInquiry(dto: S["InquiryCreateRequest"]): S["InquiryDetail"] {
  const detail: S["InquiryDetail"] = {
    inquiryId: String(inquirySeq++),
    title: dto.title.trim(),
    content: dto.content.trim(),
    status: "WAITING",
    answer: null,
    answeredAt: null,
    createdAt: new Date().toISOString(),
  };
  inquiries.push({ ...detail, mine: true });
  return detail;
}

export function getMyInquiry(inquiryId: string): S["InquiryDetail"] | undefined {
  const found = inquiries.find((q) => q.inquiryId === inquiryId && q.mine);
  if (!found) return undefined;
  const { mine: _mine, ...detail } = found;
  return detail;
}

export function deleteMyInquiry(inquiryId: string): boolean {
  const idx = inquiries.findIndex((q) => q.inquiryId === inquiryId && q.mine);
  if (idx < 0) return false;
  inquiries.splice(idx, 1);
  return true;
}

// 테스트 격리용 리셋
export function __reset(): void {
  seq = 1;
  cart.length = 0;
  bookings.clear();
  inquiries.length = 0;
}
