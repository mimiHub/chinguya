"use client";

import { useState } from "react";
import { Banner } from "@chinguya/ui/banner";
import { ComingSoon } from "@chinguya/ui/coming-soon";
import { Chip } from "@chinguya/ui/chip";

type NewsTab = "about" | "notice";

const TABS: { key: NewsTab; label: string }[] = [
  { key: "about", label: "회사소개" },
  { key: "notice", label: "공지사항" },
];

/**
 * 상단 네비게이션 "회사소개"·"공지사항"을 "회사 소식" 하나로 합친 페이지 — 기존에는
 * /about, /notice가 별도 메뉴였는데, 아직 둘 다 ComingSoon 스텁이라 칩(Chip)으로 전환하는
 * 탭 형태로 합쳐뒀다. 나중에 실제 콘텐츠가 생기면 탭별로 다른 내용을 렌더링하면 된다.
 */
export default function NewsPage() {
  const [tab, setTab] = useState<NewsTab>("about");

  return (
    <main>
      <Banner size="lg" title="회사 소식" image="/banner-notice.png" />

      <div className="mx-auto max-w-2xl px-4 pt-4">
        <Chip.List>
          {TABS.map((t) => (
            <Chip key={t.key} on={tab === t.key} onClick={() => setTab(t.key)}>
              {t.label}
            </Chip>
          ))}
        </Chip.List>
      </div>

      <ComingSoon />
    </main>
  );
}
