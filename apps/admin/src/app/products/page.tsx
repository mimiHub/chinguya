"use client";

import { useState } from "react";
import { Title } from "@chinguya/ui/title";
import { Text } from "@chinguya/ui/text";
import { Card } from "@chinguya/ui/card";
import { Stack } from "@chinguya/ui/stack";
import { Toggle } from "@chinguya/ui/toggle";
import { Link } from "@chinguya/ui/link";
import { Button } from "@chinguya/ui/button";
import { adminProductVariants, type AdminProductVariant, RENTAL_OPTION_LABEL } from "@/data/productData";

/**
 * S1-A4 상품 관리 목록. 상품 하나 = "카테고리+대여기간" 조합(예: "전기자전거 · 1일") — 와이어프레임
 * 대로 조합마다 고객앱/여행사앱 표출을 독립적으로 토글한다. 토글은 지금은 화면 상태만 바꾸고
 * 저장하지 않는다 — 실제 연동 시 PATCH /api/admin/products/{id} 호출로 교체한다.
 */
export default function AdminProductsPage() {
  const [variants, setVariants] = useState<AdminProductVariant[]>(adminProductVariants);

  const toggleVisibility = (id: string, field: "customerVisible" | "agencyVisible") => {
    setVariants((prev) => prev.map((v) => (v.id === id ? { ...v, [field]: !v[field] } : v)));
  };

  return (
    <main className="mx-auto max-w-2xl p-6">
      <Stack justify="between" align="center">
        <Title size="md">상품 관리</Title>
        <Button href="/products/new" variant="subtle" size="sm">
          + 등록
        </Button>
      </Stack>

      <Stack direction="column" gap="sm" className="mt-4">
        {variants.map((variant) => (
          <Card key={variant.id} padding="sm">
            <Stack direction="column" gap="sm">
              <Stack justify="between" align="center">
                <Text weight="bold">
                  {variant.title} · {RENTAL_OPTION_LABEL[variant.option]}
                </Text>
                <Link href={`/products/${variant.id}`} variant="muted" size="sm">
                  수정
                </Link>
              </Stack>
              <Text variant="sub">고객가 {variant.price.customerPrice.toLocaleString()}원</Text>
              <Stack gap="lg">
                <Stack gap="xs" align="center">
                  <Text variant="sub" as="span">
                    고객
                  </Text>
                  <Toggle on={variant.customerVisible} onChange={() => toggleVisibility(variant.id, "customerVisible")} />
                </Stack>
                <Stack gap="xs" align="center">
                  <Text variant="sub" as="span">
                    여행사
                  </Text>
                  <Toggle on={variant.agencyVisible} onChange={() => toggleVisibility(variant.id, "agencyVisible")} />
                </Stack>
              </Stack>
            </Stack>
          </Card>
        ))}
      </Stack>      
    </main>
  );
}
