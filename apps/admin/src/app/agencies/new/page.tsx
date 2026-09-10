"use client";

import { useState } from "react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { Title } from "@chinguya/ui/title";
import { Text } from "@chinguya/ui/text";
import { Stack } from "@chinguya/ui/stack";
import { LabeledBox } from "@chinguya/ui/labeled-box";
import { Input } from "@chinguya/ui/input";
import { Button } from "@chinguya/ui/button";
import { Alert } from "@chinguya/ui/alert";
import { Toast } from "@chinguya/ui/toast";
import { createApiClient, ApiError } from "@chinguya/api-client";

/**
 * 여행사 등록(S2-A2) — 초대 이메일 발송.
 *
 * 상품 등록(/products/new)과 같이 팝업이 아니라 별도 페이지다.
 *
 * 이 화면은 계정을 만들지 않는다. 여행사만 등록하고 담당자 이메일로 초대 링크를 보내며,
 * 아이디·비밀번호는 담당자가 그 링크에서 직접 정한다(S2-G1). 그래서 필수 입력이
 * 여행사명과 **담당자 이메일** 두 개다 — 이메일이 없으면 초대를 보낼 곳이 없다.
 * 담당자명·연락처는 운영 편의용이라 선택이다.
 *
 * Core API(POST /admin/agencies)에 실연동돼 있다 — 계약은
 * packages/api-spec/openapi/chinguya-admin-api.yaml.
 *
 * 메일 발송 실패는 에러가 아니라 응답의 invitation.sent === false 로 온다. 여행사는
 * 이미 등록됐으므로 되돌리지 않고, 상세 화면에서 재발송하라고 안내한다.
 */

const api = createApiClient();

function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) return err.message;
  return fallback;
}

export default function AdminAgencyNewPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);

  const handleSave = async () => {
    if (!name.trim() || !contactEmail.trim()) {
      setError("여행사명과 담당자 이메일을 입력해 주세요.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const result = await api.agencies.create({
        name,
        contactName,
        contactPhone,
        contactEmail,
      });
      setResultMessage(
        result.invitation.sent
          ? "등록하고 초대 메일을 보냈습니다"
          : "여행사는 등록했지만 초대 메일 발송에 실패했습니다. 상세에서 재발송해 주세요",
      );
    } catch (err) {
      setError(errorMessage(err, "여행사를 등록하지 못했습니다."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto max-w-2xl p-6">
      <Stack direction="column" gap="sm">
        <NextLink href="/agencies" className="text-sm text-muted hover:underline">
          ← 목록으로
        </NextLink>
        <Title size="md">여행사 등록</Title>
      </Stack>

      <Stack direction="column" gap="md" className="mt-4">
        <LabeledBox label="여행사명" required>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </LabeledBox>
        <LabeledBox label="담당자 이메일" required>
          <Input
            type="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            placeholder="manager@example.com"
            autoComplete="off"
          />
        </LabeledBox>
        <LabeledBox label="담당자명">
          <Input value={contactName} onChange={(e) => setContactName(e.target.value)} />
        </LabeledBox>
        <LabeledBox label="연락처">
          <Input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="010-0000-0000" />
        </LabeledBox>

        <Text variant="sub">
          담당자가 메일의 링크에서 아이디·비밀번호를 직접 설정합니다. 링크 유효기간은 1주일이며 1회만
          사용할 수 있습니다.
        </Text>

        {error && (
          <Alert status="error" icon={false}>
            {error}
          </Alert>
        )}

        <Button fullWidth onClick={() => void handleSave()} disabled={submitting}>
          {submitting ? "발송 중…" : "가입 링크 이메일 발송"}
        </Button>
      </Stack>

      <Toast
        open={!!resultMessage}
        onClose={() => {
          setResultMessage(null);
          router.push("/agencies");
        }}
        message={resultMessage ?? ""}
      />
    </main>
  );
}
