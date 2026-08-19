import { Banner } from "@chinguya/ui/banner";
import { ComingSoon } from "@chinguya/ui/coming-soon";

/** 상단 네비게이션 "공지사항" 링크용 스텁 — 아직 실제 화면이 없어 ComingSoon으로 연결해둔다. */
export default function NoticePage() {
  return (
    <main>
      <Banner size="sm" title="공지사항" />
      <ComingSoon />
    </main>
  );
}
