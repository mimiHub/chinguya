"use client";

import { useState } from "react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { Title } from "@chinguya/ui/title";
import { Stack } from "@chinguya/ui/stack";
import { LabeledBox } from "@chinguya/ui/labeled-box";
import { Input } from "@chinguya/ui/input";
import { Button } from "@chinguya/ui/button";
import { Alert } from "@chinguya/ui/alert";
import { Toast } from "@chinguya/ui/toast";

/**
 * 여행사 등록 페이지. 상품 등록(/products/new)과 같은 방식 — 팝업이 아니라 별도 페이지다.
 *
 * 지금은 여행사 목록(/agencies)이 그 페이지 안에서만 사는 로컬 상태라, 여기서 등록해도
 * 목록으로 돌아가면 실제로 추가돼 있지 않다(새로고침 없이 페이지를 오가면 상태가 리셋됨) —
 * 실제 연동 시 POST /api/admin/agencies 호출 + 목록을 서버에서 다시 불러오는 구조로 바뀌면
 * 해결된다. 지금은 등록 화면 흐름만 먼저 만들어둔 것이다.
 */
export default function AdminAgencyNewPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [savedOpen, setSavedOpen] = useState(false);

  const handleSave = () => {
    if (!name.trim() || !contactName.trim() || !contactPhone.trim()) {
      setError("여행사명 · 담당자명 · 연락처를 모두 입력해 주세요.");
      return;
    }
    setError(null);
    // TODO: 실제 연동 시 여기서 POST /api/admin/agencies 호출로 교체한다.
    setSavedOpen(true);
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
        <LabeledBox label="담당자명" required>
          <Input value={contactName} onChange={(e) => setContactName(e.target.value)} />
        </LabeledBox>
        <LabeledBox label="연락처" required>
          <Input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="010-0000-0000" />
        </LabeledBox>
        <LabeledBox label="이메일">
          <Input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
        </LabeledBox>

        {error && (
          <Alert status="error" icon={false}>
            {error}
          </Alert>
        )}

        <Button fullWidth onClick={handleSave}>
          등록
        </Button>
      </Stack>

      <Toast
        open={savedOpen}
        onClose={() => {
          setSavedOpen(false);
          router.push("/agencies");
        }}
        message="등록되었습니다"
      />
    </main>
  );
}
