"use client";

import type { ElementType } from "react";
import { Text } from "./text";

type Currency = "won" | "원" | "엔";

const formatters: Record<Currency, (value: number, sign: string) => string> = {
  won: (value, sign) => `${sign}₩ ${value.toLocaleString()}`,
  원: (value, sign) => `${sign}${value.toLocaleString()}원`,
  엔: (value, sign) => `${sign}${value.toLocaleString()}엔`,
};

export interface PriceProps {
  value: number;
  currency?: Currency;
  /** 값 앞에 붙일 부호 문자열 (예: 취소 수수료처럼 마이너스 금액일 때 "− ") */
  sign?: string;
  as?: ElementType;
  size?: "sm" | "base" | "lg" | "xl" | "2xl";
  weight?: "light" | "regular" | "medium" | "bold";
  mono?: boolean;
  className?: string;
}

/** 금액 표시 전용 컴포넌트. 통화 포맷 + mono 폰트를 한 곳에서 통일 적용. */
export function Price({
  value,
  currency = "won",
  sign = "",
  as = "span",
  size = "sm",
  weight = "bold",
  mono = true,
  className = "",
}: PriceProps) {
  const format = formatters[currency] ?? formatters.won;

  return (
    <Text as={as} mono={mono} size={size} weight={weight} className={className}>
      {format(value, sign)}
    </Text>
  );
}