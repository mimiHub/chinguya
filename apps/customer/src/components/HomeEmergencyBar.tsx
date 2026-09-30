"use client";

import { useEffect, useState } from "react";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { EmergencyBar, type EmergencyBarTone } from "@chinguya/ui";
import { NOTICE_TAG_LABEL } from "@chinguya/types";
import { createApiClient, type NoticeSummary, type NoticeTag } from "@chinguya/api-client";

const api = createApiClient();

/**
 * 대시보드(홈) 맨 위 한 줄 긴급 공지 바 — 공용 EmergencyBar(packages/ui)에 데이터를 붙인 것.
 * TopNav 의 고정 헤더 안, 네비 줄 **위**에 들어간다(헤더와 함께 화면 맨 위에 붙어 있다).
 *
 * 어떤 글이 뜨나(별도 필드 없이 기존 공지 값으로 정한다):
 *   공개된 공지사항 중 **고정(pinned)** 이고 카테고리가 **긴급·장애·점검** 인 글 1건.
 *   여러 건이면 긴급 > 장애 > 점검 순, 같으면 서버 목록 순서(최신)대로 첫 글.
 *   → 관리자는 긴급 공지를 '고정'하면 바가 뜨고, 고정을 풀거나 비공개하면 내려간다.
 *
 * 닫기: 이번 방문(탭) 동안만 숨긴다(sessionStorage) — 긴급 소식이라 다음 방문엔 다시 보여 준다.
 *   다른 글로 바뀌면 다시 뜬다(숨김은 글 id 기준).
 * 백엔드가 아직 카테고리(tag)를 저장하지 않아 지금은 뜨는 글이 없다 — 저장되면 바로 동작한다.
 */

const TAG_TONE: Partial<Record<NoticeTag, EmergencyBarTone>> = {
  URGENT: "urgent",
  INCIDENT: "incident",
  MAINTENANCE: "maintenance",
};
const PRIORITY: NoticeTag[] = ["URGENT", "INCIDENT", "MAINTENANCE"];
const DISMISS_KEY = "chinguya-emergency-bar-dismissed";

function pickEmergency(list: NoticeSummary[]): NoticeSummary | null {
  for (const tag of PRIORITY) {
    const hit = list.find((n) => n.pinned && n.tag === tag);
    if (hit) return hit;
  }
  return null;
}

export function HomeEmergencyBar() {
  const pathname = usePathname();
  const [notice, setNotice] = useState<NoticeSummary | null>(null);
  const [dismissedId, setDismissedId] = useState<string | null>(null);

  const isHome = pathname === "/";

  useEffect(() => {
    if (!isHome) return;
    let active = true;
    try {
      setDismissedId(sessionStorage.getItem(DISMISS_KEY));
    } catch {
      // 저장소 차단 환경 — 그냥 띄운다
    }
    // 고정 글은 서버가 목록 맨 앞에 두므로 첫 페이지만 보면 충분하다.
    api.customerNotices
      .list({ category: "NOTICE", page: 0, size: 10 })
      .then((res) => {
        if (active) setNotice(pickEmergency(res.content));
      })
      .catch(() => {
        // 긴급 바는 부가 요소 — 실패하면 조용히 안 띄운다
      });
    return () => {
      active = false;
    };
  }, [isHome]);

  if (!isHome || !notice || !notice.tag || notice.noticeId === dismissedId) return null;
  const tone = TAG_TONE[notice.tag];
  if (!tone) return null;

  const dismiss = () => {
    setDismissedId(notice.noticeId);
    try {
      sessionStorage.setItem(DISMISS_KEY, notice.noticeId);
    } catch {
      // 저장 실패해도 이번 화면에서는 닫힌다
    }
  };

  return (
    <EmergencyBar
      tone={tone}
      label={NOTICE_TAG_LABEL[notice.tag]}
      message={notice.title}
      action={<NextLink href={`/notice?tab=NOTICE&id=${notice.noticeId}`}>자세히 ›</NextLink>}
      onClose={dismiss}
    />
  );
}
