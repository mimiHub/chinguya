"use client";

import { useEffect, useState } from "react";
import { Banner } from "@chinguya/ui/banner";
import { NoticeBox } from "@chinguya/ui/notice-box";
import { Tab } from "@chinguya/ui/tab";
import { Title } from "@chinguya/ui/title";
import { Text } from "@chinguya/ui/text";
import { Stack } from "@chinguya/ui/stack";
import { Card } from "@chinguya/ui/card";
import { Button } from "@chinguya/ui/button";
import { Input } from "@chinguya/ui/input";
import { Toggle } from "@chinguya/ui/toggle";
import { Popup } from "@chinguya/ui/popup";
import { ConfirmPopup } from "@chinguya/ui/confirm-popup";
import { Badge } from "@chinguya/ui/badge";
import { IconX } from "@chinguya/ui/icon-x";
import { FormMessage } from "@chinguya/ui/form-message";
import type { InquiryEntry } from "@chinguya/types";
import { faqEntries } from "@/data/faqData";
import { initialInquiries } from "@/data/inquiryData";
import { ScrollReveal } from "@/components/ScrollReveal";

type ContactTab = "faq" | "qna";
type QnaView = "list" | "write" | "detail";


/** packages/types의 InquiryEntry(S4-C4 문의)를 이 파일 안에서는 짧게 QnaEntry로 부른다. */
type QnaEntry = InquiryEntry;

/**
 * 고객지원(S4-C3 FAQ / S4-C4 질문하기) — 캡슐형 탭(Tab variant="capsule")으로 FAQ와 1:1
 * 질문하기를 한 화면에 묶었다. 로그인 기능이 없어서 "이 브라우저 세션에서 쓴 글 전부"를
 * 본인 글로 취급한다(다른 목업 저장소들과 같은 한계) — 새로고침하면 처음 목업 데이터로
 * 되돌아간다.
 *
 * 비공개 글은 목록에서 제목만 보이고(🔒) 상세를 보려면 비밀번호가 맞아야 한다 — 기획서
 * 작성 화면엔 비밀번호 입력칸이 따로 안 보였지만, 그 비밀번호를 어딘가에서는 정해야 열람
 * 검증이 성립하기 때문에 "비공개로 등록"을 껐을 때만 비밀번호 입력칸이 나오게 추가했다.
 */
