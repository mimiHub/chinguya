import { Banner } from "@chinguya/ui/banner";
import { ComingSoon } from "@chinguya/ui/coming-soon";

/** 상단 네비게이션 "메뉴" 링크용 스텁 — 아직 실제 화면이 없어 ComingSoon으로 연결해둔다. */
export default function MenuPage() {
  return (
    <main>
      <Banner size="sm" title="메뉴" />
      <ComingSoon />
    </main>
  );
}
