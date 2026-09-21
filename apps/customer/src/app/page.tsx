"use client";

import { useEffect, useState } from "react";
import NextLink from "next/link";
import type { AssetCategory } from "@chinguya/types";
import { ASSET_CATEGORY_LABEL } from "@chinguya/types";
import { Title, Text, Card, Button } from "@chinguya/ui";
import { createApiClient } from "@chinguya/api-client";
import { HomeCarousel } from "@/components/HomeCarousel";
import { ScrollReveal } from "@/components/ScrollReveal";

const api = createApiClient();

// 홈 Rental 섹션 카드 2장 — 카테고리별 대표 이미지. 이미지는 캐러셀에 이미 쓰던
// 배너 이미지를 재사용한다(banner-pc-2=자전거 코스, banner-pc-3=낚시 장면 — HomeCarousel.tsx
// SLIDES 참고). 폴라로이드 카드는 워시테이프 장식만 쓰고 동그란 스티커는 붙이지 않는다(모든 폴라로이드 공통).
const RENTAL_CATEGORIES: { key: AssetCategory; image: string }[] = [
  { key: "BICYCLE", image: "/banner-pc-2.png" },
  { key: "FISHING_ROD", image: "/banner-pc-3.png" },
];

// 카드 사진 위에 흩뿌릴 별 위치 — 장식용이라 고정값으로 충분 (cafe-next의 CategoryCard.jsx와
// 동일한 좌표·딜레이를 그대로 옮겼다).
const STARS = [
  { top: "14%", left: "16%", size: 6, delay: "0s" },
  { top: "24%", left: "60%", size: 4, delay: "0.7s" },
  { top: "40%", left: "85%", size: 5, delay: "1.4s" },
  { top: "58%", left: "8%", size: 4, delay: "2s" },
  { top: "70%", left: "48%", size: 6, delay: "0.4s" },
  { top: "80%", left: "74%", size: 4, delay: "1.1s" },
  { top: "50%", left: "32%", size: 3, delay: "1.8s" },
];

/**
 * 홈(랜딩) 탭 — 와이어프레임 안 A(히어로 최상단 + 하단 Rental 섹션) 기준. 히어로는
 * HomeCarousel이 담당하고, 그 아래에 카테고리(자전거/낚싯대) 대표 카드 2장을 폴라로이드
 * 스타일로 보여준다. 카드를 누르면 해당 카테고리가 먼저 선택된 채로 상품 조회(/rental)로
 * 이동한다.
 *
 * **카드의 최저가는 실제 상품 목록에서 온다**(GET /v1/products?category=…). 와이어프레임 규칙
 * "관리자 '표출 ON' 상품만 노출, 가격은 고객가 기준"을 그 API 가 이미 지키고 있어서, 화면이
 * 목업 배열을 뒤지지 않고 서버가 준 `priceFrom` 을 그대로 쓴다.
 *
 * ⚠ 예전에는 **1일권** 최저가를 보여줬는데(목업에서 옵션별 가격을 직접 뒤졌다), 목록 API 의
 * `priceFrom` 은 **옵션 전체의 최저가**다. 그래서 라벨을 '1일 요금' → '최저 요금'으로 바꿨다 —
 * 상품 조회(S1-C1)가 쓰는 값과 같아서 두 화면의 숫자가 어긋나지 않는다.
 *
 * 값을 못 받으면 가격 줄을 비워 둔다(0원으로 쓰면 무료로 읽힌다).
 */
export default function Page() {
  // 카테고리별 최저가. 아직 못 받았으면 값이 없다(가격 줄을 비운다).
  const [priceFrom, setPriceFrom] = useState<Partial<Record<AssetCategory, number>>>({});

  useEffect(() => {
    let active = true;
    Promise.all(
      RENTAL_CATEGORIES.map((c) =>
        api.customerProducts
          .list(c.key, 0, 100)
          .then((page) => {
            const prices = page.content.map((p) => p.priceFrom);
            return [c.key, prices.length > 0 ? Math.min(...prices) : undefined] as const;
          })
          // 한 카테고리가 실패해도 다른 쪽은 보여준다.
          .catch(() => [c.key, undefined] as const),
      ),
    ).then((pairs) => {
      if (!active) return;
      setPriceFrom(Object.fromEntries(pairs.filter(([, v]) => v !== undefined)));
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <main>
      <HomeCarousel />

      <div className="mx-auto max-w-2xl px-6 py-10 md:max-w-5xl">
        <ScrollReveal>
          <Title leaf size="xl">
            Rental
          </Title>
          <Text variant="sub" className="mt-2">
            자전거와 낚싯대를 대여하고,
            <br />
            여행이 주는 행복을 마음껏 느껴보세요.
          </Text>

          {/*
            와이어프레임 랜딩(안 A, 확정)의 최상단 CTA. "신규·재방문 고객 모두 서비스 이해를
            먼저 유도"하는 목적이라 카테고리 섹션보다 위, 인트로 문구 바로 아래에 둔다.
            진입: 서비스 소개(S4-C2, apps/customer/src/app/about) 단일 페이지.
          */}
          <Button href="/about" fullWidth size="lg" className="mt-5">
            서비스 소개
          </Button>

          <hr className="mt-5 border-line" />
        </ScrollReveal>

        <div className="mt-6 grid grid-cols-1 gap-6 px-4 md:grid-cols-2">
          {RENTAL_CATEGORIES.map((category, i) => (
            <ScrollReveal key={category.key} delay={i * 120}>
            <NextLink href={`/rental?category=${category.key}`}>
              <Card polaroid padding="md">
                <div className="relative overflow-hidden rounded-lg">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={category.image}
                    alt={ASSET_CATEGORY_LABEL[category.key]}
                    className="aspect-[4/3] w-full rounded-lg object-cover"
                  />
                  {/* 사진 위에서 별처럼 반짝이는 점 (cafe-next와 동일한 twinkle 애니메이션) */}
                  {STARS.map((star, i) => (
                    <span
                      key={i}
                      aria-hidden="true"
                      className="animate-twinkle pointer-events-none absolute rounded-full bg-[#fffced] opacity-0 shadow-[0_0_6px_2px_rgba(255,238,218,0.85)]"
                      style={{
                        top: star.top,
                        left: star.left,
                        width: star.size,
                        height: star.size,
                        animationDelay: star.delay,
                      }}
                    />
                  ))}
                </div>
                <div className="mt-3">
                  <Text variant="sub">대여서비스 · 최저 요금</Text>
                  <div className="mt-1 flex items-end justify-between">
                    <Text weight="bold" size="2xl">
                      {ASSET_CATEGORY_LABEL[category.key]}
                    </Text>
                    {priceFrom[category.key] !== undefined && (
                      <Text weight="bold" as="span">
                        {priceFrom[category.key]!.toLocaleString()}원~
                      </Text>
                    )}
                  </div>
                </div>
              </Card>
            </NextLink>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </main>
  );
}
