"use client";

import { useEffect, useMemo, useState } from "react";
import { Title } from "@chinguya/ui/title";
import { Text } from "@chinguya/ui/text";
import { Chip } from "@chinguya/ui/chip";
import { Badge } from "@chinguya/ui/badge";
import { Kv } from "@chinguya/ui/kv";
import { Card } from "@chinguya/ui/card";
import { Stack } from "@chinguya/ui/stack";
import { Calendar, type CalendarDay } from "@chinguya/ui/calendar";
import { Toggle } from "@chinguya/ui/toggle";
import { Input } from "@chinguya/ui/input";
import { Button } from "@chinguya/ui/button";
import { Popup } from "@chinguya/ui/popup";
import { LabeledBox } from "@chinguya/ui/labeled-box";
import { Dropdown } from "@chinguya/ui/dropdown";
import { Toast } from "@chinguya/ui/toast";
import { Alert } from "@chinguya/ui/alert";
import {
  createApiClient,
  ApiError,
  type AdjustmentRequest,
  type InventoryDaySnapshot,
  type InventoryDayDetail,
  type OverCapacityDate,
} from "@chinguya/api-client";
import type { Asset } from "@chinguya/types";
import { useAdminAuth } from "@/context/AdminAuthContext";

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

const api = createApiClient();

/** 서버가 준 문구를 그대로 쓰되, 네트워크 오류처럼 본문이 없는 실패는 기본 문구로 대체한다. */
function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) return err.message;
  return fallback;
}

