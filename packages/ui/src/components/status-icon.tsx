export type StatusIconStatus = "success" | "warning" | "error" | "info";

export interface StatusIconProps {
  status: StatusIconStatus;
  /** Tailwind 크기 클래스(w-*, h-*). 기본 h-4 w-4 — 호출부에서 더 크게 쓰고 싶으면 넘긴다. */
  className?: string;
  /**
   * warning 아이콘 모양 — 기본 "triangle"(Alert 등 기존 사용처 그대로 유지). Toast는 성공/실패
   * 아이콘과 통일된 원형 배지 세트를 쓰기 위해 "circle"을 넘긴다(레퍼런스 디자인: 초록 체크·
   * 빨강 X·노랑 느낌표 원 3종이 한 세트인 ICON_TOAST 스펙).
   */
  warningShape?: "triangle" | "circle";
}

/**
 * Alert·Toast가 공유하는 상태 아이콘(success/warning/error/info) — 글자 하나(✓/⚠/✕)가 아니라
 * "색이 채워진 도형 + 흰색 글리프" 배지 모양으로 그린다(레퍼런스: 초록 원 안에 흰 체크). 도형
 * 색은 currentColor를 쓰므로, 부모가 text-success/warning/error/info 색을 정하면 그 색으로
 * 채워지고 글리프(체크/X/느낌표/i)만 항상 흰색으로 고정된다.
 *
 * className으로 크기를 받는 함수형 컴포넌트인 이유: 정적 노드(Record<Status, ReactNode>)로
 * 두면 svg 자체에 크기가 h-4 w-4로 고정돼서, 쓰는 곳마다 더 크게/작게 보여줄 수가 없었다.
 */
export function StatusIcon({ status, className = "h-4 w-4", warningShape = "triangle" }: StatusIconProps) {
  switch (status) {
    case "success":
      return (
        <svg viewBox="0 0 20 20" aria-hidden="true" className={className}>
          <circle cx="10" cy="10" r="10" fill="currentColor" />
          <path
            d="M6 10.3 8.6 13 14.2 7.2"
            fill="none"
            stroke="white"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "error":
      return (
        <svg viewBox="0 0 20 20" aria-hidden="true" className={className}>
          <circle cx="10" cy="10" r="10" fill="currentColor" />
          <path d="M7 7l6 6M13 7l-6 6" stroke="white" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      );
    case "warning":
      if (warningShape === "circle") {
        return (
          <svg viewBox="0 0 20 20" aria-hidden="true" className={className}>
            <circle cx="10" cy="10" r="10" fill="currentColor" />
            <rect x="9.2" y="5.5" width="1.6" height="5.7" rx="0.8" fill="white" />
            <circle cx="10" cy="13.8" r="1" fill="white" />
          </svg>
        );
      }
      return (
        <svg viewBox="0 0 20 20" aria-hidden="true" className={className}>
          <path d="M10 1.8 19 17.6H1Z" fill="currentColor" strokeLinejoin="round" />
          <rect x="9.2" y="7.4" width="1.6" height="4.6" rx="0.8" fill="white" />
          <circle cx="10" cy="14.3" r="0.95" fill="white" />
        </svg>
      );
    case "info":
      return (
        <svg viewBox="0 0 20 20" aria-hidden="true" className={className}>
          <circle cx="10" cy="10" r="10" fill="currentColor" />
          <circle cx="10" cy="6.4" r="1.05" fill="white" />
          <rect x="9.15" y="9.1" width="1.7" height="5" rx="0.85" fill="white" />
        </svg>
      );
  }
}
