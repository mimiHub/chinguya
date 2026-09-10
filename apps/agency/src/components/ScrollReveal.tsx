"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

type ScrollRevealProps = {
  children: ReactNode;
  /** 애니메이션 시작을 늦추는 시간(ms). 같은 화면에 여러 개를 겹쳐 쓸 때 순차 등장 효과를 준다. */
  delay?: number;
  className?: string;
};

/**
 * 스크롤(또는 페이지 진입)해서 화면에 들어오는 순간, 콘텐츠가 위에서 살짝 아래로 내려오며
 * 나타나는 공통 연출 — 고객 앱(apps/customer/src/components/ScrollReveal.tsx)과 동일한
 * 컴포넌트를 여행사 앱에도 그대로 옮겨왔다.
 *
 * IntersectionObserver로 한 번만 감지하고(재방문 시 계속 깜빡이지 않도록) 이후엔 관찰을 끊는다.
 * prefers-reduced-motion을 켠 사용자는 애니메이션 없이 바로 보이도록 처리한다.
 *
 * 여행사 앱 화면은 고객 앱과 달리 flex/min-h-0로 짜인 내부 스크롤 레이아웃(표 영역이 자기
 * 안에서만 스크롤되는 구조)이 많다 — 그 체인 중간에 이 컴포넌트를 끼워 넣을 때는 className에
 * flex-1/min-h-0/flex flex-col 등 원래 그 자리에 있던 레이아웃 클래스를 그대로 넘겨줘야
 * 스크롤 영역이 깨지지 않는다.
 */
export function ScrollReveal({ children, delay = 0, className = "" }: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -10% 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        visible ? "translate-y-0 opacity-100" : "-translate-y-6 opacity-0"
      } ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
