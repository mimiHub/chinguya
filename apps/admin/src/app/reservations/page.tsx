"use client";

import { useState } from "react";
import NextLink from "next/link";
import { Title } from "@chinguya/ui/title";
import { Tab } from "@chinguya/ui/tab";
import { Input } from "@chinguya/ui/input";
import { Card } from "@chinguya/ui/card";
import { Stack } from "@chinguya/ui/stack";
import { Text } from "@chinguya/ui/text";
import { StatusBadge, Badge } from "@chinguya/ui/badge";
import {
  adminReservations,
  ADMIN_TAB_LABEL,
  ADMIN_TAB_ORDER,
  getAdminTab,
  type AdminReservationTab,
} from "@/data/reservationData";

const TABS = ADMIN_TAB_ORDER.map((key) => ({ key, label: ADMIN_TAB_LABEL[key] }));

export default function AdminReservationsPage() {
  const [activeKey, setActiveKey] = useState<AdminReservationTab>("received");
  const [keyword, setKeyword] = useState("");

  const filtered = adminReservations.filter((r) => {
    if (getAdminTab(r) !== activeKey) return false;
    if (!keyword.trim()) return true;
    const q = keyword.trim().toLowerCase();
    return r.id.toLowerCase().includes(q) || r.passportName.toLowerCase().includes(q);
  });

  return (
    <main className="mx-auto max-w-2xl p-6">
      <Title size="md">예약 관리</Title>

      <Tab
        className="mt-4"
        items={TABS}
        activeKey={activeKey}
        onChange={(key) => setActiveKey(key as AdminReservationTab)}
      />

      <div className="my-4">
        <Input
          placeholder="🔍 검색 (예약번호·여권명)"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
      </div>

      <Stack direction="column" gap="sm">
        {filtered.length === 0 && <Text variant="sub">해당 상태의 예약이 없습니다.</Text>}
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
    </main>
  );
}
