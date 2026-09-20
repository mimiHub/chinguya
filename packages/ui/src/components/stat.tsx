"use client";

import type { ReactNode } from "react";
import NextLink from "next/link";

/**
 * 포인트 색 톤. 카드 배경은 전부 똑같고, 숫자·라벨·점 색만 지표 종류에 따라 달라진다.
 * - default: 무채색(ink/muted) — 특별한 의미가 없는 지표
 * - primary: 세이지그린 — 신규 예약처럼 "새로 들어온 것"
 * - warning: 앰버/샌드 — 처리해야 할 대기 건(입금확인 요청)
 * - error:   로즈/레드 — 취소·문제 건(취소요청)
 */
export type StatTone = "default" | "primary" | "warning" | "error";

export interface StatItem {
  value: string | number;
  label: string;
  /** 지정하면 카드 전체가 링크가 된다(예: 대시보드 지표 클릭 시 해당 목록으로 이동) */
  href?: string;
  /** 카드 색 톤(기본 "default") */
  tone?: StatTone;
  /**
   * true면 큰 카드 — 2줄 높이를 차지하고 숫자·라벨도 더 크게 나온다. 여러 지표 중 가장 중요한
   * 하나(대시보드에서는 신규 예약)에만 쓴다. 이 항목이 하나라도 있으면 전체가 2열 그리드가 되어,
   * 큰 카드는 왼쪽 열을 다 쓰고 나머지 카드들이 오른쪽 열에 위아래로 쌓인다(큰 1개 + 작은 2개 기준).
   */
  large?: boolean;
  /**
   * 카드 오른쪽 위 모서리에 얹는 장식 아이콘(예: <IconFace />). 색은 카드의 tone 색을 따른다.
   * 크기는 아이콘 쪽에서 정한다(className로 높이·너비 클래스를 준다).
   */
  icon?: ReactNode;
}

export interface StatProps {
  items?: StatItem[];
  className?: string;
}

/**
 * 톤별 색 묶음 — 숫자·라벨은 항상 흰 글자(text-ink)이고, 톤 색은 라벨 앞 점·세로 라인·모서리 아이콘에만
 * 쓴다(숫자까지 색을 칠하면 서로 다른 색 숫자가 나란히 놓여 산만해 보였다). Tailwind는 클래스 이름을
 * 문자열 그대로 찾아서 만들기 때문에 `bg-stat-${tone}`처럼 조립하지 않고 전체 이름을 그대로 적어둔다.
 * 색 값은 theme.css의 --color-stat-* 토큰이고, 앱별로(admin은 다크 톤) 다시 정의할 수 있다.
 */
const toneClass: Record<StatTone, { accent: string; dot: string }> = {
  default: { accent: "text-muted", dot: "bg-gray-500" },
  primary: { accent: "text-stat-primary", dot: "bg-stat-primary" },
  warning: { accent: "text-stat-warning", dot: "bg-stat-warning" },
  error: { accent: "text-stat-error", dot: "bg-stat-error" },
};

/**
 * 어드민 대시보드 상단 수치 카드 (신규예약/입금확인요청/취소요청 등).
 * 흰 큰 숫자 + 흰 작은 라벨을 왼쪽에 놓은 둥근 카드이고, 배경은 모두 같다(bg-surface). tone에 따라 라벨 앞
 * 점과 왼쪽 세로 라인(굵기 10px)의 색만 바뀐다. 색은 전부 테마 토큰이라 다크/라이트 테마에 맞춰 바뀐다.
 * large 항목이 있으면 그 카드만 왼쪽에 크게(2줄 높이) 놓고 나머지는 오른쪽 열에 쌓는다.
 */
export function Stat({ items = [], className = "" }: StatProps) {
  const hasLarge = items.some((item) => item.large);
  const gridClass = hasLarge ? "grid-cols-2" : "grid-cols-[repeat(auto-fit,minmax(90px,1fr))]";

  return (
    <div className={`grid gap-3 ${gridClass} ${className}`}>
      {items.map((item, i) => {
        const t = toneClass[item.tone ?? "default"];
        const large = !!item.large;
        // 숫자·라벨은 카드 왼쪽 아래에 붙인다(flex-col + justify-end). 세로 라인(굵기 10px)은 글자와 상관없이
        // 카드 높이를 거의 다 채우는 별도 요소로, 카드 왼쪽 가장자리에서 14px 띄워 놓는다(큰 카드는 위 20px·
        // 아래 16px, 작은 카드는 위아래 8px 안쪽). 그래서 글자 왼쪽 여백은 "라인 위치 + 라인 굵기 + 라인과 글자
        // 사이 간격"만큼 따로 잡는다(큰 카드 pl-12, 작은 카드 pl-10). 작은 카드 숫자는 44px이고, 이때 작은 카드는
        // 안쪽 여백(py-4)까지 합쳐 내용만으로 115px 정도가 되며, 큰 카드는 작은 카드 두 장 높이로 늘어난다.
        // display는 flex 하나로 고정한다 — 링크(<a>)에 block을 따로 붙이면 flex와 같은 속성(display)을 건드리는
        // 클래스가 둘이 된다.
        const cardClass = `relative flex flex-col justify-end rounded-lg bg-surface text-left text-ink transition-colors hover:bg-bg-light ${
          large ? "row-span-2 pb-6 pl-12 pr-6 pt-6" : "pb-4 pl-10 pr-4 pt-4"
        }`;
        const content = (
          <>
            <span
              aria-hidden="true"
              className={`absolute left-3.5 w-2.5 rounded-full ${large ? "bottom-4 top-5" : "inset-y-2"} ${t.dot}`}
            />
            <div className={`font-bold leading-tight ${large ? "text-7xl" : "text-[44px]"}`}>{item.value}</div>
            <div className={`mt-2 flex items-center gap-1.5 font-medium ${large ? "text-base" : "text-sm"}`}>
              <span aria-hidden="true" className={`shrink-0 rounded-full ${large ? "h-2.5 w-2.5" : "h-2 w-2"} ${t.dot}`} />
              {item.label}
            </div>
          </>
        );
        const icon = item.icon ? (
          <span aria-hidden="true" className={`absolute ${large ? "right-5 top-5" : "right-4 top-4"} ${t.accent}`}>
            {item.icon}
          </span>
        ) : null;

        return item.href ? (
          <NextLink key={i} href={item.href} className={`${cardClass} cursor-pointer`}>
            {icon}
            {content}
          </NextLink>
        ) : (
          <div key={i} className={cardClass}>
            {icon}
            {content}
          </div>
        );
      })}
    </div>
  );
}
