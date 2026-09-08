"use client";

import type { ReactNode } from "react";
import type { SocialProvider } from "@/data/authData";

// 카카오 공식 로고(말풍선)를 최대한 단순화해서 흉내낸 아이콘 — 정확한 브랜드 에셋 대신 형태만
// 재현한다(다른 두 아이콘도 마찬가지).
const KAKAO_BUBBLE_PATH =
  "M12 3C6.48 3 2 6.58 2 11c0 2.9 1.94 5.44 4.86 6.86-.21.77-.76 2.79-.87 3.22-.14.53.2.52.42.38.17-.11 2.7-1.83 3.8-2.58.58.08 1.18.12 1.79.12 5.52 0 10-3.58 10-8S17.52 3 12 3z";

const NAVER_ICON = (
  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm font-extrabold text-[#03c75a]">
    N
  </span>
);

const KAKAO_ICON = (
  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black">
    <svg viewBox="0 0 24 24" width="16" height="16" fill="#fee500" aria-hidden="true">
      <path d={KAKAO_BUBBLE_PATH} />
    </svg>
  </span>
);

// 구글 공식 4색 "G" 마크 — 구글 로그인 버튼에 널리 쓰이는 표준 아이콘. 네이버·카카오
// 아이콘은 둘 다 원형 배지 안에 들어 있는데 구글만 배지 없이 아이콘만 있으면 세 버튼을
// 나란히 놓았을 때 구글만 붕 떠 보인다 — 그래서 구글도 같은 크기의 원형 배지를 두르되,
// 버튼 배경이 이미 흰색이라 배지 배경은 흰색 그대로 두고 흐린 테두리선(버튼 테두리와 같은
// 색)만 그려서 "동그라미 안에 있다"는 것만 표시한다.
const GOOGLE_ICON = (
  <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[#dadce0] bg-white">
    <svg viewBox="0 0 48 48" width="18" height="18" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12 c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24 c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
      />
      <path
        fill="#FF3D00"
        d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657 C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36 c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
      />
      <path
        fill="#1976D2"
        d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571 c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"
      />
    </svg>
  </span>
);

const PROVIDER_STYLE: Record<
  SocialProvider,
  { label: string; icon: ReactNode; buttonClassName: string; textClassName: string }
> = {
  네이버: {
    label: "네이버로 시작하기",
    icon: NAVER_ICON,
    buttonClassName: "bg-[#03c75a]",
    textClassName: "text-white",
  },
  카카오: {
    label: "카카오로 시작하기",
    icon: KAKAO_ICON,
    buttonClassName: "bg-[#fee500]",
    textClassName: "text-[#191600]",
  },
  구글: {
    label: "Google로 시작하기",
    icon: GOOGLE_ICON,
    buttonClassName: "border border-[#dadce0] bg-white",
    textClassName: "text-[#1f1f1f]",
  },
};

/** S0-C1 화면에 소셜 버튼을 그리는 순서(참고 디자인 기준: 네이버 → 카카오 → Google). */
export const SOCIAL_PROVIDER_ORDER: SocialProvider[] = ["네이버", "카카오", "구글"];

export interface SocialLoginButtonProps {
  provider: SocialProvider;
  onClick: () => void;
}

/**
 * S0-C1(소셜 로그인) 소셜 버튼 — 브랜드 색·로고 배지를 그대로 재현한다(참고 디자인 기준).
 * 공용 Button 컴포넌트는 "가운데 정렬 텍스트 한 줄"짜리 알약/사각 버튼을 전제로 하는데, 이
 * 디자인은 왼쪽에 원형 로고 배지를 절대 위치로 얹고 텍스트는 버튼 전체 기준으로 가운데
 * 정렬해야 해서 모양이 근본적으로 다르다 — 그래서 Button을 쓰지 않고 직접 만들었다.
 * login·signup(S0-C1 단계) 두 화면에서 똑같이 쓰여서 공용 컴포넌트로 뺐다.
 */
export function SocialLoginButton({ provider, onClick }: SocialLoginButtonProps) {
  const { label, icon, buttonClassName, textClassName } = PROVIDER_STYLE[provider];
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex h-14 w-full items-center justify-center rounded-full transition-opacity hover:opacity-90 ${buttonClassName}`}
    >
      <span className="absolute left-4 flex h-8 w-8 shrink-0 items-center justify-center">
        {icon}
      </span>
      <span className={`text-base font-medium ${textClassName}`}>{label}</span>
    </button>
  );
}
