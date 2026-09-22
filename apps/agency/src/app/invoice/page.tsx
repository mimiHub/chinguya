"use client";

import { useCallback, useEffect, useState } from "react";
import { Title, Text, EmptyState, Table, Stack, Card, Alert, Badge } from "@chinguya/ui";
import { RENTAL_OPTION_LABEL } from "@chinguya/types";
import { createApiClient, ApiError, type AgencyInvoice } from "@chinguya/api-client";
import { ScrollReveal } from "@/components/ScrollReveal";

const api = createApiClient();

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback;
}

/**
 * S2-G7 여행사 인보이스(`g-invoice`). 매월 1일 전월 기준으로 발행되며, 라인아이템은 그 달에
 * 이용일이 든 **완료·취소** 예약 건이다. 취소 건의 '정산 반영액'은 예약 금액이 아니라
 * **취소 수수료**라, 상태 열을 함께 봐야 금액의 뜻이 정해진다. KRW 고정·세금 라인 없음이고,
 * 실제 정산(입금)은 시스템 밖 수동 확인이라 이 화면은 조회 전용이다.
 *
 * 관리자 인보이스(S2-A5/A6)와 같은 집계라 합계가 항상 일치한다 — 서버 쪽 단일 출처는
 * chinguya-api 의 InvoiceLines 다.
 *
 * Core API(GET /v1/agency/invoices)에 실연동돼 있다 — 계약은
 * packages/api-spec/openapi/chinguya-agency-api.yaml.
 *
 * 대상 월·합계를 화면에서 계산하지 않고 서버 값을 그대로 쓴다. 월 경계에서 브라우저 시계가
 * 서버와 다르면 엉뚱한 달의 인보이스를 보여주게 되기 때문이다.
 */
export default function AgencyInvoicePage() {
  const [invoice, setInvoice] = useState<AgencyInvoice | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadInvoice = useCallback(async () => {
    try {
      const response = await api.invoices.previousMonth();
      setLoadError(null);
      setInvoice(response);
    } catch (err) {
      setLoadError(errorMessage(err, "인보이스를 불러오지 못했습니다."));
    }
  }, []);

  useEffect(() => {
    void loadInvoice();
  }, [loadInvoice]);

  const tableEmptyMessage = loadError ? (
    <Alert status="error" icon={true}>
      {loadError}
    </Alert>
  ) : invoice === null ? (
    <EmptyState>인보이스를 불러오는 중입니다.</EmptyState>
  ) : (
    <EmptyState>{invoice.period} 발행 대상 예약이 없습니다.</EmptyState>
  );

  return (
    <main className="flex h-full min-h-0 flex-col">
      <Stack direction="column" className="min-h-0 flex-1">
        <ScrollReveal className="shrink-0">
        <div className="flex items-center gap-2">
          <Title size="md">인보이스</Title>
          {/* 참고 디자인("Nagual" + "PRO" 배지)처럼, 제목 바로 옆에 진한 배경 + 흰 글씨의
              작은 사각 배지로 붙인다 — 기존 Badge 컴포넌트는 rounded-full(알약형) + 옅은
              배경(gray-100)이라 이 느낌과 달라서, 여기서는 그 컴포넌트를 쓰지 않고 직접
              스타일을 준다. */}
          {invoice && (
            <span className="inline-flex items-center rounded-md bg-gray-700 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
              {invoice.period} · {invoice.currency}
            </span>
          )}
        </div>
        </ScrollReveal>

      <ScrollReveal delay={80} className="flex min-h-0 flex-1 flex-col">
      <Card className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden">
          <Table
        className="min-h-0 flex-1 overflow-y-auto"
        columns={[
          { key: "date", label: "일자", width: "10%" },
          { key: "id", label: "예약번호", width: "14%" },
          { key: "product", label: "상품·옵션" },
          { key: "qty", label: "수량", width: "8%", align: "center" },
          { key: "unitPrice", label: "단가", width: "14%", align: "right" },
          { key: "status", label: "상태", width: "10%", align: "center" },
          { key: "amount", label: "정산 반영액", width: "14%", align: "right" },
        ]}
        rows={(invoice?.lineItems ?? []).map((line) => ({
          date: line.useDate.slice(5),
          id: line.reservationNumber,
          product: `${line.assetName} · ${RENTAL_OPTION_LABEL[line.optionType]}`,
          qty: line.quantity,
          unitPrice: line.unitPrice.toLocaleString(),
          status:
            line.status === "CANCELLED" ? (
              <Badge variant="error">취소</Badge>
            ) : (
              <Badge variant="success">완료</Badge>
            ),
          amount: line.amount.toLocaleString(),
        }))}
        emptyMessage={tableEmptyMessage}
      />
        </div>
      </Card>
      </ScrollReveal>
      </Stack>

      {invoice !== null && invoice.lineItems.length > 0 && (
        <div className="mt-2 flex justify-end pr-2">
          <Text weight="bold">합계 ₩{invoice.totalAmount.toLocaleString()}</Text>
        </div>
      )}
    </main>
  );
}
