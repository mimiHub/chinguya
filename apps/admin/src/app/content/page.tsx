"use client";

import { useState } from "react";
import NextLink from "next/link";
import type { FaqEntry } from "@chinguya/types";
import { Title } from "@chinguya/ui/title";
import { Text } from "@chinguya/ui/text";
import { Card } from "@chinguya/ui/card";
import { Tab } from "@chinguya/ui/tab";
import { Stack } from "@chinguya/ui/stack";
import { Button } from "@chinguya/ui/button";
import { Input } from "@chinguya/ui/input";
import { IconX } from "@chinguya/ui/icon-x";
import { Popup } from "@chinguya/ui/popup";
import { ConfirmPopup } from "@chinguya/ui/confirm-popup";
import { LabeledBox } from "@chinguya/ui/labeled-box";
import { Toast } from "@chinguya/ui/toast";
import { initialFaqEntries } from "@/data/faqData";
import { introContent, bannerSlides, type BannerSlide } from "@/data/contentData";

type FormMode = "add" | "edit";

interface ImagePreview {
  url: string;
  fileName: string;
}

/**
 * 이미지 하나를 고르고 미리보는 필드. 배너 3개 × PC/모바일 2장 = 6곳에서 똑같은 UI가
 * 필요해서 컴포넌트로 뽑았다.
 *
 * 네이티브 `<input type="file">`은 브라우저마다 내부 "파일 선택" 버튼·문구 간격을 자체적으로
 * 그려서 디자인 시스템 스타일(패딩·테두리)을 입혀도 안쪽 간격이 안 맞는 문제가 있었다 —
 * 그래서 인풋 자체는 화면에서 숨기고, `<label htmlFor>`로 디자인 시스템 버튼과 똑같이
 * 생긴 트리거를 대신 눌러 인풋을 여는 방식으로 바꿨다.
 */
function ImageAttachField({
  id,
  label,
  currentPath,
  preview,
  onSelect,
  onClear,
}: {
  id: string;
  label: string;
  currentPath: string;
  preview: ImagePreview | null;
  onSelect: (file: File) => void;
  onClear: () => void;
}) {
  return (
    <LabeledBox label={label} helper={`현재 노출 중: ${currentPath}`} emphasis>
      {preview ? (
        <Stack direction="column" gap="sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview.url} alt="" className="h-28 w-full rounded-md object-cover" />
          <Stack justify="between" align="center">
            <Text variant="sub">{preview.fileName}</Text>
            <Button size="sm" variant="outline" onClick={onClear}>
              제거
            </Button>
          </Stack>
        </Stack>
      ) : (
        <Stack gap="sm" align="center">
          <input
            id={id}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onSelect(file);
              e.target.value = ""; // 같은 파일을 다시 골라도 onChange가 또 발생하도록 초기화
            }}
          />
          <label
            htmlFor={id}
            className="inline-flex h-8 cursor-pointer items-center justify-center rounded-md border border-primary-500 bg-surface px-4 text-sm font-medium text-primary-500 transition-colors hover:bg-bg-light"
          >
            파일 선택
          </label>
          <Text variant="sub">선택된 파일 없음</Text>
        </Stack>
      )}
    </LabeledBox>
  );
}

