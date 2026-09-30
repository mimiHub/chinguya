"use client";

import { useEffect, useState } from "react";
import NextLink from "next/link";
import { Title, Text, Card, NoticeBadge } from "@chinguya/ui";
import { createApiClient, type NoticeSummary } from "@chinguya/api-client";
import { ScrollReveal } from "@/components/ScrollReveal";

const api = createApiClient();

/** 홈에 보여줄 최신 공지 개수. 나머지는 '전체보기'로 공지사항 화면(S4-C6)에서 본다. */
const HOME_NOTICE_COUNT = 5;

/**
 * 홈(`안 A`) 맨 아래 공지사항 섹션. 공지는 팝업이 아니라 여기서 보여준다(2026-09-30 결정 — 팝업은 이벤트만).
 *
 * 공지사항 화면(S4-C6)과 **같은 API**(GET /v1/notices?category=NOTICE)를 쓴다. 공개 글만 오고, 정렬은 서버가
 * 정한다(상단 고정 먼저, 그다음 작성일 내림차순) — 화면이 다시 정렬하지 않아 두 화면 순서가 늘 같다.
 * 줄을 누르면 그 글 상세로 바로 간다(`/notice?tab=NOTICE&id=…` 바로가기 주소).
 *
 * 불러오는 중에는 섹션 틀만 두고, 실패하면 안내 한 줄만 보여준다 — 홈의 다른 영역을 막지 않는다.
 */
export function HomeNoticeSection() {
  const [notices, setNotices] = useState<NoticeSummary[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    api.customerNotices
      .list({ category: "NOTICE", page: 0, size: HOME_NOTICE_COUNT })
      .then((res) => {
        if (active) setNotices(res.content);
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <ScrollReveal>
      <div className="flex items-center justify-between">
        <Title leaf size="xl">
          Notice
        </Title>
        <NextLink href="/notice?tab=NOTICE" className="text-sm text-muted hover:text-ink">
          전체보기 ›
        </NextLink>
      </div>
      <Text variant="sub" className="mt-2">
        친구야의 새로운 소식을 알려드려요.
      </Text>

      <Card padding="none" className="mt-5 overflow-hidden">
        {failed ? (
          <Text variant="sub" className="px-5 py-4">
            공지사항을 불러오지 못했습니다.
          </Text>
        ) : notices === null ? (
          <Text variant="sub" className="px-5 py-4">
            불러오는 중…
          </Text>
        ) : notices.length === 0 ? (
          <Text variant="sub" className="px-5 py-4">
            등록된 공지사항이 없습니다.
          </Text>
        ) : (
          // 구분선은 점선(divide-dashed)이고, 목록에 px-4 를 줘서 선이 카드 양끝에서 16px 들어오게 한다.
          // 글자는 줄의 px-3 까지 더해 28px 들어간다(관리자 더보기 카드와 같은 두 겹 여백).
          <ul className="divide-y divide-dashed divide-line px-4 py-2">
            {notices.map((notice) => (
              // 호버: 줄 전체를 네모로 칠하면 점선에 딱 붙어 각져 보여서, li 에 위아래 여백(py-1.5)을 두고
              // 링크만 둥근 알약처럼(rounded-lg) 옅은 웜톤(card-primary)으로 띄운다. 제목은 브랜드 브라운으로 짙어진다.
              // 줄 높이는 예전(py-4 = 16px)과 같게 py-1.5 + py-2.5 로 나눴다.
              <li key={notice.noticeId} className="py-1.5">
                <NextLink
                  href={`/notice?tab=NOTICE&id=${notice.noticeId}`}
                  className="group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-card-primary/60"
                >
                  <NoticeBadge category={notice.category} tag={notice.tag} className="shrink-0" />
                  {/* 제목이 길면 한 줄로 자른다(truncate) — 날짜가 밀려나지 않게 min-w-0·flex-1 */}
                  <Text className="min-w-0 flex-1 truncate transition-colors group-hover:text-primary-500">
                    {notice.title}
                  </Text>
                  <Text variant="sub" as="span" className="shrink-0">
                    {notice.createdAt}
                  </Text>
                </NextLink>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </ScrollReveal>
  );
}
