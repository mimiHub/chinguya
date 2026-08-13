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

const baseFieldClass =
  "w-full rounded-sm border border-line bg-white text-ink transition-colors placeholder:text-muted focus:outline-none focus:border-primary-500 disabled:bg-gray-100 disabled:cursor-not-allowed";

const checkboxClass =
  "relative inline-flex h-[18px] w-[18px] shrink-0 appearance-none items-center justify-center rounded-sm border-[1.5px] border-line bg-white transition-colors hover:border-primary-500 checked:bg-primary-500 checked:border-primary-500 disabled:bg-gray-100 disabled:border-gray-200 disabled:cursor-not-allowed cursor-pointer " +
  "checked:after:content-[''] checked:after:absolute checked:after:h-3 checked:after:w-1.5 checked:after:border-white checked:after:border-r-2 checked:after:border-b-2 checked:after:-translate-y-0.5 checked:after:rotate-45";

const radioClass =
  "relative inline-flex h-5 w-5 shrink-0 appearance-none items-center justify-center rounded-full border-[1.5px] border-line bg-white transition-colors hover:border-primary-500 checked:border-primary-500 disabled:bg-gray-100 disabled:border-gray-200 disabled:cursor-not-allowed cursor-pointer " +
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
};

export type InputProps = BaseProps &
  Omit<InputHTMLAttributes<HTMLInputElement>, "size"> &
  Partial<Pick<TextareaHTMLAttributes<HTMLTextAreaElement>, "rows">>;

/**
 * checkbox/radio/switch는 텍스트 입력용 스타일 대신 각자의 커스텀 스타일로 렌더링된다.
 * switch는 native checkbox에 스위치 모양을 입힌 것 — checked/onChange(event)로 동일하게 쓴다.
 */
export function Input({ size = "md", className = "", error = false, as = "input", type = "text", ...rest }: InputProps) {
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

  const classNames = [baseFieldClass, sizeClass[size], error ? "border-error" : "", className]
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
