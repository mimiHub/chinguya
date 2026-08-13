"use client";

import { useState } from "react";
import NextLink from "next/link";
import { useParams, useRouter } from "next/navigation";
import type { RentalOptionKey } from "@chinguya/types";
import { OFF_SITE_RETURN_FEE_KRW } from "@chinguya/types";
import { Title } from "@chinguya/ui/title";
import { Text } from "@chinguya/ui/text";
import { Chip } from "@chinguya/ui/chip";
import { Card } from "@chinguya/ui/card";
import { Stack } from "@chinguya/ui/stack";
import { Toggle } from "@chinguya/ui/toggle";
import { Price } from "@chinguya/ui/price";
import { Button } from "@chinguya/ui/button";
import { ComingSoon } from "@chinguya/ui/coming-soon";
import { findRentalProductById, RENTAL_OPTION_LABEL, RENTAL_OPTION_ORDER } from "@/data/rentalData";

export default function RentalDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const product = findRentalProductById(params.id);

  // 옵션은 항상 상품이 있을 때만 쓰이지만, 아래에서 "이른 return"보다 먼저 훅을 불러야 해서
  // 상품이 없을 수도 있는 상태 그대로 useState를 선언해둔다(React 훅 규칙: 조건부 호출 금지).
  const [option, setOption] = useState<RentalOptionKey>("1d");
  const [offSiteReturn, setOffSiteReturn] = useState(false);

  // 관리자가 고객앱 표출을 꺼둔(customerVisible: false) 상품은 목록에 없더라도 주소를 직접
  // 입력해 들어오는 경우까지 막기 위해 여기서도 확인한다.
  if (!product || !product.customerVisible) {
    return <ComingSoon label="존재하지 않는 상품입니다" />;
  }

  const handleOptionChange = (key: RentalOptionKey) => {
    setOption(key);
    // 타지역 반납은 2일 대여에서만 선택 가능한 옵션 — 다른 옵션으로 바꾸면 선택 해제
    if (key !== "2d") setOffSiteReturn(false);
  };

  const isMultiDay = option === "2d";
  const basePrice = product.priceByOption[option].customerPrice;
  const totalPrice = basePrice + (isMultiDay && offSiteReturn ? OFF_SITE_RETURN_FEE_KRW : 0);

  // 설명(description)이 있으면 그걸 캡션으로 쓰고, 없으면 상품명(name)에서 타이틀을 뺀
  // 나머지를 캡션으로 대신 쓴다(예: "전기자전거 대여(당일 오후 4시 반납)" → "대여(당일 오후 4시 반납)").
  const subtitle =
    product.description ??
    (product.name.startsWith(product.title) ? product.name.slice(product.title.length).trim() : product.name);

  return (
    <main className="mx-auto max-w-2xl p-6">
      <Stack direction="column" gap="sm">
        <NextLink href="/rental" className="text-sm text-muted hover:underline">
          ← 목록으로
        </NextLink>

        <Title size="lg">{product.title}</Title>
        <Text variant="sub">{subtitle || `${product.title}와 함께하는 여유로운 시간`}</Text>
      </Stack>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={product.image}
        alt={product.title}
        className="mt-4 aspect-square w-full rounded-lg object-cover"
      />

      <Stack direction="column" gap="sm" className="mt-6">
        <Title size="sm" leaf tone="secondary">
          시간 옵션
        </Title>
        <Chip.List>
          {RENTAL_OPTION_ORDER.map((key) => (
            <Chip key={key} on={key === option} onClick={() => handleOptionChange(key)}>
              {RENTAL_OPTION_LABEL[key]}
            </Chip>
          ))}
        </Chip.List>

        {isMultiDay && (
          <Card padding="sm">
            <Stack justify="between" align="center">
              <Stack direction="column" gap="xs">
                <Text weight="bold">타지역 반납</Text>
                <Text variant="sub">
                  다른 지점에서 반납할 수 있어요 (+ {OFF_SITE_RETURN_FEE_KRW.toLocaleString()}원)
                </Text>
              </Stack>
              <Toggle on={offSiteReturn} onChange={setOffSiteReturn} />
            </Stack>
          </Card>
        )}
      </Stack>

      <div className="mt-6 flex items-center justify-between">
        <Title size="sm" leaf tone="secondary">
          이용 요금
        </Title>
        <div className="text-right">
          <Price as="span" value={totalPrice} size="2xl" currency="원" mono={false} />
          {isMultiDay && offSiteReturn && (
            <Text variant="sub" className="mt-1">
              기본 {basePrice.toLocaleString()}원 + 타지역 반납 {OFF_SITE_RETURN_FEE_KRW.toLocaleString()}원
            </Text>
          )}
        </div>
      </div>

      <Button
        fullWidth
        size="lg"
        className="mt-4"
        onClick={() =>
          router.push(
            `/rental/reserve?product=${product.id}&option=${option}${
              isMultiDay && offSiteReturn ? "&offSiteReturn=1" : ""
            }`,
          )
        }
      >
        예약하기
      </Button>
    </main>
  );
}
