import type { Inventory } from "@chinguya/types";

/**
 * 날짜별 재고 세팅(S1-A3) 목업.
 * 실제로는 GET/PUT /api/admin/inventory?assetId=...&date=... 로 대체될 자리다.
 *
 * 재고는 "카테고리+대여기간" 조합(상품)이 아니라 자산(전기자전거/일반자전거/일반낚시대/릴낚시대)
 * 단위로 관리한다 — 재고 세팅 화면은 assetData.ts의 자산 목록을 그대로 쓴다.
 *
 * 비동기 데일리 로그(2026-09-03, "S1-A3 날짜별 재고 현황 기획 수정")에 따라 이 파일을 다시 만들었다.
 * 예전엔 날짜마다 총 보유·여행사 할당을 직접 입력해서 저장했는데, 지금은 다음 세 가지를
 * "조합"해서 그날의 총 보유를 계산한다(직접 입력하는 숫자가 아니라 계산 결과다):
 *
 * ① 기준 보유량 이력(baselineHistory) — "지금 우리가 가진 대수". 구매·처분처럼 영구적인
 *   변화라 "적용 시작일"을 갖는다(A3-M1). 날짜별 기준 보유량은 그 날짜 이전에 시작된 가장
 *   최근 이력값이다 — 과거 날짜는 그때 적용되던 값을 그대로 쓴다.
 * ② 재고 조정(adjustments) — 수리·임시 임차처럼 일시적인 증감이라 기간(시작일~종료일, 종료일은
 *   미정으로 열어둘 수 있음)과 요일 지정(반복)을 갖는다(A3-M2). 같은 날짜에 여러 조정이
 *   겹치면 전부 합산된다. 태그(예: "임차"/"수리")는 화면 표시·안내메일용 라벨일 뿐 코드값은 아니다.
 * ③ 매장 휴무(closedDates) — 자산별이 아니라 "전 자산 공통"으로 날짜만 막는다.
 *
 * 그날 총 보유 = 그 날짜의 기준 보유량 + 그 날짜에 걸리는 조정 delta 합계.
 * Slice 1은 여행사 할당이 없어 고객 가용 = 총 보유(관리자는 숫자를 하나만 다룬다) — Slice 2부터
 * 총 보유 − 여행사 할당 = 고객 가용으로 바뀔 자리라 Inventory 타입 자체는 그대로 두고 여기서
 * agencyAllocated를 0으로 고정한다.
 *
 * 예약(reservedCount)은 고객이 실제로 확정 예약한 수량 목업이고, 잔여 = 고객 가용 − 예약이다.
 * 조정을 저장할 때 그 결과로 예약 > 총 보유가 되는 날짜가 생기면(재고 초과) 저장 전에
 * 얼럿(A3-M3)으로 확인을 받는다 — previewOverCapacityDates가 이 계산을 담당한다.
 */

export interface BaselineEntry {
  value: number;
  /** 이 기준 보유량이 적용되기 시작하는 날짜(YYYY-MM-DD). 과거 날짜·이미 걸린 조정에는 영향 없음. */
  startDate: string;
  memo: string;
  createdAt: string;
}

/** assetId -> 기준 보유량 변경 이력(시작일 오름차순). */
const baselineHistory = new Map<string, BaselineEntry[]>([
  ["asset-bike-electric", [{ value: 8, startDate: "2000-01-01", memo: "초기값", createdAt: new Date(0).toISOString() }]],
  ["asset-bike-regular", [{ value: 10, startDate: "2000-01-01", memo: "초기값", createdAt: new Date(0).toISOString() }]],
  ["asset-fishing-regular", [{ value: 6, startDate: "2000-01-01", memo: "초기값", createdAt: new Date(0).toISOString() }]],
  ["asset-fishing-reel", [{ value: 4, startDate: "2000-01-01", memo: "초기값", createdAt: new Date(0).toISOString() }]],
]);

export interface InventoryAdjustment {
  id: string;
  assetId: string;
  /** "임차"/"수리"처럼 화면·안내메일 표시용 라벨. 별도 코드값이 아니라 자유 텍스트다. */
  tag: string;
  /** 증감량(+/-). */
  delta: number;
  /** 적용 시작일(YYYY-MM-DD). */
  startDate: string;
  /** 적용 종료일. null이면 "미정"(진행 중) — 나중에 복귀일이 정해지면 수정으로 채운다. */
  endDate: string | null;
  /** 특정 요일에만 반복 적용(예: 주말 임차 = [0, 6]). null/빈 배열이면 기간 내 모든 날짜. */
  weekdays: number[] | null;
  memo: string;
  createdAt: string;
}

