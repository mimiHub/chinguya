"use client";

import { useState } from "react";
import NextLink from "next/link";
import type { Invoice } from "@chinguya/types";
import { Title } from "@chinguya/ui/title";
import { Text } from "@chinguya/ui/text";
import { Stack } from "@chinguya/ui/stack";
import { Badge } from "@chinguya/ui/badge";
import { Toggle } from "@chinguya/ui/toggle";
import { Calendar, type CalendarDay } from "@chinguya/ui/calendar";
import { CalendarIcon } from "@chinguya/ui/calendar-icon";
import { Popup } from "@chinguya/ui/popup";
import { Input } from "@chinguya/ui/input";
import { Button } from "@chinguya/ui/button";
import { IconX } from "@chinguya/ui/icon-x";
import { ConfirmPopup } from "@chinguya/ui/confirm-popup";
import { Alert } from "@chinguya/ui/alert";
import { NoticeBox } from "@chinguya/ui/notice-box";
import { agencies } from "@/data/agencyData";
import { invoices as initialInvoices, getPreviousPeriod } from "@/data/invoiceData";

/**
 * 인보이스 관리. 매월 1일에 전월 기준으로 여행사별 인보이스를 발행한다는 규칙(packages/types
 * Invoice 문서 주석)에 따라, 여행사·기간·금액을 정해 "발행"하면 목록에 쌓인다. 정산(입금 확인)
 * 여부는 관리자가 직접 토글로 체크한다 — 자동 입금 확인 연동은 없다.
 *
 * 할당 세팅(/allocations)과 화면 구조를 맞췄다: 기간은 직접 타이핑하지 않고 캘린더 버튼(날짜
 * 텍스트 + CalendarIcon)을 눌러 팝업 캘린더에서 아무 날짜나 고르면 그 달(YYYY-MM)이 기간이 된다.
 * 여행사 드롭다운도 브라우저 기본 select 대신 트리거 버튼 바로 아래 그리는 방식으로 동일하다.
 */
