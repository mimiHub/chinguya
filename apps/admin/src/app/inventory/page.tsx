"use client";

import { useEffect, useMemo, useState } from "react";
import { Title, Text, Chip, Badge, Kv, Card, Stack, Calendar, type CalendarDay, Toggle, Input, Button, Popup, LabeledBox, Dropdown, Toast, Alert, HelpTooltip } from "@chinguya/ui";
import {
  createApiClient,
  ApiError,
  type AdjustmentRequest,
  type AgencyAllocation,
  type InventoryAdjustment,
  type InventoryDaySnapshot,
  type InventoryDayDetail,
  type OverCapacityDate,
} from "@chinguya/api-client";
import type { Asset } from "@chinguya/types";
import { useAdminAuth } from "@/context/AdminAuthContext";

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

/** 재고 조정 "태그" 캡슐 선택기의 기본 후보. 팀에서 자주 쓰는 라벨을 미리 깔아둔다. */
const DEFAULT_TAG_OPTIONS = ["임차", "수리"];
const TAG_OPTIONS_STORAGE_KEY = "chinguya-admin-inventory-tag-options";

/**
 * 태그는 서버가 코드값을 두지 않는 자유 라벨이라(api-spec 참고), "자주 쓰는 태그" 목록은
 * 서버가 아니라 이 브라우저에 로컬로만 저장해서 다음에도 캡슐로 바로 고를 수 있게 한다 —
 * 팀원마다, 이 컴퓨터마다 따로 쌓인다. localStorage가 없거나(SSR) 값이 깨져 있으면 그냥
 * 기본값만 쓴다.
 */
function loadTagOptions(): string[] {
  if (typeof window === "undefined") return DEFAULT_TAG_OPTIONS;
  try {
    const raw = window.localStorage.getItem(TAG_OPTIONS_STORAGE_KEY);
    const saved = raw ? (JSON.parse(raw) as string[]) : [];
    const merged = [...DEFAULT_TAG_OPTIONS];
    for (const tag of saved) {
      if (tag && !merged.includes(tag)) merged.push(tag);
    }
    return merged;
  } catch {
    return DEFAULT_TAG_OPTIONS;
  }
}

const api = createApiClient();

/** 서버가 준 문구를 그대로 쓰되, 네트워크 오류처럼 본문이 없는 실패는 기본 문구로 대체한다. */
function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) return err.message;
  return fallback;
}

/**
 * S1-A3 날짜별 재고 세팅.
 * 자산(전기자전거/일반자전거/일반낚시대/릴낚시대)을 고른 뒤 캘린더에서 날짜를 하나 선택하면,
 * 그날의 재고 상세(기준 보유량·조정 내역·총 보유·여행사 할당·고객 가용·예약·잔여·매장 휴무)를
 * 확인·조정한다. 총 보유는 직접 입력하는 숫자가 아니라 "기준 보유량 + 그날 걸리는 보유 조정 합계"로,
 * 여행사 할당은 "여행사 기준 할당 + 그 여행사 할당 조정 합계"로 계산된다(구 S2-A4 할당 세팅을 흡수).
 * 고객 가용 = 총 보유 − 여행사 할당 합(0 미만 불가)이고, 여행사 예약 마감(이용일 D-3)이 지나면 안
 * 팔린 할당은 고객 가용으로 반환된다 — 계산은 전부 서버가 하고 이 화면은 결과만 그린다.
 *
 * Core API(GET/POST/PUT/DELETE /admin/inventory/**)에 실연동돼 있다 — 계약은
 * packages/api-spec/openapi/chinguya-admin-api.yaml. 자산 선택기는 자산 관리(S1-A2)와
 * 동일한 /admin/assets 목록을 그대로 쓴다.
 *
 * ⚠ "예약" 수치는 고객·여행사 예약 백엔드가 아직 없어 서버가 항상 0을 내려준다 — 그래서 재고
 * 조정 저장 시 "초과 경고"(A3-M3) 모달은 지금은 보유를 줄여 할당 합이 총 보유를 넘을 때(할당 초과)만 뜬다.
 *
 * 쓰기(기준 보유량·여행사 기준 할당 변경·재고 조정 추가/수정/해제·매장 휴무 토글)는 슈퍼어드민만 가능하다.
 * 아래 버튼 숨김은 서버 403과 정합을 맞추는 것일 뿐 보안 경계가 아니다(경계는 SecurityConfig).
 */
