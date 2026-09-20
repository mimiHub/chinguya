"use client";

import { Suspense, useEffect, useState } from "react";
import NextLink from "next/link";
import { useSearchParams } from "next/navigation";
import type { AssetCategory } from "@chinguya/types";
import {
  createApiClient,
  ApiError,
  DEFAULT_API_BASE_URL,
  type CustomerProductSummary,
} from "@chinguya/api-client";
import { Title, Text, EmptyState, Tab, NoticeBox, Banner, Alert } from "@chinguya/ui";
import { rentalNotice } from "@/data/rentalData";
import { ScrollReveal } from "@/components/ScrollReveal";

/**
 * 상품 조회 `list`(S1-C1).
 *
 * Core API(GET /v1/products)에 실연동돼 있다 — 계약은 packages/api-spec/openapi/chinguya-slice1-openapi.yaml.
 * 카드 1개 = 연결 자산 1개이고, 관리자가 '표출 ON'한 상품이 1개 이상인 자산만 서버가 내려준다.
 * 요약가는 표출 중인 상품의 최저 고객가다.
 */

const api = createApiClient();

const CATEGORY_TABS: { key: AssetCategory; label: string }[] = [
  { key: "BICYCLE", label: "자전거" },
  { key: "FISHING_ROD", label: "낚싯대" },
];

/** 카드 수 = 자산 수라 계약상 최대 크기(100) 한 페이지로 충분하다. */
const PAGE_SIZE = 100;

// 목록 카드에 쓸 배경톤 3종을 순서대로 번갈아 적용한다(theme.css의 card-primary/secondary/tertiary).
const CARD_BG = ["bg-card-primary", "bg-card-secondary", "bg-card-tertiary"];

// 와이어프레임(S1-C1)에는 "전체" 탭이 없다 — 자전거/낚싯대 두 탭만 있다. 기본 선택 탭은
// 첫 번째 카테고리(자전거), 단 홈 Rental 카드처럼 ?category=FISHING_ROD 로 들어오면 그 탭이
// 먼저 선택된 채로 열린다.
function RentalListContent() {
  const searchParams = useSearchParams();
  const initialCategory: AssetCategory = searchParams.get("category") === "FISHING_ROD" ? "FISHING_ROD" : "BICYCLE";
  const [filter, setFilter] = useState<AssetCategory>(initialCategory);
  const [products, setProducts] = useState<CustomerProductSummary[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    // 탭을 빠르게 바꾸면 늦게 온 이전 탭 응답이 목록을 덮을 수 있어 버린다.
    let active = true;
    setProducts(null);
    setLoadError(null);
    api.customerProducts
      .list(filter, 0, PAGE_SIZE)
      .then((page) => {
        if (active) setProducts(page.content);
      })
      .catch((err: unknown) => {
        if (active) setLoadError(err instanceof ApiError ? err.message : "상품을 불러오지 못했습니다.");
      });
    return () => {
      active = false;
    };
  }, [filter]);

  return (
    <main>
      {/* 하단 탭 대메뉴 화면(상품)이라 배너를 크게 쓴다 */}
      <Banner size="lg" title="상품 조회" image="/banner-rental.png" />

      <div className="mx-auto max-w-2xl p-6">
      <Title size="lg" subtitle="자전거 · 낚싯대를 원하는 시간만큼 빌려보세요.">
        상품
      </Title>

      {/* 서비스 소개·내 예약과 같은 알약 탭(회색 트랙 안에서 선택 항목만 진한 알약)으로 통일 */}
      <Tab
        variant="capsule"
        items={CATEGORY_TABS}
        activeKey={filter}
        onChange={(key) => setFilter(key as AssetCategory)}
        className="mt-4"
      />

      {loadError && (
        <Alert status="error" className="mt-4">
          {loadError}
        </Alert>
      )}

      {products === null && !loadError && (
        <Text variant="sub" className="mt-4">
          불러오는 중…
        </Text>
      )}

      {/*
        리스트가 길어지면 페이지 전체가 계속 늘어나는 대신, 카드 목록 영역만 정해진 높이
        안에서 스크롤되게 한다(탭·이용 안내는 화면에 고정으로 보임). 모바일은 카드 3.5장
        정도(300px), PC는 화면이 넓어 더 많이 보여줘도 되니 600px로 임의 지정했다 — 실제
        카드 높이가 바뀌면 이 값도 같이 조정한다.
      */}
      <div className="mt-4 max-h-[300px] overflow-y-auto pr-1 md:max-h-[600px]">
        <div className="flex flex-col gap-3">
          {(products ?? []).map((product, i) => (
            <ScrollReveal key={product.productId} delay={i * 60}>
            <NextLink href={`/rental/${product.productId}`} className="block">
              <div className={`flex items-center gap-4 rounded-lg border border-gray-0 p-3 ${CARD_BG[i % CARD_BG.length]}`}>
                {product.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`${DEFAULT_API_BASE_URL}${product.thumbnailUrl}`}
                    alt={product.name}
                    className="h-14 w-14 shrink-0 rounded-md object-contain"
                  />
                ) : (
                  <div className="h-14 w-14 shrink-0 rounded-md bg-gray-100" aria-hidden />
                )}
                <div className="min-w-0">
                  <Text  className="truncate">
                    {product.name}
                  </Text>
                  <Text variant="sub" className="mt-1">
                    {product.priceFrom.toLocaleString()}원부터
                  </Text>
                </div>
              </div>
            </NextLink>
            </ScrollReveal>
          ))}
        </div>
      </div>

      {products !== null && products.length === 0 && (
        <EmptyState variant="card" className="mt-6">해당 분류의 상품이 없습니다.</EmptyState>
      )}

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
