"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

type ScrollRevealProps = {
  children: ReactNode;
  /** 애니메이션 시작을 늦추는 시간(ms). 같은 화면에 여러 개를 겹쳐 쓸 때 순차 등장 효과를 준다. */
  delay?: number;
  className?: string;
  /**
   * true면 항목 사이에 점선 구분선을 추가한다(마지막 항목은 자동으로 생략).
   * 목록 항목을 이 컴포넌트로 감싸 쓰는 경우, 이 자리가 실제 형제 요소가 되는 지점이라
   * last-child 판정이 올바르게 동작한다 — 카드 안쪽에 직접 border-dashed를 넣으면 카드
   * 자체 테두리와 충돌하거나(4면이 다 점선으로 보임) "마지막" 판정이 어긋날 수 있다.
   * 카드가 이미 그림자·둥근 모서리로 충분히 구분되는 목록(예: mypage)에서는 켜지 않는다.
   */
  divider?: boolean;
};

/**
 * 스크롤해서 화면에 들어오는 순간, 콘텐츠가 위에서 살짝 아래로 내려오며 나타나는 공통 연출.
 * 고객 페이지 전반에서 동일하게 쓰기 위한 컴포넌트 — 섹션/카드 단위로 감싸서 사용한다.
 *
 * IntersectionObserver로 한 번만 감지하고(재방문 시 계속 깜빡이지 않도록) 이후엔 관찰을 끊는다.
 * prefers-reduced-motion을 켠 사용자는 애니메이션 없이 바로 보이도록 처리한다.
 */
export function ScrollReveal({ children, delay = 0, className = "", divider = false }: ScrollRevealProps) {
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
      } ${divider ? "border-b border-dashed border-line last:border-b-0" : ""} ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
