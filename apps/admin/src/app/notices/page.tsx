"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import NextLink from "next/link";
import {
  Title,
  Text,
  Card,
  Stack,
  Tab,
  Button,
  Badge,
  Toggle,
  Alert,
  Toast,
  type ToastStatus,
} from "@chinguya/ui";
import { NOTICE_CATEGORY_LABEL } from "@chinguya/types";
import {
  createApiClient,
  ApiError,
  type NoticeCategory,
  type NoticeSummary,
} from "@chinguya/api-client";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { EmptyStateCat } from "@/components/EmptyStateCat";

const api = createApiClient();

const PAGE_SIZE = 20;

const CATEGORY_TABS: { key: NoticeCategory; label: string }[] = [
  { key: "NOTICE", label: NOTICE_CATEGORY_LABEL.NOTICE },
  { key: "EVENT", label: NOTICE_CATEGORY_LABEL.EVENT },
];

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback;
}

/**
 * 공지사항·이벤트 관리 목록(`a-notice`, S4-A4). 계약: api-spec/openapi/chinguya-admin-api.yaml.
 *
 * 관리자 목록은 **숨긴 글도 함께** 온다 — 카드의 공개 토글로 다시 켤 수 있어야 하기 때문이다.
 * 고객 화면(S4-C6)은 같은 API를 공개 글만 받도록 부른다.
 *
 * 정렬은 서버가 정한다(고정 글 먼저, 그다음 작성일 내림차순). 화면은 받은 순서를 그대로 쓴다 —
 * 두 화면이 같은 순서를 봐야 하므로 규칙을 클라이언트에 두지 않는다.
 *
 * 목록은 **무한 스크롤**이다. 바닥 감지용 빈 div를 IntersectionObserver로 보고, 화면에 들어오면
 * 다음 페이지를 이어 붙인다. 커서가 아니라 page·size인 것은 예약 관리(S1-A6)와 같은 방식을
 * 쓰기 위함이다(계약 참고).
 *
 * 쓰기(등록·공개 토글)는 슈퍼어드민만 — 버튼·토글 숨김은 정합성용이고 최종 차단은 서버 403이다.
 */
export default function AdminNoticesPage() {
  const { isSuperAdmin } = useAdminAuth();

  const [category, setCategory] = useState<NoticeCategory>("NOTICE");
  const [notices, setNotices] = useState<NoticeSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastStatus, setToastStatus] = useState<ToastStatus>("success");
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError(null);
    api.notices
      .list({ category, page, size: PAGE_SIZE })
      .then((res) => {
        if (!active) return;
        // page 0이면 갈아끼우고(탭 변경), 그 뒤는 이어 붙인다(무한 스크롤).
        setNotices((prev) => (page === 0 ? res.content : [...prev, ...res.content]));
        setTotal(res.totalElements);
      })
      .catch((err: unknown) => {
        if (active) setLoadError(errorMessage(err, "글 목록을 불러오지 못했습니다."));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [category, page]);

  const hasMore = notices.length < total;

  // 바닥 감지 — 관찰 대상이 화면에 들어오고, 더 받을 게 남았고, 지금 불러오는 중이 아닐 때만 진행한다.
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore || loading) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) setPage((p) => p + 1);
    });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loading]);

  const changeCategory = (key: NoticeCategory) => {
    setCategory(key);
    setPage(0);
    setNotices([]);
    setTotal(0);
  };

  /** 카드에서 바로 공개/숨김을 바꾼다. 서버 응답으로 그 줄만 갈아끼운다(목록을 다시 받지 않는다). */
  const togglePublished = useCallback(async (notice: NoticeSummary) => {
    try {
      const detail = await api.notices.detail(notice.noticeId);
      const saved = await api.notices.update(notice.noticeId, {
        category: detail.category,
        title: detail.title,
        content: detail.content,
        published: !detail.published,
        pinned: detail.pinned,
        eventStartDate: detail.eventStartDate,
        eventEndDate: detail.eventEndDate,
        imageUrls: detail.imageUrls,
      });
      setNotices((prev) =>
        prev.map((n) => (n.noticeId === saved.noticeId ? { ...n, published: saved.published } : n)),
      );
      setToastStatus("success");
      setToastMessage(saved.published ? "공개로 바꿨습니다" : "숨김으로 바꿨습니다");
    } catch (err) {
      setToastStatus("error");
      setToastMessage(errorMessage(err, "공개 상태를 바꾸지 못했습니다."));
    }
  }, []);

  return (
    <main className="mx-auto max-w-2xl p-6">
      <Stack direction="column" gap="sm">
        <NextLink href="/more" className="text-sm text-muted hover:underline">
          ← 더보기로
        </NextLink>
        <Stack justify="between" align="center">
          <Title size="md">공지 · 이벤트</Title>
          {isSuperAdmin && (
            <Button href="/notices/new" variant="subtle" size="sm">
              + 등록
            </Button>
          )}
        </Stack>
      </Stack>

      <Stack direction="column" gap="md" className="mt-4">
        <Tab
          items={CATEGORY_TABS}
          activeKey={category}
          onChange={(key) => changeCategory(key as NoticeCategory)}
        />

        {loadError && (
          <Alert status="error" icon={true}>
            {loadError}
          </Alert>
        )}

        <Stack direction="column" gap="sm">
          {notices.map((notice) => (
            <Card key={notice.noticeId} padding="sm">
              <Stack justify="between" align="center">
                <NextLink href={`/notices/${notice.noticeId}`} className="min-w-0 flex-1">
                  <Stack direction="column" gap="xs">
                    <Stack gap="xs" align="center">
                      {notice.pinned && <Badge variant="gray">고정</Badge>}
                      <Text weight="bold">{notice.title}</Text>
                    </Stack>
                    <Text variant="sub">{notice.createdAt}</Text>
                  </Stack>
                </NextLink>
                {isSuperAdmin && (
                  <Toggle on={notice.published} onChange={() => void togglePublished(notice)} />
                )}
              </Stack>
            </Card>
          ))}

          {!loading && !loadError && notices.length === 0 && (
            <EmptyStateCat message="등록된 글이 없습니다." />
          )}
          {loading && <Text variant="sub">불러오는 중…</Text>}
          {/* 바닥 감지용 — 화면에 들어오면 다음 페이지를 이어 붙인다. */}
          <div ref={sentinelRef} aria-hidden="true" />
        </Stack>

        {!isSuperAdmin && (
          <Text variant="sub">
            일반 관리자는 목록만 볼 수 있습니다. 등록·수정·삭제는 슈퍼어드민만 할 수 있어요.
          </Text>
        )}
      </Stack>

      <Toast
        open={!!toastMessage}
        status={toastStatus}
        onClose={() => setToastMessage(null)}
        message={toastMessage ?? ""}
      />
    </main>
  );
}