export default function AdminInventoryPage() {
  const { isSuperAdmin } = useAdminAuth();

  const [assets, setAssets] = useState<Asset[] | null>(null);
  const [assetsError, setAssetsError] = useState<string | null>(null);
  const [assetId, setAssetId] = useState("");

  useEffect(() => {
    let alive = true;
    api.assets
      .list()
      .then((list) => {
        if (!alive) return;
        setAssets(list);
        setAssetId((current) => current || list[0]?.assetId || "");
      })
      .catch((err) => {
        if (alive) setAssetsError(errorMessage(err, "자산 목록을 불러오지 못했습니다."));
      });
    return () => {
      alive = false;
    };
  }, []);

  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth() + 1);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // 기준 보유량 변경 / 재고 조정 추가·수정·해제 / 매장 휴무 토글이 반영된 뒤 달력·상세를
  // 다시 불러오기 위한 트리거.
  const [refreshTick, setRefreshTick] = useState(0);

  const [snapshot, setSnapshot] = useState<InventoryDaySnapshot[] | null>(null);
  const [snapshotError, setSnapshotError] = useState<string | null>(null);
  const [currentBaseline, setCurrentBaseline] = useState(0);
  // 삭제되지 않은 여행사 전부의 오늘 기준 기준 할당(없으면 0). 기준 카드는 value > 0만 보여 주고,
  // A3-M4·재고 조정의 여행사 선택지는 이 목록 전체를 쓴다.
  const [allocations, setAllocations] = useState<AgencyAllocation[]>([]);

  const [dayDetail, setDayDetail] = useState<InventoryDayDetail | null>(null);

  const [baselineOpen, setBaselineOpen] = useState(false);
  const [baselineInput, setBaselineInput] = useState(0);
  const [baselineStartDate, setBaselineStartDate] = useState("");
  const [baselineMemo, setBaselineMemo] = useState("");
  const [baselineError, setBaselineError] = useState("");
  const [baselineSubmitting, setBaselineSubmitting] = useState(false);

  const [allocationOpen, setAllocationOpen] = useState(false);
  const [allocationAgencyId, setAllocationAgencyId] = useState("");
  const [allocationInput, setAllocationInput] = useState(0);
  const [allocationStartDate, setAllocationStartDate] = useState("");
  const [allocationMemo, setAllocationMemo] = useState("");
  const [allocationError, setAllocationError] = useState("");
  const [allocationSubmitting, setAllocationSubmitting] = useState(false);

  const [adjustOpen, setAdjustOpen] = useState(false);
  const [editingAdjustmentId, setEditingAdjustmentId] = useState<string | null>(null);
  // 조정 대상 — "stock"이면 총 보유를, "agency"면 adjustAgencyId 여행사의 할당만 증감한다.
  const [adjustTarget, setAdjustTarget] = useState<"stock" | "agency">("stock");
  const [adjustAgencyId, setAdjustAgencyId] = useState("");
  const [adjustSign, setAdjustSign] = useState<"+" | "-">("+");
  const [adjustAmount, setAdjustAmount] = useState(1);
  const [adjustStartDate, setAdjustStartDate] = useState("");
  const [adjustEndDate, setAdjustEndDate] = useState("");
  const [adjustNoEndDate, setAdjustNoEndDate] = useState(false);
  const [adjustWeekdays, setAdjustWeekdays] = useState<number[]>([]);
  const [adjustTag, setAdjustTag] = useState("");
  const [tagOptions, setTagOptions] = useState<string[]>(DEFAULT_TAG_OPTIONS);
  const [addingTagOption, setAddingTagOption] = useState(false);
  const [newTagOptionInput, setNewTagOptionInput] = useState("");
  const [adjustMemo, setAdjustMemo] = useState("");
  const [adjustError, setAdjustError] = useState("");
  const [adjustSubmitting, setAdjustSubmitting] = useState(false);

  // 로컬에 저장해둔 태그 후보를 마운트 시 한 번만 읽어온다(useState 초기값에서 바로 읽으면
  // 서버 렌더 결과와 달라져 하이드레이션 경고가 날 수 있어 effect로 미룬다).
  useEffect(() => {
    setTagOptions(loadTagOptions());
  }, []);

  const addTagOption = (rawTag: string) => {
    const tag = rawTag.trim();
    if (!tag) return;
    setTagOptions((prev) => {
      if (prev.includes(tag)) return prev;
      const next = [...prev, tag];
      try {
        window.localStorage.setItem(TAG_OPTIONS_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // localStorage를 못 쓰는 환경이면 이번 세션 동안만 목록에 남고, 다음 방문엔 기본값으로 돌아간다.
      }
      return next;
    });
    setAdjustTag(tag);
    setAddingTagOption(false);
    setNewTagOptionInput("");
  };

  const [overCapacityOpen, setOverCapacityOpen] = useState(false);
  const [overCapacityDates, setOverCapacityDates] = useState<OverCapacityDate[]>([]);
  const [pendingAdjustInput, setPendingAdjustInput] = useState<AdjustmentRequest | null>(null);
  const [pendingEditId, setPendingEditId] = useState<string | null>(null);

  const selectedDateKey =
    selectedDay != null ? `${viewYear}-${String(viewMonth).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}` : null;

  useEffect(() => {
    if (!assetId) return;
    let alive = true;
    setSnapshotError(null);
    Promise.all([
      api.inventory.snapshot(assetId, viewYear, viewMonth),
      api.inventory.currentBaseline(assetId),
      api.inventory.currentAllocations(assetId),
    ])
      .then(([snapshotResult, baselineResult, allocationResult]) => {
        if (!alive) return;
        setSnapshot(snapshotResult);
        setCurrentBaseline(baselineResult.value);
        setAllocations(allocationResult);
      })
      .catch((err) => {
        if (alive) setSnapshotError(errorMessage(err, "재고 정보를 불러오지 못했습니다."));
      });
    return () => {
      alive = false;
    };
  }, [assetId, viewYear, viewMonth, refreshTick]);

  useEffect(() => {
    if (!assetId || !selectedDateKey) {
      setDayDetail(null);
      return;
    }
    let alive = true;
    api.inventory
      .day(assetId, selectedDateKey)
      .then((detail) => {
        if (alive) setDayDetail(detail);
      })
      .catch((err) => {
        if (alive) setToastMessage(errorMessage(err, "선택일 정보를 불러오지 못했습니다."));
      });
    return () => {
      alive = false;
    };
  }, [assetId, selectedDateKey, refreshTick]);

  const days: CalendarDay[] = useMemo(() => {
    if (!snapshot) return [];
    const firstWeekday = new Date(viewYear, viewMonth - 1, 1).getDay();
    const leading: CalendarDay[] = Array.from({ length: firstWeekday }, () => ({ date: "", status: "off" }));
    const body: CalendarDay[] = snapshot.map((day, i) => {
      const dayNumber = i + 1;
      if (day.closed) {
        return { date: dayNumber, status: "holiday", label: "휴무", hasAdjustment: day.hasAdjustment };
      }
      // 색상은 잔여 기준 — 마감(0)/초과(음수)는 값 그대로, 임박은 고객 가용 대비 30% 이하로 남은 날.
      const status: CalendarDay["status"] =
        day.remaining < 0
          ? "over"
          : day.remaining === 0
            ? "zero"
            : day.remaining <= day.customerAvailable * 0.3
              ? "low"
              : "ok";
      return { date: dayNumber, status, qty: day.customerAvailable, remaining: day.remaining, hasAdjustment: day.hasAdjustment };
    });
    return [...leading, ...body];
  }, [snapshot, viewYear, viewMonth]);

  const adjustmentsForSelectedDay = dayDetail?.adjustments ?? [];
  const stockAdjustments = adjustmentsForSelectedDay.filter((a) => a.agencyId === null);
  const agencyAdjustments = adjustmentsForSelectedDay.filter((a) => a.agencyId !== null);
  const allocatedAgencies = allocations.filter((a) => a.value > 0);
  const agencyOptions = allocations.map((a) => ({ value: a.agencyId, label: a.agencyName }));

  const handleSelectDay = (day: number) => {
    setSelectedDay(day);
  };

  const handleSelectAsset = (id: string) => {
    setAssetId(id);
    setSelectedDay(null);
  };

  const handleToggleClosed = async (value: boolean) => {
    if (!selectedDateKey) return;
    try {
      await api.inventory.setClosure(selectedDateKey, value);
      setRefreshTick((t) => t + 1);
      setToastMessage(value ? "매장 휴무로 저장되었습니다" : "매장 휴무가 해제되었습니다");
    } catch (err) {
      setToastMessage(errorMessage(err, "매장 휴무 설정을 저장하지 못했습니다."));
    }
  };

  const openBaseline = () => {
    setBaselineInput(currentBaseline);
    setBaselineStartDate(selectedDateKey ?? "");
    setBaselineMemo("");
    setBaselineError("");
    setBaselineOpen(true);
  };

  const handleSaveBaseline = async () => {
    if (!baselineStartDate) return;
    setBaselineSubmitting(true);
    try {
      await api.inventory.changeBaseline(assetId, baselineInput, baselineStartDate, baselineMemo.trim());
      setBaselineOpen(false);
      setRefreshTick((t) => t + 1);
      setToastMessage("기준 보유량이 저장되었습니다");
    } catch (err) {
      setBaselineError(errorMessage(err, "기준 보유량을 저장하지 못했습니다."));
    } finally {
      setBaselineSubmitting(false);
    }
  };

  const openAllocation = () => {
    const initial = allocatedAgencies[0] ?? allocations[0];
    if (!initial) return;
    setAllocationAgencyId(initial.agencyId);
    setAllocationInput(initial.value);
    setAllocationStartDate(selectedDateKey ?? "");
    setAllocationMemo("");
    setAllocationError("");
    setAllocationOpen(true);
  };

  const handleSelectAllocationAgency = (agencyId: string) => {
    setAllocationAgencyId(agencyId);
    setAllocationInput(allocations.find((a) => a.agencyId === agencyId)?.value ?? 0);
  };

  const handleSaveAllocation = async () => {
    if (!allocationAgencyId || !allocationStartDate) return;
    setAllocationSubmitting(true);
    try {
      const result = await api.inventory.changeAllocation(assetId, {
        agencyId: allocationAgencyId,
        value: allocationInput,
        startDate: allocationStartDate,
        memo: allocationMemo.trim(),
      });
      setAllocations(result);
      setAllocationOpen(false);
      setRefreshTick((t) => t + 1);
      setToastMessage("여행사 기준 할당이 저장되었습니다");
    } catch (err) {
      // 409(ALLOCATION_EXCEEDS_STOCK)는 서버 문구에 초과 날짜가 나열돼 있어 그대로 보여 준다.
      setAllocationError(errorMessage(err, "여행사 기준 할당을 저장하지 못했습니다."));
    } finally {
      setAllocationSubmitting(false);
    }
  };

  const openAddAdjustment = () => {
    if (!selectedDateKey) return;
    setEditingAdjustmentId(null);
    setAdjustTarget("stock");
    setAdjustAgencyId(allocations[0]?.agencyId ?? "");
    setAdjustSign("+");
    setAdjustAmount(1);
    setAdjustStartDate(selectedDateKey);
    setAdjustEndDate(selectedDateKey);
    setAdjustNoEndDate(false);
    setAdjustWeekdays([]);
    setAdjustTag("");
    setAddingTagOption(false);
    setNewTagOptionInput("");
    setAdjustMemo("");
    setAdjustError("");
    setAdjustOpen(true);
  };

  const openEditAdjustment = (id: string) => {
    const record = adjustmentsForSelectedDay.find((a) => a.id === id);
    if (!record) return;
    setEditingAdjustmentId(id);
    setAdjustTarget(record.agencyId === null ? "stock" : "agency");
    setAdjustAgencyId(record.agencyId ?? allocations[0]?.agencyId ?? "");
    setAdjustSign(record.delta < 0 ? "-" : "+");
    setAdjustAmount(Math.abs(record.delta));
    setAdjustStartDate(record.startDate);
    setAdjustEndDate(record.endDate ?? "");
    setAdjustNoEndDate(record.endDate === null);
    setAdjustWeekdays(record.weekdays ?? []);
    // 예전에 자유 입력으로 직접 쳐 넣은 태그라 캡슐 후보에 없을 수도 있다 — 그런 경우에도
    // 수정 화면을 열면 바로 캡슐로 보이고 선택된 상태여야 하므로 후보 목록에 끼워 넣는다.
    if (record.tag) addTagOption(record.tag);
    setAdjustTag(record.tag);
    setAddingTagOption(false);
    setNewTagOptionInput("");
    setAdjustMemo(record.memo);
    setAdjustError("");
    setAdjustOpen(true);
  };

  const handleRemoveAdjustment = async (id: string) => {
    try {
      await api.inventory.removeAdjustment(id);
      setRefreshTick((t) => t + 1);
      setToastMessage("재고 조정이 해제되었습니다");
    } catch (err) {
      setToastMessage(errorMessage(err, "재고 조정을 해제하지 못했습니다."));
    }
  };

  const toggleAdjustWeekday = (weekday: number) => {
    setAdjustWeekdays((prev) => (prev.includes(weekday) ? prev.filter((w) => w !== weekday) : [...prev, weekday]));
  };

  /**
   * 요일 지정(예: 토·일)을 걸어놨는데 기간 자체가 그 요일을 하루도 못 채우면(대표적으로 팝업이
   * 기본으로 채워주는 "시작일=종료일=선택한 날짜" 그대로 두고 요일만 좁힌 경우), 조정은 저장은
   * 되지만 어느 날짜에도 실제로 적용되지 않는 유령 레코드가 된다 — 화면 어디서도 다시 보이지
   * 않고 지울 수도 없다(날짜별 상세는 그날 적용되는 조정만 내려주기 때문). 그래서 저장 전에
   * 기간·요일 조합이 실제로 최소 하루는 걸리는지 미리 검증한다. 7일 이상 기간이면 모든 요일이
   * 한 번씩은 들어가므로 바로 통과시킨다.
   */
  const weekdayMatchesRange = (startDate: string, endDate: string | null, weekdays: number[]): boolean => {
    if (weekdays.length === 0 || endDate === null) return true;
    const start = new Date(`${startDate}T00:00:00`);
    const end = new Date(`${endDate}T00:00:00`);
    const spanDays = Math.round((end.getTime() - start.getTime()) / 86400000);
    if (spanDays < 0) return true; // 다른 검증(기간 역전 등)에 맡긴다.
    if (spanDays >= 6) return true;
    const weekdaySet = new Set(weekdays);
    for (let i = 0; i <= spanDays; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      if (weekdaySet.has(d.getDay())) return true;
    }
    return false;
  };

  const buildAdjustInput = (): AdjustmentRequest | null => {
    if (!adjustStartDate || adjustAmount === 0) return null;
    if (adjustTarget === "agency" && !adjustAgencyId) return null;
    return {
      agencyId: adjustTarget === "agency" ? adjustAgencyId : null,
      tag: adjustTag.trim(),
      delta: adjustSign === "-" ? -adjustAmount : adjustAmount,
      startDate: adjustStartDate,
      endDate: adjustNoEndDate ? null : adjustEndDate || adjustStartDate,
      weekdays: adjustWeekdays.length > 0 ? adjustWeekdays : null,
      memo: adjustMemo.trim(),
    };
  };

  const commitAdjust = async (input: AdjustmentRequest, editId: string | null) => {
    if (editId) {
      await api.inventory.updateAdjustment(editId, input);
    } else {
      await api.inventory.addAdjustment(assetId, input);
    }
    setAdjustOpen(false);
    setRefreshTick((t) => t + 1);
    setToastMessage(editId ? "재고 조정이 수정되었습니다" : "재고 조정이 추가되었습니다");
  };

  const handleSubmitAdjust = async () => {
    const input = buildAdjustInput();
    if (!input) return;
    if (input.weekdays && !weekdayMatchesRange(input.startDate, input.endDate, input.weekdays)) {
      setAdjustError("선택한 요일이 기간 안에 하루도 없어서 저장해도 어느 날짜에도 적용되지 않습니다. 기간을 넓히거나 요일 선택을 다시 확인해주세요.");
      return;
    }
    setAdjustSubmitting(true);
    try {
      const overCapacity = editingAdjustmentId
        ? await api.inventory.previewEdit(editingAdjustmentId, input)
        : await api.inventory.previewAdd(assetId, input);
      // 할당 조정이 할당 합 > 총 보유를 만들면 서버가 저장을 409로 막는다 — 미리 막고 날짜를 보여 준다.
      // (보유 조정이 만든 할당 초과는 아래 A3-M3 경고 후 저장 허용.)
      const allocationOver = overCapacity.filter((d) => d.allocated > d.totalStockAfter);
      if (input.agencyId && allocationOver.length > 0) {
        setAdjustError(
          `여행사 할당 합이 총 보유를 넘는 날짜가 있어 저장할 수 없습니다: ${allocationOver
            .map((d) => `${d.date}(할당 ${d.allocated} / 총 보유 ${d.totalStockAfter})`)
            .join(", ")}`,
        );
        return;
      }
      if (overCapacity.length > 0) {
        setOverCapacityDates(overCapacity);
        setPendingAdjustInput(input);
        setPendingEditId(editingAdjustmentId);
        setAdjustOpen(false);
        setOverCapacityOpen(true);
        return;
      }
      await commitAdjust(input, editingAdjustmentId);
    } catch (err) {
      setAdjustError(errorMessage(err, "재고 조정을 저장하지 못했습니다."));
    } finally {
      setAdjustSubmitting(false);
    }
  };

  const handleConfirmOverCapacity = async () => {
    if (!pendingAdjustInput) return;
    try {
      await commitAdjust(pendingAdjustInput, pendingEditId);
    } catch (err) {
      setToastMessage(errorMessage(err, "재고 조정을 저장하지 못했습니다."));
    } finally {
      setOverCapacityOpen(false);
      setPendingAdjustInput(null);
      setPendingEditId(null);
    }
  };

  // 조정 한 줄 — 보유 조정은 태그(임차·수리 등), 할당 조정은 태그 자리에 대상 여행사를 표시한다.
  // 카드(bg-surface) 안에서 테두리 없이 한 단계 어두운 배경(bg-bg)으로만 구분한다.
  const renderAdjustment = (adj: InventoryAdjustment) => (
    <Stack key={adj.id} direction="column" gap="xs" className="rounded-md bg-bg p-2">
      <Stack justify="between" align="center">
        {/* LabeledBox의 emphasis 라벨(강조색 점 + 굵고 큰 글씨)과 같은 스타일 — 이
            카드 안에서 "이날 조정"이 아래 메모/기간 줄과 확실히 구분되는 부제목이
            되도록 점을 붙였다. */}
        <Text weight="bold" as="span" className="inline-flex items-center gap-1.5">
          <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary-500" />
          이날 조정 {adj.agencyName ? <Badge>{adj.agencyName}</Badge> : adj.tag && <Badge>{adj.tag}</Badge>}
        </Text>
        <Text weight="bold" as="span" tone={adj.delta < 0 ? "error" : "success"}>
          {adj.delta > 0 ? `+${adj.delta}` : adj.delta}
        </Text>
      </Stack>
      <Stack justify="between" align="center">
        <Text variant="sub" as="span">
          {adj.memo || "메모 없음"} · {adj.startDate}~{adj.endDate ?? "미정"}
        </Text>
        {isSuperAdmin && (
          <Stack gap="xs">
            <button type="button" className="text-xs text-muted underline" onClick={() => openEditAdjustment(adj.id)}>
              수정
            </button>
            <button type="button" className="text-xs text-muted underline" onClick={() => handleRemoveAdjustment(adj.id)}>
              해제
            </button>
          </Stack>
        )}
      </Stack>
    </Stack>
  );

  return (
    <main className="mx-auto max-w-2xl p-6">
      <Stack direction="column" gap="sm">
        <Title size="md">날짜별 재고 세팅</Title>
      </Stack>

      {assetsError && (
        <Alert status="error" className="mt-4">
          {assetsError}
        </Alert>
      )}
      {snapshotError && (
        <Alert status="error" className="mt-4">
          {snapshotError}
        </Alert>
      )}

      <Stack direction="column" gap="md" className="mt-4">
        <Text weight="bold" leaf>자산 선택</Text>
        {assets === null && !assetsError && <Text variant="sub">불러오는 중…</Text>}
        {assets !== null && assets.length === 0 && (
          <Text variant="sub">등록된 자산이 없습니다. 자산 관리에서 먼저 등록해 주세요.</Text>
        )}
        <Chip.List scrollArrows>
          {(assets ?? []).map((asset) => (
            <Chip key={asset.assetId} on={asset.assetId === assetId} onClick={() => handleSelectAsset(asset.assetId)}>
              {asset.name}
            </Chip>
          ))}
        </Chip.List>

        {assetId && (
          <>
            <Stack justify="between" align="center">
              <Text variant="sub" as="span">
                기준 보유량 {currentBaseline}대
              </Text>
              {isSuperAdmin && (
                <Button variant="outline" size="sm" onClick={openBaseline}>
                  변경
                </Button>
              )}
            </Stack>

            {/* 여행사가 하나도 없으면 할당 줄 자체를 숨긴다(고객 가용 = 총 보유). */}
            {allocations.length > 0 && (
              <Stack justify="between" align="center">
                <Text variant="sub" as="span">
                  여행사 기준 할당{" "}
                  {allocatedAgencies.length > 0
                    ? allocatedAgencies.map((a) => `${a.agencyName} ${a.value}`).join(" · ")
                    : "없음"}
                </Text>
                {isSuperAdmin && (
                  <Button variant="outline" size="sm" onClick={openAllocation}>
                    변경
                  </Button>
                )}
              </Stack>
            )}

            <Card>
              <Calendar
                year={viewYear}
                month={viewMonth}
                days={days}
                legend="inventory"
                mode="single"
                selected={selectedDay ?? undefined}
                onSelect={handleSelectDay}
                onPrevMonth={() => {
                  setSelectedDay(null);
                  if (viewMonth === 1) {
                    setViewYear((y) => y - 1);
                    setViewMonth(12);
                  } else {
                    setViewMonth((m) => m - 1);
                  }
                }}
                onNextMonth={() => {
                  setSelectedDay(null);
                  if (viewMonth === 12) {
                    setViewYear((y) => y + 1);
                    setViewMonth(1);
                  } else {
                    setViewMonth((m) => m + 1);
                  }
                }}
              />
            </Card>

            {selectedDay && dayDetail ? (
              <Stack direction="column" gap="md">
                <Text weight="bold">
                  {viewMonth}월 {selectedDay}일 (선택)
                </Text>

                {/* 재고 상세를 흐름별 카드 3장으로 나눈다 — ① 보유(기준 보유량·조정·총 보유) ② 여행사 할당
                    ③ 고객 가용(가용·예약·잔여). 매장 휴무·조정 추가 버튼은 카드 밖에 둔다. */}
                <Card padding="sm">
                  <Stack direction="column" gap="sm">
                    <Kv items={[{ key: "기준 보유량", value: `${dayDetail.baseline}개` }]} hideLastBorder={false} />

                    {stockAdjustments.map(renderAdjustment)}

                    <Kv items={[{ key: "그날 총 보유", value: `${dayDetail.totalStock}개` }]} />
                  </Stack>
                </Card>

                {(dayDetail.allocations.length > 0 || agencyAdjustments.length > 0) && (
                  <Card padding="sm">
                    <Stack direction="column" gap="sm">
                      <Kv
                        items={[
                          {
                            key: (
                              <>
                                여행사 할당 {dayDetail.allocationReleased && <Badge>D-3 반환</Badge>}
                              </>
                            ),
                            value: `${dayDetail.allocated}개`,
                          },
                        ]}
                        hideLastBorder={false}
                      />
                      {dayDetail.allocations.map((line) => (
                        <Stack key={line.agencyId} justify="between" align="center" className="pl-3">
                          <Text variant="sub" as="span">
                            {line.agencyName} · 기준 {line.baseline}
                          </Text>
                          <Text as="span">{line.allocated}개</Text>
                        </Stack>
                      ))}
                      {agencyAdjustments.map(renderAdjustment)}
                      {dayDetail.allocationReleased && (
                        <Text variant="sub">
                          여행사 예약 마감(이용일 D-3)이 지나 안 팔린 할당은 고객 가용으로 반환됐습니다.
                        </Text>
                      )}
                    </Stack>
                  </Card>
                )}

                <Card padding="sm">
                  <Kv
                    items={[
                      {
                        key: (
                          <>
                            고객 가용 <Badge>총 보유 − 할당</Badge>
                          </>
                        ),
                        value: `${dayDetail.customerAvailable}개`,
                      },
                      { key: "예약", value: `${dayDetail.reserved}개` },
                      { key: "잔여", value: `${dayDetail.remaining}개` },
                    ]}
                  />
                </Card>

                <Toggle
                  on={dayDetail.closed}
                  onChange={handleToggleClosed}
                  disabled={!isSuperAdmin}
                  className="w-full justify-between"
                  label={
                    <Text variant="sub" as="span" className="inline-flex items-center gap-1.5">
                      매장 휴무 <Badge>전 자산 공통</Badge>
                    </Text>
                  }
                />

                {isSuperAdmin && (
                  <Button variant="outline" fullWidth onClick={openAddAdjustment}>
                    재고 조정 추가
                  </Button>
                )}
              </Stack>
            ) : (
              <Text variant="sub">날짜를 선택하면 재고 상세를 확인·조정할 수 있습니다.</Text>
            )}
          </>
        )}
      </Stack>

      <Popup open={baselineOpen} onClose={() => setBaselineOpen(false)} title="기준 보유량 변경">
        <Stack direction="column" gap="md">
          {/* align="start"로 두 칸 다 라벨 줄부터 맞춘다 — 화살표는 그 라벨 줄(emphasis 라벨
              한 줄 24px + gap-2 8px) 아래 입력창(h-10 40px) 정중앙에 오도록 고정 오프셋(mt-10)을
              준다. */}
          <Stack justify="between" align="start">
            <LabeledBox label="기준 보유량" required emphasis>
              <Input type="number" value={currentBaseline} disabled />
            </LabeledBox>
            <Text className="mt-10">→</Text>
            <LabeledBox label="변경 후" required emphasis>
              <Input type="number" min={0} value={baselineInput} onChange={(e) => setBaselineInput(Number(e.target.value))} />
            </LabeledBox>
          </Stack>
          <LabeledBox label="적용 시작일" required emphasis>
            <Input type="date" value={baselineStartDate} onChange={(e) => setBaselineStartDate(e.target.value)} />
          </LabeledBox>
          <LabeledBox label="메모" emphasis error={baselineError}>
            <Input
              value={baselineMemo}
              onChange={(e) => setBaselineMemo(e.target.value)}
              placeholder="예) 전기자전거 2대 추가 구매"
            />
          </LabeledBox>
          <Stack gap="sm">
            <Button variant="outline" fullWidth onClick={() => setBaselineOpen(false)}>
              취소
            </Button>
            <Button fullWidth disabled={!baselineStartDate || baselineSubmitting} onClick={handleSaveBaseline}>
              저장
            </Button>
          </Stack>
        </Stack>
      </Popup>

      <Popup open={allocationOpen} onClose={() => setAllocationOpen(false)} title="여행사 기준 할당 변경">
        <Stack direction="column" gap="md">
          <LabeledBox label="여행사" required emphasis>
            <Dropdown options={agencyOptions} value={allocationAgencyId} onChange={handleSelectAllocationAgency} />
          </LabeledBox>
          {/* 기준 보유량 변경 모달과 같은 배치 — 화살표 오프셋(mt-10)도 그쪽 주석 참고. */}
          <Stack justify="between" align="start">
            <LabeledBox label="기준 할당" required emphasis>
              <Input
                type="number"
                value={allocations.find((a) => a.agencyId === allocationAgencyId)?.value ?? 0}
                disabled
              />
            </LabeledBox>
            <Text className="mt-10">→</Text>
            <LabeledBox label="변경 후" required emphasis>
              <Input type="number" min={0} value={allocationInput} onChange={(e) => setAllocationInput(Number(e.target.value))} />
            </LabeledBox>
          </Stack>
          <LabeledBox label="적용 시작일" required emphasis>
            <Input type="date" value={allocationStartDate} onChange={(e) => setAllocationStartDate(e.target.value)} />
          </LabeledBox>
          <LabeledBox label="메모" emphasis error={allocationError}>
            <Input value={allocationMemo} onChange={(e) => setAllocationMemo(e.target.value)} placeholder="예) 8월 성수기 계약" />
          </LabeledBox>
          <Text variant="sub">0으로 두면 그날부터 할당이 해제됩니다. 할당 합이 총 보유를 넘는 날이 생기면 저장되지 않습니다.</Text>
          <Stack gap="sm">
            <Button variant="outline" fullWidth onClick={() => setAllocationOpen(false)}>
              취소
            </Button>
            <Button
              fullWidth
              disabled={!allocationAgencyId || !allocationStartDate || allocationSubmitting}
              onClick={handleSaveAllocation}
            >
              저장
            </Button>
          </Stack>
        </Stack>
      </Popup>

      <Popup open={adjustOpen} onClose={() => setAdjustOpen(false)} title="재고 조정">
        <Stack direction="column" gap="md">
          {/* 여행사가 없으면 대상은 보유량뿐이라 필드 자체를 숨긴다. */}
          {allocations.length > 0 && (
            <LabeledBox label="대상" required emphasis>
              <div className="grid grid-cols-2 gap-2">
                <Dropdown
                  options={[
                    { value: "stock", label: "보유량" },
                    { value: "agency", label: "여행사 할당" },
                  ]}
                  value={adjustTarget}
                  onChange={(v) => setAdjustTarget(v)}
                />
                <Dropdown
                  options={agencyOptions}
                  value={adjustTarget === "agency" ? adjustAgencyId : null}
                  onChange={setAdjustAgencyId}
                  placeholder="여행사"
                  disabled={adjustTarget !== "agency"}
                />
              </div>
            </LabeledBox>
          )}
          <LabeledBox label="증감" required emphasis>
            <div className="grid grid-cols-2 gap-2">
              <Dropdown
                options={[
                  { value: "+", label: "+" },
                  { value: "-", label: "-" },
                ]}
                value={adjustSign}
                onChange={(v) => setAdjustSign(v)}
              />
              <Input
                type="number"
                className="min-w-0"
                min={0}
                value={adjustAmount}
                onChange={(e) => setAdjustAmount(Math.abs(Number(e.target.value)))}
              />
            </div>
          </LabeledBox>
          <LabeledBox
            label={
              <>
                기간
                <HelpTooltip>
                  아래 요일 지정과 같이 쓸 때는, 반복하려는 요일이 실제로 포함되도록 기간을
                  넉넉히 잡으세요(예: 여름 내내 매주 토·일이면 6/1~8/31). 하루짜리 조정이면
                  시작일=종료일로 두고 요일 지정은 비워두세요.
                </HelpTooltip>
              </>
            }
            required
            emphasis
          >
            <div className="grid grid-cols-2 gap-2">
              <Input type="date" className="min-w-0" value={adjustStartDate} onChange={(e) => setAdjustStartDate(e.target.value)} />
              <Input
                type="date"
                className="min-w-0"
                value={adjustEndDate}
                disabled={adjustNoEndDate}
                onChange={(e) => setAdjustEndDate(e.target.value)}
              />
            </div>
            <label className="mt-1 flex items-center gap-1.5 text-xs text-muted">
              <input
                type="checkbox"
                checked={adjustNoEndDate}
                onChange={(e) => setAdjustNoEndDate(e.target.checked)}
              />
              종료일 미정(복귀 시 종료 처리)
            </label>
          </LabeledBox>
          <LabeledBox
            label={
              <>
                요일 지정 (선택)
                <HelpTooltip>
                  선택한 요일에만, 위 기간 안에서 매주 반복 적용됩니다 — 날짜를 하나하나 고를
                  필요 없어요. 예: 기간을 몇 달로 넓게 잡고 토·일만 켜면 그 기간의 매주 토·일에
                  자동 반복. 아무 요일도 선택하지 않으면 기간 내 모든 날짜에 적용됩니다.
                </HelpTooltip>
              </>
            }
            emphasis
          >
            <Stack gap="xs" wrap>
              {WEEKDAY_LABELS.map((label, weekday) => (
                <button
                  key={weekday}
                  type="button"
                  onClick={() => toggleAdjustWeekday(weekday)}
                  className={[
                    "h-8 w-8 rounded-full border text-xs",
                    adjustWeekdays.includes(weekday)
                      ? "border-primary-500 bg-primary-500 text-white"
                      : "border-line bg-surface text-muted",
                  ].join(" ")}
                >
                  {label}
                </button>
              ))}
            </Stack>
          </LabeledBox>

          {/* 조정 줄 카드 상단에 배지로 뜨는 자유 라벨(예 "임차"/"수리") — 서버는 코드값 없이
              자유 문자열로만 받는다(api-spec InventoryAdjustment.tag 설명 참고). 그래도 매번
              새로 타이핑하기 번거로우니, 자산 선택기와 같은 캡슐(Chip) 방식으로 지금까지 쓴
              태그를 바로 골라 쓰고 + 로 새 캡슐을 늘릴 수 있게 한다. 이 후보 목록 자체는
              서버에 없는 값이라 이 브라우저에만 저장한다(loadTagOptions/addTagOption 참고). */}
          <LabeledBox label="태그 (선택)" emphasis helper="조정 줄 위에 배지로 표시됩니다. + 를 눌러 새 태그를 추가하세요.">
            <Chip.List scrollArrows>
              {tagOptions.map((tag) => (
                <Chip
                  key={tag}
                  on={adjustTag === tag}
                  onClick={() => setAdjustTag((prev) => (prev === tag ? "" : tag))}
                >
                  {tag}
                </Chip>
              ))}
              {addingTagOption ? (
                <Input
                  autoFocus
                  fullWidth={false}
                  size="sm"
                  className="w-24"
                  value={newTagOptionInput}
                  onChange={(e) => setNewTagOptionInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTagOption(newTagOptionInput);
                    } else if (e.key === "Escape") {
                      setAddingTagOption(false);
                      setNewTagOptionInput("");
                    }
                  }}
                  onBlur={() => {
                    if (newTagOptionInput.trim()) addTagOption(newTagOptionInput);
                    else setAddingTagOption(false);
                  }}
                  placeholder="새 태그"
                  maxLength={60}
                />
              ) : (
                <Chip onClick={() => setAddingTagOption(true)} aria-label="태그 추가">
                  +
                </Chip>
              )}
            </Chip.List>
          </LabeledBox>

          <LabeledBox label="메모" emphasis error={adjustError}>
            <Input as="textarea" rows={2} value={adjustMemo} onChange={(e) => setAdjustMemo(e.target.value)} placeholder="예) 펑크 2대" />
          </LabeledBox>

          <Stack gap="sm">
            <Button variant="outline" fullWidth onClick={() => setAdjustOpen(false)}>
              취소
            </Button>
            <Button fullWidth disabled={adjustSubmitting} onClick={handleSubmitAdjust}>
              적용
            </Button>
          </Stack>
        </Stack>
      </Popup>

      <Popup open={overCapacityOpen} onClose={() => setOverCapacityOpen(false)} title="재고 초과 경고">
        <Stack direction="column" gap="md">
          <Text variant="sub">{overCapacityDates.length}개 날짜에서 재고 초과가 생깁니다:</Text>
          <Stack direction="column" gap="xs">
            {overCapacityDates.map((d) => (
              <Text key={d.date} variant="sub">
                {d.allocated > d.totalStockAfter
                  ? `${d.date}(할당 ${d.allocated} / 총 보유 ${d.totalStockAfter})`
                  : `${d.date}(예약 ${d.reserved} / 고객 가용 ${Math.max(d.totalStockAfter - d.allocated, 0)})`}
              </Text>
            ))}
          </Stack>
          <Text variant="sub">
            실제 파손·수리는 사실이므로 저장은 허용합니다. 할당 초과 날은 고객 가용이 0으로 막히고, 어느 여행사
            할당을 줄일지는 직접 정해 주세요.
          </Text>
          <Stack gap="sm">
            <Button variant="outline" fullWidth onClick={() => setOverCapacityOpen(false)}>
              취소
            </Button>
            <Button variant="danger" fullWidth onClick={handleConfirmOverCapacity}>
              초과 감수하고 저장
            </Button>
          </Stack>
        </Stack>
      </Popup>

      <Toast open={!!toastMessage} onClose={() => setToastMessage(null)} message={toastMessage ?? ""} />
    </main>
  );
}
