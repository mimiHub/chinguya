"use client";

export interface TabItem {
  key: string;
  label: string;
}

export interface TabProps {
  items?: TabItem[];
  activeKey?: string;
  onChange?: (key: string) => void;
  /** "underline"(기본, 밑줄 탭) | "capsule"(알약 모양 세그먼트 탭) */
  variant?: "underline" | "capsule";
  className?: string;
}

export function Tab({ items = [], activeKey, onChange, variant = "underline", className = "" }: TabProps) {
  const isCapsule = variant === "capsule";

  const listClass = isCapsule
    ? "inline-flex gap-1 rounded-full bg-bg-light p-1 md:gap-2"
    : "flex gap-4 overflow-x-auto border-b border-line md:gap-6";

  const itemClass = (active: boolean) => {
    if (isCapsule) {
      return [
        "flex-none rounded-full px-6 py-1 text-sm font-medium whitespace-nowrap transition-colors",
        active ? "bg-primary-800 text-white" : "text-muted hover:text-ink",
      ].join(" ");
    }
    return [
      "flex-none border-b-2 px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors md:text-base",
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
