"use client";

import NextLink from "next/link";
import { useParams } from "next/navigation";
import { Title } from "@chinguya/ui/title";
import { Text } from "@chinguya/ui/text";
import { Stack } from "@chinguya/ui/stack";
import { Card } from "@chinguya/ui/card";
import { Kv } from "@chinguya/ui/kv";
import { StatusBadge } from "@chinguya/ui/badge";
import { Button } from "@chinguya/ui/button";
import { ComingSoon } from "@chinguya/ui/coming-soon";
import { Banner } from "@chinguya/ui/banner";
import { findRentalProductById, RENTAL_OPTION_LABEL } from "@/data/rentalData";
import { findReservationById } from "@/data/reservationData";
import { ScrollReveal } from "@/components/ScrollReveal";

/** S1-C6 예약 상세 · 바우처. 현장 이용 시 예약번호가 증빙 역할을 한다. */
export default function ReservationDetailPage() {
  const params = useParams<{ id: string }>();
  const reservation = findReservationById(params.id);
  const product = reservation ? findRentalProductById(reservation.productId) : undefined;

  if (!reservation || !product) {
    return <ComingSoon label="예약 정보를 찾을 수 없습니다" />;
  }

  const canCancel = reservation.status === "received" || reservation.status === "completed";

  return (
    <main>
      {/* 소메뉴 배너는 소속된 대메뉴("내정보/내 예약")의 이름을 그대로 쓴다 */}
      <Banner size="sm" title="내 예약" image="/banner-contact.png" />

      <div className="mx-auto max-w-2xl p-6">
      <Stack direction="column" gap="sm">
        <NextLink href="/mypage" className="text-sm text-muted hover:underline">
          ← 이전 페이지로 이동
        </NextLink>
        <Title size="lg">예약 상세</Title>
      </Stack>

      <ScrollReveal>
      <Card className="mt-4 text-center">
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-lg bg-gray-50 p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={product.image} alt={product.title} className="h-full w-full object-contain" />
        </div>
        <Text weight="bold" className="mt-2">
          {product.title}
        </Text>
        <div className="mt-2">
          <StatusBadge status={reservation.status} />
        </div>
      </Card>
      </ScrollReveal>

      <ScrollReveal delay={100}>
      <Kv
        className="mt-4"
        items={[
          { key: "예약번호", value: reservation.id },
          { key: "상품/옵션", value: `${product.title} · ${RENTAL_OPTION_LABEL[reservation.rentalOption]}` },
          {
            key: "이용일",
            value: reservation.useDateEnd
              ? `${reservation.useDate} ~ ${reservation.useDateEnd}`
              : reservation.useDate,
          },
          { key: "수량", value: `${reservation.quantity}개` },
          { key: "여권명", value: reservation.passportName },
          { key: "결제 금액", value: `₩ ${reservation.amountKrw.toLocaleString()}` },
        ]}
      />
      </ScrollReveal>

      {canCancel && (
        <NextLink href={`/reservations/${reservation.id}/cancel`} className="mt-6 block">
          <Button fullWidth >
            취소 요청
          </Button>
        </NextLink>
      )}
      </div>
    </main>
  );
}
