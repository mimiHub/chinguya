"use client";

import { useEffect, useRef, useState } from "react";
import NextLink from "next/link";
import { ApiError, createApiClient, type AdminInquiry } from "@chinguya/api-client";
import { Title, Text, EmptyState, Card, Stack, Badge, Input, Button, Toast, Alert } from "@chinguya/ui";
import { useAdminAuth } from "@/context/AdminAuthContext";

const api = createApiClient();

function errorMessage(err: unknown, fallback: string) {
  return err instanceof ApiError ? err.message : fallback;
}

/**
 * S4-A2-1 문의 관리 목록 / S4-A2-2 문의 상세·답변. 고객앱 질문하기(S4-C4/C5)에 답변을 등록한다.
 * Core API(/admin/inquiries)에 실연동돼 고객이 쓴 글이 그대로 뜨고, 등록한 답변은 고객 상세에 바로 보인다.
 * 고객앱의 본인 글 잠금은 관리자에게 적용하지 않는다. 답변 등록·수정은 슈퍼어드민만 — 일반 관리자에게는
 * 입력칸·버튼을 숨기고 답변만 읽기로 보여준다(서버도 403으로 막는다).
 *
 * 목록·상세가 한 페이지 안에서 바뀌므로, 상세로 갈 때 목록 스크롤 위치를 기억했다가 돌아올 때 되돌린다.
 * 관리자 레이아웃은 창이 아니라 {children}을 감싼 div가 스크롤되므로(app/layout.tsx) <main>의 부모를 쓴다.
 *
 * 답변 등록 시 고객에게 카카오 알림톡을 보낸다는 규칙이 있지만, 실제 발송 연동은 이연 상태다.
 */
export default function AdminInquiriesPage() {
  const { isSuperAdmin } = useAdminAuth();
  const [inquiries, setInquiries] = useState<AdminInquiry[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selected, setSelected] = useState<AdminInquiry | null>(null);
  const [answerDraft, setAnswerDraft] = useState("");
  const [answerError, setAnswerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  // 상세로 가기 직전의 목록 스크롤 위치. 목록으로 돌아오면(selected가 비면) 이 위치로 되돌린다.
  const mainRef = useRef<HTMLElement>(null);
  const listScrollY = useRef(0);

  useEffect(() => {
    mainRef.current?.parentElement?.scrollTo(0, selected ? 0 : listScrollY.current);
  }, [selected]);

  const load = () => {
    setLoadError(null);
    api.inquiries
      .list()
      .then(setInquiries)
      .catch((err: unknown) => setLoadError(errorMessage(err, "문의 목록을 불러오지 못했습니다.")));
  };

  useEffect(load, []);

  const list = inquiries ?? [];
  const answeredCount = list.filter((q) => q.status === "ANSWERED").length;

  const openDetail = (item: AdminInquiry) => {
    listScrollY.current = mainRef.current?.parentElement?.scrollTop ?? 0;
    setSelected(item);
    setAnswerDraft(item.answer ?? "");
    setAnswerError(null);
  };

  const submitAnswer = () => {
    if (!selected || !answerDraft.trim() || submitting) return;
    setSubmitting(true);
    setAnswerError(null);
    api.inquiries
      .answer(selected.inquiryId, answerDraft.trim())
      .then(() => {
        setToastOpen(true);
        setSelected(null);
        load();
      })
      .catch((err: unknown) => setAnswerError(errorMessage(err, "답변을 등록하지 못했습니다.")))
      .finally(() => setSubmitting(false));
  };

  if (selected) {
    return (
      <main ref={mainRef} className="mx-auto max-w-2xl p-6">
        <Stack direction="column" gap="sm">
          <button
            type="button"
            onClick={() => setSelected(null)}
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
                <Badge variant="gray">{selected.customerLoginId}</Badge>
              </Stack>
              <Text variant="sub" className="whitespace-pre-line">
                {selected.content}
              </Text>
            </Stack>
          </Card>

          {isSuperAdmin ? (
            <Stack direction="column" gap="sm">
              <Text weight="bold" leaf>
                답변
              </Text>
              <Input
                as="textarea"
                rows={5}
                placeholder="답변 입력…"
                value={answerDraft}
                maxLength={2000}
                onChange={(e) => setAnswerDraft(e.target.value)}
              />
              {answerError && <Alert status="error">{answerError}</Alert>}
              <Button fullWidth disabled={!answerDraft.trim() || submitting} onClick={submitAnswer}>
                {selected.answer ? "답변 수정" : "답변 등록"}
              </Button>
            </Stack>
          ) : (
            <Card padding="sm">
              <Stack direction="column" gap="xs">
                <Text weight="bold" leaf>
                  답변
                </Text>
                <Text variant="sub" className="whitespace-pre-line">
                  {selected.answer ?? "아직 답변이 없습니다. 답변 등록은 슈퍼어드민만 할 수 있습니다."}
                </Text>
              </Stack>
            </Card>
          )}

          {isSuperAdmin && (
            <Alert status="info">
              <p>답변 등록 시 고객에게 &quot;카카오 알림톡&quot;이 발송됩니다.</p>
              <p className="text-xs">(알림 인터페이스, 실발송은 이연 상태)</p>
            </Alert>
          )}
        </Stack>
      </main>
    );
  }

  return (
    <main ref={mainRef} className="mx-auto max-w-2xl p-6">
      <Stack direction="column" gap="sm">
        <NextLink href="/more" className="text-sm text-muted hover:underline">
          ← 더보기로
        </NextLink>
        <Title size="md">문의 관리</Title>
        <Text variant="sub">
          총 {list.length}건 · 답변완료 {answeredCount} · 대기 {list.length - answeredCount}
        </Text>
      </Stack>

      <Stack direction="column" gap="sm" className="mt-4">
        {loadError && <Alert status="error">{loadError}</Alert>}
        {inquiries === null && !loadError && <Text variant="sub">불러오는 중…</Text>}

        {list.map((item) => (
          <Card key={item.inquiryId} padding="sm" onClick={() => openDetail(item)}>
            <Stack justify="between" align="center">
              <Stack direction="column" gap="xs" className="min-w-0">
                <Text weight="bold">{item.title}</Text>
                {/* 본문 미리보기 — 두 줄까지만 */}
                <Text variant="sub" className="line-clamp-2">
                  {item.content}
                </Text>
              </Stack>
              <Badge variant={item.status === "ANSWERED" ? "success" : "warning"}>
                {item.status === "ANSWERED" ? "답변완료" : "대기"}
              </Badge>
            </Stack>
          </Card>
        ))}

        {inquiries !== null && inquiries.length === 0 && <EmptyState variant="card">접수된 문의가 없습니다.</EmptyState>}
      </Stack>

      <Toast open={toastOpen} onClose={() => setToastOpen(false)} message="답변이 등록되었습니다" />
    </main>
  );
}
