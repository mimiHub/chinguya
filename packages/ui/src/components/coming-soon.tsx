"use client";

import { Title } from "./title";

export interface ComingSoonProps {
  label?: string;
}

export function ComingSoon({ label = "준비 중입니다" }: ComingSoonProps) {
  return (
    <div className="flex min-h-[300px] items-center justify-center">
      <Title size="md" center>
        {label}
      </Title>
    </div>
  );
}
