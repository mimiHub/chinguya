"use client";

import { useEffect, useState, type MouseEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";

export interface PopupProps {
  open?: boolean;
  onClose?: () => void;
  title?: ReactNode;
  className?: string;
  children?: ReactNode;
}

/**
 * 모바일에서는 하단 시트, 768px↑에서는 중앙 모달로 전환되는 공용 팝업.
 *
 * document.body에 포탈로 렌더링한다 — 원래는 호출한 자리에 그대로 렌더링했는데, 여행사 앱
 * 상품 예약 화면(apps/agency/src/app/book/page.tsx)의 날짜 선택 팝업(Calendar를 담은 Popup)이
 * ScrollReveal로 감싼 Card 안에 있다 보니 팝업이 화면 중앙이 아니라 그 Card 크기 안에
 * 갇혀서 달력 아랫줄이 잘려 보이는 문제가 있었다(2026-09-23). 원인은 CSS의 잘 알려진 함정 —
 * position:fixed는 "가장 가까운 transform이 걸린 조상" 기준으로 붙는데, ScrollReveal은 등장
 * 애니메이션을 위해 자기 자신에 translate-y 값을 준다(끝나면 translate-y-0이라도 transform
 * 자체는 "없음"이 아니라 "0만큼 이동"이라 여전히 그 기준점이 된다). 그래서 fixed inset-0가
 * 진짜 뷰포트가 아니라 그 작은 Card를 기준으로 계산됐다. Popup을 body로 포탈하면 어떤
 * 조상에 transform이 걸려 있어도 항상 진짜 뷰포트 기준 fixed로 뜨고, 이 컴포넌트를 쓰는
 * 다른 모든 화면(ConfirmPopup 포함)에도 같은 안전성이 자동으로 적용된다.
 *
 * mounted 체크는 SSR 안전장치 — document는 서버에 없으므로 클라이언트에 마운트된 뒤에만
 * 포탈을 만든다(마운트 전에는 어차피 open도 대개 false라 실사용엔 영향 없다).
 */
export function Popup({ open, onClose, title, className = "", children }: PopupProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[1000] flex items-end justify-center bg-black/50 md:items-center"
      onClick={onClose}
    >
      <div
        className={`max-h-[85vh] w-full overflow-y-auto rounded-t-lg bg-surface p-6 md:max-h-[90vh] md:w-[400px] md:max-w-[90vw] md:rounded-lg ${className}`}
        onClick={(e: MouseEvent) => e.stopPropagation()}
      >
        {title && (
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-lg font-bold text-ink">{title}</h3>
            <span className="cursor-pointer text-lg text-muted hover:text-ink" onClick={onClose}>
              &times;
            </span>
          </div>
        )}
        {children}
      </div>
    </div>,
    document.body,
  );
}