const adjustments: InventoryAdjustment[] = [];
let nextAdjustmentId = 1;

/** 매장 휴무 날짜(전 자산 공통) — 날짜 문자열(YYYY-MM-DD)만 담는다. */
const closedDates = new Set<string>();

/** 자산·날짜별 고객 예약 확정 수량(목업). 잔여 = 고객 가용 − 이 값. */
const mockReservations = new Map<string, number>();

function toDateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function mapKey(assetId: string, dateKey: string): string {
  return `${assetId}__${dateKey}`;
}

function todayKey(): string {
  const d = new Date();
  return toDateKey(d.getFullYear(), d.getMonth() + 1, d.getDate());
}

function offsetDateKey(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return toDateKey(d.getFullYear(), d.getMonth() + 1, d.getDate());
}

/** 그 날짜에 적용되는 기준 보유량 — 그 날짜 이전(포함)에 시작된 이력 중 가장 최근 값. */
function getBaselineStockOn(assetId: string, dateKey: string): number {
  const history = baselineHistory.get(assetId) ?? [];
  let value = 0;
  for (const entry of history) {
    if (entry.startDate <= dateKey) value = entry.value;
    else break;
  }
  return value;
}

/** 지금(오늘) 기준 이 자산의 기준 보유량 — "이 자산의 기준 보유량: N개" 표시에 쓴다. */
export function getCurrentBaselineStock(assetId: string): number {
  return getBaselineStockOn(assetId, todayKey());
}

/**
 * 기준 보유량을 변경한다(A3-M1). 구매·처분 등 영구 변화용이라 "적용 시작일" 이후 날짜에만
 * 반영되고, 과거 날짜·이미 걸린 재고 조정은 건드리지 않는다(조정은 새 기준값 위에 그대로 합산).
 */
export function addBaselineChange(assetId: string, value: number, startDate: string, memo: string): void {
  const history = baselineHistory.get(assetId) ?? [];
  history.push({ value: Math.max(0, value), startDate, memo, createdAt: new Date().toISOString() });
  history.sort((a, b) => (a.startDate < b.startDate ? -1 : a.startDate > b.startDate ? 1 : 0));
  baselineHistory.set(assetId, history);
}

/** 이 자산 · 이 날짜에 걸리는 재고 조정들(기간 + 요일 지정을 반영). */
export function getAdjustmentsForDate(assetId: string, dateKey: string): InventoryAdjustment[] {
  return adjustments.filter((a) => {
    if (a.assetId !== assetId) return false;
    if (dateKey < a.startDate) return false;
    if (a.endDate && dateKey > a.endDate) return false;
    if (a.weekdays && a.weekdays.length > 0) {
      const weekday = new Date(`${dateKey}T00:00:00`).getDay();
      if (!a.weekdays.includes(weekday)) return false;
    }
    return true;
  });
}

/** 그 날짜의 총 보유 = 기준 보유량 + 그날 걸리는 조정 delta 합계(0 미만으로는 안 내려간다). */
function getTotalStockOn(assetId: string, dateKey: string): number {
  const baseline = getBaselineStockOn(assetId, dateKey);
  const delta = getAdjustmentsForDate(assetId, dateKey).reduce((sum, a) => sum + a.delta, 0);
  return Math.max(baseline + delta, 0);
}

function getReservedCountByKey(assetId: string, dateKey: string): number {
  return mockReservations.get(mapKey(assetId, dateKey)) ?? 0;
}

/** 특정 자산 · 특정 날짜의 고객 예약 확정 수량을 가져온다. 저장된 적 없으면 0. */
export function getReservedCount(assetId: string, year: number, month: number, day: number): number {
  return getReservedCountByKey(assetId, toDateKey(year, month, day));
}

/** 매장 휴무 여부(전 자산 공통). */
export function isStoreClosed(dateKey: string): boolean {
  return closedDates.has(dateKey);
}

/** 매장 휴무를 설정/해제한다(전 자산 공통 — 이 날짜는 모든 자산이 함께 쉰다). */
export function setStoreClosed(dateKey: string, closed: boolean): void {
  if (closed) closedDates.add(dateKey);
  else closedDates.delete(dateKey);
}

export interface DaySnapshot {
  dateKey: string;
  /** 그 날짜 기준으로 적용되던 기준 보유량(오늘 기준 최신값이 아니라 "그날" 기준 최신 이력값) —
   *  화면에 "기준 보유량"을 그 날짜와 함께 보여줄 때는 반드시 이 값을 써야 한다. 오늘 기준
   *  값(getCurrentBaselineStock)을 대신 쓰면, 그사이 기준 보유량이 바뀐 경우 총 보유(= baseline
   *  + 조정 delta)와 안 맞는 숫자가 화면에 나란히 보이게 된다. */
  baseline: number;
  totalStock: number;
  customerAvailable: number;
  closed: boolean;
  reserved: number;
  /** 고객 가용 − 예약. 마이너스면 재고 초과. */
  remaining: number;
}

