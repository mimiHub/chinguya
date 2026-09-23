"use client";

import { usePathname } from "next/navigation";

/**
 * 관리자 앱 전체 배경에 깔리는 "밤하늘" — 작은 별들이 제각각 반짝이고, 가끔 별똥별이 하나 지나간다.
 * 드로어·로그인 화면의 야경 사진(달밤)과 페이지 배경(차분한 네이비, globals.css)을 한 분위기로 잇기 위한 것.
 *
 * - **배경에만** 그린다: `fixed inset-0 -z-10` — 카드·헤더·하단 탭은 자기 배경(bg-surface)이 있어서
 *   별이 그 위로 올라오지 않고, 카드 사이 빈 페이지 배경에서만 보인다. body 배경색은 캔버스로
 *   번져 그려지므로(-z-10이어도 body 배경 뒤로 숨지 않는다) 따로 z-index를 맞출 필요가 없다.
 * - 클릭을 막지 않게 pointer-events-none, 스크린리더가 읽지 않게 aria-hidden.
 * - 로그인 화면(/login)은 자체 사진 배경 + 별(NIGHT_SKY_STARS)이 있어서 여기서는 그리지 않는다.
 * - 움직임 줄이기(prefers-reduced-motion) 설정이면 반짝임·별똥별 없이 옅은 별만 고정으로 둔다.
 * - 업무 화면이라 튀지 않게 전체를 옅게(opacity-60) 깔았다.
 */

// 별 좌표 — Math.random을 렌더 중에 쓰면 SSR과 클라이언트 값이 달라 하이드레이션 경고가 나므로,
// 시드가 고정된 의사난수(mulberry32)로 모듈 로드 시 한 번 만든다. 매번 같은 하늘이 나온다.
function mulberry32(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20260923);
const STAR_COUNT = 70;
const STARS = Array.from({ length: STAR_COUNT }, () => ({
  top: `${(rand() * 100).toFixed(2)}%`,
  left: `${(rand() * 100).toFixed(2)}%`,
  // 대부분 1~2px 작은 별, 가끔 3px 큰 별
  size: rand() < 0.15 ? 3 : rand() < 0.5 ? 2 : 1,
  // 주기와 시작 시점을 제각각으로 둬야 한꺼번에 깜빡이지 않고 "자연스럽게" 반짝인다.
  duration: `${(2.4 + rand() * 3.6).toFixed(2)}s`,
  delay: `${(rand() * 6).toFixed(2)}s`,
}));

export function NightSkyBackdrop() {
  const pathname = usePathname();
  if (pathname === "/login") return null;

  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden opacity-60" aria-hidden="true">
      {STARS.map((star, i) => (
        <span
          key={i}
          className="animate-twinkle absolute rounded-full opacity-0 motion-reduce:animate-none motion-reduce:opacity-40"
          style={{
            top: star.top,
            left: star.left,
            width: star.size,
            height: star.size,
            background: "var(--color-star)",
            boxShadow: star.size > 1 ? "0 0 4px 1px var(--color-star-glow)" : undefined,
            animationDuration: star.duration,
            animationDelay: star.delay,
          }}
        />
      ))}

      {/* 별똥별 — 두 개를 서로 다른 위치·시차로 두어 같은 궤적이 반복돼 보이지 않게 한다.
          한 주기(14s/19s) 중 앞부분에만 지나가고 나머지는 쉬어서 "가끔" 보인다. */}
      <span
        className="animate-shooting-star absolute top-[14%] left-[88%] h-px w-24 opacity-0 motion-reduce:hidden"
        style={{ background: "linear-gradient(to right, var(--color-star), transparent)" }}
      />
      <span
        className="animate-shooting-star absolute top-[38%] left-[70%] h-px w-20 opacity-0 motion-reduce:hidden"
        style={{
          background: "linear-gradient(to right, var(--color-star), transparent)",
          animationDuration: "19s",
          animationDelay: "7s",
        }}
      />
    </div>
  );
}