/**
 * S1-A3 날짜별 재고 세팅.
 * 자산(전기자전거/일반자전거/일반낚시대/릴낚시대)을 고른 뒤 캘린더에서 날짜를 하나 선택하면,
 * 그날의 재고 상세(기준 보유량·조정 내역·총 보유·예약·잔여·매장 휴무)를 확인·조정한다. 총 보유는
 * 더 이상 직접 입력하는 숫자가 아니라 "기준 보유량 + 그날 걸리는 조정 합계"로 계산된다.
 *
 * Core API(GET/POST/PUT/DELETE /admin/inventory/**)에 실연동돼 있다 — 계약은
 * packages/api-spec/openapi/chinguya-admin-api.yaml. 자산 선택기는 자산 관리(S1-A2)와
 * 동일한 /admin/assets 목록을 그대로 쓴다.
 *
 * ⚠ "예약" 수치는 고객 예약 백엔드가 아직 없어 서버가 항상 0을 내려준다 — 그래서 재고
 * 조정 저장 시 "초과 경고"(A3-M3) 모달은 배관은 남아 있지만 지금은 절대 뜨지 않는다.
 *
 * 쓰기(기준 보유량 변경·재고 조정 추가/수정/해제·매장 휴무 토글)는 슈퍼어드민만 가능하다.
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

  const [dayDetail, setDayDetail] = useState<InventoryDayDetail | null>(null);

  const [baselineOpen, setBaselineOpen] = useState(false);
  const [baselineInput, setBaselineInput] = useState(0);
  const [baselineStartDate, setBaselineStartDate] = useState("");
  const [baselineMemo, setBaselineMemo] = useState("");
  const [baselineError, setBaselineError] = useState("");
  const [baselineSubmitting, setBaselineSubmitting] = useState(false);

  const [adjustOpen, setAdjustOpen] = useState(false);
  const [editingAdjustmentId, setEditingAdjustmentId] = useState<string | null>(null);
  const [adjustSign, setAdjustSign] = useState<"+" | "-">("+");
  const [adjustAmount, setAdjustAmount] = useState(1);
  const [adjustStartDate, setAdjustStartDate] = useState("");
  const [adjustEndDate, setAdjustEndDate] = useState("");
  const [adjustNoEndDate, setAdjustNoEndDate] = useState(false);
  const [adjustWeekdays, setAdjustWeekdays] = useState<number[]>([]);
  const [adjustTag, setAdjustTag] = useState("");
  const [adjustMemo, setAdjustMemo] = useState("");
  const [adjustError, setAdjustError] = useState("");
  const [adjustSubmitting, setAdjustSubmitting] = useState(false);

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
    Promise.all([api.inventory.snapshot(assetId, viewYear, viewMonth), api.inventory.currentBaseline(assetId)])
      .then(([snapshotResult, baselineResult]) => {
        if (!alive) return;
        setSnapshot(snapshotResult);
        setCurrentBaseline(baselineResult.value);
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

  const openAddAdjustment = () => {
    if (!selectedDateKey) return;
    setEditingAdjustmentId(null);
    setAdjustSign("+");
    setAdjustAmount(1);
    setAdjustStartDate(selectedDateKey);
    setAdjustEndDate(selectedDateKey);
    setAdjustNoEndDate(false);
    setAdjustWeekdays([]);
    setAdjustTag("");
    setAdjustMemo("");
    setAdjustError("");
    setAdjustOpen(true);
  };

  const openEditAdjustment = (id: string) => {
    const record = adjustmentsForSelectedDay.find((a) => a.id === id);
    if (!record) return;
    setEditingAdjustmentId(id);
    setAdjustSign(record.delta < 0 ? "-" : "+");
    setAdjustAmount(Math.abs(record.delta));
    setAdjustStartDate(record.startDate);
    setAdjustEndDate(record.endDate ?? "");
    setAdjustNoEndDate(record.endDate === null);
    setAdjustWeekdays(record.weekdays ?? []);
    setAdjustTag(record.tag);
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

  const buildAdjustInput = (): AdjustmentRequest | null => {
    if (!adjustStartDate || adjustAmount === 0) return null;
    return {
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
    setAdjustSubmitting(true);
    try {
      const overCapacity = editingAdjustmentId
        ? await api.inventory.previewEdit(editingAdjustmentId, input)
        : await api.inventory.previewAdd(assetId, input);
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

                <Kv items={[{ key: "기준 보유량", value: `${dayDetail.baseline}개` }]} />

                {adjustmentsForSelectedDay.map((adj) => (
                  <Stack key={adj.id} direction="column" gap="xs" className="rounded-sm border border-line p-2">
                    <Stack justify="between" align="center">
                      {/* LabeledBox의 emphasis 라벨(강조색 점 + 굵고 큰 글씨)과 같은 스타일 — 이
                          카드 안에서 "이날 조정"이 아래 메모/기간 줄과 확실히 구분되는 부제목이
                          되도록 점을 붙였다. */}
                      <Text weight="bold" as="span" className="inline-flex items-center gap-1.5">
                        <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary-500" />
                        이날 조정 {adj.tag && <Badge>{adj.tag}</Badge>}
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
                ))}

                <Kv
                  items={[
                    {
                      key: (
                        <>
                          그날 총 보유 = <Badge>고객 가용</Badge>
                        </>
                      ),
                      value: `${dayDetail.totalStock}개`,
                    },
                  ]}
                />

                <Kv
                  items={[
                    { key: "예약", value: `${dayDetail.reserved}개` },
                    { key: "잔여", value: `${dayDetail.remaining}개` },
                  ]}
                />

                <Stack justify="between" align="center">
                  <Text variant="sub" as="span" className="inline-flex items-center gap-1.5">
                    매장 휴무 <Badge>전 자산 공통</Badge>
                  </Text>
                  <Toggle on={dayDetail.closed} onChange={handleToggleClosed} disabled={!isSuperAdmin} />
                </Stack>

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

      <Popup open={adjustOpen} onClose={() => setAdjustOpen(false)} title="재고 조정">
        <Stack direction="column" gap="md">
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
          <LabeledBox label="기간" required emphasis>
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
          <LabeledBox label="요일 지정 (선택)" emphasis>
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
          <Text variant="sub">
            {overCapacityDates.length}개 날짜에서 예약이 총 보유를 초과합니다:{" "}
            {overCapacityDates.map((d) => `${d.date}(예약 ${d.reserved} / 총 보유 ${d.totalStockAfter})`).join(", ")}
          </Text>
          <Text variant="sub">실제 파손·수리는 사실이므로 저장은 허용합니다.</Text>
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