/**
 * S4-A1/A3 FAQ · 콘텐츠 관리(CMS-lite). 세 구역으로 나뉜다:
 *  1) FAQ 등록/수정/삭제·노출 순서 관리 — 분류·검색 없음(기획서 명시)
 *  2) 랜딩(안 A) 히어로 배너 편집 — 배너 3장, 배너마다 PC/모바일 이미지가 따로 필요하다
 *     (apps/customer/src/components/HomeCarousel.tsx의 SLIDES와 동일한 구조)
 *  3) 서비스 소개(S4-C2) 본문 편집
 *
 * 실제로는 여기서 저장한 내용이 고객앱 FAQ·랜딩·서비스 소개 화면에 그대로 반영돼야 하지만,
 * 지금은 앱마다 독립된 프로토타입이라 반영되지 않는다(자세한 한계는
 * apps/admin/src/data/faqData.ts, contentData.ts 주석 참고).
 *
 * 순서 변경: 처음엔 FAQ 목록 각 줄에 위/아래 화살표를 따로 뒀는데, 화살표를 누르면 그 줄이
 * 한 칸 움직이면서 다음 클릭이 원래 노리던 줄이 아니라 그 자리로 밀려온 다른 줄의 화살표를
 * 누르게 되는 문제가 있었다(연속 클릭 시 두 줄이 한꺼번에 뒤바뀐 것처럼 보임). 그래서
 * 순서 조정은 수정 팝업 안으로 옮겼다 — 목록이 바뀌지 않는 고정된 위치에서 "이 항목"의
 * 위치만 화살표로 옮기므로 같은 문제가 생기지 않는다. 와이어프레임의 드래그(⋮⋮)는 관리자
 * 앱이 모바일 대상이라 터치 드래그까지 구현하기엔 무겁다고 판단해 화살표로 대신했다.
 *
 * 이미지 첨부: 실제 업로드·저장 서버가 없어서 완전한 기능은 아니지만, "첨부 UI 자체가
 * 없는" 것과 "골라서 미리보기까지는 되는" 건 다르다고 판단해 파일 선택 + 미리보기는
 * 붙여뒀다. 고른 파일은 URL.createObjectURL로 브라우저 메모리에만 잠깐 띄우는 것이라
 * 새로고침하면 사라지고, 저장 버튼을 눌러도 서버에 올라가지 않는다(bannerSlides에도
 * 반영 안 함) — 실제 업로드 연동은 여전히 이연 상태다.
 */
