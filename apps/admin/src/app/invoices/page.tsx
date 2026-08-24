"use client";

import { useState } from "react";
import NextLink from "next/link";
import type { Invoice } from "@chinguya/types";
import { Title } from "@chinguya/ui/title";
import { Text } from "@chinguya/ui/text";
import { Card } from "@chinguya/ui/card";
import { Stack } from "@chinguya/ui/stack";
import { Badge } from "@chinguya/ui/badge";
import { Toggle } from "@chinguya/ui/toggle";
import { NoticeBox } from "@chinguya/ui/notice-box";
import { IconX } from "@chinguya/ui/icon-x";
import { ConfirmPopup } from "@chinguya/ui/confirm-popup";
import { agencies } from "@/data/agencyData";
import { invoices as initialInvoices, getCurrentPeriod, getPendingUsage } from "@/data/invoiceData";

/**
 * 인보이스 관리. 매월 1일에 전월 기준으로 여행사별 인보이스가 자동 발행된다는 규칙(packages/types
 * Invoice 문서 주석)에 따라, 관리자가 여행사·금액을 직접 입력해서 발행하지 않는다 — 여행사 예약
 * 사용액(agencyReservationData)을 합산해 자동으로 만들어진다(invoiceData.issueDueInvoices).
 *
 * 화면은 두 구간으로 나뉜다: 아직 마감 전이라 계속 올라가는 "이번 달 사용 금액(발행예정)"과,
 * 이미 마감돼 자동 발행된 "발행된 인보이스" 목록. 정산(입금) 확인만 관리자가 수동으로 토글한다.
 */
export default function AdminInvoicesPage() {
  const activeAgencies = agencies.filter((a) => a.active);
  const currentPeriod = getCurrentPeriod();

  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [deleteTarget, setDeleteTarget] = useState<Invoice | null>(null);

  const findAgencyName = (id: string) => agencies.find((a) => a.id === id)?.name ?? id;

  const toggleSettled = (id: string) => {
    setInvoices((prev) => prev.map((inv) => (inv.id === id ? { ...inv, settled: !inv.settled } : inv)));
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    setInvoices((prev) => prev.filter((inv) => inv.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  return (
    <main className="mx-auto max-w-2xl p-6">
      <Stack direction="column" gap="sm">
        <NextLink href="/more" className="text-sm text-muted hover:underline">
          ← 더보기로
        </NextLink>
        <Title size="md">인보이스 관리</Title>
      </Stack>

      <Stack direction="column" gap="md" className="mt-4">
        <Text weight="bold" leaf>
          이번 달 사용 금액
        </Text>

        <Card padding="sm">
          {activeAgencies.map((agency) => (
            <div
              key={agency.id}
              className="flex items-center justify-between gap-2 border-b border-dashed border-line py-3 text-sm last:border-b-0"
            >
              <Stack direction="column" gap="xs">
                <Text weight="bold">{agency.name}</Text>
                <Text variant="sub">{currentPeriod} · 사용 중</Text>
              </Stack>
              <Stack gap="sm" align="center">
                <Text weight="bold">{getPendingUsage(agency.id).toLocaleString()}원</Text>
                <Badge variant="gray">발행예정</Badge>
              </Stack>
            </div>
          ))}

          {activeAgencies.length === 0 && <Text variant="sub">등록된 여행사가 없습니다.</Text>}
        </Card>

        <Text weight="bold" leaf>
          발행된 인보이스
        </Text>

        <Card padding="sm">
          {invoices.map((invoice) => (
            <div
              key={invoice.id}
              className="flex items-center justify-between gap-2 border-b border-dashed border-line py-3 text-sm last:border-b-0"
            >
              <Stack direction="column" gap="xs">
                <Text weight="bold">{findAgencyName(invoice.agencyId)}</Text>
                <Text variant="sub">
                  {invoice.period} · {invoice.amountKrw.toLocaleString()}원
                </Text>
              </Stack>
              <Stack gap="sm" align="center">
                <Badge variant={invoice.settled ? "success" : "gray"}>{invoice.settled ? "정산완료" : "미정산"}</Badge>
                <Toggle on={invoice.settled} onChange={() => toggleSettled(invoice.id)} />
                <IconX aria-label={`${invoice.period} 인보이스 삭제`} onClick={() => setDeleteTarget(invoice)} />
              </Stack>
            </div>
          ))}

          {invoices.length === 0 && <Text variant="sub">아직 발행된 인보이스가 없습니다.</Text>}
        </Card>

        <NoticeBox tone="gray">
          인보이스는 매월 1일 전월 기준으로 자동 발행됩니다. 통화는 KRW(세금 라인 없음)이며, 정산(입금)
          확인은 위 목록에서 토글로 수동 체크합니다.
        </NoticeBox>
      </Stack>

      <ConfirmPopup
        open={Boolean(deleteTarget)}
        message={`${deleteTarget?.period} · ${deleteTarget ? findAgencyName(deleteTarget.agencyId) : ""} 인보이스를 삭제합니다. 이 작업은 되돌릴 수 없습니다.`}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </main>
  );
}
