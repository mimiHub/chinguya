"use client";

import { useEffect, useRef, useState, type TouchEvent } from "react";
import { Popup, NoticeBadge, Text, Button } from "@chinguya/ui";
import { createApiClient, type NoticeCategory, type NoticeDetail } from "@chinguya/api-client";
import { splitNoticeBody } from "@/components/NoticeBody";

const api = createApiClient();

/** 넘겨 볼 수 있는 최대 장수 — 서버도 3건까지만 주지만(slice1 v0.15) 화면에서 한 번 더 막는다. */
const MAX_SLIDES = 3;

/** 팝업 한 장에 그릴 값. 서버 응답(NoticeDetail)을 화면용으로 한 번 정리해 둔다. */
interface PopupSlide {
  noticeId: string;
  category: NoticeCategory;
  title: string;
  /** 본문에서 이미지 표기를 뺀 글자 */
  text: string;
  /** 대표 이미지 1장 — 본문 첫 이미지, 없으면 첫 첨부. 둘 다 없으면 null */
  imageSrc: string | null;
  eventStartDate: string | null;
  eventEndDate: string | null;
}

/** 서버 이미지 주소(/content/images/…)는 프록시(/api/core)를 거쳐 읽는다 — 공지사항 화면(NoticeBody)과 같다. */
function imageSrc(url: string): string {
  return url.startsWith("/content/images/") ? `/api/core${url}` : url;
}

function toSlide(detail: NoticeDetail): PopupSlide {
  const segments = splitNoticeBody(detail.content);
  const text = segments
    .filter((seg) => seg.type === "text")
    .map((seg) => seg.value)
    .join("")
    .trim();
  const firstImage = segments.find((seg) => seg.type === "image")?.value ?? detail.imageUrls[0] ?? null;
  return {
    noticeId: detail.noticeId,
    category: detail.category,
    title: detail.title,
    text,
    imageSrc: firstImage ? imageSrc(firstImage) : null,
    eventStartDate: detail.eventStartDate,
    eventEndDate: detail.eventEndDate,
  };
}

/** '오늘'은 일본 기준(공통 비즈니스 규칙) — '오늘 하루 보지 않기'가 언제 풀리는지 정할 때만 쓴다. */
function todayJst(): string {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Tokyo" });
}

/** "2026-10-01" ~ "2026-10-31" → "2026.10.01 ~ 10.31" (같은 해면 뒤쪽 연도 생략) */
function formatPeriod(start: string | null, end: string | null): string | null {
  if (!start) return null;
  const s = start.replaceAll("-", ".");
  if (!end) return `${s} ~`;
  const e = end.slice(0, 4) === start.slice(0, 4) ? end.slice(5).replace("-", ".") : end.replaceAll("-", ".");
  return `${s} ~ ${e}`;
}

const HIDE_KEY = "chinguya-home-popup-hidden";

/**
 * 고객 홈 **이벤트** 팝업(`안 A`). 모바일은 하단 시트, 768px↑는 가운데 모달(공용 Popup).
 * 공지사항은 팝업이 아니라 홈 맨 아래 HomeNoticeSection 에서 보여준다(2026-09-30 결정).
 *
 * - **데이터**: `GET /v1/notices/home-popup`(slice1 v0.15). 관리자(S4-A4)가 '홈 팝업 노출'을 켠 공개
 *   이벤트 중 노출 기간 안인 글을 서버가 최신순 최대 3건 골라 준다 — **기간 판단은 서버 한 곳**이 하고
 *   화면은 받은 그대로 그린다(시작일 전엔 안 오고, 종료일 다음 날 자동으로 빠진다).
 * - 빈 배열이거나 호출이 실패하면(백엔드 반영 전 404 포함) 팝업을 띄우지 않는다 — 홈을 막지 않는다.
 * - 여러 개면 슬라이드로 넘기고, '자세히 보기'는 공지사항 이벤트 탭의 그 글 상세(`/notice?tab=EVENT&id=…`)로.
 * - **오늘 하루 보지 않기**: 저장 값은 '그날 날짜(일본) + 그때 보이던 글 id 목록'이라, 그날 새 이벤트가
 *   추가되면 숨겨 둔 사람에게도 다시 뜬다.
 * - localStorage 는 시크릿 창·저장 차단 환경에서 예외를 던질 수 있어 try/catch — 읽기 실패면 그냥 띄우고
 *   쓰기 실패면 닫기만 한다.
 */
