"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import NextLink from "next/link";
import { Title } from "@chinguya/ui/title";
import { Chip } from "@chinguya/ui/chip";
import { Input } from "@chinguya/ui/input";
import { Card } from "@chinguya/ui/card";
import { Stack } from "@chinguya/ui/stack";
import { Text } from "@chinguya/ui/text";
import { EmptyState } from "@chinguya/ui/empty-state";
import { StatusBadge, Badge } from "@chinguya/ui/badge";
import {
  adminReservations,
  ADMIN_TAB_LABEL,
  ADMIN_TAB_ORDER,
  getAdminTab,
  type AdminReservationTab,
} from "@/data/reservationData";

const TABS = ADMIN_TAB_ORDER.map((key) => ({ key, label: ADMIN_TAB_LABEL[key] }));

// useSearchParams()를 쓰는 컴포넌트는 Next.js가 정적 프리렌더링을 시도할 때 Suspense 경계 안에
// 있어야 한다(없으면 빌드 에러) — 그래서 실제 내용은 내부 컴포넌트로 분리하고, 기본 export에서
// Suspense로 감싼다.
export default function AdminReservationsPage() {
  return (
    <Suspense fallback={null}>
      <AdminReservationsPageInner />
    </Suspense>
  );
}

function AdminReservationsPageInner() {
  // 대시보드 지표 카드(신규예약/입금확인요청/취소요청)에서 넘어올 때 ?tab=unpaid 처럼
  // 쿼리스트링으로 어느 탭을 열어둘지 지정한다 — 값이 없거나 잘못된 값이면 기본값("접수") 사용.
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab");
  const [activeKey, setActiveKey] = useState<AdminReservationTab>(
    ADMIN_TAB_ORDER.includes(initialTab as AdminReservationTab) ? (initialTab as AdminReservationTab) : "received",
  );
  const [keyword, setKeyword] = useState("");

  const filtered = adminReservations.filter((r) => {
    if (getAdminTab(r) !== activeKey) return false;
    if (!keyword.trim()) return true;
    const q = keyword.trim().toLowerCase();
    return r.id.toLowerCase().includes(q) || r.passportName.toLowerCase().includes(q);
  });

  return (
    <main className="mx-auto max-w-2xl p-6">
      <Stack direction="column" gap="sm">
        <Title size="md">예약 관리</Title>
      </Stack>

      <Stack direction="column" gap="md" className="mt-4">
        <Chip.List scrollArrows>
          {TABS.map((t) => (
            <Chip key={t.key} on={activeKey === t.key} onClick={() => setActiveKey(t.key as AdminReservationTab)}>
              {t.label}
            </Chip>
          ))}
        </Chip.List>

        <Input
          placeholder="검색 (예약번호·여권명)"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />

        <Stack direction="column" gap="sm">
          {filtered.length === 0 && <EmptyState>해당 상태의 예약이 없습니다.</EmptyState>}
          {filtered.map((r) => (
            <NextLink key={r.id} href={`/reservations/${r.id}`} className="block">
              <Card padding="sm">
                <Stack justify="between" align="center">
                  <div>
                    <Text weight="bold">{r.id}</Text>
                    <Text variant="sub">
                      {r.product} · {r.useDate}
                    </Text>
                  </div>
                  {getAdminTab(r) === "unpaid" ? (
                    <Badge variant="warning">미입금</Badge>
                  ) : (
                    <StatusBadge status={r.status} />
                  )}
                </Stack>
              </Card>
            </NextLink>
          ))}
        </Stack>
      </Stack>
    </main>
  );
}
