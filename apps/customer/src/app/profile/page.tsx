"use client";

import { OFF_SITE_RETURN_FEE_KRW } from "@chinguya/types";
import { Banner } from "@chinguya/ui/banner";
import { Card } from "@chinguya/ui/card";
import { Title } from "@chinguya/ui/title";
import { Text } from "@chinguya/ui/text";
import { Stack } from "@chinguya/ui/stack";
import { Kv } from "@chinguya/ui/kv";
import { Button } from "@chinguya/ui/button";
import { StatusBadge } from "@chinguya/ui/badge";
import { useCart, type CartLine } from "@/context/CartContext";
import { listReservations } from "@/data/reservationData";
import { findRentalProductById, RENTAL_OPTION_LABEL } from "@/data/rentalData";

// 로그인 기능이 아직 없어서, 이 세션을 쓰는 사용자 본인 정보를 그대로 고정값으로 둔다.
// 실제로는 로그인 세션에서 가져온 값으로 대체될 자리다.
const MOCK_USER = { name: "gmj0503", email: "gmj0503@gmail.com" };

// 미리보기라 너무 길어지지 않게 최근 몇 건만 보여준다 — 전체는 "전체보기" 버튼으로 이동.
const PREVIEW_COUNT = 3;

function rentalDaysOf(line: CartLine): number {
  const start = new Date(line.useDateStart);
  const end = new Date(line.useDateEnd);
  return Math.round((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1;
}

function lineAmount(line: CartLine): number {
  const product = findRentalProductById(line.productId);
  if (!product) return 0;
  const unitPrice = product.priceByOption[line.option].customerPrice;
  const offSiteFee = line.offSiteReturn ? OFF_SITE_RETURN_FEE_KRW : 0;
  return unitPrice * line.qty * rentalDaysOf(line) + offSiteFee;
}

/**
 * 하단 탭 "내정보" — 로그인 기능이 없어서 회원정보 수정 화면(S0-C3) 대신, 내 정보 요약과
 * 내 예약·내 장바구니 미리보기를 모아 보여주는 대시보드 형태로 구성했다. 각 목록은
 * listReservations()/useCart()의 최신 데이터를 최대 3건만 잘라서 보여주고, 전체 목록은
 * "전체보기" 버튼으로 각 화면(/mypage, /cart)에 넘긴다.
 */
export default function ProfilePage() {
  const { items } = useCart();
  const reservations = listReservations().slice(0, PREVIEW_COUNT);
  const cartPreview = items.slice(0, PREVIEW_COUNT);

  return (
    <main>
      <Banner size="lg" title="계정" image="/banner-store.png" />

      <div className="mx-auto max-w-2xl p-6">
        <Stack direction="column" gap="lg">
          <Card>
            <Title leaf size="md">내정보</Title>
            <Kv items={[
              { key: "이름", value: MOCK_USER.name },
              { key: "이메일(아이디)", value: MOCK_USER.email },
            ]} />
          </Card>

          <Card>
            <Title leaf size="md">내 예약 상황</Title>

            <Stack direction="column" gap="xs" className="mt-3">
              {reservations.length === 0 ? (
                <Text tone="secondary" className="py-4 text-center">아직 예약 내역이 없습니다.</Text>
              ) : (
                reservations.map((reservation) => {
                  const product = findRentalProductById(reservation.productId);
                  return (
                    <div
                      key={reservation.id}
                      className="flex items-center justify-between gap-2 border-b border-line py-3 last:border-b-0"
                    >
                      <Stack direction="column" gap="xs">
                        <Text weight="medium">{reservation.id}</Text>
                        <Text variant="sub">
                          {product ? `${product.title} · ${RENTAL_OPTION_LABEL[reservation.rentalOption]}` : ""}
                        </Text>
                      </Stack>
                      <StatusBadge status={reservation.status} />
                    </div>
                  );
                })
              )}
            </Stack>

            <Button href="/mypage" fullWidth className="mt-4">
              내 예약 전체보기
            </Button>
          </Card>

          <Card>
            <Title leaf size="md">내 장바구니</Title>

            <Stack direction="column" gap="xs" className="mt-3">
              {cartPreview.length === 0 ? (
                <Text tone="secondary" className="py-4 text-center">장바구니가 비어 있습니다.</Text>
              ) : (
                cartPreview.map((line) => {
                  const product = findRentalProductById(line.productId);
                  if (!product) return null;
                  return (
                    <Stack
                      key={line.cartLineId}
                      direction="column"
                      gap="xs"
                      className="border-b border-line py-3 last:border-b-0"
                    >
                      <Text weight="medium">{product.name}</Text>
                      <Text variant="sub">
                        {RENTAL_OPTION_LABEL[line.option]} · {line.qty}{product.category === "bike" ? "대" : "개"}
                      </Text>
                      <Text weight="bold" className="text-right">
                        ₩ {lineAmount(line).toLocaleString()}
                      </Text>
                    </Stack>
                  );
                })
              )}
            </Stack>

            <Button href="/cart" fullWidth className="mt-4">
              내 장바구니 전체보기
            </Button>
          </Card>
        </Stack>
      </div>
    </main>
  );
}
