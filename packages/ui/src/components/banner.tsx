"use client";

import type { ReactNode } from "react";

type Size = "lg" | "sm";

const heightClass: Record<Size, string> = {
  lg: "h-56",
  sm: "h-36",
};

const titleClass: Record<Size, string> = {
  lg: "text-xl",
  sm: "text-base",
};

// 배너 사진 안에서 어느 지점을 보여줄지. lg는 세로가 넉넉해서 위쪽(로고·메뉴 아이콘)부터 보여주고,
// sm은 세로가 짧아서 위쪽 기준으로 자르면 사진 속 낚시 장면이 잘려 나가 가운데를 기준으로 보여준다.
// (Tailwind의 배경 위치 클래스 — 고정값이라 인라인 스타일 대신 클래스로 표현한다)
const positionClass: Record<Size, string> = {
  lg: "bg-top",
  sm: "bg-center",
};

export interface BannerProps {
  /** "lg"(대메뉴 — 하단 탭으로 바로 들어오는 화면) | "sm"(소메뉴 — 그 안에서 더 들어간 화면) */
  size?: Size;
  /** 배너 위에 겹쳐 보여줄 제목. 비우면 텍스트 없이 사진만 나온다. */
  title?: ReactNode;
  /** 배경 사진 경로. 앱마다 자기 public 폴더에 이 파일이 있어야 한다. */
  image?: string;
  className?: string;
}

/**
 * 고객앱 공통 상단 배너. 대메뉴(하단 탭에서 바로 들어오는 화면: 홈/상품/장바구니/내정보)는
 * 크게, 소메뉴(그 안에서 더 들어간 화면: 상품 상세, 예약, 입금 안내 등)는 작게 쓴다.
 * 사진 위에 다시 로고·메뉴 아이콘을 그리지 않는다 — site-banner.jpg 자체에 이미 로고와
 * 메뉴 아이콘이 디자인 시안대로 포함돼 있고, 제목 텍스트만 이 컴포넌트가 겹쳐서 그린다
 * (화면마다 제목이 달라질 수 있어서 사진에 굽지 않고 별도 요소로 뒀다).
 */
export function Banner({ size = "lg", title, image = "/site-banner.jpg", className = "" }: BannerProps) {
  return (
    <div
      className={`relative w-full overflow-hidden bg-gray-200 bg-cover ${heightClass[size]} ${positionClass[size]} ${className}`}
      style={{ backgroundImage: `url(${image})` }}
    >
      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/5 to-transparent" />
      {title && (
        <p className={`absolute bottom-3 left-4 font-bold text-white drop-shadow ${titleClass[size]}`}>{title}</p>
      )}
    </div>
  );
}
