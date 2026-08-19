"use client";

import { useEffect, useState } from "react";
import { Banner } from "@chinguya/ui/banner";
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

type ContactTab = "faq" | "qna";
type QnaView = "list" | "write" | "detail";

interface FaqEntry {
  id: string;
  question: string;
  answer: string;
}

// FAQ 목업 — 기획서(S4-C3)엔 검색·카테고리 분류가 없다고 명시돼 있어 그냥 고정 순서로 나열한다.
const FAQ_ITEMS: FaqEntry[] = [
  {
    id: "faq-1",
    question: "대여 시간은 언제까지 연장할 수 있나요?",
    answer:
      "영업 종료 시간까지 매장에 방문해 반납 전 연장 요청을 주시면 됩니다. 예약된 다음 이용자가 있는 경우 연장이 어려울 수 있어요.",
  },
  {
    id: "faq-2",
    question: "예약 없이 현장에서 바로 대여할 수 있나요?",
    answer: "가능합니다. 다만 재고가 남아 있을 때만 현장 대여가 가능해서, 미리 예약해 두시는 걸 권장드려요.",
  },
  {
    id: "faq-3",
    question: "우천 시에도 자전거 대여가 가능한가요?",
    answer: "우천 시에는 안전을 위해 자전거 대여가 제한될 수 있어요. 낚싯대는 우천 시에도 정상적으로 대여됩니다.",
  },
  {
    id: "faq-4",
    question: "결제 수단은 어떤 게 있나요?",
    answer: "예약 후 안내되는 계좌로 무통장 입금만 가능합니다. 현장 카드 결제는 아직 준비 중이에요.",
  },
  {
    id: "faq-5",
    question: "여권 정보는 왜 입력해야 하나요?",
    answer: "예약자 본인 확인을 위해 여권 영문명을 받고 있어요. 대여하실 때 실물 여권을 함께 보여주시면 됩니다.",
  },
];

interface QnaEntry {
  id: string;
  title: string;
  content: string;
  isPublic: boolean;
  /** 비공개 글만 있음 — 상세를 열람할 때 이 값과 맞는지 확인한다. */
  pin?: string;
  /** 없으면 "답변 대기 중"으로 표시 */
  answer?: string;
  /** 같은 글 상세 화면에서 이어서 남긴 추가 질문들 — 기획서(S4-C4 상세/작성)처럼 답변을
   *  보고 나서도 같은 스레드에 바로 새 질문을 남길 수 있게 한다. */
  followUps?: string[];
}

const INITIAL_QNA: QnaEntry[] = [
  {
    id: "qna-1",
    title: "대여 취소 시 환불은 언제 되나요?",
    content: "취소 신청을 했는데 환불은 언제쯤 받을 수 있나요?",
    isPublic: true,
    answer: "무통장 입금 취소 건은 확인 후 영업일 기준 3일 이내로 입금하신 계좌로 환불해 드리고 있어요.",
  },
  {
    id: "qna-2",
    title: "여권 사본도 미리 보내야 하나요?",
    content: "여권 사본을 미리 이메일로 보내둬야 할까요?",
    isPublic: false,
    pin: "1234",
    answer: "아니요, 예약 확정 안내와 함께 사본 제출 링크를 보내드리니 그때 보내주시면 됩니다.",
  },
  {
    id: "qna-3",
    title: "자전거 대여 시 헬멧도 포함인가요?",
    content: "자전거 대여할 때 헬멧도 같이 대여할 수 있나요?",
    isPublic: true,
    answer: "네, 전 상품에 헬멧이 기본 포함되어 있어요. 사이즈가 필요하시면 현장에서 요청해 주세요.",
  },
  {
    id: "qna-4",
    title: "결제 관련 문의",
    content: "해외에서도 입금(결제)할 수 있는 방법이 있을까요?",
    isPublic: false,
    pin: "1234",
  },
];

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
  const [openFaqId, setOpenFaqId] = useState<string | null>(FAQ_ITEMS[0]?.id ?? null);

  const [qnaItems, setQnaItems] = useState<QnaEntry[]>(INITIAL_QNA);
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
      <Banner size="lg" title="고객지원" image="/banner-notice.png" />

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
              <Title leaf size="md">
                자주 묻는 질문
              </Title>

              <Stack direction="column" gap="sm">
                {FAQ_ITEMS.map((faq) => {
                  const open = openFaqId === faq.id;
                  return (
                    <Card key={faq.id} padding="sm" tint="primary">
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
                        <div className="mt-3 flex items-start gap-3 rounded-md bg-white p-3 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-bg-light text-xs font-bold text-ink">
                            A
                          </span>
                          <Text variant="sub" className="flex-1">
                            {faq.answer}
                          </Text>
                        </div>
                      )}
                    </Card>
                  );
                })}
              </Stack>

              <Text tone="secondary" size="xs" className="mt-1">
                검색·카테고리 분류는 제공하지 않아요. 원하는 답변이 없으면 질문하기 탭에서 직접 물어봐 주세요.
              </Text>
            </Stack>
          ) : qnaView === "list" ? (
            <Stack direction="column" gap="sm">
              <Title leaf size="md">
                질문 목록
              </Title>

              <Stack direction="column" gap="sm">
                {qnaItems.map((item) => (
                  <Card key={item.id} padding="sm" onClick={() => openQna(item)}>
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
                
                  <Card >
                  <Stack direction="column" gap="sm">
                    <Badge variant="success" className="w-fit">
                      관리자 답변
                    </Badge>
                    <Text variant="sub">{selected.answer ?? "아직 답변이 등록되지 않았어요. 조금만 기다려 주세요."}</Text>
                  </Stack>
                </Card>
                </Stack>
              </Card>

              {(selected.followUps ?? []).map((msg, i) => (
                <Card key={i} padding="sm" tint="secondary">          
                  <Stack justify="end">
                    <IconX aria-label="질문 삭제" onClick={() => setDeleteTargetId(selected.id)} />   </Stack>     
                  <Text className="mt-1">{msg}</Text>
                </Card>
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
