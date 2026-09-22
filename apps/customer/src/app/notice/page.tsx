"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Banner, Tab, Card, Badge, Title, Text, EmptyState, Stack, Button, Alert } from "@chinguya/ui";
import { NOTICE_CATEGORY_LABEL, type NoticeCategoryKey } from "@chinguya/types";
import {
  createApiClient,
  ApiError,
  type NoticeCategory,
  type NoticeDetail,
  type NoticeSummary,
} from "@chinguya/api-client";
import { ScrollReveal } from "@/components/ScrollReveal";
import { NoticeBody } from "@/components/NoticeBody";

const api = createApiClient();

const PAGE_SIZE = 20;

const NOTICE_TABS: { key: NoticeCategory; label: string }[] = [
  { key: "NOTICE", label: NOTICE_CATEGORY_LABEL.NOTICE },
  { key: "EVENT", label: NOTICE_CATEGORY_LABEL.EVENT },
];

// 카테고리별 태그 색 — "공지사항"은 무채색(gray), "이벤트"는 톤이 들어간 색(secondary)으로
// 한눈에 구분되게 했다.
const CATEGORY_BADGE_VARIANT: Record<NoticeCategoryKey, "gray" | "secondary"> = {
  NOTICE: "gray",
  EVENT: "secondary",
};

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback;
}

/** "2026-07-01" ~ "2026-07-31" 를 한 줄로. 종료일이 없으면 시작일만 보여준다. */
function formatPeriod(start: string, end: string | null): string {
  return end ? `${start} ~ ${end}` : `${start} ~`;
}

/** 종료일이 지난 이벤트인지 — 화면이 '종료' 태그를 붙이는 기준이다. */
function isFinished(notice: { eventEndDate: string | null }, today: string): boolean {
  return notice.eventEndDate !== null && notice.eventEndDate < today;
}

/**
 * S4-C6 공지사항·이벤트(`s4-c6`). 계약: api-spec/openapi/chinguya-slice1-openapi.yaml.
 *
 * Core API(GET /v1/notices, /v1/notices/{id})에 실연동돼 있다. **공개 글만** 오고, 숨긴 글은
 * 주소를 직접 쳐도 404 다(서버가 막는다).
 *
 * 목록 ↔ 상세는 **같은 화면 안에서 전환**한다(별도 라우트가 아니라 화면 내 상태 전환).
 * 목록은 요약만 받고, 카드를 누를 때 상세를 따로 받는다 — 목록에 본문까지 담으면 무거워진다.
 *
 * 정렬은 서버가 정한다(고정 글 먼저, 그다음 작성일 내림차순). 관리자 목록과 같은 순서다.
 *
 * 목록은 **무한 스크롤**이다. 바닥 감지용 빈 div를 IntersectionObserver로 본다.
 *
 * 본문의 `![설명](주소)` 표기는 {@link NoticeBody}가 이미지로 바꿔 보여준다. 그 외 마크다운
 * 문법은 글자 그대로 둔다 — 관리자 화면도 같은 범위라고 안내한다.
 */
