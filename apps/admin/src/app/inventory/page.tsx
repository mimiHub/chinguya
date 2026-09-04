"use client";

import { useMemo, useState } from "react";
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
import { listActiveAssets } from "@/data/assetData";
import {
  getDaySnapshot,
  getCurrentBaselineStock,
  addBaselineChange,
  getAdjustmentsForDate,
  addAdjustment,
  updateAdjustment,
  removeAdjustment,
  previewOverCapacityDates,
  setStoreClosed,
  type AddAdjustmentInput,
  type OverCapacityDate,
} from "@/data/inventoryData";

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

/**
 * S1-A3 날짜별 재고 세팅.
 * 자산(전기자전거/일반자전거/일반낚시대/릴낚시대)을 고른 뒤 캘린더에서 날짜를 하나 선택하면,
 * 그날의 재고 상세(기준 보유량·조정 내역·총 보유·예약·잔여·매장 휴무)를 확인·조정한다. 총 보유는
 * 더 이상 직접 입력하는 숫자가 아니라 "기준 보유량 + 그날 걸리는 조정 합계"로 계산된다.
 *
 * 비동기 데일리 로그(2026-09-03, "S1-A3 날짜별 재고 현황 기획 수정")에 따라 다음처럼 다시 만들었다:
 * ① 기준 보유량 변경(A3-M1) — 적용 시작일을 갖는 영구 변화. 과거 날짜·이미 걸린 조정에는 영향 없음.
 * ② 재고 조정(A3-M2) — 태그 + 기간(종료일 미정 가능) + 요일 지정을 갖는 일시적 증감. 같은 날짜에
 *   여러 조정이 겹치면 합산되고, 각각 개별로 수정·해제한다.
 * ③ 매장 휴무는 이제 자산별이 아니라 전 자산 공통(그 날짜엔 모든 자산이 함께 쉰다).
 * ④ 조정 결과 예약 > 총 보유가 되는 날짜가 생기면(재고 초과) 저장 전에 얼럿(A3-M3)으로 확인받는다.
 */
