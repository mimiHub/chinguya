"use client";

export interface TabItem {
  key: string;
  label: string;
}

export interface TabProps {
  items?: TabItem[];
  activeKey?: string;
  onChange?: (key: string) => void;
  /** "underline"(기본, 밑줄 탭) | "capsule"(알약 모양 세그먼트 탭) | "segment"(꽉 찬 폭의
   *  트랙 안에서 선택된 항목만 진한 배경으로 덮는 세그먼트 컨트롤 — 알약형이 아닌 다른
   *  형태가 필요할 때 사용) */
  variant?: "underline" | "capsule" | "segment";
  className?: string;
}

export function Tab({ items = [], activeKey, onChange, variant = "underline", className = "" }: TabProps) {
  const listClass =
    variant === "capsule"
      ? "inline-flex gap-1 rounded-full bg-bg-light p-1 md:gap-2"
      : variant === "segment"
        ? "flex gap-1 rounded-lg bg-bg-light p-1"
        : "flex gap-4 overflow-x-auto border-b border-line md:gap-6";

  const itemClass = (active: boolean) => {
    if (variant === "capsule") {
      return [
        "flex-none cursor-pointer rounded-full px-6 py-1 text-sm font-medium whitespace-nowrap transition-colors",
        active ? "bg-primary-800 text-white" : "text-muted hover:text-ink",
      ].join(" ");
    }
    if (variant === "segment") {
      return [
        "flex-1 cursor-pointer rounded-md py-2 text-center text-sm font-medium whitespace-nowrap transition-colors",
        active ? "bg-ink text-white shadow-sm" : "text-muted hover:text-ink",
      ].join(" ");
    }
    return [
      "flex-none cursor-pointer border-b-2 px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors md:text-base",
      active ? "border-primary-500 text-primary-500 font-bold" : "border-transparent text-muted hover:text-ink",
    ].join(" ");
  };

  return (
    <div className={`${listClass} ${className}`}>
      {items.map((item) => (
        <div key={item.key} className={itemClass(item.key === activeKey)} onClick={() => onChange?.(item.key)}>
          {item.label}
        </div>
      ))}
    </div>
  );
}