export default function NoticePage() {
  const [tab, setTab] = useState<NoticeCategory>("NOTICE");
  const [items, setItems] = useState<NoticeSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  const [selected, setSelected] = useState<NoticeDetail | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);

  const sentinelRef = useRef<HTMLDivElement>(null);

  // '오늘'은 이벤트 종료 표시에만 쓴다. 목록·정렬 기준은 서버가 정하므로 여기 시계가 끼어들지 않는다.
  const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Tokyo" });

  useEffect(() => {
    let active = true;
    setLoading(true);
    setListError(null);
    api.customerNotices
      .list({ category: tab, page, size: PAGE_SIZE })
      .then((res) => {
        if (!active) return;
        setItems((prev) => (page === 0 ? res.content : [...prev, ...res.content]));
        setTotal(res.totalElements);
      })
      .catch((err: unknown) => {
        if (active) setListError(errorMessage(err, "글 목록을 불러오지 못했습니다."));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [tab, page]);

  const hasMore = items.length < total;

  // 상세를 보는 동안에는 목록이 화면에 없으므로 감지하지 않는다.
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || selected || !hasMore || loading) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) setPage((p) => p + 1);
    });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [selected, hasMore, loading]);

  const openDetail = useCallback(async (noticeId: string) => {
    setDetailError(null);
    try {
      setSelected(await api.customerNotices.detail(noticeId));
    } catch (err) {
      setDetailError(errorMessage(err, "글을 불러오지 못했습니다."));
    }
  }, []);

  const changeTab = (key: NoticeCategory) => {
    setTab(key);
    setPage(0);
    setItems([]);
    setTotal(0);
    setSelected(null);
    setDetailError(null);
  };

  return (
    <main>
      <Banner size="lg" title="공지사항" image="/banner-notice.png" />

      <div className="mx-auto max-w-2xl p-6">
        <Tab
          variant="capsule"
          items={NOTICE_TABS}
          activeKey={tab}
          onChange={(key) => changeTab(key as NoticeCategory)}
        />

        <div className="mt-4">
          {detailError && (
            <Alert status="error" icon={true} className="mb-4">
              {detailError}
            </Alert>
          )}

          {selected ? (
            <ScrollReveal>
              <Stack direction="column" gap="md">
                <Card>
                  <Stack gap="xs" align="center">
                    <Badge variant={CATEGORY_BADGE_VARIANT[selected.category]} className="w-fit">
                      {NOTICE_CATEGORY_LABEL[selected.category]}
                    </Badge>
                    {isFinished(selected, today) && <Badge variant="gray">종료</Badge>}
                  </Stack>
                  <Title size="lg" className="mt-2">
                    {selected.title}
                  </Title>
                  <Text variant="sub" size="xs" className="mt-1">
                    {selected.createdAt}
                  </Text>
                  {selected.eventStartDate && (
                    <Text variant="sub" size="xs" className="mt-1">
                      기간 {formatPeriod(selected.eventStartDate, selected.eventEndDate)}
                    </Text>
                  )}
                  <hr className="my-4 border-line" />
                  <NoticeBody content={selected.content} />
                  {selected.imageUrls.length > 0 && (
                    <Stack direction="column" gap="sm" className="mt-4">
                      {selected.imageUrls.map((url) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img key={url} src={`/api/core${url}`} alt="" className="w-full rounded" />
                      ))}
                    </Stack>
                  )}
                </Card>

                <Button fullWidth onClick={() => setSelected(null)}>
                  목록으로
                </Button>
              </Stack>
            </ScrollReveal>
          ) : (
            <>
              {listError && (
                <Alert status="error" icon={true}>
                  {listError}
                </Alert>
              )}

              {!loading && !listError && items.length === 0 ? (
                <EmptyState variant="card">등록된 글이 없습니다.</EmptyState>
              ) : (
                <ScrollReveal>
                  <Card padding="sm">
                    <Stack direction="column">
                      {items.map((item, i) => (
                        <button
                          key={item.noticeId}
                          type="button"
                          onClick={() => void openDetail(item.noticeId)}
                          className={`flex items-center gap-3 py-3 text-left ${i > 0 ? "border-t border-line" : ""}`}
                        >
                          <Badge variant={CATEGORY_BADGE_VARIANT[item.category]} className="shrink-0">
                            {NOTICE_CATEGORY_LABEL[item.category]}
                          </Badge>
                          <Text as="span" weight="medium" className="min-w-0 flex-1 truncate">
                            {item.title}
                          </Text>
                          {isFinished(item, today) && (
                            <Badge variant="gray" className="shrink-0">
                              종료
                            </Badge>
                          )}
                          <Text as="span" variant="sub" size="xs" className="shrink-0">
                            {item.createdAt}
                          </Text>
                        </button>
                      ))}
                    </Stack>
                  </Card>
                </ScrollReveal>
              )}

              {loading && (
                <Text variant="sub" className="mt-3">
                  불러오는 중…
                </Text>
              )}
              {/* 바닥 감지용 — 화면에 들어오면 다음 페이지를 이어 붙인다. */}
              <div ref={sentinelRef} aria-hidden="true" />
            </>
          )}
        </div>
      </div>
    </main>
  );
}
