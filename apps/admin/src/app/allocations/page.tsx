"use client";

import { useMemo, useState } from "react";
import NextLink from "next/link";
import { Title } from "@chinguya/ui/title";
import { Text } from "@chinguya/ui/text";
import { Chip } from "@chinguya/ui/chip";
import { Stack } from "@chinguya/ui/stack";
import { Calendar, type CalendarDay } from "@chinguya/ui/calendar";
import { CalendarIcon } from "@chinguya/ui/calendar-icon";
import { Popup } from "@chinguya/ui/popup";
import { Kv } from "@chinguya/ui/kv";
import { Input } from "@chinguya/ui/input";
import { Button } from "@chinguya/ui/button";
import { IconX } from "@chinguya/ui/icon-x";
import { FormMessage } from "@chinguya/ui/form-message";
import { Alert } from "@chinguya/ui/alert";
import { Toast } from "@chinguya/ui/toast";
import { assets } from "@/data/assetData";
import { agencies } from "@/data/agencyData";
import { getInventoryRecord } from "@/data/inventoryData";
import { getAllocatedQty, getTotalAllocatedQty, saveAllocatedQty } from "@/data/allocationData";

/**
 * 여행사별 할당 세팅. 재고 세팅(S1-A3, /inventory)에서 정한 "여행사 할당" 합계를 실제로
 * 어느 여행사에 몇 개씩 나눠줄지 정하는 화면이다.
 *
 * 캘린더는 항상 펼쳐두지 않고, 날짜 버튼(선택한 날짜 텍스트 + 캘린더 아이콘)을 눌렀을 때만
 * 팝업으로 띄운다 — 화면을 계속 차지하지 않게 하기 위함. 날짜 버튼의 캘린더 아이콘은
 * packages/ui의 CalendarIcon(SVG)이라 다른 화면에서도 항상 같은 모양으로 보인다.
 */
