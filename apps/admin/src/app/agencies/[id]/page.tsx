"use client";

import { use, useCallback, useEffect, useState } from "react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import type { Agency } from "@chinguya/types";
import { Title, Text, Stack, Card, Badge, Toggle, LabeledBox, Input, Button, Alert, Toast, ConfirmPopup } from "@chinguya/ui";
import type { ToastStatus } from "@chinguya/ui";
import { createApiClient, ApiError } from "@chinguya/api-client";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { invitationBadge } from "../invitationBadge";

/**
 * 여행사 상세(S2-A3) — 정보 수정 · 사용 가능/불가 · 초대 재발송 · 삭제.
 *
 * Core API(GET/PUT/PATCH/DELETE /admin/agencies/{id}, POST .../invitations)에
 * 실연동돼 있다 — 계약은 packages/api-spec/openapi/chinguya-admin-api.yaml.
 *
 * 담당자 이메일을 바꿔도 초대가 자동으로 나가지 않는다 — 재발송은 아래 버튼으로만
 * 일어난다. 서버도 같은 규칙이라, 이메일만 고치고 저장하면 옛 링크가 그대로 살아 있다.
 *
 * 계정이 이미 등록된 여행사에는 재발송할 수 없다(서버가 409). 비밀번호 재설정 플로우가
 * 아직 없어서, 담당자가 비밀번호를 잊으면 지금은 손쓸 방법이 없다 —
 * api-spec(chinguya-agency-api.yaml) 헤더의 TODO 1에 적어 뒀다.
 */

const api = createApiClient();

function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) return err.message;
  return fallback;
}

/** 만료 시각을 화면용 날짜로. 서버는 UTC ISO 로 준다. */
function formatDate(iso: string | null): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("ko-KR", { dateStyle: "medium", timeStyle: "short" });
}

