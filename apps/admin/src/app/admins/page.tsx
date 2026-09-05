"use client";

import { useState } from "react";
import NextLink from "next/link";
import type { AdminRole } from "@chinguya/types";
import { Title } from "@chinguya/ui/title";
import { Text } from "@chinguya/ui/text";
import { Card } from "@chinguya/ui/card";
import { Stack } from "@chinguya/ui/stack";
import { Badge } from "@chinguya/ui/badge";
import { Chip } from "@chinguya/ui/chip";
import { Button } from "@chinguya/ui/button";
import { IconX } from "@chinguya/ui/icon-x";
import { LabeledBox } from "@chinguya/ui/labeled-box";
import { Input } from "@chinguya/ui/input";
import { Popup } from "@chinguya/ui/popup";
import { ConfirmPopup } from "@chinguya/ui/confirm-popup";
import { Alert } from "@chinguya/ui/alert";
import { adminAccounts, type AdminAccount } from "@/data/authData";

const ROLE_LABEL: Record<AdminRole, string> = {
  STAFF: "관리자",
  SUPER_ADMIN: "슈퍼어드민",
};

/**
 * S0-A5/A6 관리자 관리.
 * 일반 관리자는 조회 전용, 슈퍼어드민만 계정을 추가/삭제할 수 있다는 규칙이 있고, 이제
 * useAdminAuth().isSuperAdmin 으로 현재 등급을 알 수 있다 — 다만 등록/삭제 버튼 게이팅은
 * 다른 쓰기 화면들과 함께 별도 작업으로 미뤄둔 상태다(서버는 이미 403으로 막고 있다).
 * 계정 CRUD API도 아직 없어서 이 화면은 목 데이터로만 동작한다.
 */
export default function AdminAccountsPage() {
  const [accounts, setAccounts] = useState<AdminAccount[]>(adminAccounts);
  const [popupOpen, setPopupOpen] = useState(false);
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<AdminRole>("STAFF");
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminAccount | null>(null);

  const resetForm = () => {
    setId("");
    setPassword("");
    setName("");
    setRole("STAFF");
    setError(null);
  };

  const handleAdd = () => {
    if (!id.trim() || !password.trim() || !name.trim()) {
      setError("아이디 · 비밀번호 · 이름을 모두 입력해 주세요.");
      return;
    }
    if (accounts.some((a) => a.id === id.trim())) {
      setError("이미 사용 중인 아이디입니다.");
      return;
    }
    setAccounts((prev) => [...prev, { id: id.trim(), password, name: name.trim(), role }]);
    setPopupOpen(false);
    resetForm();
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    setAccounts((prev) => prev.filter((a) => a.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  return (
    <main className="mx-auto max-w-2xl p-6">
      <Stack direction="column" gap="sm">
        <NextLink href="/more" className="text-sm text-muted hover:underline">
          ← 더보기로
        </NextLink>
        <Stack justify="between" align="center">
          <Title size="md">관리자 관리</Title>
          <Button
            size="sm"
            variant="subtle"
            onClick={() => {
              resetForm();
              setPopupOpen(true);
            }}
          >
            + 등록
          </Button>
        </Stack>
      </Stack>

      <Stack direction="column" gap="sm" className="mt-4">
        {accounts.map((account) => (
          <Card key={account.id} padding="sm">
            <Stack justify="between" align="center">
              <Stack direction="column" gap="xs">
                <Stack gap="xs" align="center">
                  <Text weight="bold">{account.name}</Text>
                  <Badge variant={account.role === "SUPER_ADMIN" ? "primary" : "gray"}>
                    {ROLE_LABEL[account.role]}
                  </Badge>
                </Stack>
                <Text variant="sub">{account.id}</Text>
              </Stack>
              <IconX aria-label={`${account.name} 삭제`} onClick={() => setDeleteTarget(account)} />
            </Stack>
          </Card>
        ))}
      </Stack>      

      <Popup open={popupOpen} onClose={() => setPopupOpen(false)} title="관리자 등록">
        <Stack direction="column" gap="md">
          <LabeledBox label="아이디" required>
            <Input value={id} onChange={(e) => setId(e.target.value)} />
          </LabeledBox>
          <LabeledBox label="비밀번호" required>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </LabeledBox>
          <LabeledBox label="이름" required>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
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

          <Button fullWidth onClick={handleAdd}>
            등록
          </Button>
        </Stack>
      </Popup>

      <ConfirmPopup
        open={Boolean(deleteTarget)}
        message={`'${deleteTarget?.name}' 관리자 계정을 삭제합니다. 이 작업은 되돌릴 수 없습니다.`}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </main>
  );
}