export default function AdminAllocationsPage() {
  const activeAgencies = agencies.filter((a) => a.active);
  const agencyIds = activeAgencies.map((a) => a.id);

  const [assetId, setAssetId] = useState(assets[0]?.id ?? "");
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth() + 1);
  // 처음 들어왔을 때 안내 문구만 덩그러니 보이지 않도록, 오늘 날짜를 기본으로 미리 선택해둔다.
  // (자산/여행사 데이터는 이 시점에 이미 준비돼 있어서 초기값 계산 함수 안에서 바로 써도 안전하다)
  const [selectedDay, setSelectedDay] = useState<number | null>(now.getDate());
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [qtyByAgency, setQtyByAgency] = useState<Record<string, number>>(() => {
    const key = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const initial: Record<string, number> = {};
    agencies
      .filter((a) => a.active)
      .forEach((agency) => {
        initial[agency.id] = getAllocatedQty(assets[0]?.id ?? "", agency.id, key);
      });
    return initial;
  });
  const [savedOpen, setSavedOpen] = useState(false);
  const [pickerAgencyId, setPickerAgencyId] = useState(activeAgencies[0]?.id ?? "");
  const [pickerQty, setPickerQty] = useState(0);
  const [agencyMenuOpen, setAgencyMenuOpen] = useState(false);

  const pickerAgency = activeAgencies.find((a) => a.id === pickerAgencyId);

  const days: CalendarDay[] = useMemo(() => {
    const firstWeekday = new Date(viewYear, viewMonth - 1, 1).getDay();
    const totalDays = new Date(viewYear, viewMonth, 0).getDate();
    const leading: CalendarDay[] = Array.from({ length: firstWeekday }, () => ({ date: "", status: "off" }));
    const body: CalendarDay[] = Array.from({ length: totalDays }, (_, i) => {
      const day = i + 1;
      const dateKey = `${viewYear}-${String(viewMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const total = getTotalAllocatedQty(assetId, agencyIds, dateKey);
      return { date: day, status: "ok" as const, qty: total };
    });
    return [...leading, ...body];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assetId, viewYear, viewMonth]);

  const dateKey = selectedDay
    ? `${viewYear}-${String(viewMonth).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}`
    : null;

  const inventoryRecord = dateKey ? getInventoryRecord(assetId, viewYear, viewMonth, selectedDay!) : null;
  const agencyAllocatedTarget = inventoryRecord?.agencyAllocated ?? 0;
  const allocatedSum = Object.values(qtyByAgency).reduce((sum, v) => sum + v, 0);

  const handleSelectDay = (day: number) => {
    setSelectedDay(day);
    setDatePickerOpen(false);
    const key = `${viewYear}-${String(viewMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const next: Record<string, number> = {};
    activeAgencies.forEach((agency) => {
      next[agency.id] = getAllocatedQty(assetId, agency.id, key);
    });
    setQtyByAgency(next);
  };

  const handleSelectAsset = (id: string) => {
    setAssetId(id);
    // 자산을 바꿔도 안내 문구로 돌아가지 않고, 지금 선택돼 있던 날짜(없으면 오늘) 기준으로
    // 그 자산의 할당 현황을 바로 다시 보여준다.
    const day = selectedDay ?? now.getDate();
    setSelectedDay(day);
    const key = `${viewYear}-${String(viewMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const next: Record<string, number> = {};
    activeAgencies.forEach((agency) => {
      next[agency.id] = getAllocatedQty(id, agency.id, key);
    });
    setQtyByAgency(next);
  };

  const handleAddAllocation = () => {
    if (!pickerAgencyId) return;
    setQtyByAgency((prev) => ({ ...prev, [pickerAgencyId]: pickerQty }));
    setPickerQty(0);
  };

  const handleRemoveAllocation = (agencyId: string) => {
    setQtyByAgency((prev) => {
      const next = { ...prev };
      delete next[agencyId];
      return next;
    });
  };

  const handleSave = () => {
    if (!dateKey) return;
    activeAgencies.forEach((agency) => {
      saveAllocatedQty(assetId, agency.id, dateKey, qtyByAgency[agency.id] ?? 0);
    });
    setSavedOpen(true);
  };

  return (
    <main className="mx-auto max-w-2xl p-6">
      <Stack direction="column" gap="sm">
        <NextLink href="/more" className="text-sm text-muted hover:underline">
          ← 더보기로
        </NextLink>
        <Title size="md">할당 세팅</Title>
      </Stack>

      <Text variant="sub" className="mt-4">
        자산 선택
      </Text>
      <Stack gap="sm" align="center" className="mt-1">
        <Chip.List>
          {assets.map((asset) => (
            <Chip key={asset.id} on={asset.id === assetId} onClick={() => handleSelectAsset(asset.id)}>
              {asset.name}
            </Chip>
          ))}
        </Chip.List>

        {/* 날짜 버튼 — 누르면 캘린더가 팝업으로 뜨고, 고른 날짜가 이 버튼 위에 그대로 적힌다 */}
        <button
          type="button"
          onClick={() => setDatePickerOpen(true)}
          className="ml-auto flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-line bg-white px-4 text-sm text-ink"
        >
          {dateKey ?? "날짜 선택"}
          <CalendarIcon />
        </button>
      </Stack>

      <Text weight="bold" className="mt-6">
        날짜별 할당 세팅
      </Text>

      {selectedDay ? (
        <Stack direction="column" gap="md" className="mt-3">
          {/*
            여행사가 많아질 수 있어서 전부 나열하지 않고 하나씩 골라 수량을 추가하는 방식.
            브라우저 기본 select는 모바일에서 팝업 위치가 화면 위로 튀는 문제가 있어서, 네이티브
            select 대신 트리거 버튼 바로 아래에 직접 그리는 드롭다운(절대 위치)을 만들었다 —
            우리가 그리는 DOM이라 위치가 항상 버튼 바로 밑에 고정된다.
          */}
          <Stack gap="sm" align="center">
            <div className="relative min-w-0 flex-1">
              <button
                type="button"
                onClick={() => setAgencyMenuOpen((o) => !o)}
                className="flex h-10 w-full min-w-0 items-center justify-between gap-2 rounded-sm border border-line bg-white px-4 text-left text-sm text-ink focus:border-primary-500 focus:outline-none"
              >
                <span className="truncate">{pickerAgency?.name ?? "여행사 선택"}</span>
                {/* 셀렉트박스처럼 보이는 화살표 — 열림/닫힘에 따라 위/아래로 뒤집힌다(순수 CSS 삼각형) */}
                <span
                  className={`h-0 w-0 shrink-0 border-x-[5px] border-t-[6px] border-x-transparent border-t-muted transition-transform ${
                    agencyMenuOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {agencyMenuOpen && (
                <>
                  {/* 드롭다운 바깥을 누르면 닫히도록 화면 전체를 덮는 투명 레이어 */}
                  <div className="fixed inset-0 z-40" onClick={() => setAgencyMenuOpen(false)} />
                  <div className="absolute top-full left-0 z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-line bg-white shadow-lg">
                    {activeAgencies.map((agency) => (
                      <button
                        key={agency.id}
                        type="button"
                        onClick={() => {
                          setPickerAgencyId(agency.id);
                          setAgencyMenuOpen(false);
                        }}
                        className={`block w-full px-4 py-2 text-left text-sm hover:bg-gray-100 ${
                          agency.id === pickerAgencyId ? "bg-primary-100 text-primary-700" : ""
                        }`}
                      >
                        {agency.name}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            {/* Input 자체에 항상 w-full이 붙어있어서 className으로 폭만 줄이면 flex 계산이 꼬인다
                (w-full이 flex-basis를 100%로 밀어버려서 옆의 flex-1 드롭다운을 눌러버림) —
                그래서 폭이 고정된 래퍼 div로 감싸서 그 안에서만 100%가 되게 한다. */}
            <div className="w-16 shrink-0">
              <Input
                type="number"
                size="md"
                className="text-right"
                value={pickerQty}
                min={0}
                onChange={(e) => setPickerQty(Number(e.target.value))}
              />
            </div>
            <Button size="md" variant="secondary" className="shrink-0" onClick={handleAddAllocation} disabled={!pickerAgencyId}>
              추가
            </Button>
          </Stack>

          {activeAgencies.length === 0 && (
            <FormMessage type="helper">활성화된 여행사가 없습니다. 여행사 관리에서 먼저 등록해 주세요.</FormMessage>
          )}

          {/* 카드 대신 여백 최소화한 리스트 — 여행사가 많아져도 자리를 덜 차지한다.
              이 영역만 고정 높이로 자체 스크롤한다(저장 버튼 등 나머지 화면은 항상 같은 자리에 보임) */}
          <div className="max-h-72 overflow-y-auto">
            {Object.entries(qtyByAgency).map(([agencyId, qty]) => {
              const agency = activeAgencies.find((a) => a.id === agencyId);
              if (!agency) return null;
              return (
                <div
                  key={agencyId}
                  className="flex items-center justify-between gap-2 border-b border-dashed border-line py-2 text-sm last:border-b-0"
                >
                  <Text variant="sub" as="span">
                    {agency.name}
                  </Text>
                  <Stack gap="sm" align="center">
                    <Text weight="bold">{qty}개</Text>
                    <IconX aria-label={`${agency.name} 할당 삭제`} onClick={() => handleRemoveAllocation(agencyId)} />
                  </Stack>
                </div>
              );
            })}
          </div>

          <Kv items={[{ key: "할당 합계", value: `${allocatedSum}개` }]} />

          {allocatedSum !== agencyAllocatedTarget && (
            <Alert status="error" icon={false}>
              할당 합계가 재고 세팅상 여행사 할당({agencyAllocatedTarget}개)과 다릅니다. 재고 세팅 화면에서 값을
              맞추거나 여기서 합계를 맞춰 주세요.
            </Alert>
          )}

          {/* 지금은 이 앱 안에서만 저장된다. 여행사 앱 예약 화면의 가용(할당) 수량은 아직
              @chinguya/catalog-data의 고정값을 그대로 보여준다 — 실제 API가 생기면 여기서 저장한
              값으로 자동 반영되도록 연결한다. (개발자용 메모라 화면에는 노출하지 않는다.) */}
          <Button fullWidth onClick={handleSave}>
            저장
          </Button>
        </Stack>
      ) : (
        <Text variant="sub" className="mt-3">
          날짜를 선택하면 여행사별 할당 수량을 확인·수정할 수 있습니다.
        </Text>
      )}

      <Toast open={savedOpen} onClose={() => setSavedOpen(false)} message="저장되었습니다" />

      <Popup open={datePickerOpen} onClose={() => setDatePickerOpen(false)} title="날짜 선택">
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
      </Popup>
    </main>
  );
}