export default function AdminInventoryPage() {
  const assets = listActiveAssets();
  const [assetId, setAssetId] = useState(assets[0]?.id ?? "");
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth() + 1);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // 기준 보유량 변경 / 재고 조정 추가·수정·해제 / 매장 휴무 토글이 반영된 뒤 캘린더·목록을
  // 다시 그리기 위한 트리거.
  const [refreshTick, setRefreshTick] = useState(0);

  const [baselineOpen, setBaselineOpen] = useState(false);
  const [baselineInput, setBaselineInput] = useState(0);
  const [baselineStartDate, setBaselineStartDate] = useState("");
  const [baselineMemo, setBaselineMemo] = useState("");

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

  const [overCapacityOpen, setOverCapacityOpen] = useState(false);
  const [overCapacityDates, setOverCapacityDates] = useState<OverCapacityDate[]>([]);
  const [pendingAdjustInput, setPendingAdjustInput] = useState<AddAdjustmentInput | null>(null);
  const [pendingEditId, setPendingEditId] = useState<string | null>(null);

  const selectedDateKey =
    selectedDay != null ? `${viewYear}-${String(viewMonth).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}` : null;

  const days: CalendarDay[] = useMemo(() => {
    const firstWeekday = new Date(viewYear, viewMonth - 1, 1).getDay();
    const totalDays = new Date(viewYear, viewMonth, 0).getDate();
    const leading: CalendarDay[] = Array.from({ length: firstWeekday }, () => ({ date: "", status: "off" }));
    const body: CalendarDay[] = Array.from({ length: totalDays }, (_, i) => {
      const day = i + 1;
      const snapshot = getDaySnapshot(assetId, viewYear, viewMonth, day);
      const hasAdjustment = getAdjustmentsForDate(assetId, snapshot.dateKey).length > 0;

      if (snapshot.closed) {
        return { date: day, status: "holiday", label: "휴무", hasAdjustment };
      }
      // 색상은 잔여 기준 — 마감(0)/초과(음수)는 값 그대로, 임박은 고객 가용 대비 30% 이하로 남은 날.
      const status: CalendarDay["status"] =
        snapshot.remaining < 0
          ? "over"
          : snapshot.remaining === 0
            ? "zero"
            : snapshot.remaining <= snapshot.customerAvailable * 0.3
              ? "low"
              : "ok";
      return { date: day, status, qty: snapshot.customerAvailable, remaining: snapshot.remaining, hasAdjustment };
    });
    return [...leading, ...body];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assetId, viewYear, viewMonth, refreshTick]);

  const selectedSnapshot = selectedDay != null ? getDaySnapshot(assetId, viewYear, viewMonth, selectedDay) : null;

  const adjustmentsForSelectedDay = useMemo(() => {
    if (!selectedDateKey) return [];
    return getAdjustmentsForDate(assetId, selectedDateKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assetId, selectedDateKey, refreshTick]);

  // 오늘 기준 최신값(getCurrentBaselineStock)이 아니라 "선택한 그 날짜"에 적용되던 기준
  // 보유량이어야 한다 — 안 그러면 기준 보유량을 바꾼 뒤 과거/미래 날짜를 볼 때 이 값과 아래
  // "그날 총 보유"가 서로 다른 기준으로 계산되어 안 맞아 보인다(getDaySnapshot이 이미 그 날짜
  // 기준으로 계산해서 snapshot.baseline에 담아준다).
  const selectedBaseline = selectedSnapshot?.baseline ?? 0;

  const handleSelectDay = (day: number) => {
    setSelectedDay(day);
  };

  const handleSelectAsset = (id: string) => {
    setAssetId(id);
    setSelectedDay(null);
  };

  const handleToggleClosed = (value: boolean) => {
    if (!selectedDateKey) return;
    setStoreClosed(selectedDateKey, value);
    setRefreshTick((t) => t + 1);
    setToastMessage(value ? "매장 휴무로 저장되었습니다" : "매장 휴무가 해제되었습니다");
  };

  const openBaseline = () => {
    setBaselineInput(getCurrentBaselineStock(assetId));
    setBaselineStartDate(selectedDateKey ?? "");
    setBaselineMemo("");
    setBaselineOpen(true);
  };

  const handleSaveBaseline = () => {
    if (!baselineStartDate) return;
    addBaselineChange(assetId, baselineInput, baselineStartDate, baselineMemo.trim());
    setBaselineOpen(false);
    setRefreshTick((t) => t + 1);
    setToastMessage("기준 보유량이 저장되었습니다");
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
    setAdjustOpen(true);
  };

  const handleRemoveAdjustment = (id: string) => {
    removeAdjustment(id);
    setRefreshTick((t) => t + 1);
    setToastMessage("재고 조정이 해제되었습니다");
  };

  const toggleAdjustWeekday = (weekday: number) => {
    setAdjustWeekdays((prev) => (prev.includes(weekday) ? prev.filter((w) => w !== weekday) : [...prev, weekday]));
  };

  const buildAdjustInput = (): AddAdjustmentInput | null => {
    if (!adjustStartDate || adjustAmount === 0) return null;
    return {
      assetId,
      tag: adjustTag.trim(),
      delta: adjustSign === "-" ? -adjustAmount : adjustAmount,
      startDate: adjustStartDate,
      endDate: adjustNoEndDate ? null : adjustEndDate || adjustStartDate,
      weekdays: adjustWeekdays.length > 0 ? adjustWeekdays : null,
      memo: adjustMemo.trim(),
    };
  };

  const handleSubmitAdjust = () => {
    const input = buildAdjustInput();
    if (!input) return;
    const overCapacity = previewOverCapacityDates(input, editingAdjustmentId ?? undefined);
    if (overCapacity.length > 0) {
      setOverCapacityDates(overCapacity);
      setPendingAdjustInput(input);
      setPendingEditId(editingAdjustmentId);
      setAdjustOpen(false);
      setOverCapacityOpen(true);
      return;
    }
    commitAdjust(input, editingAdjustmentId);
  };

  const commitAdjust = (input: AddAdjustmentInput, editId: string | null) => {
    if (editId) {
      updateAdjustment(editId, {
        tag: input.tag,
        delta: input.delta,
        startDate: input.startDate,
        endDate: input.endDate,
        weekdays: input.weekdays,
        memo: input.memo,
      });
    } else {
      addAdjustment(input);
    }
    setAdjustOpen(false);
    setRefreshTick((t) => t + 1);
    setToastMessage(editId ? "재고 조정이 수정되었습니다" : "재고 조정이 추가되었습니다");
  };

  const handleConfirmOverCapacity = () => {
    if (!pendingAdjustInput) return;
    commitAdjust(pendingAdjustInput, pendingEditId);
    setOverCapacityOpen(false);
    setPendingAdjustInput(null);
    setPendingEditId(null);
  };

  return (
    <main className="mx-auto max-w-2xl p-6">
      <Stack direction="column" gap="sm">
        <Title size="md">날짜별 재고 세팅</Title>
      </Stack>

      <Stack direction="column" gap="md" className="mt-4">
        <Text weight="bold" leaf>자산 선택</Text>
        <Chip.List scrollArrows>
          {assets.map((asset) => (
            <Chip key={asset.id} on={asset.id === assetId} onClick={() => handleSelectAsset(asset.id)}>
              {asset.name}
            </Chip>
          ))}
        </Chip.List>

        <Stack justify="between" align="center">
          <Text variant="sub" as="span">
            기준 보유량 {getCurrentBaselineStock(assetId)}대
          </Text>
          <Button variant="outline" size="sm" onClick={openBaseline}>
            변경
          </Button>
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

        {selectedDay && selectedSnapshot ? (
          <Stack direction="column" gap="md">
            <Text weight="bold">
              {viewMonth}월 {selectedDay}일 (선택)
            </Text>

            <Kv items={[{ key: "기준 보유량", value: `${selectedBaseline}개` }]} />

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
                  <Stack gap="xs">
                    <button type="button" className="text-xs text-muted underline" onClick={() => openEditAdjustment(adj.id)}>
                      수정
                    </button>
                    <button type="button" className="text-xs text-muted underline" onClick={() => handleRemoveAdjustment(adj.id)}>
                      해제
                    </button>
                  </Stack>
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
                  value: `${selectedSnapshot.totalStock}개`,
                },
              ]}
            />

            <Kv
              items={[
                { key: "예약", value: `${selectedSnapshot.reserved}개` },
                { key: "잔여", value: `${selectedSnapshot.remaining}개` },
              ]}
            />

            <Stack justify="between" align="center">
              <Text variant="sub" as="span" className="inline-flex items-center gap-1.5">
                매장 휴무 <Badge>전 자산 공통</Badge>
              </Text>
              <Toggle on={selectedSnapshot.closed} onChange={handleToggleClosed} />
            </Stack>

            <Button variant="outline" fullWidth onClick={openAddAdjustment}>
              재고 조정 추가
            </Button>
          </Stack>
        ) : (
          <Text variant="sub">날짜를 선택하면 재고 상세를 확인·조정할 수 있습니다.</Text>
        )}
      </Stack>

      <Popup open={baselineOpen} onClose={() => setBaselineOpen(false)} title="기준 보유량 변경">
        <Stack direction="column" gap="md">
          {/* align="start"로 두 칸 다 라벨 줄부터 맞춘다 — 화살표는 그 라벨 줄(emphasis 라벨
              한 줄 24px + gap-2 8px) 아래 입력창(h-10 40px) 정중앙에 오도록 고정 오프셋(mt-10)을
              준다. */}
          <Stack justify="between" align="start">
            <LabeledBox label="기준 보유량" required emphasis>
              <Input type="number" value={getCurrentBaselineStock(assetId)} disabled />
            </LabeledBox>
            <Text className="mt-10">→</Text>
            <LabeledBox label="변경 후" required emphasis>
              <Input type="number" min={0} value={baselineInput} onChange={(e) => setBaselineInput(Number(e.target.value))} />
            </LabeledBox>
          </Stack>
          <LabeledBox label="적용 시작일" required emphasis>
            <Input type="date" value={baselineStartDate} onChange={(e) => setBaselineStartDate(e.target.value)} />
          </LabeledBox>
          <LabeledBox label="메모" emphasis>
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
            <Button fullWidth disabled={!baselineStartDate} onClick={handleSaveBaseline}>
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
          
          <LabeledBox label="메모" emphasis>
            <Input as="textarea" rows={2} value={adjustMemo} onChange={(e) => setAdjustMemo(e.target.value)} placeholder="예) 펑크 2대" />
          </LabeledBox>

          <Stack gap="sm">
            <Button variant="outline" fullWidth onClick={() => setAdjustOpen(false)}>
              취소
            </Button>
            <Button fullWidth onClick={handleSubmitAdjust}>
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
