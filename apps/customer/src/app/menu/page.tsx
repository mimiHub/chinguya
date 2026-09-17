import { ComingSoon } from "@chinguya/ui";

/** 상단 네비게이션 "메뉴" 링크용 스텁 — 아직 실제 화면이 없어 ComingSoon(splash)으로 연결해둔다.
 *  splash는 페이지 전체를 채우는 랜딩 화면이라, 다른 소메뉴 화면처럼 위에 Banner를 따로 얹지
 *  않는다(짙은 배경 화면 위에 밝은 배너가 겹치면 어색하다). */
export default function MenuPage() {
  return <ComingSoon variant="splash" />;
}
