"use client";

import { useEffect, useState } from "react";
import NextLink from "next/link";
import type { AdminRole } from "@chinguya/types";
import { createApiClient, ApiError, type AdminAccount } from "@chinguya/api-client";
import { Title, Text, Card, Stack, Badge, Chip, Button, IconX, LabeledBox, Input, Popup, ConfirmPopup, Alert } from "@chinguya/ui";
import { useAdminAuth } from "@/context/AdminAuthContext";

const api = createApiClient();

const ROLE_LABEL: Record<AdminRole, string> = {
  STAFF: "관리자",
  SUPER_ADMIN: "슈퍼어드민",
};

function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) return err.message;
  return fallback;
}

/**
 * S0-A5 관리자 목록 · S0-A6 관리자 등록/수정 (와이어프레임 `a-admins`).
 *
 * Core API(/admin/admins) 실연동. 조회는 누구나, 등록·수정·삭제는 슈퍼어드민만이라 STAFF에게는
 * 버튼을 숨긴다(서버도 403으로 막는다). 등록과 수정은 같은 팝업을 쓴다 — 수정에서는 아이디를
 * 바꿀 수 없고, 비밀번호를 비워 두면 기존 비밀번호가 유지된다.
 * 삭제는 소프트 삭제이고, 마지막 슈퍼어드민의 강등·삭제는 서버가 409로 막아 그 문구를 보여준다.
 */
export default function AdminAccountsPage() {
  const { isSuperAdmin } = useAdminAuth();
  const [accounts, setAccounts] = useState<AdminAccount[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [popupOpen, setPopupOpen] = useState(false);
  /** null = 등록, 값이 있으면 그 계정을 수정 중 */
  const [editing, setEditing] = useState<AdminAccount | null>(null);
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<AdminRole>("STAFF");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminAccount | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    api.admins
      .list()
      .then((list) => {
        setAccounts(list);
        setLoaded(true);
      })
      .catch((err) => setLoadError(errorMessage(err, "관리자 목록을 불러오지 못했습니다.")));
  }, []);

  const openForm = (account: AdminAccount | null) => {
    setEditing(account);
    setLoginId(account?.loginId ?? "");
    setPassword("");
    setRole(account?.role ?? "STAFF");
    setError(null);
    setPopupOpen(true);
  };

  const handleSave = async () => {
    if (!editing && (!loginId.trim() || !password)) {
      setError("아이디 · 비밀번호를 모두 입력해 주세요.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      if (editing) {
        const updated = await api.admins.update(editing.adminId, { role, password: password || undefined });
        setAccounts((prev) => prev.map((a) => (a.adminId === updated.adminId ? updated : a)));
      } else {
        const created = await api.admins.create({ loginId: loginId.trim(), password, role });
        setAccounts((prev) => [...prev, created]);
      }
      setPopupOpen(false);
    } catch (err) {
      setError(errorMessage(err, "저장하지 못했습니다."));
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    setDeleteError(null);
    try {
      await api.admins.remove(target.adminId);
      setAccounts((prev) => prev.filter((a) => a.adminId !== target.adminId));
    } catch (err) {
      setDeleteError(errorMessage(err, "삭제하지 못했습니다."));
    }
  };

  return (
    <main className="mx-auto max-w-2xl p-6">
      <Stack direction="column" gap="sm">
        <NextLink href="/more" className="text-sm text-muted hover:underline">
          ← 더보기로
        </NextLink>
        <Stack justify="between" align="center">
          <Title size="md">관리자 관리</Title>
          {isSuperAdmin && loaded && (
            <Button size="sm" variant="subtle" onClick={() => openForm(null)}>
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

      {!loaded && !loadError && (
        <Stack direction="column" className="mt-4">
          <Text variant="sub">불러오는 중…</Text>
        </Stack>
      )}

      {loaded && (
        <Stack direction="column" gap="sm" className="mt-4">
          {accounts.map((account) => (
            <Card key={account.adminId} padding="sm" onClick={isSuperAdmin ? () => openForm(account) : undefined}>
              <Stack justify="between" align="center">
                <Stack gap="xs" align="center">
                  <Text weight="bold">{account.loginId}</Text>
                  <Badge variant={account.role === "SUPER_ADMIN" ? "primary" : "gray"}>
                    {ROLE_LABEL[account.role]}
                  </Badge>
                </Stack>
                {isSuperAdmin && (
                  <IconX
                    aria-label={`${account.loginId} 삭제`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTarget(account);
                    }}
                  />
                )}
              </Stack>
            </Card>
          ))}
          {deleteError && <Alert status="error">{deleteError}</Alert>}
          <Text variant="sub">일반 관리자는 조회 전용입니다. 등록·수정·삭제는 슈퍼어드민만 할 수 있어요.</Text>
        </Stack>
      )}

      <Popup open={popupOpen} onClose={() => setPopupOpen(false)} title={editing ? "관리자 수정" : "관리자 등록"}>
        <Stack direction="column" gap="md">
          <LabeledBox
            label="아이디"
            required={!editing}
            helper={editing ? "아이디는 바꿀 수 없습니다." : "영문·숫자·._- 4~50자"}
          >
            <Input value={loginId} disabled={Boolean(editing)} onChange={(e) => setLoginId(e.target.value)} />
          </LabeledBox>
          <LabeledBox
            label="비밀번호"
            required={!editing}
            helper={
              editing
                ? "비워 두면 기존 비밀번호를 유지합니다. 바꿀 때는 공백 없는 영문·숫자·기호 8~72자"
                : "공백 없는 영문·숫자·기호 8~72자"
            }
          >
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
          </LabeledBox>
          <LabeledBox label="권한" required>
            <Chip.List>
              {(["STAFF", "SUPER_ADMIN"] as AdminRole[]).map((key) => (
                <Chip key={key} on={key === role} onClick={() => setRole(key)}>
                  {ROLE_LABEL[key]}
                </Chip>
              ))}
            </Chip.List>
          </LabeledBox>

          {error && (
            <Alert status="error" icon={false}>
              {error}
            </Alert>
          )}

          <Button fullWidth disabled={submitting} onClick={() => void handleSave()}>
            {submitting ? "저장 중…" : editing ? "저장" : "등록"}
          </Button>
        </Stack>
      </Popup>

      <ConfirmPopup
        open={Boolean(deleteTarget)}
        message={`'${deleteTarget?.loginId}' 관리자 계정을 삭제합니다. 삭제한 아이디는 다시 쓸 수 없습니다.`}
        onConfirm={() => void confirmDelete()}
        onClose={() => setDeleteTarget(null)}
      />
    </main>
  );
}
