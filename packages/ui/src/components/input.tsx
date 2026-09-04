"use client";

import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

type Size = "sm" | "md" | "lg";
type As = "input" | "textarea";
type CustomType = "checkbox" | "radio" | "switch";

const sizeClass: Record<Size, string> = {
  sm: "h-8 px-4 text-sm",
  md: "h-10 px-4 text-base",
  lg: "h-12 px-6 text-lg",
};

// "w-full"을 여기 고정으로 넣어두면, 고정 너비를 주고 싶은 곳(className="w-32" 등)에서
// 같은 width 속성을 두 클래스가 동시에 노려서 어느 쪽이 이기는지가 Tailwind 내부 유틸리티
// 정렬 순서에 좌우된다(순서상 w-full이 이겨서, 형제 요소(라벨)의 텍스트 길이에 따라 flex-shrink
// 계산이 달라지며 같은 w-32를 준 입력창끼리도 실제 렌더링 너비가 달라지는 문제가 있었다 —
// packages/ui/src/components/card.tsx의 padding 충돌과 동일한 유형의 버그). 그래서 기본값은
// fullWidth prop으로 조건부 적용하고, 고정 너비가 필요한 곳은 fullWidth={false}로 꺼서
// className의 w-32 등이 유일한 width 소스가 되게 한다.
// disabled 필드가 두 가지 이유로 거의 안 보였다: ① bg-gray-100만으로는 다크 테마(admin)에서
// surface(#292a2d)와 gray-100(#2d2e31) 명도 차이가 거의 없다 — gray-200(#35363a)으로 올려
// "비활성 칸"이라는 게 배경만 봐도 드러나게 한다. ② 더 큰 원인은 따로 있었다 — Safari/Chrome
// 둘 다 disabled input의 실제 렌더링 글자색은 우리가 준 color(text-muted)가 아니라
// -webkit-text-fill-color가 따로 결정하고, 이걸 안 주면 브라우저 기본값(값이 실제로 거의
// 안 보이는 아주 옅은 색)이 이겨버린다 — 재고 세팅 "기준 보유량"의 값 8이 빈 칸처럼 보이던
// 원인. -webkit-text-fill-color를 직접 지정하고 opacity도 100으로 고정해서 브라우저가 값을
// 더 죽이지 못하게 막는다.
const baseFieldClass =
  "rounded-sm border border-line bg-surface text-ink transition-colors placeholder:text-muted focus:outline-none focus:border-input-focus disabled:bg-gray-200 disabled:text-muted disabled:opacity-100 disabled:[-webkit-text-fill-color:var(--color-muted)] disabled:cursor-not-allowed";

const checkboxClass =
  "relative inline-flex h-[18px] w-[18px] shrink-0 appearance-none items-center justify-center rounded-sm border-[1.5px] border-line bg-surface transition-colors hover:border-primary-500 checked:bg-primary-500 checked:border-primary-500 disabled:bg-gray-100 disabled:border-gray-200 disabled:cursor-not-allowed cursor-pointer " +
  "checked:after:content-[''] checked:after:absolute checked:after:h-3 checked:after:w-1.5 checked:after:border-white checked:after:border-r-2 checked:after:border-b-2 checked:after:-translate-y-0.5 checked:after:rotate-45";

const radioClass =
  "relative inline-flex h-5 w-5 shrink-0 appearance-none items-center justify-center rounded-full border-[1.5px] border-line bg-surface transition-colors hover:border-primary-500 checked:border-primary-500 disabled:bg-gray-100 disabled:border-gray-200 disabled:cursor-not-allowed cursor-pointer " +
  "checked:after:content-[''] checked:after:absolute checked:after:h-2.5 checked:after:w-2.5 checked:after:rounded-full checked:after:bg-primary-500";

const switchClass =
  "relative h-[22px] w-10 shrink-0 appearance-none rounded-full bg-gray-200 transition-colors checked:bg-secondary-800 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-[left] checked:after:left-[21px]";

const customTypeClass: Record<CustomType, string> = {
  checkbox: checkboxClass,
  radio: radioClass,
  switch: switchClass,
};

type BaseProps = {
  size?: Size;
  error?: boolean;
  as?: As;
  className?: string;
  /** 기본 true(꽉 채움). 고정 너비를 className(예: "w-32")으로 줄 때는 false로 꺼서 충돌을 막는다. */
  fullWidth?: boolean;
};

export type InputProps = BaseProps &
  Omit<InputHTMLAttributes<HTMLInputElement>, "size"> &
  Partial<Pick<TextareaHTMLAttributes<HTMLTextAreaElement>, "rows">>;

/**
 * checkbox/radio/switch는 텍스트 입력용 스타일 대신 각자의 커스텀 스타일로 렌더링된다.
 * switch는 native checkbox에 스위치 모양을 입힌 것 — checked/onChange(event)로 동일하게 쓴다.
 */
export function Input({
  size = "md",
  className = "",
  error = false,
  as = "input",
  type = "text",
  fullWidth = true,
  ...rest
}: InputProps) {
  if (type === "checkbox" || type === "radio" || type === "switch") {
    const nativeType = type === "switch" ? "checkbox" : type;
    return (
      <input
        type={nativeType}
        className={`${customTypeClass[type as CustomType]} ${className}`}
        {...(rest as InputHTMLAttributes<HTMLInputElement>)}
      />
    );
  }

  const classNames = [baseFieldClass, fullWidth ? "w-full" : "", sizeClass[size], error ? "border-error" : "", className]
    .filter(Boolean)
    .join(" ");

  if (as === "textarea") {
    return (
      <textarea
        className={`${classNames} min-h-[120px] resize-none py-2 leading-relaxed`}
        {...(rest as TextareaHTMLAttributes<HTMLTextAreaElement>)}
      />
    );
  }

  return <input type={type} className={classNames} {...(rest as InputHTMLAttributes<HTMLInputElement>)} />;
}
