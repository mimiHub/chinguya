"use client";

import { useState } from "react";
import NextLink from "next/link";
import type { InquiryEntry } from "@chinguya/types";
import { Title } from "@chinguya/ui/title";
import { Text } from "@chinguya/ui/text";
import { Card } from "@chinguya/ui/card";
import { Stack } from "@chinguya/ui/stack";
import { Badge } from "@chinguya/ui/badge";
import { Input } from "@chinguya/ui/input";
import { Button } from "@chinguya/ui/button";
import { Toast } from "@chinguya/ui/toast";
import { NoticeBox } from "@chinguya/ui/notice-box";
import { initialInquiries } from "@/data/inquiryData";

/**
 * S4-A2 문의 관리. 고객앱 1:1 문의(질문하기, S4-C4)에 답변을 등록한다.
 *
 * 여기서 보는 목록은 고객앱과 같은 시드를 따로 들고 있는 프로토타입 목업이다(자세한 한계는
 * apps/admin/src/data/inquiryData.ts 주석 참고) — 실제로는 같은 백엔드를 공유해야 한다.
 * 고객앱의 비공개(PIN) 잠금은 관리자 화면에는 적용하지 않는다 — 답변하려면 항상 본문을
 * 볼 수 있어야 하기 때문이다.
 *
 * 답변 등록 시 고객에게 카카오 알림톡을 보낸다는 규칙이 있지만, 실제 발송 연동은 이연
 * 상태다(packages/types InquiryEntry 문서 주석) — 여기서는 등록 성공 토스트로만 그 흐름을
 * 흉내낸다.
 */
export default function AdminInquiriesPage() {
  const [inquiries, setInquiries] = useState<InquiryEntry[]>(initialInquiries);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [answerDraft, setAnswerDraft] = useState("");
  const [toastOpen, setToastOpen] = useState(false);

  const selected = inquiries.find((q) => q.id === selectedId) ?? null;
  const answeredCount = inquiries.filter((q) => q.answer).length;

  const openDetail = (item: InquiryEntry) => {
    setSelectedId(item.id);
    setAnswerDraft(item.answer ?? "");
  };

  const submitAnswer = () => {
    if (!selected || !answerDraft.trim()) return;
    setInquiries((prev) =>
      prev.map((q) =>
        q.id === selected.id ? { ...q, answer: answerDraft.trim(), answeredAt: new Date().toISOString() } : q,
      ),
    );
    setToastOpen(true);
    setSelectedId(null);
  };

  if (selected) {
    return (
      <main className="mx-auto max-w-2xl p-6">
        <Stack direction="column" gap="sm">
          <button
            type="button"
            onClick={() => setSelectedId(null)}
            className="text-left text-sm text-muted hover:underline"
          >
            ← 목록으로
          </button>
          <Title size="md">문의 상세</Title>
        </Stack>

        <Stack direction="column" gap="md" className="mt-4">
          <Card padding="sm">
            <Stack direction="column" gap="xs">
              <Stack justify="between" align="start">
                <Text weight="bold">{selected.title}</Text>
                {selected.isPublic ? (
                  <Badge variant="gray">공개</Badge>
                ) : (
                  <Badge variant="gray">🔒 비공개</Badge>
                )}
              </Stack>
              <Text variant="sub">{selected.content}</Text>
            </Stack>
          </Card>

          {(selected.followUps ?? []).map((msg, i) => (
            <Card key={i} padding="sm">
              <Text variant="sub">↳ {msg}</Text>
            </Card>
          ))}

          <Stack direction="column" gap="sm">
            <Text weight="bold" leaf>
              답변
            </Text>
            <Input
              as="textarea"
              rows={5}
              placeholder="답변 입력…"
              value={answerDraft}
              onChange={(e) => setAnswerDraft(e.target.value)}
            />
            <Button fullWidth disabled={!answerDraft.trim()} onClick={submitAnswer}>
              {selected.answer ? "답변 수정" : "답변 등록"}
            </Button>
          </Stack>

          <NoticeBox tone="gray">
            답변 등록 시 고객에게 <b>카카오 알림톡</b>이 발송됩니다(알림 인터페이스, 실발송은
            이연 상태).
          </NoticeBox>
        </Stack>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl p-6">
      <Stack direction="column" gap="sm">
        <NextLink href="/more" className="text-sm text-muted hover:underline">
          ← 더보기로
        </NextLink>
        <Title size="md">문의 관리</Title>
        <Text variant="sub">
          총 {inquiries.length}건 · 답변완료 {answeredCount} · 대기 {inquiries.length - answeredCount}
        </Text>
      </Stack>

      <Stack direction="column" gap="sm" className="mt-4">
        {inquiries.map((item) => (
          <Card key={item.id} padding="sm" onClick={() => openDetail(item)}>
            <Stack justify="between" align="center">
              <Stack direction="column" gap="xs">
                <Text weight="bold">{item.title}</Text>
                <Text variant="sub">{item.content}</Text>
              </Stack>
              <Badge variant={item.answer ? "success" : "warning"}>{item.answer ? "답변완료" : "대기"}</Badge>
            </Stack>
          </Card>
        ))}

        {inquiries.length === 0 && <Text variant="sub">접수된 문의가 없습니다.</Text>}
      </Stack>

      <Toast open={toastOpen} onClose={() => setToastOpen(false)} message="답변이 등록되었습니다" />
    </main>
  );
}
