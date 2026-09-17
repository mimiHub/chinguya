"use client";

import { useCallback, useEffect, useState } from "react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import type { Agency } from "@chinguya/types";
import { Title, Text, Card, Stack, Badge, Toggle, Button, Alert, Toast, EmptyState } from "@chinguya/ui";
import { createApiClient, ApiError } from "@chinguya/api-client";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { invitationBadge } from "./invitationBadge";

/**
 * 여행사 관리(S2-A1/A3) — 목록 · 사용 가능/불가 토글 · 삭제.
 *
 * Core API(GET/PATCH/DELETE /admin/agencies)에 실연동돼 있다 — 계약은
 * packages/api-spec/openapi/chinguya-admin-api.yaml.
 *
 * 토글이 실제로 무언가를 막는다: active=false가 되면 그 여행사 계정은 여행사앱
 * 로그인이 거부되고(403 AGENCY_INACTIVE), 이미 로그인해 있던 세션도 다음 화면
 * 이동에서 튕긴다(여행사 앱 셸이 매 이동마다 /v1/agency/auth/me 를 부른다).
 *
 * 삭제는 항상 소프트 삭제다 — 인보이스가 여행사 이름을 잃으면 안 되기 때문. 복원 API가
 * 없어서 운영자 관점에서는 여전히 되돌릴 수 없고, 그래서 확인 문구도 그대로 둔다.
 *
 * 쓰기는 슈퍼어드민만 가능하다. 아래 버튼 숨김은 서버 403과 정합을 맞추는 것일 뿐
 * 보안 경계가 아니다(경계는 SecurityConfig).
 */

const api = createApiClient();

function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) return err.message;
  return fallback;
}

export default function AdminAgenciesPage() {
  const router = useRouter();
  const { isSuperAdmin } = useAdminAuth();

  const [agencies, setAgencies] = useState<Agency[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  /** 토글 연타로 요청이 겹치지 않게 진행 중인 여행사 id를 잡아 둔다. */
  const [pendingId, setPendingId] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setAgencies(await api.agencies.list());
      setLoadError(null);
    } catch (err) {
      setLoadError(errorMessage(err, "여행사 목록을 불러오지 못했습니다."));
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const toggleActive = async (agency: Agency) => {
    setPendingId(agency.agencyId);
    try {
      await api.agencies.setActive(agency.agencyId, !agency.active);
      await reload();
      setToastMessage(
        agency.active
          ? `'${agency.name}' 사용을 중지했습니다`
          : `'${agency.name}' 사용을 재개했습니다`,
      );
    } catch (err) {
      setToastMessage(errorMessage(err, "사용 상태를 바꾸지 못했습니다."));
    } finally {
      setPendingId(null);
    }
  };

  return (
    <main className="mx-auto max-w-2xl p-6">
      <Stack direction="column" gap="sm">
        <NextLink href="/more" className="text-sm text-muted hover:underline">
          ← 더보기로
        </NextLink>
        <Stack justify="between" align="center">
          <Title size="md">여행사 관리</Title>
          {isSuperAdmin && (
            <Button href="/agencies/new" variant="subtle" size="sm">
              + 등록
            </Button>
          )}
        </Stack>
      </Stack>

      {loadError && (
        <Alert status="error" className="mt-4">
          {loadError}
        </Alert>
      )}

      <Stack direction="column" gap="sm" className="mt-4">
        {agencies === null && !loadError && <Text variant="sub">불러오는 중…</Text>}

        {agencies?.map((agency) => {
          const invitation = invitationBadge(agency);
          return (
            <Card key={agency.agencyId} padding="sm">
              <Stack direction="column" gap="sm">
                <Stack justify="between" align="center">
                  {/* 카드 전체가 아니라 이름만 링크다 — 토글이 카드 안에 있어서
                      카드를 통째로 링크로 만들면 토글을 누를 때마다 상세로 넘어간다. */}
                  <NextLink href={`/agencies/${agency.agencyId}`} className="hover:underline">
                    <Text weight="bold">{agency.name}</Text>
                  </NextLink>
                  <Badge variant={invitation.variant}>{invitation.label}</Badge>
                </Stack>
                <Text variant="sub">
                  {agency.contactName || "담당자 미입력"}
                  {agency.contactPhone ? ` · ${agency.contactPhone}` : ""}
                </Text>
                <Text variant="sub">{agency.contactEmail}</Text>
                {isSuperAdmin ? (
                  <Toggle
                    on={agency.active}
                    onChange={() => {
                      if (pendingId) return;
                      void toggleActive(agency);
                    }}
                    className="w-full justify-between"
                    label={
                      <Badge variant={agency.active ? "success" : "gray"}>
                        {agency.active ? "활성화" : "비활성화"}
                      </Badge>
                    }
                  />
                ) : (
                  <Stack justify="between" align="center">
                    <Badge variant={agency.active ? "success" : "gray"}>
                      {agency.active ? "활성화" : "비활성화"}
                    </Badge>
                    <Button size="sm" variant="outline" onClick={() => router.push(`/agencies/${agency.agencyId}`)}>
                      상세
                    </Button>
                  </Stack>
                )}
              </Stack>
            </Card>
          );
        })}

        {agencies !== null && agencies.length === 0 && (
          <EmptyState>등록된 여행사가 없습니다.</EmptyState>
        )}
      </Stack>

      <Toast open={!!toastMessage} onClose={() => setToastMessage(null)} message={toastMessage ?? ""} />
    </main>
  );
}
