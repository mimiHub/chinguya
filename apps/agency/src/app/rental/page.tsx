"use client";

import { useMemo, useState } from "react";
import type { RentalCategoryKey } from "@chinguya/types";
import { Title } from "@chinguya/ui/title";
import { Text } from "@chinguya/ui/text";
import { Chip } from "@chinguya/ui/chip";
import { Card } from "@chinguya/ui/card";
import { Price } from "@chinguya/ui/price";
import { rentalProducts, CATEGORY_LABEL } from "@/data/rentalData";

/** 상품의 대여 옵션 중 가장 저렴한 여행사가를 "~부터"로 보여줄 때 사용 */
function minAgencyPrice(product: (typeof rentalProducts)[number]) {
  return Math.min(...Object.values(product.priceByOption).map((p) => p.agencyPrice));
}

// 와이어프레임(S1/S3-C1)과 같은 화면 구조 — 자전거/낚싯대 두 탭, "전체" 탭은 없다.
// customer 앱과 다르게 여기서는 agencyVisible 기준으로 필터링한다: 관리자가 여행사앱에
// 노출 켜둔 상품만 나열되고, 예약도 여기서 잡을 수 있어야 한다(예약 연결은 추후 작업).
export default function AgencyRentalListPage() {
  const [filter, setFilter] = useState<RentalCategoryKey>("bike");

  const visibleProducts = useMemo(
    () => rentalProducts.filter((p) => p.agencyVisible && p.category === filter),
    [filter],
  );

  return (
    <main className="mx-auto max-w-2xl p-6">
      <Title size="lg" subtitle="관리자가 노출 설정한 상품만 예약할 수 있습니다">
        상품 조회
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
          <Card key={product.id} padding="sm" className="flex h-full flex-col gap-2">
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
            <Price value={minAgencyPrice(product)} sign="~ " size="base" />
          </Card>
        ))}
      </div>

      {visibleProducts.length === 0 && (
        <Text tone="secondary" className="mt-6 text-center">
          해당 분류의 상품이 없습니다.
        </Text>
      )}
    </main>
  );
}
