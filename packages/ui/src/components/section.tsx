"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

export interface SectionProps {
  children?: ReactNode;
  /** "default"(일반 페이지) | "auth"(가운데 정렬된 좁은 폼 페이지) */
  variant?: "default" | "auth";
  className?: string;
}

/**
 * 페이지 콘텐츠를 감싸는 공용 섹션.
 * 스크롤해서 화면에 들어오면 위에서 아래로 자연스럽게 내려오며 나타나는 애니메이션이 기본 적용됨(1회).
 */
export function Section({ children, variant = "default", className = "" }: SectionProps) {
  const variantClass = variant === "auth" ? "mx-auto max-w-[400px] py-10" : "py-6";
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      className={[
        variantClass,
        "transition-[opacity,transform] duration-700 ease-out motion-reduce:transition-none motion-reduce:opacity-100 motion-reduce:translate-y-0",
        visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-7",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </section>
  );
}
