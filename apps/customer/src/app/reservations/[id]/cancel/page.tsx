"use client";

import { useState } from "react";
import NextLink from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Title } from "@chinguya/ui/title";
import { Stack } from "@chinguya/ui/stack";
import { Card } from "@chinguya/ui/card";
import { Kv } from "@chinguya/ui/kv";
import { Input } from "@chinguya/ui/input";
import { LabeledBox } from "@chinguya/ui/labeled-box";
import { Button } from "@chinguya/ui/button";
import { FormMessage } from "@chinguya/ui/form-message";
import { NoticeBox } from "@chinguya/ui/notice-box";
import { ComingSoon } from "@chinguya/ui/coming-soon";
import { Toast } from "@chinguya/ui/toast";
import { Banner } from "@chinguya/ui/banner";
import { findReservationById, updateReservationStatus } from "@/data/reservationData";
import { getCancellationFeeRate, getDaysBeforeUse } from "@/data/cancellationData";
import { ScrollReveal } from "@/components/ScrollReveal";

/**
 * S1-C7 취소 요청. 수수료는 이용일 기준 차등 요율(관리자 설정, CancellationFeeRule)로 계산해서
 * 보여주고, 고객이 확인 후 진행한다. 환불 계좌는 이 화면에서 입력받고, 실제 이체는 관리자가
 * 수동으로 처리한다(문서 규칙) — 그래서 여기서는 계좌 정보를 별도로 저장하지 않고 화면에서만
 * 확인하는 용도로 쓴다.
 */
export default function ReservationCancelPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const reservation = findReservationById(params.id);
  const [bankInfo, setBankInfo] = useState("");
  const [done, setDone] = useState(false);

  if (!reservation) {
    return <ComingSoon label="예약 정보를 찾을 수 없습니다" />;
  }

  const daysBeforeUse = getDaysBeforeUse(reservation.useDate);
  const feeRate = getCancellationFeeRate(daysBeforeUse);
  const feeAmount = Math.round(reservation.amountKrw * feeRate);
  const refundAmount = reservation.amountKrw - feeAmount;

  const handleSubmit = () => {
    if (!bankInfo.trim()) return;
    updateReservationStatus(reservation.id, "cancel_requested", feeRate);
    setDone(true);
  };

  return (
    <main>
      {/* 소메뉴 배너는 소속된 대메뉴("내정보/내 예약")의 이름을 그대로 쓴다 */}
      <Banner size="sm" title="내 예약" image="/banner-contact.png" />

      <div className="mx-auto max-w-2xl p-6">
      <Stack direction="column" gap="sm">
        <NextLink href={`/reservations/${reservation.id}`} className="text-sm text-muted hover:underline">
          ← 이전 페이지로 이동
        </NextLink>
        <Title size="lg">예약 취소 요청</Title>
      </Stack>

      <ScrollReveal>
      <Card className="mt-4">
        <Kv
          items={[
            { key: "결제 금액", value: `₩ ${reservation.amountKrw.toLocaleString()}` },
            { key: "취소 수수료", value: `− ₩ ${feeAmount.toLocaleString()} (${Math.round(feeRate * 100)}%)` },
            { key: "환불 예정액", value: `₩ ${refundAmount.toLocaleString()}` },
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
          <Input
            value={bankInfo}
            onChange={(e) => setBankInfo(e.target.value)}
            placeholder="예: 신한은행 110-000-000000 / 홍길동"
          />
        </LabeledBox>
        <FormMessage type="helper">환불 계좌는 취소 요청 시점에 입력합니다. 실제 이체는 관리자가 수동 처리합니다.</FormMessage>
      </Stack>
      </ScrollReveal>

      <Button fullWidth className="mt-6" disabled={!bankInfo.trim()} onClick={handleSubmit}>
        취소 요청 보내기
      </Button>

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
