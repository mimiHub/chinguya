"use client";

import { useMemo, useState } from "react";
import NextLink from "next/link";
import type { RentalCategoryKey } from "@chinguya/types";
import { Title } from "@chinguya/ui/title";
import { Text } from "@chinguya/ui/text";
import { Chip } from "@chinguya/ui/chip";
import { Card } from "@chinguya/ui/card";
import { Price } from "@chinguya/ui/price";
import { NoticeBox } from "@chinguya/ui/notice-box";
import { rentalProducts, rentalNotice, CATEGORY_LABEL } from "@/data/rentalData";

/** 상품의 대여 옵션 중 가장 저렴한 가격을 "~부터"로 보여줄 때 사용 */
function minCustomerPrice(product: (typeof rentalProducts)[number]) {
  return Math.min(...Object.values(product.priceByOption).map((p) => p.customerPrice));
}

// 와이어프레임(S1/S3-C1)에는 "전체" 탭이 없다 — 자전거/낚싯대 두 탭만 있고, 각 탭에는
// 관리자가 customerVisible을 켜둔 상품만 나열된다. 기본 선택 탭은 첫 번째 카테고리(자전거).
export default function RentalListPage() {
  const [filter, setFilter] = useState<RentalCategoryKey>("bike");

  const visibleProducts = useMemo(
    () => rentalProducts.filter((p) => p.customerVisible && p.category === filter),
    [filter],
  );

  return (
    <main className="mx-auto max-w-2xl p-6">
      <Title size="lg" subtitle="자전거 · 낚싯대를 원하는 시간만큼 빌려보세요">
        렌탈 상품
      </Title>

      <Chip.List className="mt-4">
        <Chip on={filter === "bike"} onClick={() => setFilter("bike")}>
          자전거
        </Chip>
        <Chip on={filter === "fishing"} onClick={() => setFilter("fishing")}>
          낚싯대
        </Chip>
      </Chip.List>

      <div className="mt-4 grid grid-cols-2 gap-4">
        {visibleProducts.map((product) => (
          <NextLink key={product.id} href={`/rental/${product.id}`} className="block">
            <Card padding="sm" className="flex h-full flex-col gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={product.image}
                alt={product.title}
                className="aspect-square w-full rounded-md object-cover"
              />
              <div>
                <Text variant="caption">{CATEGORY_LABEL[product.category]}</Text>
                <Text weight="bold">{product.title}</Text>
              </div>
              <Price value={minCustomerPrice(product)} sign="~ " size="base" />
            </Card>
          </NextLink>
        ))}
      </div>

      {visibleProducts.length === 0 && (
        <Text tone="secondary" className="mt-6 text-center">
          해당 분류의 상품이 없습니다.
        </Text>
      )}

      <NoticeBox title="이용 안내" tone="gray" className="mt-8">
        <ul className="flex list-disc flex-col gap-1 pl-4 text-sm text-muted">
          {rentalNotice.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </NoticeBox>
    </main>
  );
}