export default function AdminInvoicesPage() {
  const activeAgencies = agencies.filter((a) => a.active);

  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [agencyId, setAgencyId] = useState(activeAgencies[0]?.id ?? "");
  const [agencyMenuOpen, setAgencyMenuOpen] = useState(false);
  const [period, setPeriod] = useState(getPreviousPeriod());
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [viewYear, setViewYear] = useState(() => Number(getPreviousPeriod().split("-")[0]));
  const [viewMonth, setViewMonth] = useState(() => Number(getPreviousPeriod().split("-")[1]));
  const [amountKrw, setAmountKrw] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Invoice | null>(null);

  const selectedAgency = activeAgencies.find((a) => a.id === agencyId);
  const findAgencyName = (id: string) => agencies.find((a) => a.id === id)?.name ?? id;

  const days: CalendarDay[] = (() => {
    const firstWeekday = new Date(viewYear, viewMonth - 1, 1).getDay();
    const totalDays = new Date(viewYear, viewMonth, 0).getDate();
    const leading: CalendarDay[] = Array.from({ length: firstWeekday }, () => ({ date: "", status: "off" }));
    const body: CalendarDay[] = Array.from({ length: totalDays }, (_, i) => ({ date: i + 1, status: "ok" as const }));
    return [...leading, ...body];
  })();

  const toggleSettled = (id: string) => {
    setInvoices((prev) => prev.map((inv) => (inv.id === id ? { ...inv, settled: !inv.settled } : inv)));
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    setInvoices((prev) => prev.filter((inv) => inv.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  const handleSelectPeriodDay = () => {
    setPeriod(`${viewYear}-${String(viewMonth).padStart(2, "0")}`);
    setDatePickerOpen(false);
  };

  const handleIssue = () => {
    if (!agencyId || !period.trim() || amountKrw <= 0) {
      setError("여행사 · 기간 · 금액을 모두 입력해 주세요.");
      return;
    }
    if (invoices.some((inv) => inv.agencyId === agencyId && inv.period === period.trim())) {
      setError("이미 같은 여행사 · 기간으로 발행된 인보이스가 있습니다.");
      return;
    }
    setError(null);
    setInvoices((prev) => [
      ...prev,
      { id: `INV-${period.trim()}-${agencyId}`, agencyId, period: period.trim(), amountKrw, settled: false },
    ]);
    setAmountKrw(0);
  };

  return (
    <main className="mx-auto max-w-2xl p-6">
      <Stack direction="column" gap="sm">
        <NextLink href="/more" className="text-sm text-muted hover:underline">
          ← 더보기로
        </NextLink>
        <Title size="md">인보이스 관리</Title>
      </Stack>

      <Stack justify="between" align="center" className="mt-6">
        <Text weight="bold">인보이스 발행</Text>
        <button
          type="button"
          onClick={() => setDatePickerOpen(true)}
          className="flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-line bg-white px-4 text-sm text-ink"
        >
          {period}
          <CalendarIcon />
        </button>
      </Stack>

      <Stack direction="column" gap="sm" className="mt-3">
        {/* 여행사명 + 금액 + 발행 — 할당 세팅의 "여행사명 + 수량 + 추가"와 같은 순서/배치 */}
        <Stack gap="sm" align="center">
          <div className="relative min-w-0 flex-1">
            <button
              type="button"
              onClick={() => setAgencyMenuOpen((o) => !o)}
              className="flex h-10 w-full min-w-0 items-center justify-between gap-2 rounded-sm border border-line bg-white px-4 text-left text-sm text-ink focus:border-primary-500 focus:outline-none"
            >
              <span className="truncate">{selectedAgency?.name ?? "여행사 선택"}</span>
              <span
                className={`h-0 w-0 shrink-0 border-x-[5px] border-t-[6px] border-x-transparent border-t-muted transition-transform ${
                  agencyMenuOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {agencyMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setAgencyMenuOpen(false)} />
                <div className="absolute top-full left-0 z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-line bg-white shadow-lg">
                  {activeAgencies.map((agency) => (
                    <button
                      key={agency.id}
                      type="button"
                      onClick={() => {
                        setAgencyId(agency.id);
                        setAgencyMenuOpen(false);
                      }}
                      className={`block w-full px-4 py-2 text-left text-sm hover:bg-gray-100 ${
                        agency.id === agencyId ? "bg-primary-100 text-primary-700" : ""
                      }`}
                    >
                      {agency.name}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="w-24 shrink-0">
            <Input
              type="number"
              size="md"
              className="text-right"
              value={amountKrw}
              min={0}
              onChange={(e) => setAmountKrw(Number(e.target.value))}
            />
          </div>
          <Button size="md" variant="secondary" className="shrink-0" onClick={handleIssue}>
            발행
          </Button>
        </Stack>

        {error && (
          <Alert status="error" icon={false}>
            {error}
          </Alert>
        )}
      </Stack>

      <Text weight="bold" className="mt-6">
        발행된 인보이스
      </Text>

      <div className="mt-2">
        {invoices.map((invoice) => (
          <div key={invoice.id} className="flex items-center justify-between gap-2 border-b border-dashed border-line py-3 text-sm last:border-b-0">
            <Stack direction="column" gap="xs">
              <Text weight="bold">{findAgencyName(invoice.agencyId)}</Text>
              <Text variant="sub">
                {invoice.period} · {invoice.amountKrw.toLocaleString()}원
              </Text>
            </Stack>
            <Stack gap="sm" align="center">
              <Badge variant={invoice.settled ? "success" : "gray"}>{invoice.settled ? "발행됨" : "발행예정"}</Badge>
              <Toggle on={invoice.settled} onChange={() => toggleSettled(invoice.id)} />
              <IconX aria-label={`${invoice.period} 인보이스 삭제`} onClick={() => setDeleteTarget(invoice)} />
            </Stack>
          </div>
        ))}
      </div>

      {invoices.length === 0 && <Text variant="sub">아직 발행된 인보이스가 없습니다.</Text>}

      <NoticeBox tone="gray" className="mt-6">
        인보이스는 매월 1일에 전월 기준으로 발행합니다. 정산(입금 확인) 여부는 관리자가 직접 확인 후 토글로 체크합니다.
      </NoticeBox>

      <ConfirmPopup
        open={Boolean(deleteTarget)}
        message={`${deleteTarget?.period} · ${deleteTarget ? findAgencyName(deleteTarget.agencyId) : ""} 인보이스를 삭제합니다. 이 작업은 되돌릴 수 없습니다.`}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteTarget(null)}
      />

      <Popup open={datePickerOpen} onClose={() => setDatePickerOpen(false)} title="기간 선택">
        <Text variant="sub" className="mb-2">
          날짜를 하나 고르면 그 달이 기간(YYYY-MM)으로 설정됩니다.
        </Text>
        <Calendar
          year={viewYear}
          month={viewMonth}
          days={days}
          mode="single"
          onSelect={handleSelectPeriodDay}
          onPrevMonth={() => {
            if (viewMonth === 1) {
              setViewYear((y) => y - 1);
              setViewMonth(12);
            } else {
              setViewMonth((m) => m - 1);
            }
          }}
          onNextMonth={() => {
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
