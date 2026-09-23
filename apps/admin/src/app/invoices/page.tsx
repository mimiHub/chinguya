"use client";

import { useCallback, useEffect, useState } from "react";
import NextLink from "next/link";
import { Title, Text, EmptyState, Card, Stack, Badge, Chip, NoticeBox, Alert } from "@chinguya/ui";
import { EmptyStateCat } from "@/components/EmptyStateCat";
import { INVOICE_SETTLEMENT_LABEL } from "@chinguya/types";
import { createApiClient, ApiError, type AdminInvoiceList } from "@chinguya/api-client";

const api = createApiClient();

/**
 * 인보이스 관리 — 목록(`a-invoice`, S2-A5). 계약: api-spec/openapi/chinguya-admin-api.yaml.
 *
 * 매월 1일 전월 기준으로 **자동 발행**되므로 수동 '등록' 버튼이 없다. 발행은 서버가 목록 조회
 * 때 겸해서 하므로(멱등), 화면은 그냥 목록을 부르기만 하면 된다.
 *
 * 화면은 두 구간이다: 아직 마감 전이라 계속 올라가는 '이번 달 사용 금액'(응답의 `pending`)과,
 * 이미 발행된 인보이스(`invoices`, 여행사 필터 가능). 발행 전 건은 id 가 없어서 상세로 들어갈
 * 수 없고, 그래서 카드가 링크가 아니다. 발행된 카드를 누르면 라인아이템·입금 확인이 있는
 * 상세(S2-A6, `/invoices/[id]`)로 간다 — 정산 확인은 상세에서만 한다.
 *
 * 대상 월·금액을 화면에서 계산하지 않고 서버 값을 그대로 쓴다 — 월 경계에서 브라우저 시계가
 * 서버와 다르면 하루 어긋난다(여행사 인보이스 S2-G7 과 같은 원칙).
 */
export default function AdminInvoicesPage() {
  const [list, setList] = useState<AdminInvoiceList | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [agencyFilter, setAgencyFilter] = useState<string | null>(null);

  const loadInvoices = useCallback(async () => {
    try {
      const response = await api.adminInvoices.list();
      setLoadError(null);
      setList(response);
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : "인보이스 목록을 불러오지 못했습니다.");
    }
  }, []);

  useEffect(() => {
    void loadInvoices();
  }, [loadInvoices]);

  // 필터는 클라이언트에서 건다 — 전량 응답이라 왕복이 필요 없고, 칩을 눌렀을 때 즉시 반응한다.
  const pending = list?.pending ?? [];
  const invoices = (list?.invoices ?? []).filter(
    (invoice) => agencyFilter === null || invoice.agencyId === agencyFilter,
  );

  /** 필터 칩 목록 — 인보이스가 있거나 이번 달 사용 중인 여행사만 나온다. */
  const filterAgencies = [...(list?.pending ?? []), ...(list?.invoices ?? [])].reduce<
    { agencyId: string; agencyName: string }[]
  >((acc, row) => {
    if (!acc.some((a) => a.agencyId === row.agencyId)) {
      acc.push({ agencyId: row.agencyId, agencyName: row.agencyName });
    }
    return acc;
  }, []);

  return (
    <main className="mx-auto max-w-2xl p-6">
      <Stack direction="column" gap="sm">
        <NextLink href="/more" className="text-sm text-muted hover:underline">
          ← 더보기로
        </NextLink>
        <Title size="md">인보이스 관리</Title>
      </Stack>

      {loadError && (
        <Alert status="error" icon={true} className="mt-4">
          {loadError}
        </Alert>
      )}

      <Stack direction="column" gap="md" className="mt-4">
        <Text weight="bold" leaf>
          이번 달 사용 금액
        </Text>

        <Card padding="sm">
          {pending.map((row) => (
            <div
              key={row.agencyId}
              className="flex items-center justify-between gap-2 border-b border-dashed border-line py-3 text-sm last:border-b-0"
            >
              <Stack direction="column" gap="xs">
                <Text weight="bold">{row.agencyName}</Text>
                <Text variant="sub">{row.period} · 사용 중</Text>
              </Stack>
              <Stack gap="sm" align="center">
                <Text weight="bold">{row.amount.toLocaleString()}원</Text>
                <Badge variant="gray">{INVOICE_SETTLEMENT_LABEL.pending}</Badge>
              </Stack>
            </div>
          ))}

          {pending.length === 0 && (
            <EmptyState>
              {list === null && !loadError ? "불러오는 중…" : "사용 가능한 여행사가 없습니다."}
            </EmptyState>
          )}
        </Card>

        <Text weight="bold" leaf>
          발행된 인보이스
        </Text>

        {filterAgencies.length > 0 && (
          <Chip.List scrollArrows>
            <Chip on={agencyFilter === null} onClick={() => setAgencyFilter(null)}>
              전체
            </Chip>
            {filterAgencies.map((agency) => (
              <Chip
                key={agency.agencyId}
                on={agencyFilter === agency.agencyId}
                onClick={() => setAgencyFilter(agency.agencyId)}
              >
                {agency.agencyName}
              </Chip>
            ))}
          </Chip.List>
        )}

        <Stack direction="column" gap="sm">
          {invoices.map((invoice) => (
            <NextLink
              key={invoice.invoiceId}
              href={`/invoices/${invoice.invoiceId}`}
              className="block"
            >
              <Card padding="sm">
                <Stack justify="between" align="center">
                  <Stack direction="column" gap="xs">
                    <Text weight="bold">{invoice.agencyName}</Text>
                    <Text variant="sub">
                      발행 {invoice.issuedAt} · {invoice.amount.toLocaleString()}원
                    </Text>
                  </Stack>
                  <Badge variant={invoice.settled ? "success" : "warning"}>
                    {invoice.settled
                      ? INVOICE_SETTLEMENT_LABEL.settled
                      : INVOICE_SETTLEMENT_LABEL.unsettled}
                  </Badge>
                </Stack>
              </Card>
            </NextLink>
          ))}

          {invoices.length === 0 && (
            <EmptyStateCat
              message={
                list === null && !loadError ? "불러오는 중…" : "아직 발행된 인보이스가 없습니다."
              }
            />
          )}
        </Stack>

        <NoticeBox tone="gray">
          인보이스는 매월 1일 전월 기준으로 자동 발행됩니다. 통화는 KRW(세금 라인 없음)이며,
          정산(입금) 확인은 카드를 눌러 들어간 상세 화면에서 인보이스 단위로 합니다.
        </NoticeBox>
      </Stack>
    </main>
  );
}
