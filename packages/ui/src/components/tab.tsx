"use client";

export interface TabItem {
  key: string;
  label: string;
}

export interface TabProps {
  items?: TabItem[];
  activeKey?: string;
  onChange?: (key: string) => void;
  /** "underline"(기본, 밑줄 탭) | "capsule"(알약 모양 세그먼트 탭 — 회색 트랙 안에서 선택된 항목만 진한
   *  알약으로 올라오는 모양. 서비스 소개·내 예약·상품 조회 등 화면 상단 탭이 모두 이 모양으로 통일돼 있다) |
   *  "segment"(꽉 찬 폭의 트랙 안에서 선택된 항목만 진한 배경으로 덮는 세그먼트 컨트롤 — 알약형이 아닌 다른
   *  형태가 필요할 때 사용) */
  variant?: "underline" | "capsule" | "segment";
  className?: string;
}

export function Tab({
  items = [],
  activeKey,
  onChange,
  variant = "underline",
  className = "",
}: TabProps) {
  const listClass =
    variant === "capsule"
      ? // w-fit: 알약 트랙이 안쪽 탭 글자 폭만큼만 차지하게 고정한다. inline-flex만으로는 부모가 세로 Stack(flex, 기본
        // align-items: stretch)일 때 트랙이 가로로 끝까지 늘어나 화면마다 폭이 달라졌다.
        "inline-flex w-fit gap-1 rounded-full bg-bg-light p-1 md:gap-2"
      : variant === "segment"
        ? "flex gap-1 rounded-lg bg-bg-light p-1"
        : "flex gap-4 overflow-x-auto border-b border-line md:gap-6";

  const itemClass = (active: boolean) => {
    if (variant === "capsule") {
      return [
        "flex-none cursor-pointer rounded-full px-6 py-1 text-sm font-medium whitespace-nowrap transition-colors",
        // 활성 알약은 대표색(primary-500) — 버튼·segment 탭과 같은 색. 앱마다 primary-500이 다시 정의되므로 앱 테마를 따른다.
        active ? "bg-primary-500 text-white" : "text-muted hover:text-ink",
      ].join(" ");
    }
    if (variant === "segment") {
      // "bg-ink"는 라이트 테마 기준 "짙은 잉크색"을 가리키는 이름이지만, 다크 테마 앱(관리자)에서는
      // --color-ink 자체가 밝은 텍스트색으로 재정의돼 있어서(packages/ui는 앱마다 색 토큰이 다시
      // 정의되는 걸 전제로 한다) bg-ink를 배경으로 쓰면 흰 텍스트와 거의 같은 밝기가 되어 글자가
      // 안 보이는 문제가 있었다. 테마와 무관하게 항상 뚜렷한 강조색인 primary-500으로 바꿨다.
      //
      // 라운드는 트랙(rounded-lg = --radius-lg)에서 트랙 안쪽 여백(p-1 = 0.25rem)만큼 뺀 값이다 — 바깥 박스 안에
      // 여백을 두고 박스를 하나 더 넣을 때는 "안쪽 반지름 = 바깥 반지름 − 여백"이어야 두 모서리 곡선이 같은
      // 중심을 공유해서(동심원) 선택된 버튼이 트랙에 자연스럽게 들어맞는다. 예전엔 안쪽이 rounded-md(8px)라
      // 16px 트랙 모서리에서 곡선 간격이 들쭉날쭉해 보였다. 트랙 라운드·여백을 바꾸면 이 식도 같이 맞춘다.
      return [
        "flex-1 cursor-pointer rounded-[calc(var(--radius-lg)-0.25rem)] py-2 text-center text-sm font-medium whitespace-nowrap transition-colors",
        active ? "bg-primary-500 text-white shadow-sm" : "text-muted hover:text-ink",
      ].join(" ");
    }
    return [
      "flex-none cursor-pointer border-b-2 px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors md:text-base",
      active
        ? "border-primary-500 text-primary-500 font-bold"
        : "border-transparent text-muted hover:text-ink",
    ].join(" ");
  };

  return (
    <div className={`${listClass} ${className}`}>
      {items.map((item) => (
        <div
          key={item.key}
          className={itemClass(item.key === activeKey)}
          onClick={() => onChange?.(item.key)}
        >
          {item.label}
        </div>
      ))}
    </div>
  );
}