/** 그 자산 · 그 날짜의 계산된 스냅샷(기준 보유량·총 보유/휴무/예약/잔여를 한 번에) — 캘린더·상세 패널이 이걸로 그린다. */
export function getDaySnapshot(assetId: string, year: number, month: number, day: number): DaySnapshot {
  const dateKey = toDateKey(year, month, day);
  const closed = isStoreClosed(dateKey);
  const baseline = getBaselineStockOn(assetId, dateKey);
  const totalStock = getTotalStockOn(assetId, dateKey);
  const reserved = getReservedCountByKey(assetId, dateKey);
  return { dateKey, baseline, totalStock, customerAvailable: totalStock, closed, reserved, remaining: totalStock - reserved };
}

/**
 * apps/admin/src/app/allocations/page.tsx(S2-A4, 날짜별 할당 세팅)가 여전히 이 반환 모양을
 * 참조한다 — Slice 1에서는 agencyAllocated가 항상 0이다(위 파일 상단 설명 참고).
 */
export function getInventoryRecord(assetId: string, year: number, month: number, day: number): Inventory & { closed: boolean } {
  const snapshot = getDaySnapshot(assetId, year, month, day);
  return {
    productId: assetId,
    date: snapshot.dateKey,
    totalStock: snapshot.totalStock,
    agencyAllocated: 0,
    customerAvailable: snapshot.customerAvailable,
    closed: snapshot.closed,
  };
}

export interface AddAdjustmentInput {
  assetId: string;
  tag: string;
  delta: number;
  startDate: string;
  endDate: string | null;
  weekdays: number[] | null;
  memo: string;
}

function iterateDateKeys(startDate: string, endDate: string | null, weekdays: number[] | null): string[] {
  const start = new Date(`${startDate}T00:00:00`);
  const cap = new Date(start);
  cap.setDate(cap.getDate() + 60); // 종료일 미정(무기한)이면 미리보기는 60일까지만 확인한다.
  const endBound = endDate ? new Date(`${endDate}T00:00:00`) : cap;
  const last = endBound < cap ? endBound : cap;
  const keys: string[] = [];
  for (let d = new Date(start); d <= last; d.setDate(d.getDate() + 1)) {
    if (weekdays && weekdays.length > 0 && !weekdays.includes(d.getDay())) continue;
    keys.push(toDateKey(d.getFullYear(), d.getMonth() + 1, d.getDate()));
  }
  return keys;
}

export interface OverCapacityDate {
  date: string;
  reserved: number;
  totalStockAfter: number;
}

/**
 * 이 조정을 실제로 적용하면 예약 > 총 보유가 되는 날짜를 전부 찾는다(재고 초과, A3-M3에서
 * 사용). excludeId를 주면 그 조정 자체는 계산에서 뺀 뒤 새 delta를 얹는다(수정 시 사용 —
 * 기존 조정의 효과를 이중으로 반영하지 않기 위함).
 */
export function previewOverCapacityDates(input: AddAdjustmentInput, excludeId?: string): OverCapacityDate[] {
  const keys = iterateDateKeys(input.startDate, input.endDate, input.weekdays);
  const result: OverCapacityDate[] = [];
  for (const dateKey of keys) {
    const baseline = getBaselineStockOn(input.assetId, dateKey);
    const otherDelta = getAdjustmentsForDate(input.assetId, dateKey)
      .filter((a) => a.id !== excludeId)
      .reduce((sum, a) => sum + a.delta, 0);
    const totalStockAfter = Math.max(baseline + otherDelta + input.delta, 0);
    const reserved = getReservedCountByKey(input.assetId, dateKey);
    if (reserved > totalStockAfter) {
      result.push({ date: dateKey, reserved, totalStockAfter });
    }
  }
  return result;
}

/** 재고 조정을 추가한다(A3-M2 "적용"). 재고 초과 여부는 저장 전에 previewOverCapacityDates로 먼저 확인한다. */
export function addAdjustment(input: AddAdjustmentInput): InventoryAdjustment {
  const record: InventoryAdjustment = { id: `adj-${nextAdjustmentId++}`, createdAt: new Date().toISOString(), ...input };
  adjustments.push(record);
  return record;
}

