"use client";

import { useState } from "react";
import { Banner } from "@chinguya/ui/banner";
import { Tab } from "@chinguya/ui/tab";
import { Card } from "@chinguya/ui/card";
import { Badge } from "@chinguya/ui/badge";
import { Title } from "@chinguya/ui/title";
import { Text } from "@chinguya/ui/text";
import { Stack } from "@chinguya/ui/stack";
import { Button } from "@chinguya/ui/button";

type NoticeCategory = "notice" | "event";

const NOTICE_TABS: { key: NoticeCategory; label: string }[] = [
  { key: "notice", label: "공지사항" },
  { key: "event", label: "이벤트" },
];

interface NewsItem {
  id: string;
  category: NoticeCategory;
  title: string;
  date: string;
  content: string;
}

// 카테고리별 태그 색 — "공지사항"은 무채색(gray), "이벤트"는 톤이 들어간 색(secondary)으로
// 한눈에 구분되게 했다.
const CATEGORY_BADGE_VARIANT: Record<NoticeCategory, "gray" | "secondary"> = {
  notice: "gray",
  event: "secondary",
};

// 임의(목업) 데이터 — 실제로는 관리자 콘텐츠 관리에서 등록한 공지/이벤트 글로 대체될 자리다.
const NEWS_ITEMS: NewsItem[] = [
  {
    id: "news-1",
    category: "notice",
    title: "매장 오픈 안내",
    date: "2026-07-01",
    content: "친구야가 오픈했습니다.\n이즈하라와 히타카츠 매장에 들러 편리하고 행복한 여행 되세요.\n한국인들의 편의를 위해 모든 게 준비 되어 있습니다.\n친구야 올림",
  },
  {
    id: "news-2",
    category: "event",
    title: "오픈 기념 대여 할인 이벤트",
    date: "2026-07-05",
    content:
      "대마도의 이즈하라와 히타카츠 두곳에 카페를 운영중입니다.\n일본 현지의 여행상품 상담 받으시고, 편리하게 여행 다녀오세요.\n현지 상주 직원의 친절한 안내와 더불어 프리미엄 서비스까지 받아보세요.\n무거운 캠핑장비를 이끌고 해외여행은 NO~! 캠핑장비 일체를 합리적 가격에 렌탈하여 드립니다. 대마도는 걸어서 관광하기에도 좋습니다.\n하지만 자전거로 돌아보며 여행하는 것도 추천~!\n자전거 / 낚시용품 / 물놀이 용품 일체를 렌탈하여 드립니다.",
  },
];

/**
 * 공지사항 — 상단 네비게이션 대메뉴 전용 화면. 하위 탭(공지사항/이벤트)은 상단 대메뉴 칩과
 * 같은 알약(capsule) 모양으로 통일했다. 원래 /news 안에 "회사소개"와 함께 칩으로 묶여
 * 있었는데, 파일 하나가 너무 커져서 각자 대메뉴로 다시 분리했다.
 */
export default function NoticePage() {
  const [tab, setTab] = useState<NoticeCategory>("notice");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = NEWS_ITEMS.find((item) => item.id === selectedId) ?? null;
  const items = NEWS_ITEMS.filter((item) => item.category === tab);

  return (
    <main>
      <Banner size="lg" title="공지사항" image="/banner-notice.png" />

      <div className="mx-auto max-w-2xl p-6">
        <Tab
          variant="capsule"
          items={NOTICE_TABS}
          activeKey={tab}
          onChange={(key) => {
            setTab(key as NoticeCategory);
            setSelectedId(null);
          }}
        />

        <div className="mt-4">
          {selected ? (
            <Stack direction="column" gap="md">
              <Card>
                <Badge variant={CATEGORY_BADGE_VARIANT[selected.category]} className="w-fit">
                  {NOTICE_TABS.find((t) => t.key === selected.category)?.label}
                </Badge>
                <Title size="lg" className="mt-2">
                  {selected.title}
                </Title>
                <Text variant="sub" size="xs" className="mt-1">
                  {selected.date}
                </Text>
                <hr className="my-4 border-line" />
                <Text className="whitespace-pre-line leading-relaxed">{selected.content}</Text>
              </Card>

              <Button fullWidth onClick={() => setSelectedId(null)}>
                목록으로
              </Button>
            </Stack>
          ) : items.length === 0 ? (
            <Text tone="secondary" className="py-8 text-center">
              등록된 글이 없습니다.
            </Text>
          ) : (
            <Card padding="sm">
              <Stack direction="column">
                {items.map((item, i) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedId(item.id)}
                    className={`flex items-center gap-3 py-3 text-left ${i > 0 ? "border-t border-line" : ""}`}
                  >
                    <Badge variant={CATEGORY_BADGE_VARIANT[item.category]} className="shrink-0">
                      {NOTICE_TABS.find((t) => t.key === item.category)?.label}
                    </Badge>
                    <Text as="span" weight="medium" className="min-w-0 flex-1 truncate">
                      {item.title}
                    </Text>
                    <Text as="span" variant="sub" size="xs" className="shrink-0">
                      {item.date}
                    </Text>
                  </button>
                ))}
              </Stack>
            </Card>
          )}
        </div>
      </div>
    </main>
  );
}
