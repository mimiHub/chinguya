"use client";

import { useEffect, useRef, useState } from "react";
import NextLink from "next/link";
import {
  Title,
  Text,
  Card,
  Stack,
  Button,
  Input,
  IconX,
  Popup,
  ConfirmPopup,
  LabeledBox,
  Alert,
  Toast,
} from "@chinguya/ui";
import type { ToastStatus } from "@chinguya/ui";
import { createApiClient, ApiError, type AdminFaq } from "@chinguya/api-client";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { EmptyStateCat } from "@/components/EmptyStateCat";

const api = createApiClient();

type FormMode = "add" | "edit";

function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) return err.message;
  return fallback;
}

/**
 * S4-A1 FAQ 관리 — FAQ 등록/수정/삭제·노출 순서 관리. 분류·검색 없음(기획서 명시).
 * 랜딩 히어로 배너 편집(S4-A3)은 /landing 으로 분리했다.
 *
 * Core API에 실연동돼 있다(GET·POST·PUT·DELETE /admin/faqs) — 계약은
 * packages/api-spec/openapi/chinguya-admin-api.yaml.
 *
 * 쓰기는 슈퍼어드민만 가능하다. 일반 관리자에게 입력칸을 잠그고 버튼을 숨기는 것은 서버
 * 403과 정합을 맞추는 것일 뿐 보안 경계가 아니다(경계는 SecurityConfig).
 *
 * 순서 변경: 처음엔 FAQ 목록 각 줄에 위/아래 화살표를 따로 뒀는데, 화살표를 누르면 그 줄이
 * 한 칸 움직이면서 다음 클릭이 원래 노리던 줄이 아니라 그 자리로 밀려온 다른 줄의 화살표를
 * 누르게 되는 문제가 있었다(연속 클릭 시 두 줄이 한꺼번에 뒤바뀐 것처럼 보임). 그래서
 * 순서 조정은 수정 팝업 안으로 옮겼다 — 목록이 바뀌지 않는 고정된 위치에서 "이 항목"의
 * 위치만 화살표로 옮기므로 같은 문제가 생기지 않는다. 와이어프레임의 드래그(⋮⋮)는 관리자
 * 앱이 모바일 대상이라 터치 드래그까지 구현하기엔 무겁다고 판단해 화살표로 대신했다.
 * 화살표를 누를 때마다 전체 순서를 서버에 바로 저장한다.
 */