/** 기존 재고 조정을 수정한다(A3-M2 "수정"). */
export function updateAdjustment(id: string, patch: Omit<AddAdjustmentInput, "assetId">): void {
  const record = adjustments.find((a) => a.id === id);
  if (!record) return;
  Object.assign(record, patch);
}

/** 재고 조정을 해제한다(그 조정의 효과가 즉시 빠진다) — A3-M2 "해제". */
export function removeAdjustment(id: string): void {
  const index = adjustments.findIndex((a) => a.id === id);
  if (index !== -1) adjustments.splice(index, 1);
}

/**
 * 이 자산에 재고 세팅 이력(기준 보유량 변경 또는 재고 조정)이 하나라도 있는지 확인한다.
 * 자산 관리(S1-A2)에서 삭제할 때 완전삭제(0건)와 소프트삭제(1건 이상)를 가르는 기준이다.
 */
export function hasInventoryRecords(assetId: string): boolean {
  const history = baselineHistory.get(assetId) ?? [];
  if (history.length > 1) return true;
  return adjustments.some((a) => a.assetId === assetId);
}

/**
 * 재고 세팅 캘린더가 여유/임박/마감(0)/초과/매장 휴무 다섯 가지 색과 재고 조정 점을 전부
 * 보여줄 수 있도록, "오늘" 기준 상대 날짜로 전기자전거 데모 데이터를 심어둔다(고정 날짜로
 * 박아두면 실제로 그 달을 넘겨서 열었을 때 아무것도 안 보이게 된다).
 */
function seedInventoryCalendarDemo(): void {
  const assetId = "asset-bike-electric";
  // 기준 보유량 8 위에 조정을 얹어 여유/임박/마감/초과 네 가지 색을 전부 보여준다.
  const cases: Array<{ offset: number; delta: number; reserved: number; tag: string; memo: string }> = [
    { offset: 2, delta: -3, reserved: 1, tag: "정비", memo: "데모 · 여유" }, // 총 보유 5, 잔여 4/5
    { offset: 4, delta: -3, reserved: 4, tag: "정비", memo: "데모 · 임박" }, // 총 보유 5, 잔여 1/5
    { offset: 6, delta: -3, reserved: 5, tag: "정비", memo: "데모 · 마감" }, // 총 보유 5, 잔여 0/5
    { offset: 8, delta: -4, reserved: 5, tag: "정비", memo: "데모 · 초과" }, // 총 보유 4, 잔여 -1/4
  ];
  for (const c of cases) {
    const dateKey = offsetDateKey(c.offset);
    addAdjustment({ assetId, tag: c.tag, delta: c.delta, startDate: dateKey, endDate: dateKey, weekdays: null, memo: c.memo });
    mockReservations.set(mapKey(assetId, dateKey), c.reserved);
  }
  // 매장 휴무 데모(전 자산 공통).
  closedDates.add(offsetDateKey(10));

  // 같은 날짜에 재고 조정이 여러 건 겹치는 경우 데모 — 위 cases는 날짜마다 조정을 하나씩만
  // 얹어서 색상 구분(여유/임박/마감/초과)을 보여주는 데 집중했는데, 실제로는 태그가 다른 조정
  // 여러 건이 같은 날짜에 함께 걸릴 수 있고(A3-M2가 "겹치면 전부 합산"이라고 명시) 각각 따로
  // 수정·해제할 수 있어야 한다. 이 상태를 보여주는 날짜를 하나 더 심어둔다.
  const multiAdjustDateKey = offsetDateKey(12);
  addAdjustment({
    assetId,
    tag: "임차",
    delta: 3,
    startDate: multiAdjustDateKey,
    endDate: multiAdjustDateKey,
    weekdays: null,
    memo: "데모 · 주말 임차",
  });
  addAdjustment({
    assetId,
    tag: "수리",
    delta: -2,
    startDate: multiAdjustDateKey,
    endDate: multiAdjustDateKey,
    weekdays: null,
    memo: "데모 · 펑크 2대",
  });
  mockReservations.set(mapKey(assetId, multiAdjustDateKey), 3);

  // "일반자전거"는 재고 세팅 이력이 있는 자산의 데모 데이터 — 자산 관리(S1-A2)에서 삭제하면
  // 완전 삭제(CASE 1)가 아니라 소프트 삭제(CASE 2, "삭제됨"으로 남아 복원 가능)로 처리된다.
  addAdjustment({
    assetId: "asset-bike-regular",
    tag: "정비",
    delta: -1,
    startDate: "2027-07-07",
    endDate: "2027-07-07",
    weekdays: null,
    memo: "데모 · 재고 세팅 이력",
  });
}

seedInventoryCalendarDemo();
