"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Banner, NoticeBox, Tab, Title, Text, Stack, Card, Button, Input, ConfirmPopup, Badge, IconX, Alert, EmptyState } from "@chinguya/ui";
import type { AssetCategory } from "@chinguya/types";
import {
  ApiError,
  createApiClient,
  type CustomerFaq,
  type InquiryDetail,
  type InquirySummary,
} from "@chinguya/api-client";
import { useCustomerAuth } from "@/context/CustomerAuthContext";
import { ScrollReveal } from "@/components/ScrollReveal";
import { UsageGuideSteps } from "@/components/UsageGuideSteps";

type ContactTab = "faq" | "usage" | "qna";

/** 사용방법 탭에서 고르는 상품 종류 — 상품 조회(/rental)의 카테고리와 같은 이름을 쓴다. */
const USAGE_CATEGORY_TABS: { key: AssetCategory; label: string }[] = [
  { key: "BICYCLE", label: "자전거" },
  { key: "FISHING_ROD", label: "낚싯대" },
];
type QnaView = "list" | "write" | "detail";

const api = createApiClient();


/**
 * 고객지원(S4-C3 FAQ / 사용방법 / S4-C4·C5 질문하기) — 캡슐형 탭(Tab variant="capsule")으로 FAQ·사용방법·1:1
 * 질문하기를 한 화면에 묶었다. FAQ는 Core API(GET /v1/faqs)에 실연동돼 관리자 FAQ 관리(S4-A1) 순서 그대로 보여준다.
 * "사용방법"은 상품 상세의 "상품 사용방법" 탭과 같은 데이터(data/usageGuides.ts)를
 * 그대로 보여준다 — 예약하기 전(상품 상세)에도, 예약한 뒤(대여 중)에도 여러 곳에서 쉽게 찾을 수 있게 하려는 것이다.
 *
 * 질문하기는 Core API(/v1/inquiries)에 실연동돼 있고 로그인 고객만 쓸 수 있다. 목록은 모든 고객 글의
 * 제목·상태만 보이고, 남의 글은 🔒로 잠겨 열리지 않는다. 본문·관리자 답변은 본인 글 상세에서만 보인다
 * (서버도 남의 글 상세를 404로 막는다). 질문은 등록·삭제만 되고 수정은 안 된다.
 */
