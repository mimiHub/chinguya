"use client";

import { useLayoutEffect, useRef, useState } from "react";
import NextLink from "next/link";
import { Stack, Text, EmptyState } from "@chinguya/ui";

/** 상태 태그에 칠할 색 톤 — 위쪽 수치 카드(Stat)와 같은 계열. 없으면 회색 태그. */
export type VisitAccent = "primary" | "warning" | "error" | "info";

export interface TodayVisitItem {
  id: string;
  product: string;
  useDate: string;
  accent?: VisitAccent;
  /** 오른쪽 상태 태그에 적을 글자(접수·미입금·완료·취소요청…) */
  tagLabel: string;
}

/**
 * 목록 영역에 한 번에 보이는 카드 수. 이보다 많으면 영역 안에서 스크롤해서 본다. 영역이 딱 이 개수 높이로
 * 고정돼서, 예약이 아무리 많아도 화면이 그 이상 길어지지 않는다.
 */
const VISIBLE_COUNT = 5;

/**
 * 스크롤 영역 아래쪽에서 카드가 배경으로 서서히 사라지는 구간의 높이(px). 이 구간은 영역 맨 아래에 붙은
 * 여백이기도 해서, 맨 끝까지 스크롤하면 마지막 카드는 이 여백 위에 온전히 보이고 사라지는 구간에는 빈 배경만
 * 남는다(그래서 끝에서 카드가 흐려져 보이지 않는다).
 */
const FADE_HEIGHT = 28;

/**
 * 예약 카드 오른쪽 상태 태그 색. 카드 배경·테두리는 전부 같은 기본색으로 통일하고(카드마다 배경색이 다르면
 * 색이 너무 많아 한눈에 안 들어왔다), 상태는 이 태그의 색으로만 구분한다. 태그 색은 위쪽 수치 카드와 같은
 * 계열이다. 공용 StatusBadge는 3개 앱이 같은 색을 쓰도록 고정돼 있어(접수·미입금이 같은 크림색이라 구분이
 * 안 됐다) 이 화면에서만 직접 그린다. 클래스는 전체 이름으로 적어야 Tailwind가 찾는다.
 */
const tagClass = {
  primary: "bg-stat-primary/15 text-stat-primary",
  warning: "bg-stat-warning/15 text-stat-warning",
  error: "bg-stat-error/15 text-stat-error",
  info: "bg-info/15 text-info",
  none: "bg-badge-gray-bg text-badge-gray-text",
} as const;

/**
 * 대시보드 "오늘 방문 예약" 목록. 카드 5건 높이의 영역 안에 전부 담고, 5건을 넘으면 그 영역 안에서
 * 스크롤해서 나머지를 본다 — 예전에는 "더 보기" 버튼으로 펼쳤지만, 스크롤이 되면 버튼이 필요 없어서
 * 뺐다. 영역 높이가 늘지 않으니 화면 아래에 떠 있는 "재고 초과 날짜" 토스트와도 겹치지 않는다.
 *
 * 영역 높이는 카드 높이를 숫자로 박아두지 않고, 실제로 그려진 5번째 카드의 아래 끝을 재서 쓴다(카드 안
 * 글자가 줄바꿈되거나 화면 폭이 바뀌어 카드 높이가 달라져도 항상 딱 5건이 보인다). 카드가 5건 이하면
 * 높이를 제한하지 않는다. 이 5건 높이는 "최대" 높이일 뿐이라, 화면이 낮아 바깥 상자에 그만큼 자리가 없으면
 * 영역이 알아서 더 줄어들고(min-h-0) 그 안에서 스크롤한다 — 페이지 전체는 스크롤되지 않는다.
 *
 * 서버 컴포넌트인 대시보드(page.tsx)가 "오늘(JST) 이용 건" 필터와 색 톤·태그 글자 판정을 끝낸 뒤
 * 넘겨주므로, 여기는 그려주기와 높이 계산만 맡는다(그래서 "미입금" 같은 시간 기준 판정이 서버·클라이언트
 * 사이에서 어긋날 일이 없다).
 */
export function TodayVisitList({ items }: { items: TodayVisitItem[] }) {
  // 5건 높이(px). null이면 높이를 제한하지 않는다(5건 이하이거나 아직 못 쟀을 때).
  const [maxHeight, setMaxHeight] = useState<number | null>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const inner = innerRef.current;
    if (!inner) return;

    const measure = () => {
      // inner의 첫 자식이 카드들을 담은 Stack이다 — 카드는 그 자식들.
      const cards = inner.firstElementChild?.children;
      if (!cards || cards.length <= VISIBLE_COUNT) {
        setMaxHeight(null);
        return;
      }
      const last = cards[VISIBLE_COUNT - 1] as HTMLElement;
      // inner가 offsetParent(relative)라 offsetTop은 inner 기준이다. 바깥 영역의 위쪽 여유(pt-1 = 4px)와
      // 아래쪽 사라지는 구간(FADE_HEIGHT)을 더해 준다.
      setMaxHeight(last.offsetTop + last.offsetHeight + 4 + FADE_HEIGHT);
    };

    measure();
    // 화면 폭이 바뀌면 카드 안 글자가 줄바꿈되며 카드 높이가 달라지므로 크기가 바뀔 때마다 다시 잰다.
    const observer = new ResizeObserver(measure);
    observer.observe(inner);
    return () => observer.disconnect();
  }, [items.length]);

  if (items.length === 0) {
    return <EmptyState variant="card">오늘 방문 예약이 없습니다.</EmptyState>;
  }

  return (
    // -mx-1/px-1, -my-1/pt-1은 스크롤 영역 가장자리에서 카드 테두리가 잘리지 않게 하는 여유다.
    <div className="-mx-1 -my-1 flex min-h-0 flex-col">
      <div
        style={
          maxHeight !== null
            ? {
                maxHeight,
                // 아래쪽 FADE_HEIGHT 구간에서 카드가 배경으로 서서히 투명해진다. 배경색을 덧칠하는 게 아니라
                // 스크롤 영역 자체를 마스크로 흐리게 하므로 가장자리에 딱 떨어지는 경계선이 생기지 않는다.
                maskImage: `linear-gradient(to bottom, #000 calc(100% - ${FADE_HEIGHT}px), transparent)`,
                WebkitMaskImage: `linear-gradient(to bottom, #000 calc(100% - ${FADE_HEIGHT}px), transparent)`,
              }
            : undefined
        }
        className={`min-h-0 overflow-y-auto px-1 pt-1 ${maxHeight !== null ? "pb-7" : "pb-1"}`}
      >
        <div ref={innerRef} className="relative">
          <Stack direction="column" gap="sm">
            {items.map((r) => (
              // 바깥 상자(rounded-lg 16px) 안에 들어가므로 카드 모서리는 한 단계 작은 rounded-card(12px)로 둔다.
              <NextLink
                key={r.id}
                href={`/reservations/${r.id}`}
                className="block rounded-card border border-card-border bg-surface p-4 transition-colors hover:bg-bg-light"
              >
                <Stack justify="between" align="center">
                  <div>
                    <Text weight="bold">{r.id}</Text>
                    <Text variant="sub">
                      {r.product} · {r.useDate}
                    </Text>
                  </div>
                  <span
                    className={`inline-flex h-6 items-center whitespace-nowrap rounded-full px-2 text-xs font-medium ${
                      tagClass[r.accent ?? "none"]
                    }`}
                  >
                    {r.tagLabel}
                  </span>
                </Stack>
              </NextLink>
            ))}
          </Stack>
        </div>
      </div>
    </div>
  );
}
