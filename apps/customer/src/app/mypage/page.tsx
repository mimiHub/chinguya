"use client";

import { useState } from "react";
import NextLink from "next/link";
import { Title } from "@chinguya/ui/title";
import { Text } from "@chinguya/ui/text";
import { Stack } from "@chinguya/ui/stack";
import { Tab } from "@chinguya/ui/tab";
import { StatusBadge } from "@chinguya/ui/badge";
import { Banner } from "@chinguya/ui/banner";
import { findRentalProductById, RENTAL_OPTION_LABEL } from "@/data/rentalData";
import {
  listReservations,
  MY_RESERVATION_TAB_ORDER,
  MY_RESERVATION_TAB_LABEL,
  type MyReservationTab,
} from "@/data/reservationData";
import { Card } from "@chinguya/ui/card";

/**
 * S1-C5 예약 목록(내 예약). 로그인 기능이 아직 없어서 "이 브라우저 세션에서 만든 예약 전부"를
 * 그대로 보여준다(사용자 구분 없음) — reservationData.ts 문서 주석 참고.
 */
export default function MyPage() {
  const [tab, setTab] = useState<MyReservationTab>("all");
  const reservations = listReservations();
  const filtered = tab === "all" ? reservations : reservations.filter((r) => r.status === tab);

  return (
    <main>
      {/* 하단 탭 대메뉴 화면(내 예약)이라 배너를 크게 쓴다 */}
      <Banner size="lg" title="예약 목록" image="/banner-mypage.png" />

      <div className="mx-auto max-w-2xl p-6">
      <Title size="lg">내 예약</Title>

      <Tab
        variant="capsule"
        items={MY_RESERVATION_TAB_ORDER.map((key) => ({ key, label: MY_RESERVATION_TAB_LABEL[key] }))}
        activeKey={tab}
        onChange={(key) => setTab(key as MyReservationTab)}
        className="mt-4"
      />

      <Stack direction="column" gap="sm" className="mt-4">
        {filtered.map((reservation) => {
          const product = findRentalProductById(reservation.productId);
          return (
            <NextLink key={reservation.id} href={`/reservations/${reservation.id}`} className="block">
              <Card className="flex items-center justify-between gap-2 border-b border-dashed border-line py-3 text-sm last:border-b-0">
                <Stack direction="column" gap="xs">
                  <Text weight="medium">{product?.title ?? reservation.productId}</Text>
                  <Text variant="sub">
                    {RENTAL_OPTION_LABEL[reservation.rentalOption]} · {reservation.useDate}
                    {reservation.useDateEnd ? ` ~ ${reservation.useDateEnd}` : ""} · ×{reservation.quantity}
                  </Text>
                </Stack>
                <StatusBadge status={reservation.status} />
              </Card>
            </NextLink>
          );
        })}
      </Stack>

      {filtered.length === 0 && (
        <Text tone="secondary" className="mt-8 text-center">
          {tab === "all" ? "아직 예약 내역이 없습니다." : "해당 상태의 예약이 없습니다."}
        </Text>
      )}      
      </div>
    </main>
  );
}
