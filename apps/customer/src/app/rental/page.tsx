"use client";

import { Suspense, useMemo, useState } from "react";
import NextLink from "next/link";
import { useSearchParams } from "next/navigation";
import type { RentalCategoryKey } from "@chinguya/types";
import { getCustomerExposedQty } from "@chinguya/catalog-data";
import { Title } from "@chinguya/ui/title";
import { Text } from "@chinguya/ui/text";
import { EmptyState } from "@chinguya/ui/empty-state";
import { Chip } from "@chinguya/ui/chip";
import { NoticeBox } from "@chinguya/ui/notice-box";
import { Banner } from "@chinguya/ui/banner";
import { rentalProducts, rentalNotice, RENTAL_OPTION_LABEL } from "@/data/rentalData";

// 목록 카드에 쓸 배경톤 3종을 순서대로 번갈아 적용한다(theme.css의 card-primary/secondary/tertiary).
const CARD_BG = ["bg-card-primary", "bg-card-secondary", "bg-card-tertiary"];

/** "1일 15,000원부터"처럼 목록에서 대표로 보여줄 기준 가격(1일 옵션 고정) */
function oneDayPrice(product: (typeof rentalProducts)[number]) {
  return product.priceByOption["1d"].customerPrice;
}

// 와이어프레임(S1/S3-C1)에는 "전체" 탭이 없다 — 자전거/낚싯대 두 탭만 있고, 각 탭에는
// 관리자가 customerVisible을 켜둔 상품만 나열된다. 기본 선택 탭은 첫 번째 카테고리(자전거),
// 단 홈 Rental 카드처럼 ?category=fishing 로 들어오면 그 탭이 먼저 선택된 채로 열린다.
function RentalListContent() {
  const searchParams = useSearchParams();
  const initialCategory: RentalCategoryKey = searchParams.get("category") === "fishing" ? "fishing" : "bike";
  const [filter, setFilter] = useState<RentalCategoryKey>(initialCategory);

  /**
   * 목록은 "상품 카탈로그 하나당 카드 1개"가 아니다 — 실제 쇼핑몰(쿠팡 등) 검색 결과처럼,
   * 대여 가능한 물리적 단위 수만큼 카드가 반복해서 나온다. 몇 개를 보여줄지는
   * @chinguya/catalog-data(관리자가 설정하는 "노출 수량", 세 앱이 공유하는 값)에서 가져온다.
   * 카드가 여러 장이어도 전부 같은 상품이라 눌렀을 때 이동하는 상세 페이지는 동일하다.
   */
  const listings = useMemo(() => {
    return rentalProducts
      .filter((p) => p.customerVisible && p.category === filter)
      .flatMap((product) => {
        const qty = getCustomerExposedQty(product.id);
        return Array.from({ length: qty }, (_, i) => ({ product, listingKey: `${product.id}-${i}` }));
      });
  }, [filter]);

  return (
    <main>
      {/* 하단 탭 대메뉴 화면(상품)이라 배너를 크게 쓴다 */}
      <Banner size="lg" title="상품 조회" image="/banner-rental.png" />

      <div className="mx-auto max-w-2xl p-6">
      <Title size="lg" subtitle="자전거 · 낚싯대를 원하는 시간만큼 빌려보세요.">
        상품
      </Title>

      <Chip.List className="mt-4">
        <Chip on={filter === "bike"} onClick={() => setFilter("bike")}>
          자전거
        </Chip>
        <Chip on={filter === "fishing"} onClick={() => setFilter("fishing")}>
          낚싯대
        </Chip>
      </Chip.List>

      {/*
        리스트가 길어지면 페이지 전체가 계속 늘어나는 대신, 카드 목록 영역만 정해진 높이
        안에서 스크롤되게 한다(탭·이용 안내는 화면에 고정으로 보임). 모바일은 카드 3.5장
        정도(300px), PC는 화면이 넓어 더 많이 보여줘도 되니 600px로 임의 지정했다 — 실제
        카드 높이가 바뀌면 이 값도 같이 조정한다.
      */}
      <div className="mt-4 max-h-[300px] overflow-y-auto pr-1 md:max-h-[600px]">
        <div className="flex flex-col gap-3">
          {listings.map(({ product, listingKey }, i) => (
            <NextLink key={listingKey} href={`/rental/${product.id}`} className="block">
              <div className={`flex items-center gap-4 rounded-lg border border-gray-0 p-3 ${CARD_BG[i % CARD_BG.length]}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={product.image}
                  alt={product.title}
                  className="h-14 w-14 shrink-0 rounded-md object-contain"
                />
                <div className="min-w-0">
                  <Text  className="truncate">
                    {product.name}
                  </Text>
                  <Text variant="sub" className="mt-1">
                    {RENTAL_OPTION_LABEL["1d"]} {oneDayPrice(product).toLocaleString()}원부터
                  </Text>
                </div>
              </div>
            </NextLink>
          ))}
        </div>
      </div>

      {listings.length === 0 && <EmptyState className="mt-6">해당 분류의 상품이 없습니다.</EmptyState>}

      <NoticeBox
        title={
          <Title size="sm" leaf tone="secondary">
            이용 안내
          </Title>
        }
        tone="none"
        className="mt-4"
      >
        <ul className="flex list-disc flex-col gap-1 pl-4 text-sm text-muted">
          {rentalNotice.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </NoticeBox>
      </div>
    </main>
  );
}

// useSearchParams를 쓰는 컴포넌트는 Suspense 경계 안에서만 정적 렌더링이 가능하다
// (deposit/page.tsx와 동일한 패턴).
export default function RentalListPage() {
  return (
    <Suspense fallback={null}>
      <RentalListContent />
    </Suspense>
  );
}