function ContactContent() {
  // 예약 상세 등 다른 화면에서 /contact?tab=usage&category=FISHING_ROD 로 오면 사용방법 탭·해당 상품 종류가 먼저 선택된 채로 열린다.
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const initialTab: ContactTab = tabParam === "usage" || tabParam === "qna" ? tabParam : "faq";
  const initialUsageCategory: AssetCategory =
    searchParams.get("category") === "FISHING_ROD" ? "FISHING_ROD" : "BICYCLE";
  const [tab, setTab] = useState<ContactTab>(initialTab);
  const [usageCategory, setUsageCategory] = useState<AssetCategory>(initialUsageCategory);
  const [faqs, setFaqs] = useState<CustomerFaq[] | null>(null);
  const [faqError, setFaqError] = useState<string | null>(null);
  const [openFaqId, setOpenFaqId] = useState<string | null>(null);

  useEffect(() => {
    api.customerFaqs
      .list()
      .then((list) => {
        setFaqs(list);
        // 첫 질문은 펼친 채로 보여준다.
        setOpenFaqId(list[0]?.faqId ?? null);
      })
      .catch((err: unknown) => {
        setFaqError(err instanceof ApiError ? err.message : "FAQ를 불러오지 못했습니다.");
      });
  }, []);

  const { session, loading: authLoading } = useCustomerAuth();
  const [qnaItems, setQnaItems] = useState<InquirySummary[] | null>(null);
  const [qnaError, setQnaError] = useState<string | null>(null);
  const [qnaView, setQnaView] = useState<QnaView>("list");
  const [selected, setSelected] = useState<InquiryDetail | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [writeTitle, setWriteTitle] = useState("");
  const [writeContent, setWriteContent] = useState("");

  const loadQna = () => {
    setQnaError(null);
    api.customerInquiries
      .list()
      .then(setQnaItems)
      .catch((err: unknown) => {
        setQnaError(err instanceof ApiError ? err.message : "질문 목록을 불러오지 못했습니다.");
      });
  };

  // 질문하기 탭은 로그인 고객만 쓴다 — 로그인 확인이 끝난 뒤에 목록을 부른다.
  useEffect(() => {
    if (tab !== "qna" || authLoading || !session) return;
    loadQna();
  }, [tab, authLoading, session]);

  const openQna = (item: InquirySummary) => {
    if (!item.mine) return;
    setQnaError(null);
    api.customerInquiries
      .detail(item.inquiryId)
      .then((detail) => {
        setSelected(detail);
        setQnaView("detail");
      })
      .catch((err: unknown) => {
        setQnaError(err instanceof ApiError ? err.message : "질문을 불러오지 못했습니다.");
      });
  };

  const resetWriteForm = () => {
    setWriteTitle("");
    setWriteContent("");
  };

  const canSubmit = writeTitle.trim().length > 0 && writeContent.trim().length > 0 && !submitting;

  const submitQna = () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setQnaError(null);
    api.customerInquiries
      .create({ title: writeTitle.trim(), content: writeContent.trim() })
      .then(() => {
        resetWriteForm();
        setQnaView("list");
        loadQna();
      })
      .catch((err: unknown) => {
        setQnaError(err instanceof ApiError ? err.message : "질문을 등록하지 못했습니다.");
      })
      .finally(() => setSubmitting(false));
  };

  const deleteQna = () => {
    if (!deleteTargetId) return;
    api.customerInquiries
      .remove(deleteTargetId)
      .then(() => {
        setSelected(null);
        setQnaView("list");
        loadQna();
      })
      .catch((err: unknown) => {
        setQnaError(err instanceof ApiError ? err.message : "질문을 삭제하지 못했습니다.");
      })
      .finally(() => setDeleteTargetId(null));
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
              { key: "usage", label: "사용방법" },
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

              {faqError && <Alert status="error">{faqError}</Alert>}

              {faqs === null && !faqError && <Text variant="sub">불러오는 중…</Text>}

              {faqs !== null && faqs.length === 0 && <EmptyState variant="card">등록된 질문이 없습니다.</EmptyState>}

              <Stack direction="column" gap="sm">
                {(faqs ?? []).map((faq, i) => {
                  const open = openFaqId === faq.faqId;
                  return (
                    <ScrollReveal key={faq.faqId} delay={i * 60}>
                    <Card padding="sm" tint="primary">
                      <button
                        type="button"
                        onClick={() => setOpenFaqId(open ? null : faq.faqId)}
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
          ) : tab === "usage" ? (
            <Stack direction="column" gap="md">
              <Title size="lg" subtitle="대여한 상품을 어떻게 쓰고 반납하는지 알려드려요.">
                상품 사용방법
              </Title>
              <Tab
                variant="segment"
                items={USAGE_CATEGORY_TABS}
                activeKey={usageCategory}
                onChange={(key) => setUsageCategory(key as AssetCategory)}
              />
              <UsageGuideSteps category={usageCategory} />
            </Stack>
          ) : authLoading ? null : !session ? (
            <Stack direction="column" gap="md">
              <Title size="lg" subtitle="궁금하신 점을 알려주시면, 답변을 보내드릴게요.">
                질문 목록
              </Title>
              <Text tone="secondary">질문하기는 로그인 후 이용할 수 있습니다.</Text>
              <Button href={`/login?redirect=${encodeURIComponent("/contact?tab=qna")}`}>로그인</Button>
            </Stack>
          ) : qnaView === "list" ? (
            <Stack direction="column" gap="sm">
              <Title size="lg" subtitle="궁금하신 점을 알려주시면, 답변을 보내드릴게요.">
                질문 목록
              </Title>

              {qnaError && <Alert status="error">{qnaError}</Alert>}

              {qnaItems === null && !qnaError && <Text variant="sub">불러오는 중…</Text>}

              {qnaItems !== null && qnaItems.length === 0 && (
                <EmptyState variant="card">등록된 질문이 없습니다.</EmptyState>
              )}

              {/* 목록은 전체 공개(제목·상태). 남의 글은 🔒 — 눌러도 열리지 않는다. */}
              <Stack direction="column" gap="sm">
                {(qnaItems ?? []).map((item, i) => (
                  <ScrollReveal key={item.inquiryId} delay={i * 60}>
                  <Card padding="sm" onClick={item.mine ? () => openQna(item) : undefined}>
                    <Stack justify="between" align="center">
                      <Text as="span" weight="medium" variant={item.mine ? undefined : "sub"}>
                        {!item.mine && (
                          <span aria-label="다른 고객의 글" className="mr-1">
                            🔒
                          </span>
                        )}
                        {item.title}
                      </Text>
                      {item.status === "ANSWERED" ? (
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
                    setQnaError(null);
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

              {qnaError && <Alert status="error">{qnaError}</Alert>}

              <Input placeholder="제목" value={writeTitle} maxLength={100} onChange={(e) => setWriteTitle(e.target.value)} />
              <Input
                as="textarea"
                rows={5}
                placeholder="새 질문 입력..."
                value={writeContent}
                maxLength={2000}
                onChange={(e) => setWriteContent(e.target.value)}
              />

              <Text variant="sub" size="xs">
                등록한 질문은 수정할 수 없어요(삭제는 가능). 내용과 답변은 작성한 본인만 볼 수 있어요.
              </Text>

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

              {qnaError && <Alert status="error">{qnaError}</Alert>}

              <ScrollReveal>
              <Card tint="secondary">
                <Stack direction="column" gap="sm">
                  <Stack justify="between" align="start">
                    <Text weight="bold">{selected.title}</Text>
                    <IconX aria-label="질문 삭제" onClick={() => setDeleteTargetId(selected.inquiryId)} />
                  </Stack>
                  <Badge variant="error" className="w-fit">
                      수정 불가
                  </Badge>
                  <Text className="whitespace-pre-line">{selected.content}</Text>

                  <Card shadow={false}>
                    <Stack direction="column" gap="sm">
                      <Badge variant="info" className="w-fit">
                        관리자 답변
                      </Badge>
                      <Text variant="sub" className="whitespace-pre-line">
                        {selected.answer ?? "아직 답변이 등록되지 않았어요. 조금만 기다려 주세요."}
                      </Text>
                    </Stack>
                  </Card>
                </Stack>
              </Card>
              </ScrollReveal>

              <Button
                fullWidth
                variant="outline"
                onClick={() => {
                  resetWriteForm();
                  setQnaView("write");
                }}
              >
                새 질문 작성
              </Button>
            </Stack>
          ) : null}
        </Stack>
      </div>

      <ConfirmPopup
        open={Boolean(deleteTargetId)}
        message="이 질문을 삭제할까요? 삭제하면 되돌릴 수 없어요."
        onConfirm={deleteQna}
        onClose={() => setDeleteTargetId(null)}
      />
    </main>
  );
}

// useSearchParams를 쓰는 컴포넌트는 Suspense 경계 안에서만 정적 렌더링이 가능하다(rental/page.tsx와 같은 패턴).
export default function ContactPage() {
  return (
    <Suspense fallback={null}>
      <ContactContent />
    </Suspense>
  );
}