export function HomeNoticePopup() {
  const [slides, setSlides] = useState<PopupSlide[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let active = true;
    api.customerNotices
      .homePopup()
      .then((details) => {
        if (!active) return;
        const next = details.slice(0, MAX_SLIDES).map(toSlide);
        if (next.length === 0) return;
        let hidden: string | null = null;
        try {
          hidden = window.localStorage.getItem(HIDE_KEY);
        } catch {
          hidden = null;
        }
        setSlides(next);
        if (hidden !== signatureOf(next)) setOpen(true);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  if (slides.length === 0) return null;

  const hideToday = () => {
    try {
      window.localStorage.setItem(HIDE_KEY, signatureOf(slides));
    } catch {
      // 저장이 막힌 환경 — 이번 방문에서만 닫힌다.
    }
    setOpen(false);
  };

  return (
    <Popup open={open} onClose={() => setOpen(false)}>
      <div className="flex flex-col gap-4">
        <PopupSlider items={slides} onNavigate={() => setOpen(false)} />

        <div className="flex items-center justify-between border-t border-line pt-3 text-sm">
          <button type="button" onClick={hideToday} className="cursor-pointer text-muted hover:text-ink">
            오늘 하루 보지 않기
          </button>
          <button type="button" onClick={() => setOpen(false)} className="cursor-pointer font-medium text-ink">
            닫기
          </button>
        </div>
      </div>
    </Popup>
  );
}

/** 숨김 비교용 서명 — 일본 날짜 + 보이는 글 id 목록. */
function signatureOf(slides: PopupSlide[]): string {
  return `${todayJst()}|${slides.map((slide) => slide.noticeId).join(",")}`;
}

/** 이 거리(px) 이상 가로로 밀면 스와이프로 본다 — 살짝 스친 터치는 무시. */
const SWIPE_THRESHOLD = 40;

/**
 * 히어로 배너(HomeCarousel)와 같은 전환 방식 — **가로 스크롤을 쓰지 않는다.** 모든 장을 같은 자리에
 * 겹쳐 두고 현재 장만 opacity 1 로 올리는 크로스페이드라 스크롤 막대가 생길 수 없다.
 * 자동으로 넘어가지 않는다 — 아래 줄의 화살표(‹ ›)·점·'1 / 3' 으로 직접 넘긴다. 첫 장/마지막 장에서는
 * 해당 화살표를 흐리게 막는다. 모바일은 손가락으로 밀어도 넘어간다(터치 시작·끝 x 좌표 차이만 본다).
 *
 * 글(제목·기간·본문·버튼)도 CSS grid 한 칸에 모든 장을 겹쳐 두어, 영역 높이가 **가장 긴 장**에 맞춰진다 —
 * 장이 바뀔 때마다 하단 시트 높이가 들썩이지 않는다. 안 보이는 장은 invisible 이라 클릭·포커스도 안 된다.
 */
function PopupSlider({ items, onNavigate }: { items: PopupSlide[]; onNavigate: () => void }) {
  const [index, setIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const multiple = items.length > 1;

  const goPrev = () => setIndex((i) => Math.max(0, i - 1));
  const goNext = () => setIndex((i) => Math.min(items.length - 1, i + 1));

  const onTouchStart = (e: TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  };
  const onTouchEnd = (e: TouchEvent) => {
    const start = touchStartX.current;
    const end = e.changedTouches[0]?.clientX;
    touchStartX.current = null;
    if (!multiple || start == null || end == null) return;
    const dx = end - start;
    if (dx <= -SWIPE_THRESHOLD) goNext();
    else if (dx >= SWIPE_THRESHOLD) goPrev();
  };

  const hasImage = items.some((item) => item.imageSrc);

  return (
    <div className="flex flex-col gap-4" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      {/* 상단 글머리(뱃지·제목·기간) — 장마다 겹쳐 두고 현재 장만 보인다 */}
      <div className="grid">
        {items.map((item, i) => (
          <div
            key={item.noticeId}
            aria-hidden={i !== index}
            className={`col-start-1 row-start-1 flex flex-col gap-2 transition-opacity duration-500 ${
              i === index ? "visible opacity-100" : "invisible opacity-0"
            }`}
          >
            <NoticeBadge category={item.category} className="self-start" />
            <Text as="h2" size="lg" weight="bold">
              {item.title}
            </Text>
            {formatPeriod(item.eventStartDate, item.eventEndDate) && (
              <Text variant="sub">{formatPeriod(item.eventStartDate, item.eventEndDate)}</Text>
            )}
          </div>
        ))}
      </div>

      {/* 이미지 — 히어로처럼 겹쳐 두고 크로스페이드. 이미지 없는 장은 옅은 배경 */}
      {hasImage && (
        <div className="relative aspect-video w-full overflow-hidden rounded-md bg-bg-light">
          {items.map((item, i) =>
            item.imageSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={item.noticeId}
                src={item.imageSrc}
                alt=""
                aria-hidden={i !== index}
                className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
                  i === index ? "opacity-100" : "opacity-0"
                }`}
              />
            ) : null,
          )}
        </div>
      )}

      {/* 본문·버튼 — 역시 겹쳐 두고 가장 긴 장에 높이를 맞춘다 */}
      <div className="grid">
        {items.map((item, i) => {
          return (
            <div
              key={item.noticeId}
              aria-hidden={i !== index}
              className={`col-start-1 row-start-1 flex flex-col gap-4 transition-opacity duration-500 ${
                i === index ? "visible opacity-100" : "invisible opacity-0"
              }`}
            >
              {item.text && <Text className="whitespace-pre-line">{item.text}</Text>}
              {item.noticeId && (
                <Button href={`/notice?tab=${item.category}&id=${item.noticeId}`} fullWidth onClick={onNavigate}>
                  자세히 보기
                </Button>
              )}
            </div>
          );
        })}
      </div>

      {multiple && (
        <SlideControls count={items.length} index={index} onPrev={goPrev} onNext={goNext} onSelect={setIndex} />
      )}
    </div>
  );
}

/** 슬라이드 아래 조작 줄 — ‹ 점 › '1 / 3'. 점은 현재 장만 길게 늘어난다. */
function SlideControls({
  count,
  index,
  onPrev,
  onNext,
  onSelect,
}: {
  count: number;
  index: number;
  onPrev: () => void;
  onNext: () => void;
  onSelect: (i: number) => void;
}) {
  const arrowClass =
    "cursor-pointer px-1 text-lg leading-none text-muted hover:text-ink disabled:cursor-default disabled:opacity-30";
  return (
    <div className="flex items-center justify-center gap-3">
      <button type="button" aria-label="이전 글" onClick={onPrev} disabled={index === 0} className={arrowClass}>
        ‹
      </button>
      {Array.from({ length: count }, (_, i) => (
        <button
          key={i}
          type="button"
          aria-label={`${i + 1}번째 글로 이동`}
          aria-current={i === index}
          onClick={() => onSelect(i)}
          className={`h-2 cursor-pointer rounded-full transition-all ${i === index ? "w-5 bg-primary-500" : "w-2 bg-line"}`}
        />
      ))}
      <button
        type="button"
        aria-label="다음 글"
        onClick={onNext}
        disabled={index === count - 1}
        className={arrowClass}
      >
        ›
      </button>
      <span className="text-xs text-muted">
        {index + 1} / {count}
      </span>
    </div>
  );
}
