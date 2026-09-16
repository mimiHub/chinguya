"use client";

import { Suspense, useEffect, useState } from "react";
import NextLink from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createApiClient, ApiError, type CustomerDepositInfo } from "@chinguya/api-client";
import { Title, Text, Stack, Card, Kv, Button, Alert, Toast, Banner } from "@chinguya/ui";
import { useCustomerAuth } from "@/context/CustomerAuthContext";
import { ScrollReveal } from "@/components/ScrollReveal";

/**
 * 입금 안내 · 확인 요청 `deposit`(S1-C4). 장바구니(S1-C3)에서 확정한 예약(?bookingId=)의 무통장 입금
 * 안내를 보여 주고, 입금 후 "입금 확인 요청"을 받는다. PG 미사용.
 *
 * Core API 실연동: GET /v1/bookings/{id}/deposit-info, POST /v1/bookings/{id}/deposit-request.
 * 계약은 packages/api-spec/openapi/chinguya-slice1-openapi.yaml.
 *
 * 상태 흐름(Model B): 확정 직후 = 입금대기 → 입금 확인 요청 = 접수 → 관리자가 입금을 확인하면 완료.
 * 요청은 입금대기일 때만 할 수 있다. 24시간 안에 입금하지 않으면 관리자가 강제취소할 수 있다.
 */

const api = createApiClient();

function formatDueBy(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function DepositContent() {
  const params = useSearchParams();
  const router = useRouter();
  const bookingId = params.get("bookingId") ?? "";
  const { session, loading: authLoading } = useCustomerAuth();
  const [info, setInfo] = useState<CustomerDepositInfo | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [requesting, setRequesting] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [requested, setRequested] = useState(false);

  useEffect(() => {
    if (authLoading || !session || !bookingId) return;
    let active = true;
    api.customerBookings
      .depositInfo(bookingId)
      .then((res) => {
        if (active) setInfo(res);
      })
      .catch((err: unknown) => {
        if (active) setLoadError(err instanceof ApiError ? err.message : "입금 안내를 불러오지 못했습니다.");
      });
    return () => {
      active = false;
    };
  }, [authLoading, session, bookingId]);

  const handleRequest = async () => {
    if (!info) return;
    setRequesting(true);
    setRequestError(null);
    try {
      const booking = await api.customerBookings.requestDeposit(bookingId);
      setInfo({ ...info, status: booking.status });
      setRequested(true);
    } catch (err) {
      setRequestError(err instanceof ApiError ? err.message : "입금 확인 요청을 하지 못했습니다.");
    } finally {
      setRequesting(false);
    }
  };

  const body = (() => {
    if (authLoading) return null;
    if (!session) {
      return (
        <Stack direction="column" gap="md" className="mt-6">
          <Text tone="secondary">입금 안내는 로그인 후 확인할 수 있습니다.</Text>
          <Button href={`/login?redirect=${encodeURIComponent(`/deposit?bookingId=${bookingId}`)}`}>로그인</Button>
        </Stack>
      );
    }
    if (!bookingId) {
      return (
        <Alert status="error" className="mt-4">
          예약 정보를 찾을 수 없습니다.
        </Alert>
      );
    }
    if (loadError) {
      return (
        <Alert status="error" className="mt-4">
          {loadError}
        </Alert>
      );
    }
    if (!info) {
      return (
        <Text variant="sub" className="mt-4">
          불러오는 중…
        </Text>
      );
    }
    const awaitingDeposit = info.status === "AWAITING_DEPOSIT";
    return (
      <>
        <ScrollReveal>
        <Card className="mt-4">
          <Kv
            items={[
              { key: "예약번호", value: info.bookingNumber },
              { key: "입금 계좌", value: `${info.bankName} ${info.accountNumber}` },
              { key: "예금주", value: info.accountHolder },
              { key: "입금액", value: `₩ ${info.amount.toLocaleString()}` },
              ...(info.dueBy ? [{ key: "입금 기한", value: formatDueBy(info.dueBy) }] : []),
            ]}
          />
        </Card>
        </ScrollReveal>

        <ScrollReveal delay={100}>
        <Alert status="info" className="mt-4" icon={false}>
          PG 미사용. 안내 계좌(관리자 설정 1개)로 입금 후 아래 버튼으로 확인 요청 → 상태 접수.
          24시간 내 미입금 시 관리자가 강제취소할 수 있습니다.
        </Alert>
        </ScrollReveal>

        {requestError && (
          <Alert status="error" className="mt-4" icon={false}>
            {requestError}
          </Alert>
        )}

        <Button fullWidth className="mt-6" disabled={!awaitingDeposit || requesting} onClick={handleRequest}>
          {awaitingDeposit ? "입금 확인 요청" : "입금 확인 요청 완료"}
        </Button>
      </>
    );
  })();

  return (
    <main>
      {/* 소메뉴 배너는 소속된 대메뉴("장바구니/예약 확인")의 이름을 그대로 쓴다 */}
      <Banner size="sm" title="예약 확인" image="/banner-notice.png" />

      <div className="mx-auto max-w-2xl p-6">
      <Stack direction="column" gap="sm">
        <NextLink href="/cart" className="text-sm text-muted hover:underline">
          ← 이전 페이지로 이동
        </NextLink>
        <Title size="lg">입금 안내</Title>
      </Stack>

      {body}

      <Toast
        open={requested}
        onClose={() => {
          setRequested(false);
          router.push("/mypage");
        }}
        message="입금 확인 요청이 접수되었습니다"
        actionLabel="내 예약 보기"
        actionHref="/mypage"
      />
      </div>
    </main>
  );
}

export default function DepositPage() {
  return (
    <Suspense fallback={null}>
      <DepositContent />
    </Suspense>
  );
}
