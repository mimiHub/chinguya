"use client";

import { useMemo, useState } from "react";
import { Title } from "@chinguya/ui/title";
import { Text } from "@chinguya/ui/text";
import { Chip } from "@chinguya/ui/chip";
import { Card } from "@chinguya/ui/card";
import { Stack } from "@chinguya/ui/stack";
import { Calendar, type CalendarDay } from "@chinguya/ui/calendar";
import { Kv } from "@chinguya/ui/kv";
import { Toggle } from "@chinguya/ui/toggle";
import { Input } from "@chinguya/ui/input";
import { Button } from "@chinguya/ui/button";
import { Toast } from "@chinguya/ui/toast";
import { assets } from "@/data/assetData";
import { getInventoryRecord, saveInventoryRecord } from "@/data/inventoryData";

/**
 * S1-A3 날짜별 재고 세팅.
 * 자산(전기자전거/일반자전거/일반낚시대/릴낚시대)을 고른 뒤 캘린더에서 날짜를 하나 선택하면,
 * 그날의 총 보유/여행사 할당/휴무 여부를 관리자가 직접 세팅한다. 고객 가용 수량은
 * "총 보유 − 여행사 할당"으로 자동 계산된다(packages/types의 Inventory 규칙 — Slice 1이라
 * 자동계산이지만 수식 자체는 이미 고정). 재고는 상품(가격 조합) 단위가 아니라 자산 단위로
 * 관리한다.
 */
export default function AdminInventoryPage() {
  const [assetId, setAssetId] = useState(assets[0]?.id ?? "");
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth() + 1);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const [totalStock, setTotalStock] = useState(0);
  const [agencyAllocated, setAgencyAllocated] = useState(0);
  const [closed, setClosed] = useState(false);
  const [savedOpen, setSavedOpen] = useState(false);

  const days: CalendarDay[] = useMemo(() => {
    const firstWeekday = new Date(viewYear, viewMonth - 1, 1).getDay();
    const totalDays = new Date(viewYear, viewMonth, 0).getDate();
    const leading: CalendarDay[] = Array.from({ length: firstWeekday }, () => ({ date: "", status: "off" }));
    const body: CalendarDay[] = Array.from({ length: totalDays }, (_, i) => {
      const day = i + 1;
      const record = getInventoryRecord(assetId, viewYear, viewMonth, day);
      const status: CalendarDay["status"] = record.closed ? "holiday" : record.customerAvailable <= 0 ? "zero" : "ok";
      return { date: day, status, qty: record.customerAvailable };
    });
    return [...leading, ...body];
  }, [assetId, viewYear, viewMonth]);

  const handleSelectDay = (day: number) => {
    setSelectedDay(day);
    const record = getInventoryRecord(assetId, viewYear, viewMonth, day);
    setTotalStock(record.totalStock);
    setAgencyAllocated(record.agencyAllocated);
    setClosed(record.closed);
  };

  const handleSelectAsset = (id: string) => {
    setAssetId(id);
    setSelectedDay(null);
  };

  const customerAvailable = Math.max(totalStock - agencyAllocated, 0);

  const handleSave = () => {
    if (!selectedDay) return;
    saveInventoryRecord({
      productId: assetId,
      date: `${viewYear}-${String(viewMonth).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}`,
      totalStock,
      agencyAllocated,
      customerAvailable,
      closed,
    });
    setSavedOpen(true);
  };

  return (
    <main className="mx-auto max-w-2xl p-6">
      <Title size="md">날짜별 재고 세팅</Title>

      <Text variant="sub" className="mt-2">
        자산 선택
      </Text>
      <Chip.List className="mt-1">
        {assets.map((asset) => (
          <Chip key={asset.id} on={asset.id === assetId} onClick={() => handleSelectAsset(asset.id)}>
            {asset.name}
          </Chip>
        ))}
      </Chip.List>

      <Card className="mt-4">
        <Calendar
          year={viewYear}
          month={viewMonth}
          days={days}
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

      {selectedDay ? (
        <Stack direction="column" gap="md" className="mt-4">
          <Text weight="bold">
            {viewMonth}월 {selectedDay}일 재고 세팅
          </Text>

          <Stack justify="between" align="center">
            <Text variant="sub" as="span">
              총 보유
            </Text>
            <Input
              type="number"
              size="sm"
              className="w-24 text-right"
              value={totalStock}
              min={0}
              onChange={(e) => setTotalStock(Number(e.target.value))}
            />
          </Stack>

          <Stack justify="between" align="center">
            <Text variant="sub" as="span">
              여행사 할당
            </Text>
            <Input
              type="number"
              size="sm"
              className="w-24 text-right"
              value={agencyAllocated}
              min={0}
              max={totalStock}
              onChange={(e) => setAgencyAllocated(Number(e.target.value))}
            />
          </Stack>

          <Kv items={[{ key: "고객 가용(자동)", value: `${customerAvailable}개` }]} />

          <Stack justify="between" align="center">
            <Text variant="sub" as="span">
              휴무
            </Text>
            <Toggle on={closed} onChange={setClosed} />
          </Stack>

          {/* 지금은 이 앱 안에서만 저장된다. 고객·여행사 앱의 노출/가용 수량(@chinguya/catalog-data)에는
              아직 자동 반영되지 않는다 — 실제 API가 생기면 여기서 저장한 값이 그대로 전달되도록 연결한다.
              (개발자용 메모라 화면에는 노출하지 않는다.) */}
          <Button fullWidth onClick={handleSave}>
            저장
          </Button>
        </Stack>
      ) : (
        <Text variant="sub" className="mt-4">
          날짜를 선택하면 세팅값을 확인·수정할 수 있습니다.
        </Text>
      )}

      <Toast open={savedOpen} onClose={() => setSavedOpen(false)} message="저장되었습니다" />
    </main>
  );
}
