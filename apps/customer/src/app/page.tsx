import NextLink from "next/link";
import { Button } from "@chinguya/ui/button";
import { HomeCarousel } from "@/components/HomeCarousel";

/**
 * 홈(랜딩) 탭 — 지금은 하단 탭 네비게이션이 동작하는 것까지만 목적으로 최소 구성한다.
 * 와이어프레임 랜딩(안 A: 히어로 이미지, 서비스 소개 CTA, 인기 상품 썸네일, 카테고리 칩)의
 * 전체 레이아웃은 아직 반영하지 않았다 — 다음 작업에서 이 페이지를 안 A 기준으로 채운다.
 * 배너는 하단 탭 대메뉴 화면이라 크게(size="lg") 쓴다.
 */
export default function Page() {
  return (
    <main>
      <HomeCarousel />

      <div className="mx-auto max-w-2xl p-6">
        <p className="text-sm text-muted">친구야 · 고객 · 모바일</p>
        <h1 className="mt-1 text-2xl font-bold">친구야</h1>
        <p className="mt-4 text-muted">자전거 · 낚싯대를 원하는 시간만큼 빌려보세요.</p>

        <NextLink href="/rental" className="mt-6 block">
          <Button fullWidth>상품 보러가기</Button>
        </NextLink>
      </div>
    </main>
  );
}
