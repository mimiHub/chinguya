"use client";

import { Title } from "./title";

export interface ComingSoonProps {
  /**
   * default variant: "존재하지 않는 예약입니다" 같은 짧은 안내 문구 한 줄(기존 동작 그대로).
   * splash variant: "Coming soon!" 아래 부제로 쓴다 — 생략하면 "페이지 준비중입니다."
   */
  label?: string;
  /**
   * "default"(기본) — 기존처럼 화면 일부에 끼워 쓰는 작은 안내 문구(상품/예약/인보이스를
   * 찾을 수 없을 때 등, 페이지 레이아웃은 그대로 두고 본문 자리만 대체).
   * "splash" — 페이지 전체를 채우는 짙은 남색 배경 + 별자리(점·선) 장식의 "준비 중" 랜딩
   * 화면(레퍼런스 디자인). 아직 화면 자체가 없는 스텁 라우트(예: /menu)에서 페이지 전체를
   * 이 화면으로 채울 때 쓴다 — 다른 곳의 "OO을 찾을 수 없습니다" 안내와는 성격이 달라서
   * variant로 분리했다(기본값은 그대로 두고, 이 랜딩 느낌이 필요한 곳만 opt-in).
   */
  variant?: "default" | "splash";
}

export function ComingSoon({ label, variant = "default" }: ComingSoonProps) {
  if (variant === "splash") {
    return (
      <div className="relative flex min-h-[70vh] items-center justify-center overflow-hidden bg-[#131b2e]">
        {/* 배경 사진 — 각 앱 public/coming-soon-bg.jpg 필요(logo-mb.png와 같은 관례: 공용
            컴포넌트는 경로만 참조하고, 실제 파일은 이 컴포넌트를 쓰는 앱마다 자기 public에
            둔다). */}
        <img
          src="/coming-soon-bg.jpg"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover"
        />
        {/* 사진 위에 어두운 반투명 오버레이 — 사진 자체가 밝고 색이 다양해서 그 위에 흰
            글자를 바로 얹으면 하늘·호수의 밝은 영역에서 글자가 묻힌다. 오버레이로 전체
            명도를 낮춰 어느 위치에 텍스트가 와도 대비가 확보되게 한다. */}
        <div className="absolute inset-0 bg-[#0b0f1a]/70" aria-hidden="true" />
        <div className="relative flex flex-col items-center gap-4 px-6 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-white md:text-5xl">
            {/* "soon!"은 포인트 컬러(로고 세이지그린 accent 스케일)로 강조 — primary-500은
                앱마다 값이 달라서(고객·여행사 앱은 검정에 가까움, admin만 세이지그린으로
                재정의됨) 여기선 항상 같은 초록으로 보여야 하는 accent-400을 쓴다(어두운
                오버레이 위에서 accent-500보다 한 톤 밝아 대비가 더 낫다). */}
            Coming <span className="text-accent-400">soon!</span>
          </h1>
          <p className="text-sm text-slate-400 md:text-base">{label ?? "페이지 준비중입니다."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[300px] items-center justify-center">
      <Title size="md" center>
        {label ?? "준비 중입니다"}
      </Title>
    </div>
  );
}
