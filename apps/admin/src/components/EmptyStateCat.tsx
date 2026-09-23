"use client";

import type { ReactNode } from "react";
import { Card } from "@chinguya/ui";

export interface EmptyStateCatProps {
  /** "OO이 없습니다." 같은 안내 문구 — 화면마다 다르다. 디자인(카드·자는 고양이)은 항상 같다. */
  message: ReactNode;
  /** 바깥 여백(margin) 조정용 — 공용 EmptyState와 같은 용법. */
  className?: string;
}

/**
 * 어드민 전용 "데이터 없음" 상태 — 대시보드 "오늘 방문 예약"에 넣었던 자는 고양이 디자인을
 * 그대로 컴포넌트로 뽑은 것이다. 문구는 화면마다 바뀌어도 되지만(그래서 message를 prop으로
 * 받는다) 카드 모양·고양이·Zz 애니메이션은 항상 동일하게 유지한다.
 *
 * 공용 EmptyState(packages/ui)는 admin·agency·customer 3개 앱이 같이 쓰는 컴포넌트라 여기서
 * 고양이를 넣으면 다른 앱 화면에도 전부 나타나 버린다 — 그래서 이 컴포넌트는 apps/admin
 * 안에서만 존재하고, 어드민의 "데이터 없음" 자리에 공용 EmptyState 대신 이걸 쓴다.
 * dashboard-sleeping-cat.png(투명 배경으로 이미 오려진 원본을 리사이즈만 한 파일)도
 * apps/admin/public에만 있다.
 */
export function EmptyStateCat({ message, className = "" }: EmptyStateCatProps) {
  return (
    <Card
      padding="none"
      className={`relative flex min-h-[320px] flex-col overflow-hidden ${className}`}
    >
      <div className="px-4 py-3 text-sm text-muted">{message}</div>

      <div
        className="pointer-events-none absolute inset-x-0 bottom-6 flex flex-col items-center"
        aria-hidden="true"
      >
        {/* "Zz" — 두 글자를 시차를 두고 위로 떠오르며 옅어지게 반복시켜서(sleep-z) 자고
            있다는 걸 나타낸다. 위치는 겹치지 않게 조금씩 어긋나게 뒀다(참고 시안처럼). */}
        <div className="relative mb-1 h-6 w-12">
          <span
            className="animate-sleep-z absolute left-1 text-lg font-bold text-muted opacity-0"
            style={{ animationDelay: "0s" }}
          >
            Z
          </span>
          <span
            className="animate-sleep-z absolute left-5 top-2 text-sm font-bold text-muted opacity-0"
            style={{ animationDelay: "0.7s" }}
          >
            z
          </span>
        </div>

        {/* dashboard-sleeping-cat.png는 배경이 투명하게 이미 오려진 원본 PNG를 그대로
            쓰고, 표시 크기(100px)에 맞춰 리사이즈만 한 것이다 — 직접 알파를 뽑아
            처리했을 때 경계가 끊겨 보이거나 박스 테두리가 남는 문제가 있었어서, 그
            작업 없이 이미 배경이 빠져 있는 원본 파일을 그대로 쓴다. */}
        {/* eslint-disable-next-line @next/next/no-img-element -- 고정 크기 장식용 일러스트, next/image 최적화 불필요 */}
        <img
          src="/dashboard-sleeping-cat.png"
          alt=""
          className="animate-cat-breathe w-[100px]"
          style={{ transformOrigin: "bottom center" }}
        />
      </div>
    </Card>
  );
}
