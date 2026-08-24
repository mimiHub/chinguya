"use client";

import { useState } from "react";
import NextLink from "next/link";
import type { Agency } from "@chinguya/types";
import { Title } from "@chinguya/ui/title";
import { Text } from "@chinguya/ui/text";
import { Card } from "@chinguya/ui/card";
import { Stack } from "@chinguya/ui/stack";
import { Badge } from "@chinguya/ui/badge";
import { Toggle } from "@chinguya/ui/toggle";
import { Button } from "@chinguya/ui/button";
import { IconX } from "@chinguya/ui/icon-x";
import { ConfirmPopup } from "@chinguya/ui/confirm-popup";
import { agencies as initialAgencies } from "@/data/agencyData";

/**
 * 여행사 관리. 거래처(여행사) 계정을 등록·조회하고, 활성/비활성(계약 종료 등)을 토글한다.
 * active=false가 되면 그 여행사 계정으로는 여행사앱 로그인/예약이 막힌다는 규칙이지만,
 * 아직 agency 앱에 로그인 자체가 없어서 지금은 이 화면의 토글이 실제로 뭔가를 막지는 않는다.
 * 등록은 팝업이 아니라 상품 관리(/products/[id])와 같은 방식으로 별도 페이지(/agencies/new)에서 한다.
 */
export default function AdminAgenciesPage() {
  const [agencies, setAgencies] = useState<Agency[]>(initialAgencies);
  const [deleteTarget, setDeleteTarget] = useState<Agency | null>(null);

  const toggleActive = (id: string) => {
    setAgencies((prev) => prev.map((a) => (a.id === id ? { ...a, active: !a.active } : a)));
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    setAgencies((prev) => prev.filter((a) => a.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  return (
    <main className="mx-auto max-w-2xl p-6">
      <Stack direction="column" gap="sm">
        <NextLink href="/more" className="text-sm text-muted hover:underline">
          ← 더보기로
        </NextLink>
        <Stack justify="between" align="center">
          <Title size="md">여행사 관리</Title>
          <Button href="/agencies/new" variant="subtle" size="sm">
            + 등록
          </Button>
        </Stack>
      </Stack>

      <Stack direction="column" gap="sm" className="mt-4">
        {agencies.map((agency) => (
          <Card key={agency.id} padding="sm">
            <Stack direction="column" gap="sm">
              <Stack justify="between" align="center">
                <Text weight="bold">{agency.name}</Text>
                <IconX aria-label={`${agency.name} 삭제`} onClick={() => setDeleteTarget(agency)} />
              </Stack>
              <Text variant="sub">
                {agency.contactName} · {agency.contactPhone}
              </Text>
              <Text variant="sub">{agency.contactEmail}</Text>
              <Stack justify="between" align="center">
                {/* 태그 글자가 토글 상태에 맞춰 "활성화"/"비활성화"로 바뀐다 */}
                <Badge variant={agency.active ? "success" : "gray"}>
                  {agency.active ? "활성화" : "비활성화"}
                </Badge>
                <Toggle on={agency.active} onChange={() => toggleActive(agency.id)} />
              </Stack>
            </Stack>
          </Card>
        ))}
      </Stack>      

      <ConfirmPopup
        open={Boolean(deleteTarget)}
        message={`'${deleteTarget?.name}' 여행사를 삭제합니다. 이 작업은 되돌릴 수 없습니다.`}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </main>
  );
}
