import NextLink from "next/link";
import type { RentalCategoryKey } from "@chinguya/types";
import { Title } from "@chinguya/ui/title";
import { Text } from "@chinguya/ui/text";
import { Card } from "@chinguya/ui/card";
import { HomeCarousel } from "@/components/HomeCarousel";
import { CATEGORY_LABEL, rentalProducts } from "@/data/rentalData";

// 홈 Rental 섹션 카드 2장 — 카테고리별 대표 이미지·스티커. 이미지는 캐러셀에 이미 쓰던
// 배너 이미지를 재사용한다(banner-pc-2=자전거 코스, banner-pc-3=낚시 장면 — HomeCarousel.tsx
// SLIDES 참고). 스티커는 테마색이 있는 sticker-bike.png 대신, 시안처럼 점박이/체크 무늬
// 범용 스티커(sticker02/03)를 썼다.
const RENTAL_CATEGORIES: { key: RentalCategoryKey; image: string; sticker: string }[] = [
  { key: "bike", image: "/banner-pc-2.png", sticker: "/sticker02.png" },
  { key: "fishing", image: "/banner-pc-3.png", sticker: "/sticker03.png" },
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

/** 카테고리 안에서 노출 중인 상품들의 1일 요금 중 가장 저렴한 값 — 카드에 "◯◯원~"으로 표기 */
function fromPriceOf(category: RentalCategoryKey): number {
  const prices = rentalProducts
    .filter((p) => p.customerVisible && p.category === category)
    .map((p) => p.priceByOption["1d"].customerPrice);
  return prices.length > 0 ? Math.min(...prices) : 0;
}

/**
 * 홈(랜딩) 탭 — 와이어프레임 안 A(히어로 최상단 + 하단 Rental 섹션) 기준. 히어로는
 * HomeCarousel이 담당하고, 그 아래에 카테고리(자전거/낚싯대) 대표 카드 2장을 폴라로이드
 * 스타일로 보여준다. 카드를 누르면 해당 카테고리가 먼저 선택된 채로 상품 조회(/rental)로
 * 이동한다.
 */
export default function Page() {
  return (
    <main>
      <HomeCarousel />

      <div className="mx-auto max-w-2xl px-6 py-10 md:max-w-5xl">
        <Title leaf size="xl">
          Rental
        </Title>
        <Text variant="sub" className="mt-2">
          자전거와 낚싯대를 대여하고,
          <br />
          여행이 주는 행복을 마음껏 느껴보세요.
        </Text>

        <hr className="mt-5 border-line" />

        <div className="mt-6 grid grid-cols-1 gap-6 px-4 md:grid-cols-2">
          {RENTAL_CATEGORIES.map((category) => (
            <NextLink key={category.key} href={`/rental?category=${category.key}`}>
              <Card polaroid sticker={category.sticker} padding="md">
                <div className="relative overflow-hidden rounded-lg">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={category.image}
                    alt={CATEGORY_LABEL[category.key]}
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
                  <Text variant="sub">대여서비스 · 1일 요금</Text>
                  <div className="mt-1 flex items-end justify-between">
                    <Text weight="bold" size="2xl">
                      {CATEGORY_LABEL[category.key]}
                    </Text>
                    <Text weight="bold" as="span">
                      {fromPriceOf(category.key).toLocaleString()}원~
                    </Text>
                  </div>
                </div>
              </Card>
            </NextLink>
          ))}
        </div>
      </div>
    </main>
  );
}