export default function AdminContentPage() {
  const [faqs, setFaqs] = useState<FaqEntry[]>(initialFaqEntries);
  const sortedFaqs = [...faqs].sort((a, b) => a.order - b.order);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>("add");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [questionDraft, setQuestionDraft] = useState("");
  const [answerDraft, setAnswerDraft] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<FaqEntry | null>(null);

  const [banners, setBanners] = useState<BannerSlide[]>(bannerSlides);
  // 배너 3장을 한 화면에 다 펼치면 스크롤이 너무 길어져서, 탭으로 하나씩만 보여준다.
  const [activeBannerId, setActiveBannerId] = useState(bannerSlides[0]?.id ?? "");
  const activeBanner = banners.find((b) => b.id === activeBannerId) ?? null;
  // 키 형식: "<배너id>:pc" | "<배너id>:mobile" — 배너 3개 × 2장이라 배열보다 맵이 다루기 쉽다.
  const [imagePreviews, setImagePreviews] = useState<Record<string, ImagePreview>>({});

  const [introBody, setIntroBody] = useState(introContent.body);
  const [bannerToastOpen, setBannerToastOpen] = useState(false);
  const [introToastOpen, setIntroToastOpen] = useState(false);

  const move = (id: string, direction: -1 | 1) => {
    const idx = sortedFaqs.findIndex((f) => f.id === id);
    const targetIdx = idx + direction;
    if (idx < 0 || targetIdx < 0 || targetIdx >= sortedFaqs.length) return;
    const a = sortedFaqs[idx];
    const b = sortedFaqs[targetIdx];
    if (!a || !b) return;
    const aOrder = a.order;
    const bOrder = b.order;
    setFaqs((prev) =>
      prev.map((f) => {
        if (f.id === a.id) return { ...f, order: bOrder };
        if (f.id === b.id) return { ...f, order: aOrder };
        return f;
      }),
    );
  };

  const openAdd = () => {
    setFormMode("add");
    setEditingId(null);
    setQuestionDraft("");
    setAnswerDraft("");
    setFormOpen(true);
  };

  const openEdit = (faq: FaqEntry) => {
    setFormMode("edit");
    setEditingId(faq.id);
    setQuestionDraft(faq.question);
    setAnswerDraft(faq.answer);
    setFormOpen(true);
  };

  const submitForm = () => {
    if (!questionDraft.trim() || !answerDraft.trim()) return;

    if (formMode === "add") {
      const nextOrder = faqs.length > 0 ? Math.max(...faqs.map((f) => f.order)) + 1 : 1;
      setFaqs((prev) => [
        ...prev,
        { id: `faq-${Date.now()}`, order: nextOrder, question: questionDraft.trim(), answer: answerDraft.trim() },
      ]);
    } else if (editingId) {
      setFaqs((prev) =>
        prev.map((f) =>
          f.id === editingId ? { ...f, question: questionDraft.trim(), answer: answerDraft.trim() } : f,
        ),
      );
    }
    setFormOpen(false);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    setFaqs((prev) => prev.filter((f) => f.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  const updateBannerField = (id: string, field: "title" | "subtitle", value: string) => {
    setBanners((prev) => prev.map((b) => (b.id === id ? { ...b, [field]: value } : b)));
  };

  // 브라우저 메모리에만 잠깐 띄우는 미리보기 URL이라, 새 파일을 고르거나 제거할 때
  // 이전 URL을 반드시 해제해야 한다(안 하면 탭을 오래 켜둘수록 메모리에 계속 쌓인다).
  const selectBannerImage = (key: string, file: File) => {
    setImagePreviews((prev) => {
      const old = prev[key];
      if (old) URL.revokeObjectURL(old.url);
      return { ...prev, [key]: { url: URL.createObjectURL(file), fileName: file.name } };
    });
  };

  const clearBannerImage = (key: string) => {
    setImagePreviews((prev) => {
      const old = prev[key];
      if (old) URL.revokeObjectURL(old.url);
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  // 배너·서비스 소개는 실제로는 서로 다른 콘텐츠(다른 화면·다른 API 대상)라 저장 버튼도
  // 섹션별로 나눴다 — 버튼 하나로 전체를 저장하면 "이 버튼이 정확히 뭘 저장하는지" 헷갈릴
  // 수 있어서다. 탭을 넘나들며 배너 여러 개를 고쳐도 banners는 하나의 배열 상태라 "배너
  // 저장" 한 번으로 3개 다 반영된다.
  const handleSaveBanners = () => {
    // TODO: 실제 연동 시 PUT /api/admin/content/banners 호출로 교체하고, 이미지도 함께
    // 업로드한다. 첨부 이미지는 미리보기 전용이라 지금은 저장 대상이 아니다.
    setBannerToastOpen(true);
  };

  const handleSaveIntro = () => {
    // TODO: 실제 연동 시 PUT /api/admin/content/intro 호출로 교체한다.
    setIntroToastOpen(true);
  };

  return (
    <main className="mx-auto max-w-2xl p-6">
      <Stack direction="column" gap="sm">
        <NextLink href="/more" className="text-sm text-muted hover:underline">
          ← 더보기로
        </NextLink>
        <Stack justify="between" align="center">
          <Title size="md">FAQ · 콘텐츠 관리</Title>
          <Button size="sm" variant="subtle" onClick={openAdd}>
            + FAQ
          </Button>
        </Stack>
      </Stack>

      <Stack direction="column" gap="lg" className="mt-4">
        <Stack direction="column" gap="sm">
          <Text weight="bold" leaf>
            FAQ
          </Text>
          <Stack direction="column" gap="sm">
            {sortedFaqs.map((faq, i) => (
              <Card key={faq.id} padding="sm" onClick={() => openEdit(faq)}>
                <Stack justify="between" align="center">
                  <Stack direction="column" gap="xs">
                    <Text weight="bold">
                      {i + 1}. {faq.question}
                    </Text>
                    <Text variant="sub">{faq.answer}</Text>
                  </Stack>

                  <IconX
                    aria-label={`${faq.question} 삭제`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteTarget(faq);
                    }}
                  />
                </Stack>
              </Card>
            ))}

            {sortedFaqs.length === 0 && <Text variant="sub">등록된 FAQ가 없습니다.</Text>}
          </Stack>
          <Text variant="sub">
            FAQ는 분류·검색 없이 위 순서 그대로 고객앱에 노출됩니다. 항목을 눌러 순서를 바꿀 수 있어요.
          </Text>
        </Stack>

        <Stack direction="column" gap="sm">
          <Text weight="bold" leaf>
            랜딩 히어로 배너 (3개)
          </Text>
          <Text variant="sub">
            고객앱 홈 화면 상단에서 자동으로 넘어가는 배너예요. 배너마다 PC용·모바일용 이미지가 따로 필요합니다.
          </Text>

          <Tab
            variant="segment"
            items={banners.map((b, i) => ({ key: b.id, label: `배너 ${i + 1}` }))}
            activeKey={activeBannerId}
            onChange={setActiveBannerId}
          />

          {activeBanner && (
            <Card padding="sm">
              <Stack direction="column" gap="sm">
                <LabeledBox label="제목" emphasis>
                  <Input
                    as="textarea"
                    rows={2}
                    value={activeBanner.title}
                    onChange={(e) => updateBannerField(activeBanner.id, "title", e.target.value)}
                  />
                </LabeledBox>

                <LabeledBox label="부제 (선택 입력)" emphasis>
                  <Input
                    as="textarea"
                    rows={2}
                    value={activeBanner.subtitle ?? ""}
                    onChange={(e) => updateBannerField(activeBanner.id, "subtitle", e.target.value)}
                  />
                </LabeledBox>

                <ImageAttachField
                  id={`banner-${activeBanner.id}-pc`}
                  label="PC 이미지"
                  currentPath={activeBanner.pcImage}
                  preview={imagePreviews[`${activeBanner.id}:pc`] ?? null}
                  onSelect={(file) => selectBannerImage(`${activeBanner.id}:pc`, file)}
                  onClear={() => clearBannerImage(`${activeBanner.id}:pc`)}
                />

                <ImageAttachField
                  id={`banner-${activeBanner.id}-mobile`}
                  label="모바일 이미지"
                  currentPath={activeBanner.mobileImage}
                  preview={imagePreviews[`${activeBanner.id}:mobile`] ?? null}
                  onSelect={(file) => selectBannerImage(`${activeBanner.id}:mobile`, file)}
                  onClear={() => clearBannerImage(`${activeBanner.id}:mobile`)}
                />
              </Stack>
            </Card>
          )}

          <Button fullWidth onClick={handleSaveBanners}>
            배너 저장
          </Button>
        </Stack>

        <Stack direction="column" gap="sm">
          <Text weight="bold" leaf>
            서비스 소개 본문
          </Text>
          <LabeledBox label="본문" emphasis>
            <Input as="textarea" rows={6} value={introBody} onChange={(e) => setIntroBody(e.target.value)} />
          </LabeledBox>

          <Button fullWidth onClick={handleSaveIntro}>
            본문 저장
          </Button>
        </Stack>
      </Stack>

      <Popup open={formOpen} onClose={() => setFormOpen(false)} title={formMode === "add" ? "FAQ 등록" : "FAQ 수정"}>
        <Stack direction="column" gap="md">
          <LabeledBox label="질문" required>
            <Input value={questionDraft} onChange={(e) => setQuestionDraft(e.target.value)} />
          </LabeledBox>
          <LabeledBox label="답변" required>
            <Input as="textarea" rows={4} value={answerDraft} onChange={(e) => setAnswerDraft(e.target.value)} />
          </LabeledBox>

          {/* 수정 모드에서만 노출 순서를 바꿀 수 있다 — 새로 등록하는 항목은 아직 목록에
              없어서 "위/아래로"의 기준이 될 위치가 없다(등록되면 맨 뒤에 붙는다). */}
          {formMode === "edit" && editingId && (
            <LabeledBox label="노출 순서">
              <Stack justify="between" align="center">
                <Text variant="sub">
                  현재 {sortedFaqs.findIndex((f) => f.id === editingId) + 1}번째 · 총 {sortedFaqs.length}개
                </Text>
                <Stack gap="xs">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={sortedFaqs.findIndex((f) => f.id === editingId) === 0}
                    onClick={() => move(editingId, -1)}
                  >
                    ▲ 위로
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={sortedFaqs.findIndex((f) => f.id === editingId) === sortedFaqs.length - 1}
                    onClick={() => move(editingId, 1)}
                  >
                    ▼ 아래로
                  </Button>
                </Stack>
              </Stack>
            </LabeledBox>
          )}

          <Button fullWidth disabled={!questionDraft.trim() || !answerDraft.trim()} onClick={submitForm}>
            {formMode === "add" ? "등록" : "수정 완료"}
          </Button>
        </Stack>
      </Popup>

      <ConfirmPopup
        open={Boolean(deleteTarget)}
        message={`'${deleteTarget?.question}' FAQ를 삭제합니다. 이 작업은 되돌릴 수 없습니다.`}
        onConfirm={confirmDelete}
        onClose={() => setDeleteTarget(null)}
      />

      <Toast open={bannerToastOpen} onClose={() => setBannerToastOpen(false)} message="배너가 저장되었습니다" />
      <Toast open={introToastOpen} onClose={() => setIntroToastOpen(false)} message="본문이 저장되었습니다" />
    </main>
  );
}