export default function ContactPage() {
  const [tab, setTab] = useState<ContactTab>("faq");
  const sortedFaqEntries = [...faqEntries].sort((a, b) => a.order - b.order);
  const [openFaqId, setOpenFaqId] = useState<string | null>(sortedFaqEntries[0]?.id ?? null);

  const [qnaItems, setQnaItems] = useState<QnaEntry[]>(initialInquiries);
  const [qnaView, setQnaView] = useState<QnaView>("list");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [unlockedIds, setUnlockedIds] = useState<Set<string>>(new Set());

  const [pinTargetId, setPinTargetId] = useState<string | null>(null);
  const [pinValue, setPinValue] = useState("");
  const [pinError, setPinError] = useState(false);

  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const [writeTitle, setWriteTitle] = useState("");
  const [writeContent, setWriteContent] = useState("");
  const [writePublic, setWritePublic] = useState(true);
  const [writePin, setWritePin] = useState("");

  const [replyContent, setReplyContent] = useState("");

  const selected = qnaItems.find((q) => q.id === selectedId) ?? null;

  // 상세로 들어온 글이 바뀌면(다른 질문을 열면) 이전 글에 쓰던 답글 입력값이 남아있지 않게 비운다.
  useEffect(() => {
    setReplyContent("");
  }, [selectedId]);

  const openQna = (item: QnaEntry) => {
    if (!item.isPublic && !unlockedIds.has(item.id)) {
      setPinTargetId(item.id);
      setPinValue("");
      setPinError(false);
      return;
    }
    setSelectedId(item.id);
    setQnaView("detail");
  };

  const confirmPin = () => {
    const target = qnaItems.find((q) => q.id === pinTargetId);
    if (!target) return;
    if (pinValue === target.pin) {
      setUnlockedIds((prev) => new Set(prev).add(target.id));
      setSelectedId(target.id);
      setQnaView("detail");
      setPinTargetId(null);
    } else {
      setPinError(true);
    }
  };

  const resetWriteForm = () => {
    setWriteTitle("");
    setWriteContent("");
    setWritePublic(true);
    setWritePin("");
  };

  const canSubmit =
    writeTitle.trim().length > 0 && writeContent.trim().length > 0 && (writePublic || writePin.trim().length > 0);

  const submitQna = () => {
    if (!canSubmit) return;
    const entry: QnaEntry = {
      id: `qna-${Date.now()}`,
      title: writeTitle.trim(),
      content: writeContent.trim(),
      isPublic: writePublic,
      pin: writePublic ? undefined : writePin.trim(),
      createdAt: new Date().toISOString(),
    };
    setQnaItems((prev) => [entry, ...prev]);
    resetWriteForm();
    setQnaView("list");
  };

  const deleteQna = () => {
    if (!deleteTargetId) return;
    setQnaItems((prev) => prev.filter((q) => q.id !== deleteTargetId));
    setDeleteTargetId(null);
    setQnaView("list");
    setSelectedId(null);
  };

  // 상세 화면에서 같은 글에 이어서 새 질문(답글)을 남긴다 — 관리자 답변을 보고도 궁금한 게
  // 남아 있으면 목록으로 돌아가지 않고 바로 이어서 물어볼 수 있게 한다.
  const submitReply = () => {
    if (!selected || !replyContent.trim()) return;
    const content = replyContent.trim();
    setQnaItems((prev) =>
      prev.map((q) => (q.id === selected.id ? { ...q, followUps: [...(q.followUps ?? []), content] } : q)),
    );
    setReplyContent("");
  };

  return (
    <main>
      <Banner size="lg" title="고객지원" image="/banner-contact.png" />

      <div className="mx-auto max-w-2xl p-6">
        <Stack direction="column" gap="lg">
          <Tab
            variant="capsule"
            className="self-start"
            items={[
              { key: "faq", label: "FAQ" },
              { key: "qna", label: "질문하기" },
            ]}
            activeKey={tab}
            onChange={(key) => {
              setTab(key as ContactTab);
              if (key === "qna") setQnaView("list");
            }}
          />

          {tab === "faq" ? (
            <Stack direction="column" gap="sm">
              <Title size="lg" subtitle="자주묻는 질문을 통해 빠르게 찾아보세요.">
                자주 묻는 질문
              </Title>

              <Stack direction="column" gap="sm">
                {sortedFaqEntries.map((faq, i) => {
                  const open = openFaqId === faq.id;
                  return (
                    <ScrollReveal key={faq.id} delay={i * 60}>
                    <Card padding="sm" tint="primary">
                      <button
                        type="button"
                        onClick={() => setOpenFaqId(open ? null : faq.id)}
                        className="flex w-full items-center gap-3 bg-transparent text-left focus:outline-none"
                        style={{ WebkitTapHighlightColor: "transparent" }}
                      >
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink text-xs font-bold text-white">
                          Q
                        </span>
                        <Text as="span" weight="medium" className="flex-1">
                          {faq.question}
                        </Text>
                        <span aria-hidden="true" className="shrink-0 text-sm text-muted">
                          {open ? "−" : "+"}
                        </span>
                      </button>

                      {open && (
                        <div className="mt-3 flex items-start gap-3 rounded-md bg-white p-3 ">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-bg-light text-xs font-bold text-ink">
                            A
                          </span>
                          <Text variant="sub" className="flex-1">
                            {faq.answer}
                          </Text>
                        </div>
                      )}
                    </Card>
                    </ScrollReveal>
                  );
                })}
              </Stack>

              <NoticeBox tone="none" className="mt-1">
                <Text variant="sub" size="xs">
                  검색·카테고리 분류는 제공하지 않아요. 원하는 답변이 없으면 질문하기 탭에서 직접 물어봐 주세요.
                </Text>
              </NoticeBox>
            </Stack>
          ) : qnaView === "list" ? (
            <Stack direction="column" gap="sm">
              <Title size="lg" subtitle="궁금하신 점을 알려주시면, 답변을 보내드릴게요.">
                질문 목록
              </Title>

              <Stack direction="column" gap="sm">
                {qnaItems.map((item, i) => (
                  <ScrollReveal key={item.id} delay={i * 60}>
                  <Card padding="sm" onClick={() => openQna(item)}>
                    <Stack justify="between" align="center">
                      <Text as="span" weight="medium">
                        {item.title}
                      </Text>
                      {!item.isPublic ? (
                        <span aria-hidden="true" className="text-muted">
                          🔒
                        </span>
                      ) : item.answer ? (
                        <Badge variant="success">답변완료</Badge>
                      ) : (
                        <Badge variant="gray">대기</Badge>
                      )}
                    </Stack>
                  </Card>
                  </ScrollReveal>
                ))}
              </Stack>             

              <Stack justify="center" className="mt-6">
                <Button
                  onClick={() => {
                    resetWriteForm();
                    setQnaView("write");
                  }}
                >
                  질문 작성
                </Button>
              </Stack>
            </Stack>
          ) : qnaView === "write" ? (
            <ScrollReveal>
            <Stack direction="column" gap="md">
              <button
                type="button"
                onClick={() => setQnaView("list")}
                className="text-left text-sm text-muted hover:underline"
              >
                ← 목록으로
              </button>
              <Title size="lg">내 질문</Title>

              <Input placeholder="제목" value={writeTitle} onChange={(e) => setWriteTitle(e.target.value)} />
              <Input
                as="textarea"
                rows={5}
                placeholder="새 질문 입력..."
                value={writeContent}
                onChange={(e) => setWriteContent(e.target.value)}
              />

              <Stack justify="between" align="center">
                <Text as="span" weight="medium">
                  공개로 등록
                </Text>
                <Toggle on={writePublic} onChange={setWritePublic} />
              </Stack>

              {!writePublic && (
                <Stack direction="column" gap="xs">
                  <Input
                    placeholder="비밀번호(4자리)"
                    value={writePin}
                    onChange={(e) => setWritePin(e.target.value)}
                    maxLength={4}
                  />
                  <FormMessage type="helper">비공개 글은 이 비밀번호로만 다시 열람할 수 있어요.</FormMessage>
                </Stack>
              )}

              <Button fullWidth disabled={!canSubmit} onClick={submitQna}>
                등록
              </Button>
            </Stack>
            </ScrollReveal>
          ) : selected ? (
            <Stack direction="column" gap="md">
              <button
                type="button"
                onClick={() => setQnaView("list")}
                className="text-left text-sm text-muted hover:underline"
              >
                ← 목록으로
              </button>
              <Title size="lg">내 질문</Title>

              <ScrollReveal>
              <Card tint="secondary">
                <Stack direction="column" gap="sm">
                  <Stack justify="between" align="start">
                    <Text weight="bold">{selected.title}</Text>
                    <IconX aria-label="질문 삭제" onClick={() => setDeleteTargetId(selected.id)} />
                  </Stack>                  
                  <Badge variant="error" className="w-fit">
                      수정 불가
                  </Badge>
                  <Text>{selected.content}</Text>
                
                  <Card shadow={false}>
                    <Stack direction="column" gap="sm">
                      <Badge variant="info" className="w-fit">
                        관리자 답변
                      </Badge>
                      <Text variant="sub">{selected.answer ?? "아직 답변이 등록되지 않았어요. 조금만 기다려 주세요."}</Text>
                    </Stack>
                  </Card>
                </Stack>
              </Card>
              </ScrollReveal>

              {(selected.followUps ?? []).map((msg, i) => (
                <ScrollReveal key={i}>
                <Card padding="sm" tint="secondary">          
                  <Stack justify="end">
                    <IconX aria-label="질문 삭제" onClick={() => setDeleteTargetId(selected.id)} />   </Stack>     
                  <Text className="mt-1">{msg}</Text>
                </Card>
                </ScrollReveal>
              ))}

              {/* 답변을 보고도 궁금한 게 남았으면 목록으로 돌아가지 않고 이 스레드에 바로
                  이어서 물어볼 수 있게 한다(기획서 S4-C4 상세/작성 화면 참고). */}
              <Stack direction="column" gap="sm">
                <Input
                  as="textarea"
                  rows={3}
                  placeholder="새 질문 입력..."
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                />
                <Button fullWidth disabled={!replyContent.trim()} onClick={submitReply}>
                  등록
                </Button>
              </Stack>
            </Stack>
          ) : null}
        </Stack>
      </div>

      <Popup open={Boolean(pinTargetId)} onClose={() => setPinTargetId(null)} title="비공개 질문">
        <Stack direction="column" gap="sm">
          <Text variant="sub">비밀번호를 입력하면 질문 내용을 볼 수 있어요. (답변은 작성 본인만 열람 가능합니다)</Text>
          <Input
            value={pinValue}
            onChange={(e) => {
              setPinValue(e.target.value);
              setPinError(false);
            }}
            placeholder="비밀번호"
            maxLength={4}
            error={pinError}
          />
          {pinError && <FormMessage type="error">비밀번호가 올바르지 않아요.</FormMessage>}
          <Button fullWidth onClick={confirmPin}>
            확인
          </Button>
        </Stack>
      </Popup>

      <ConfirmPopup
        open={Boolean(deleteTargetId)}
        message="이 질문을 삭제할까요? 삭제하면 되돌릴 수 없어요."
        onConfirm={deleteQna}
        onClose={() => setDeleteTargetId(null)}
      />
    </main>
  );
}
