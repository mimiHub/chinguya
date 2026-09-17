"use client";

import { useEffect, useState } from "react";
import NextLink from "next/link";
import { useParams, useRouter } from "next/navigation";
import { createApiClient, ApiError, type CustomerCancellationQuote } from "@chinguya/api-client";
import { Title, Text, Stack, Card, Kv, Input, LabeledBox, Button, FormMessage, NoticeBox, Toast, Banner, Alert } from "@chinguya/ui";
import { useCustomerAuth } from "@/context/CustomerAuthContext";
import { ScrollReveal } from "@/components/ScrollReveal";

/**
 * S1-C7 취소 요청. 수수료는 이용일 기준 차등 요율(관리자 설정)로 서버가 항목별로 계산해서
 * 합계를 보여 주고, 고객이 확인 후 진행한다. 환불 계좌는 이 화면에서 입력받고, 실제 이체는
 * 관리자가 수동으로 처리한다.
 *
 * Core API 실연동: GET /v1/bookings/{id}/cancellation-quote, POST /v1/bookings/{id}/cancel-request.
 * 계약은 packages/api-spec/openapi/chinguya-slice1-openapi.yaml.
 *
 * 와이어프레임에는 항목 선택이 없어서 itemIds 없이 부른다 — 서버가 지금 취소 가능한 항목 전부를 대상으로 잡는다.
 */

const api = createApiClient();

const EMPTY_ACCOUNT = { bankName: "", accountNumber: "", accountHolder: "" };

export default function ReservationCancelPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { session, loading: authLoading } = useCustomerAuth();
  const [quote, setQuote] = useState<CustomerCancellationQuote | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [account, setAccount] = useState(EMPTY_ACCOUNT);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (authLoading || !session) return;
    let active = true;
    api.customerBookings
      .cancellationQuote(params.id)
      .then((res) => {
        if (active) setQuote(res);
      })
      .catch((err: unknown) => {
        if (active) setLoadError(err instanceof ApiError ? err.message : "취소 금액을 불러오지 못했습니다.");
      });
    return () => {
      active = false;
    };
  }, [authLoading, session, params.id]);

  const accountFilled = Object.values(account).every((v) => v.trim());

  const handleSubmit = async () => {
    if (!accountFilled) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await api.customerBookings.requestCancel(params.id, {
        refundAccount: {
          bankName: account.bankName.trim(),
          accountNumber: account.accountNumber.trim(),
          accountHolder: account.accountHolder.trim(),
        },
      });
      setDone(true);
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : "취소 요청을 보내지 못했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const body = (() => {
    if (authLoading) return null;
    if (!session) {
      return (
        <Stack direction="column" gap="md" className="mt-6">
          <Text tone="secondary">취소 요청은 로그인 후 할 수 있습니다.</Text>
          <Button href={`/login?redirect=${encodeURIComponent(`/reservations/${params.id}/cancel`)}`}>로그인</Button>
        </Stack>
      );
    }
    if (loadError) {
      return (
        <Alert status="error" className="mt-4">
          {loadError}
        </Alert>
      );
    }
    if (!quote) {
      return (
        <Text variant="sub" className="mt-4">
          불러오는 중…
        </Text>
      );
    }
    return (
      <>
        <ScrollReveal>
          <Card className="mt-4">
            <Kv
              items={[
                { key: "결제 금액", value: `₩ ${quote.selectedAmount.toLocaleString()}` },
                { key: "취소 수수료", value: `− ₩ ${quote.cancellationFee.toLocaleString()}` },
                { key: "환불 예정액", value: `₩ ${quote.refundAmount.toLocaleString()}` },
              ]}
            />
          </Card>

          <NoticeBox tone="gray" className="mt-4">
            수수료는 이용일 기준 차등 요율(관리자 설정)로 계산됩니다. 취소 요청 시 위 수수료·환불액을
            확인 후 진행해 주세요.
          </NoticeBox>
        </ScrollReveal>

        <ScrollReveal delay={100}>
          <Stack direction="column" gap="sm" className="mt-6">
            <LabeledBox label="환불받을 계좌 (은행/번호/예금주)" required>
              <Stack direction="column" gap="xs">
                <Input
                  value={account.bankName}
                  onChange={(e) => setAccount({ ...account, bankName: e.target.value })}
                  placeholder="은행 (예: 신한은행)"
                  maxLength={50}
                  aria-label="은행"
                />
                <Input
                  value={account.accountNumber}
                  onChange={(e) => setAccount({ ...account, accountNumber: e.target.value })}
                  placeholder="계좌번호 (예: 110-000-000000)"
                  maxLength={50}
                  inputMode="numeric"
                  aria-label="계좌번호"
                />
                <Input
                  value={account.accountHolder}
                  onChange={(e) => setAccount({ ...account, accountHolder: e.target.value })}
                  placeholder="예금주 (예: 홍길동)"
                  maxLength={50}
                  aria-label="예금주"
                />
              </Stack>
            </LabeledBox>
            <FormMessage type="helper">환불 계좌는 취소 요청 시점에 입력합니다. 실제 이체는 관리자가 수동 처리합니다.</FormMessage>
          </Stack>
        </ScrollReveal>

        {submitError && (
          <Alert status="error" className="mt-4" icon={false}>
            {submitError}
          </Alert>
        )}

        <Button fullWidth className="mt-6" disabled={!accountFilled || submitting || done} onClick={handleSubmit}>
          취소 요청 보내기
        </Button>
      </>
    );
  })();

  return (
    <main>
      {/* 소메뉴 배너는 소속된 대메뉴("내정보/내 예약")의 이름을 그대로 쓴다 */}
      <Banner size="sm" title="내 예약" image="/banner-contact.png" />

      <div className="mx-auto max-w-2xl p-6">
        <Stack direction="column" gap="sm">
          <NextLink href={`/reservations/${params.id}`} className="text-sm text-muted hover:underline">
            ← 이전 페이지로 이동
          </NextLink>
          <Title size="lg">예약 취소 요청</Title>
        </Stack>

        {body}

        <Toast
          open={done}
          onClose={() => {
            setDone(false);
            router.push("/mypage");
          }}
          message="취소 요청이 접수되었습니다"
          actionLabel="내 예약 보기"
          actionHref="/mypage"
        />
      </div>
    </main>
  );
}
