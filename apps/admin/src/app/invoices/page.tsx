"use client";

import { useState } from "react";
import NextLink from "next/link";
import { Title } from "@chinguya/ui/title";
import { Text } from "@chinguya/ui/text";
import { Card } from "@chinguya/ui/card";
import { Stack } from "@chinguya/ui/stack";
import { Badge } from "@chinguya/ui/badge";
import { Chip } from "@chinguya/ui/chip";
import { NoticeBox } from "@chinguya/ui/notice-box";
import { agencies } from "@/data/agencyData";
import { invoices, getCurrentPeriod, getPendingUsage } from "@/data/invoiceData";

/**
 * 인보이스 관리 — 목록(S2-A5). 매월 1일에 전월 기준으로 여행사별 인보이스가 자동 발행된다는
 * 규칙(packages/types Invoice 문서 주석)에 따라, 관리자가 여행사·금액을 직접 입력해서 발행하지
 * 않는다 — 여행사 예약 사용액(agencyReservationData)을 합산해 자동으로 만들어진다
 * (invoiceData.issueDueInvoices). 그래서 이 화면엔 수동 '등록' 버튼이 없다.
 *
 * 화면은 두 구간으로 나뉜다: 아직 마감 전이라 계속 올라가는 "이번 달 사용 금액(발행예정)"과,
 * 이미 마감돼 자동 발행된 "발행된 인보이스" 목록(여행사 필터 가능). 카드를 누르면 라인아이템·
 * 입금 확인이 있는 상세(S2-A6, `/invoices/[id]`)로 이동한다 — 정산(입금) 확인은 상세에서만 한다.
 */
export default function AdminInvoicesPage() {
  const activeAgencies = agencies.filter((a) => a.active);
  const currentPeriod = getCurrentPeriod();

  const [agencyFilter, setAgencyFilter] = useState<string | null>(null);

  const findAgencyName = (id: string) => agencies.find((a) => a.id === id)?.name ?? id;

  const filteredInvoices = agencyFilter ? invoices.filter((inv) => inv.agencyId === agencyFilter) : invoices;

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

        <Chip.List scrollArrows>
          <Chip on={agencyFilter === null} onClick={() => setAgencyFilter(null)}>
            전체
          </Chip>
          {agencies.map((agency) => (
            <Chip key={agency.id} on={agencyFilter === agency.id} onClick={() => setAgencyFilter(agency.id)}>
              {agency.name}
            </Chip>
          ))}
        </Chip.List>

        <Stack direction="column" gap="sm">
          {filteredInvoices.map((invoice) => (
            <NextLink key={invoice.id} href={`/invoices/${invoice.id}`} className="block">
              <Card padding="sm">
                <Stack justify="between" align="center">
                  <Stack direction="column" gap="xs">
                    <Text weight="bold">{findAgencyName(invoice.agencyId)}</Text>
                    <Text variant="sub">
                      {invoice.period} · {invoice.amountKrw.toLocaleString()}원
                    </Text>
                  </Stack>
                  <Badge variant={invoice.settled ? "success" : "gray"}>{invoice.settled ? "정산완료" : "미정산"}</Badge>
                </Stack>
              </Card>
            </NextLink>
          ))}

          {filteredInvoices.length === 0 && <Text variant="sub">아직 발행된 인보이스가 없습니다.</Text>}
        </Stack>

        <NoticeBox tone="gray">
          인보이스는 매월 1일 전월 기준으로 자동 발행됩니다. 통화는 KRW(세금 라인 없음)이며, 정산(입금)
          확인은 카드를 눌러 들어간 상세 화면에서 인보이스 단위로 합니다.
        </NoticeBox>
      </Stack>
    </main>
  );
}
