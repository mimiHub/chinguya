"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Title, Card, Stack, LabeledBox, Input, Button, Text, Toast } from "@chinguya/ui";
import { createApiClient, ApiError } from "@chinguya/api-client";
import { ScrollReveal } from "@/components/ScrollReveal";

const api = createApiClient();

type Field = "currentPassword" | "newPassword" | "newPasswordConfirm";

/**
 * S2-G8 비밀번호 변경(`g-password`). 헤더 계정 메뉴에서 들어온다.
 *
 * Core API(POST /v1/agency/auth/password)에 실연동돼 있다 — 계약은
 * packages/api-spec/openapi/chinguya-agency-api.yaml. 새 비밀번호 규칙(8~64자)은 계정 등록(S2-G1)과
 * 같다. 서버도 같은 검사를 하지만, 여기서 먼저 막아 칸마다 이유를 보여준다.
 *
 * 현재 비밀번호가 틀리면 서버가 400(CURRENT_PASSWORD_MISMATCH)을 준다 — 401 이 아니라서 세션이
 * 끊기지 않고 이 화면에 머문다. 변경 후에도 세션은 유지되고, 완료 안내 후 대시보드로 간다.
 */
export default function AgencyPasswordPage() {
  const router = useRouter();
  const [form, setForm] = useState<Record<Field, string>>({
    currentPassword: "",
    newPassword: "",
    newPasswordConfirm: "",
  });
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const update = (field: Field) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = (): Partial<Record<Field, string>> => {
    const next: Partial<Record<Field, string>> = {};
    if (!form.currentPassword) next.currentPassword = "현재 비밀번호를 입력해 주세요.";
    if (form.newPassword.length < 8 || form.newPassword.length > 64) {
      next.newPassword = "비밀번호는 8자 이상 64자 이하여야 합니다.";
    } else if (form.newPassword === form.currentPassword) {
      next.newPassword = "현재 비밀번호와 다른 비밀번호를 입력해 주세요.";
    }
    if (form.newPassword !== form.newPasswordConfirm) {
      next.newPasswordConfirm = "새 비밀번호가 일치하지 않습니다.";
    }
    return next;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    try {
      await api.agencyAuth.changePassword(form);
      setDone(true);
      setToastMessage("비밀번호가 변경되었습니다");
    } catch (err) {
      if (err instanceof ApiError && err.code === "CURRENT_PASSWORD_MISMATCH") {
        setErrors({ currentPassword: err.message });
      } else {
        setToastMessage(err instanceof ApiError ? err.message : "비밀번호를 변경하지 못했습니다.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main>
      <Stack direction="column">
        <ScrollReveal>
          <Title size="md">비밀번호 변경</Title>
        </ScrollReveal>

        <ScrollReveal delay={80}>
          <Card className="max-w-md">
            <form onSubmit={(e) => void handleSubmit(e)}>
              <Stack direction="column" gap="md">
                <LabeledBox label="현재 비밀번호" error={errors.currentPassword}>
                  <Input
                    type="password"
                    value={form.currentPassword}
                    onChange={update("currentPassword")}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    error={!!errors.currentPassword}
                  />
                </LabeledBox>
                <LabeledBox label="새 비밀번호" error={errors.newPassword}>
                  <Input
                    type="password"
                    value={form.newPassword}
                    onChange={update("newPassword")}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    error={!!errors.newPassword}
                  />
                </LabeledBox>
                <LabeledBox label="새 비밀번호 확인" error={errors.newPasswordConfirm}>
                  <Input
                    type="password"
                    value={form.newPasswordConfirm}
                    onChange={update("newPasswordConfirm")}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    error={!!errors.newPasswordConfirm}
                  />
                </LabeledBox>
                <Text variant="sub">비밀번호는 8자 이상 64자 이하입니다.</Text>
                <Button type="submit" fullWidth disabled={submitting || done}>
                  {submitting ? "변경 중…" : "변경"}
                </Button>
              </Stack>
            </form>
          </Card>
        </ScrollReveal>
      </Stack>

      {/* 완료 안내를 보여준 뒤(토스트가 닫힐 때) 대시보드로 간다 — 와이어프레임의 화면 이동. */}
      <Toast
        open={!!toastMessage}
        onClose={() => {
          setToastMessage(null);
          if (done) router.push("/");
        }}
        message={toastMessage ?? ""}
        status={done ? "success" : "error"}
      />
    </main>
  );
}
