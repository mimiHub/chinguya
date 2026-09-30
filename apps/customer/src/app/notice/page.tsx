"use client";

import { Suspense, useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Banner, Tab, Card, Badge, NoticeBadge, Title, Text, EmptyState, Stack, Button, Alert, Pagination } from "@chinguya/ui";
import { NOTICE_CATEGORY_LABEL } from "@chinguya/types";
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

/**
 * 한 페이지에 보여줄 글 수(2026-09-30 — 무한 스크롤 대신 페이지 이동). 전체 개수 제한은 없다.
 * 모바일은 5개, PC(md 이상, 768px~)는 6개. 넘치면 아래 페이지네이션으로 넘긴다.
 */
const PAGE_SIZE_MOBILE = 5;
const PAGE_SIZE_DESKTOP = 6;
const DESKTOP_QUERY = "(min-width: 768px)"; // Tailwind md — BookingDock과 같은 기준

function subscribeDesktop(onChange: () => void) {
  const query = window.matchMedia(DESKTOP_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/**
 * 화면 폭에 맞는 페이지 크기. 서버 렌더 때는 화면 폭을 모르므로 null —
 * 그동안은 목록을 부르지 않아서, 잘못된 개수로 한 번 불렀다가 다시 부르는 일이 없다.
 */
function usePageSize(): number | null {
  return useSyncExternalStore(
    subscribeDesktop,
    () => (window.matchMedia(DESKTOP_QUERY).matches ? PAGE_SIZE_DESKTOP : PAGE_SIZE_MOBILE),
    () => null,
  );
}

const NOTICE_TABS: { key: NoticeCategory; label: string }[] = [
  { key: "NOTICE", label: NOTICE_CATEGORY_LABEL.NOTICE },
  { key: "EVENT", label: NOTICE_CATEGORY_LABEL.EVENT },
];

// 목록 카드 배경 — 상품 조회(S1-C1, app/rental/page.tsx)와 같은 3색 순환.
const CARD_BG = ["bg-card-primary", "bg-card-secondary", "bg-card-tertiary"];

// 카테고리 뱃지는 공용 NoticeBadge(packages/ui) — 공지사항은 세부 카테고리(점검·안내·업데이트·긴급·장애),
// 이벤트는 '이벤트'. 색도 거기서 정해서 관리자·홈 공지 섹션과 같게 보인다.

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
 * 목록은 **모바일 5개·PC 6개씩 페이지로 넘긴다**(2026-09-30 — 무한 스크롤에서 변경). 아래 `‹ 1 / 10 ›`(공용 Pagination)로
 * 이동하고, 페이지를 바꾸면 목록 머리로 스크롤한다. 전체 페이지 수는 서버의 totalElements 로 계산한다.
 *
 * 본문의 `![설명](주소)` 표기는 {@link NoticeBody}가 이미지로 바꿔 보여준다. 그 외 마크다운
 * 문법은 글자 그대로 둔다 — 관리자 화면도 같은 범위라고 안내한다.
 *
 * **바로가기 주소** `/notice?tab=EVENT&id=12` — 홈 팝업의 '자세히 보기'처럼 특정 글로 바로 보낼 때 쓴다.
 * tab 으로 첫 탭을 정하고(그래야 '목록으로'가 그 글의 탭으로 돌아간다), id 가 있으면 그 글 상세를 바로 연다.
 * '목록으로'를 누르면 주소에서 id 를 지운다 — 새로고침했을 때 상세가 다시 열리지 않게.
 */
export default function NoticePage() {
  // useSearchParams 를 쓰는 화면은 정적 프리렌더 때 Suspense 경계가 필요하다(Next.js 규칙).
  return (
    <Suspense>
      <NoticePageInner />
    </Suspense>
  );
}

function NoticePageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const linkedId = searchParams.get("id");
  const [tab, setTab] = useState<NoticeCategory>(() =>
    searchParams.get("tab") === "EVENT" ? "EVENT" : "NOTICE",
  );
  const [items, setItems] = useState<NoticeSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const pageSize = usePageSize();

  // 창 크기를 바꿔 페이지 크기가 달라지면, 보고 있던 첫 글이 들어 있는 페이지로 옮겨 준다
  // (예: 모바일 3페이지 = 11번째 글부터 → PC에선 2페이지). 렌더 중 상태 보정 패턴이라 effect가 필요 없다.
  const [prevPageSize, setPrevPageSize] = useState(pageSize);
  if (pageSize !== prevPageSize) {
    setPrevPageSize(pageSize);
    if (pageSize && prevPageSize) setPage(Math.floor((page * prevPageSize) / pageSize));
  }
  const [loading, setLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  const [selected, setSelected] = useState<NoticeDetail | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);

  // 페이지를 넘기면 목록 머리(탭 줄)로 올려 준다 — 아래쪽 화살표를 누른 자리에 머물면 새 목록 첫 줄이 안 보인다.
  const listTopRef = useRef<HTMLDivElement>(null);

  // '오늘'은 이벤트 종료 표시에만 쓴다. 목록·정렬 기준은 서버가 정하므로 여기 시계가 끼어들지 않는다.
  const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Tokyo" });

  useEffect(() => {
    if (!pageSize) return; // 화면 폭을 알기 전(서버 렌더 직후)에는 부르지 않는다
    let active = true;
    setLoading(true);
    setListError(null);
    api.customerNotices
      .list({ category: tab, page, size: pageSize })
      .then((res) => {
        if (!active) return;
        // 페이지마다 목록을 통째로 바꾼다(이어 붙이지 않는다).
        setItems(res.content);
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
  }, [tab, page, pageSize]);

  const totalPages = pageSize ? Math.ceil(total / pageSize) : 1;

  const changePage = (next: number) => {
    setPage(next);
    listTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const openDetail = useCallback(async (noticeId: string) => {
    setDetailError(null);
    try {
      setSelected(await api.customerNotices.detail(noticeId));
    } catch (err) {
      setDetailError(errorMessage(err, "글을 불러오지 못했습니다."));
    }
  }, []);

  // 바로가기 주소로 들어오면 그 글 상세를 연다. 숨긴 글·없는 글이면 서버가 404 → 오류 문구가 뜬다.
  useEffect(() => {
    if (linkedId) void openDetail(linkedId);
  }, [linkedId, openDetail]);

  const backToList = () => {
    setSelected(null);
    if (linkedId) router.replace(`/notice?tab=${tab}`, { scroll: false });
  };

  const changeTab = (key: NoticeCategory) => {
    // 이미 보고 있는 탭을 또 누른 경우: 목록은 그대로 두고 상세만 닫는다.
    // (예전엔 여기서도 목록을 비웠는데, tab·page 값이 그대로라 불러오기 effect가 다시 돌지 않아
    //  "등록된 글이 없습니다"가 떠 버렸다.)
    if (key === tab) {
      backToList();
      setDetailError(null);
      return;
    }
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

      {/* scroll-mt-20: 페이지 이동 시 상단 고정 헤더에 탭이 가려지지 않게 헤더 높이만큼 덜 올린다 */}
      <div ref={listTopRef} className="mx-auto max-w-2xl scroll-mt-20 p-6">
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
                    <NoticeBadge category={selected.category} tag={selected.tag} className="w-fit" />
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

                <Button fullWidth onClick={backToList}>
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
                // 글마다 개별 카드 — 상품 조회(S1-C1) 카드와 같은 모양(둥근 모서리·옅은 테두리·배경 3색 순환).
                // 윗줄 = 뱃지 + 제목, 이벤트면 그 아래 기간, 맨 아래 = 작성일(+ 종료).
                <div className="flex flex-col gap-3">
                  {items.map((item, i) => (
                    <ScrollReveal key={item.noticeId} delay={i * 60}>
                      <button
                        type="button"
                        onClick={() => void openDetail(item.noticeId)}
                        className={`flex w-full cursor-pointer flex-col gap-1.5 rounded-lg border border-gray-0 p-4 text-left ${CARD_BG[i % CARD_BG.length]}`}
                      >
                        {/* 카테고리 뱃지 + 제목 · 이벤트 기간 · 작성일(+종료) */}
                        <span className="flex min-w-0 items-center gap-2">
                          <NoticeBadge category={item.category} tag={item.tag} className="shrink-0" />
                          <Text as="span" weight="medium" className="min-w-0 flex-1 truncate">
                            {item.title}
                          </Text>
                        </span>
                        {item.category === "EVENT" && (
                          <Text as="span" variant="sub" size="xs">
                            기간 {item.eventStartDate ? formatPeriod(item.eventStartDate, item.eventEndDate) : "상시"}
                          </Text>
                        )}
                        <span className="flex items-center gap-2">
                          <Text as="span" variant="sub" size="xs">
                            {item.createdAt}
                          </Text>
                          {isFinished(item, today) && <Badge variant="gray">종료</Badge>}
                        </span>
                      </button>
                    </ScrollReveal>
                  ))}
                </div>
              )}

              {loading && (
                <Text variant="sub" className="mt-3">
                  불러오는 중…
                </Text>
              )}
              <Pagination page={page} totalPages={totalPages} onChange={changePage} className="mt-4" />
            </>
          )}
        </div>
      </div>
    </main>
  );
}