export default function AdminFaqPage() {
  const { isSuperAdmin } = useAdminAuth();

  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [faqs, setFaqs] = useState<AdminFaq[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>("add");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [questionDraft, setQuestionDraft] = useState("");
  const [answerDraft, setAnswerDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [moving, setMoving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminFaq | null>(null);

  // 삭제·순서변경·등록/수정 실패를 같은 Toast로 보여준다 — 예전엔 formError를 FAQ 팝업
  // 안에서만 그려서, 팝업이 닫혀 있을 때 일어나는 순서변경(move) 실패가 화면 어디에도 안
  // 보이는 버그가 있었다. Toast는 팝업 열림과 무관하게 항상 화면 위에 뜬다.
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastStatus, setToastStatus] = useState<ToastStatus>("info");
  const showToast = (message: string, status: ToastStatus) => {
    setToastMessage(message);
    setToastStatus(status);
  };

  useEffect(() => {
    api.faqs
      .list()
      .then((faqList) => {
        setFaqs(faqList);
        setLoaded(true);
      })
      .catch((err) => setLoadError(errorMessage(err, "FAQ를 불러오지 못했습니다.")));
  }, []);

  const editingIndex = faqs.findIndex((f) => f.faqId === editingId);

  // FAQ 목록 스크롤 영역 — 새로 등록한 항목은 맨 뒤에 붙는데, 목록이 길어 영역 안에서 스크롤되는
  // 상태면 방금 등록한 게 안 보인다. 등록 직후에만 맨 아래로 내려서 보여준다.
  const faqListRef = useRef<HTMLDivElement>(null);
  const [scrollFaqToEnd, setScrollFaqToEnd] = useState(false);
  useEffect(() => {
    if (!scrollFaqToEnd) return;
    const el = faqListRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    setScrollFaqToEnd(false);
  }, [scrollFaqToEnd]);

  const move = async (faqId: string, direction: -1 | 1) => {
    const idx = faqs.findIndex((f) => f.faqId === faqId);
    const targetIdx = idx + direction;
    if (idx < 0 || targetIdx < 0 || targetIdx >= faqs.length) return;
    const ids = faqs.map((f) => f.faqId);
    ids.splice(targetIdx, 0, ...ids.splice(idx, 1));

    setMoving(true);
    try {
      setFaqs(await api.faqs.reorder(ids));
    } catch (err) {
      showToast(errorMessage(err, "순서를 바꾸지 못했습니다."), "error");
    } finally {
      setMoving(false);
    }
  };

  const openAdd = () => {
    setFormMode("add");
    setEditingId(null);
    setQuestionDraft("");
    setAnswerDraft("");
    setFormOpen(true);
  };

  const openEdit = (faq: AdminFaq) => {
    setFormMode("edit");
    setEditingId(faq.faqId);
    setQuestionDraft(faq.question);
    setAnswerDraft(faq.answer);
    setFormOpen(true);
  };

  const submitForm = async () => {
    const question = questionDraft.trim();
    const answer = answerDraft.trim();
    if (!question || !answer) return;

    setSubmitting(true);
    try {
      if (formMode === "add") {
        const created = await api.faqs.create({ question, answer });
        setFaqs((prev) => [...prev, created]);
        setScrollFaqToEnd(true);
      } else if (editingId) {
        const updated = await api.faqs.update(editingId, { question, answer });
        setFaqs((prev) => prev.map((f) => (f.faqId === updated.faqId ? updated : f)));
      }
      setFormOpen(false);
    } catch (err) {
      showToast(errorMessage(err, "FAQ를 저장하지 못했습니다."), "error");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    try {
      await api.faqs.remove(target.faqId);
      setFaqs((prev) => prev.filter((f) => f.faqId !== target.faqId));
    } catch (err) {
      showToast(errorMessage(err, "FAQ를 삭제하지 못했습니다."), "error");
    }
  };

  return (
    <main className="mx-auto max-w-2xl p-6">
      <Stack direction="column" gap="sm">
        <NextLink href="/more" className="text-sm text-muted hover:underline">
          ← 더보기로
        </NextLink>
        <Stack justify="between" align="center">
          <Title size="md">FAQ 관리</Title>
          {isSuperAdmin && loaded && (
            <Button size="sm" variant="subtle" onClick={openAdd}>
              + FAQ
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
          <Text weight="bold" leaf>
            FAQ{faqs.length > 0 && ` (${faqs.length})`}
          </Text>
          {/* FAQ는 페이지네이션 없이 등록할수록 계속 쌓인다(분류·검색 없음 — 기획서). 목록에 최대 높이를
              주고 넘치면 이 영역 안에서만 스크롤되게 했다(카드 5~6장 정도 높이). pr-1: 스크롤바가 카드
              테두리에 딱 붙지 않게 한 칸 띄운다. overscroll-contain: 목록 끝까지 스크롤한 뒤 페이지 전체가
              이어서 딸려 내려가지 않게 한다. */}
          <div ref={faqListRef} className="max-h-[30rem] overflow-y-auto overscroll-contain pr-1">
          <Stack direction="column" gap="sm">
            {faqs.map((faq, i) => (
              <Card
                key={faq.faqId}
                padding="sm"
                onClick={isSuperAdmin ? () => openEdit(faq) : undefined}
              >
                <Stack justify="between" align="center">
                  <Stack direction="column" gap="xs">
                    <Text weight="bold">
                      {i + 1}. {faq.question}
                    </Text>
                    <Text variant="sub">{faq.answer}</Text>
                  </Stack>

                  {isSuperAdmin && (
                    <IconX
                      aria-label={`${faq.question} 삭제`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTarget(faq);
                      }}
                    />
                  )}
                </Stack>
              </Card>
            ))}

            {faqs.length === 0 && <EmptyStateCat message="등록된 FAQ가 없습니다." />}
          </Stack>
          </div>
          <Text variant="sub">
            FAQ는 분류·검색 없이 위 순서 그대로 고객앱에 노출됩니다.
            {isSuperAdmin && " 항목을 눌러 순서를 바꿀 수 있어요."}
          </Text>
        </Stack>
      )}

      <Popup
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={formMode === "add" ? "FAQ 등록" : "FAQ 수정"}
      >
        <Stack direction="column" gap="md">
          <LabeledBox label="질문" required>
            <Input
              value={questionDraft}
              maxLength={200}
              onChange={(e) => setQuestionDraft(e.target.value)}
            />
          </LabeledBox>
          <LabeledBox label="답변" required>
            <Input
              as="textarea"
              rows={4}
              value={answerDraft}
              maxLength={2000}
              onChange={(e) => setAnswerDraft(e.target.value)}
            />
          </LabeledBox>

          {/* 수정 모드에서만 노출 순서를 바꿀 수 있다 — 새로 등록하는 항목은 아직 목록에
              없어서 "위/아래로"의 기준이 될 위치가 없다(등록되면 맨 뒤에 붙는다). */}
          {formMode === "edit" && editingId && editingIndex >= 0 && (
            <LabeledBox label="노출 순서">
              <Stack justify="between" align="center">
                <Text variant="sub">
                  현재 {editingIndex + 1}번째 · 총 {faqs.length}개
                </Text>
                <Stack gap="xs">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={moving || editingIndex === 0}
                    onClick={() => void move(editingId, -1)}
                  >
                    ▲ 위로
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={moving || editingIndex === faqs.length - 1}
                    onClick={() => void move(editingId, 1)}
                  >
                    ▼ 아래로
                  </Button>
                </Stack>
              </Stack>
            </LabeledBox>
          )}

          <Button
            fullWidth
            disabled={submitting || !questionDraft.trim() || !answerDraft.trim()}
            onClick={() => void submitForm()}
          >
            {submitting ? "저장 중…" : formMode === "add" ? "등록" : "수정 완료"}
          </Button>
        </Stack>
      </Popup>

      <ConfirmPopup
        open={Boolean(deleteTarget)}
        message={`'${deleteTarget?.question}' FAQ를 삭제합니다. 이 작업은 되돌릴 수 없습니다.`}
        onConfirm={() => void confirmDelete()}
        onClose={() => setDeleteTarget(null)}
      />

      <Toast
        open={!!toastMessage}
        onClose={() => setToastMessage(null)}
        message={toastMessage ?? ""}
        status={toastStatus}
      />
    </main>
  );
}