export default function AdminAgencyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { isSuperAdmin } = useAdminAuth();

  const [agency, setAgency] = useState<Agency | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastStatus, setToastStatus] = useState<ToastStatus>("info");
  const [deleteOpen, setDeleteOpen] = useState(false);

  /** 성공/실패를 한 Toast로 같이 보여준다 — 메시지·색·아이콘을 한 번에 맞추기 위한 헬퍼. */
  const showToast = (message: string, status: ToastStatus = "info") => {
    setToastMessage(message);
    setToastStatus(status);
  };

  const reload = useCallback(async () => {
    try {
      const loaded = await api.agencies.detail(id);
      setAgency(loaded);
      // 서버가 정규화한 값(공백 제거·이메일 소문자)으로 폼을 다시 채운다.
      setName(loaded.name);
      setContactName(loaded.contactName);
      setContactPhone(loaded.contactPhone);
      setContactEmail(loaded.contactEmail);
      setLoadError(null);
    } catch (err) {
      setLoadError(errorMessage(err, "여행사 정보를 불러오지 못했습니다."));
    }
  }, [id]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const handleSave = async () => {
    if (!name.trim() || !contactEmail.trim()) {
      showToast("여행사명과 담당자 이메일을 입력해 주세요.", "error");
      return;
    }
    setSubmitting(true);
    try {
      await api.agencies.update(id, { name, contactName, contactPhone, contactEmail });
      await reload();
      showToast("저장했습니다", "success");
    } catch (err) {
      showToast(errorMessage(err, "여행사 정보를 저장하지 못했습니다."), "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async () => {
    if (!agency || submitting) return;
    setSubmitting(true);
    try {
      await api.agencies.setActive(id, !agency.active);
      await reload();
      showToast(agency.active ? "사용을 중지했습니다" : "사용을 재개했습니다", "success");
    } catch (err) {
      showToast(errorMessage(err, "사용 상태를 바꾸지 못했습니다."), "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    setSubmitting(true);
    try {
      const result = await api.agencies.resendInvitation(id);
      await reload();
      showToast(
        result.sent ? "초대 메일을 다시 보냈습니다" : "초대는 새로 발급했지만 메일 발송에 실패했습니다",
        result.sent ? "success" : "warning",
      );
    } catch (err) {
      showToast(errorMessage(err, "초대를 재발송하지 못했습니다."), "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setDeleteOpen(false);
    try {
      await api.agencies.remove(id);
      router.push("/agencies");
    } catch (err) {
      showToast(errorMessage(err, "여행사를 삭제하지 못했습니다."), "error");
    }
  };

  const invitation = agency ? invitationBadge(agency) : null;

  return (
    <main className="mx-auto max-w-2xl p-6">
      <Stack direction="column" gap="sm">
        <NextLink href="/agencies" className="text-sm text-muted hover:underline">
          ← 목록으로
        </NextLink>
        <Title size="md">여행사 상세</Title>
      </Stack>

      {loadError && (
        <Alert status="error" className="mt-4">
          {loadError}
        </Alert>
      )}

      {agency === null && !loadError && (
        <Text variant="sub" className="mt-4">
          불러오는 중…
        </Text>
      )}

      {agency && (
        <>
          <Card padding="sm" className="mt-4">
            <Stack direction="column" gap="sm">
              <Stack justify="between" align="center">
                <Text weight="bold">계정 상태</Text>
                {invitation && <Badge variant={invitation.variant}>{invitation.label}</Badge>}
              </Stack>
              <Text variant="sub">
                {agency.accountRegistered
                  ? `아이디 ${agency.loginId} 로 계정 등록이 완료됐습니다.`
                  : agency.invitationStatus === "PENDING"
                    ? `초대 링크 유효기간: ${formatDate(agency.invitationExpiresAt)}까지`
                    : agency.invitationStatus === "EXPIRED"
                      ? `초대 링크가 ${formatDate(agency.invitationExpiresAt)}에 만료됐습니다. 재발송이 필요합니다.`
                      : "초대 메일이 아직 발송되지 않았습니다. 재발송해 주세요."}
              </Text>
              {isSuperAdmin && !agency.accountRegistered && (
                <Button size="sm" variant="outline" onClick={() => void handleResend()} disabled={submitting}>
                  초대 메일 재발송
                </Button>
              )}
              {isSuperAdmin && !agency.accountRegistered && (
                <Text variant="sub">재발송하면 이전에 보낸 링크는 즉시 사용할 수 없게 됩니다.</Text>
              )}
            </Stack>
          </Card>

          <Card padding="sm" className="mt-4">
            {isSuperAdmin ? (
              // 슈퍼어드민은 스위치 자체가 on/off 상태를 보여주므로 옆의 배지는 중복 정보라
              // 뺐다 — 대신 제목·설명 텍스트까지 label로 묶어서 텍스트를 눌러도 토글되게 한다.
              <Toggle
                on={agency.active}
                onChange={() => void handleToggleActive()}
                className="w-full justify-between"
                label={
                  <Stack direction="column" gap="xs">
                    <Text weight="bold">사용 가능</Text>
                    <Text variant="sub">끄면 이 여행사의 로그인·예약이 차단됩니다.</Text>
                  </Stack>
                }
              />
            ) : (
              <Stack justify="between" align="center">
                <Stack direction="column" gap="xs">
                  <Text weight="bold">사용 가능</Text>
                  <Text variant="sub">끄면 이 여행사의 로그인·예약이 차단됩니다.</Text>
                </Stack>
                <Badge variant={agency.active ? "success" : "gray"}>
                  {agency.active ? "활성화" : "비활성화"}
                </Badge>
              </Stack>
            )}
          </Card>

          <Stack direction="column" gap="md" className="mt-4">
            <LabeledBox label="여행사명" required>
              <Input value={name} onChange={(e) => setName(e.target.value)} disabled={!isSuperAdmin} />
            </LabeledBox>
            <LabeledBox label="담당자 이메일" required>
              <Input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                disabled={!isSuperAdmin}
              />
            </LabeledBox>
            <LabeledBox label="담당자명">
              <Input
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                disabled={!isSuperAdmin}
              />
            </LabeledBox>
            <LabeledBox label="연락처">
              <Input
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                disabled={!isSuperAdmin}
              />
            </LabeledBox>

            {isSuperAdmin && (
              <>
                <Button fullWidth onClick={() => void handleSave()} disabled={submitting}>
                  저장
                </Button>
                <Button fullWidth variant="outline" onClick={() => setDeleteOpen(true)}>
                  여행사 삭제
                </Button>
              </>
            )}
          </Stack>
        </>
      )}

      <ConfirmPopup
        open={deleteOpen}
        message={`'${agency?.name}' 여행사를 삭제합니다. 이 작업은 되돌릴 수 없습니다.`}
        onConfirm={() => void handleDelete()}
        onClose={() => setDeleteOpen(false)}
      />

      <Toast open={!!toastMessage} onClose={() => setToastMessage(null)} message={toastMessage ?? ""} status={toastStatus} />
    </main>
  );
}
