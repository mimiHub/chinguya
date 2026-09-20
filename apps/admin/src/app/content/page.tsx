"use client";

import { useEffect, useState } from "react";
import NextLink from "next/link";
import { Title, Text, EmptyState, Card, Tab, Stack, Button, Input, IconX, Popup, ConfirmPopup, LabeledBox, Alert, Tooltip, Toast } from "@chinguya/ui";
import type { ToastStatus } from "@chinguya/ui";
import {
  createApiClient,
  ApiError,
  DEFAULT_API_BASE_URL,
  type AdminFaq,
  type HeroBanner,
} from "@chinguya/api-client";
import { useAdminAuth } from "@/context/AdminAuthContext";

const api = createApiClient();

/** 서버 한도(10MB)와 같다. 넘는 파일은 올리기 전에 막는다 — 서버가 큰 본문을 끊으면 오류 문구도 못 받는다. */
const IMAGE_MAX_BYTES = 10 * 1024 * 1024;

type FormMode = "add" | "edit";

interface ImagePreview {
  url: string;
  fileName: string;
  file: File;
}

function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) return err.message;
  return fallback;
}

/**
 * 관리자가 올린 이미지(`/content/images/…`)만 Core 프록시로 미리 볼 수 있다. 초기값은 고객·여행사
 * 앱의 정적 파일이라 관리자 앱에는 없어서 경로만 보여준다.
 */
function uploadedImageSrc(url: string): string | null {
  return url.startsWith("/content/images/") ? `${DEFAULT_API_BASE_URL}${url}` : null;
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
  disabled,
  onSelect,
  onClear,
}: {
  id: string;
  label: string;
  currentPath: string;
  preview: ImagePreview | null;
  disabled: boolean;
  onSelect: (file: File) => void;
  onClear: () => void;
}) {
  const currentSrc = uploadedImageSrc(currentPath);

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
        <Stack direction="column" gap="sm">
          {currentSrc && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={currentSrc} alt="" className="h-28 w-full rounded-md object-cover" />
          )}
          {!disabled && (
            <Stack gap="sm" align="center">
              <input
                id={id}
                type="file"
                accept="image/png,image/jpeg,image/webp"
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
        </Stack>
      )}
    </LabeledBox>
  );
}

/**
 * 배너 사이즈 권장값 안내. 기본은 사이즈 숫자까지만 보여주고, 우측 상단 +/- 버튼으로 왜 이
 * 비율이어야 하는지(자르는 기준) 설명을 펼치고 접는다 — 미미님이 사이즈 설명을 더 길게
 * 고쳐 넣으면서 한 화면에 다 펼쳐두면 모바일에서 너무 길어져 요청받은 대로 바꿨다. 배너
 * 3개 모두에 공통으로 적용되는 안내라 배너 섹션 맨 위에 한 번만 둔다(탭마다 반복 안 함).
 */
function BannerSizeGuide() {
  const [expanded, setExpanded] = useState(false);

  return (
    <Alert status="info" icon={false}>
      <div className="flex items-start justify-between gap-2">
        <p>
          [권장 사이즈] <br />
          PC: 1920 × 1080px(16:9) <br />
          모바일: 1080 × 1920px(9:16)
        </p>
        <Tooltip label={expanded ? "접기" : "더보기"}>
          <button
            type="button"
            aria-expanded={expanded}
            aria-label={expanded ? "접기" : "더보기"}
            onClick={() => setExpanded((v) => !v)}
            className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-sm font-bold leading-none hover:bg-current/10"
          >
            {expanded ? "−" : "+"}
          </button>
        </Tooltip>
      </div>
      {expanded && (
        <p>
          화면을 꽉 채우도록 잘라서 보여주는 방식이라(가운데/위쪽 기준으로 자름), 이 비율과 다르면 중요한 부분이
          잘릴 수 있어요. PC는 가운데, 모바일은 위쪽을 기준으로 잘리니 핵심 요소는 그 쪽에 배치해 주세요.
        </p>
      )}
    </Alert>
  );
}

/**
 * S4-A1/A3 FAQ · 콘텐츠 관리(CMS-lite, a-cms). 세 구역으로 나뉜다:
 *  1) FAQ 등록/수정/삭제·노출 순서 관리 — 분류·검색 없음(기획서 명시)
 *  2) 랜딩(안 A) 히어로 배너 편집 — 배너 3장, 배너마다 PC/모바일 이미지가 따로 필요하다
 *  3) 서비스 소개(S4-C2) 본문 편집
 *
 * Core API에 실연동돼 있다(GET·POST·PUT·DELETE /admin/faqs, /admin/content/*) — 계약은
 * packages/api-spec/openapi/chinguya-admin-api.yaml. 다만 고객앱 FAQ·홈 배너·서비스 소개와
 * 여행사 로그인 배경은 아직 이 API를 읽지 않아서, 여기서 저장해도 그 화면들엔 아직 반영되지
 * 않는다(api-spec 헤더 TODO 11).
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
 *
 * 이미지 첨부: 파일을 고르면 브라우저 메모리에서 미리보기만 하고, "배너 저장"을 누를 때 올린
 * 뒤 받은 주소로 배너를 저장한다 — 고르기만 하고 떠나면 서버에 파일이 남지 않게 하려는 것이다.
 */
export default function AdminContentPage() {
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

  const [banners, setBanners] = useState<HeroBanner[]>([]);
  // 배너 3장을 한 화면에 다 펼치면 스크롤이 너무 길어져서, 탭으로 하나씩만 보여준다.
  const [activeBannerSlot, setActiveBannerSlot] = useState(1);
  const activeBanner = banners.find((b) => b.slot === activeBannerSlot) ?? null;
  // 키 형식: "<slot>:pc" | "<slot>:mobile" — 배너 3개 × 2장이라 배열보다 맵이 다루기 쉽다.
  const [imagePreviews, setImagePreviews] = useState<Record<string, ImagePreview>>({});
  const [bannerSaving, setBannerSaving] = useState(false);

  const [introBody, setIntroBody] = useState("");
  const [introSaving, setIntroSaving] = useState(false);

  // FAQ 삭제·순서변경·등록/수정 실패, 배너/소개글 저장 성공·실패를 전부 같은 Toast로
  // 보여준다 — 예전엔 formError를 FAQ 팝업 안에서만 그려서, 팝업이 닫혀 있을 때 일어나는
  // 순서변경(move) 실패가 화면 어디에도 안 보이는 버그가 있었다. Toast는 팝업 열림과
  // 무관하게 항상 화면 위에 뜨므로 그 문제도 같이 해결된다.
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastStatus, setToastStatus] = useState<ToastStatus>("info");
  const showToast = (message: string, status: ToastStatus) => {
    setToastMessage(message);
    setToastStatus(status);
  };

  useEffect(() => {
    Promise.all([api.faqs.list(), api.content.banners(), api.content.intro()])
      .then(([faqList, bannerList, intro]) => {
        setFaqs(faqList);
        setBanners(bannerList);
        setActiveBannerSlot(bannerList[0]?.slot ?? 1);
        setIntroBody(intro.body);
        setLoaded(true);
      })
      .catch((err) => setLoadError(errorMessage(err, "콘텐츠를 불러오지 못했습니다.")));
  }, []);

  const editingIndex = faqs.findIndex((f) => f.faqId === editingId);

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

  const updateBannerField = (slot: number, field: "title" | "subtitle", value: string) => {
    setBanners((prev) => prev.map((b) => (b.slot === slot ? { ...b, [field]: value } : b)));
  };

  // 브라우저 메모리에만 잠깐 띄우는 미리보기 URL이라, 새 파일을 고르거나 제거할 때
  // 이전 URL을 반드시 해제해야 한다(안 하면 탭을 오래 켜둘수록 메모리에 계속 쌓인다).
  const selectBannerImage = (key: string, file: File) => {
    if (file.size > IMAGE_MAX_BYTES) {
      showToast("이미지는 10MB까지 올릴 수 있습니다.", "error");
      return;
    }
    setImagePreviews((prev) => {
      const old = prev[key];
      if (old) URL.revokeObjectURL(old.url);
      return { ...prev, [key]: { url: URL.createObjectURL(file), fileName: file.name, file } };
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
  const handleSaveBanners = async () => {
    const untitled = banners.find((b) => !b.title.trim());
    if (untitled) {
      showToast(`배너 ${untitled.slot}의 제목을 입력해 주세요.`, "error");
      return;
    }

    setBannerSaving(true);
    try {
      const uploadIfSelected = async (key: string, currentUrl: string) => {
        const preview = imagePreviews[key];
        return preview ? (await api.content.uploadImage(preview.file)).imageUrl : currentUrl;
      };
      const next = await Promise.all(
        banners.map(async (b) => ({
          ...b,
          pcImageUrl: await uploadIfSelected(`${b.slot}:pc`, b.pcImageUrl),
          mobileImageUrl: await uploadIfSelected(`${b.slot}:mobile`, b.mobileImageUrl),
        })),
      );
      setBanners(await api.content.updateBanners(next));
      Object.values(imagePreviews).forEach((p) => URL.revokeObjectURL(p.url));
      setImagePreviews({});
      showToast("배너가 저장되었습니다", "success");
    } catch (err) {
      showToast(errorMessage(err, "배너를 저장하지 못했습니다."), "error");
    } finally {
      setBannerSaving(false);
    }
  };

  const handleSaveIntro = async () => {
    if (!introBody.trim()) {
      showToast("본문을 입력해 주세요.", "error");
      return;
    }

    setIntroSaving(true);
    try {
      const saved = await api.content.updateIntro(introBody);
      setIntroBody(saved.body);
      showToast("본문이 저장되었습니다", "success");
    } catch (err) {
      showToast(errorMessage(err, "본문을 저장하지 못했습니다."), "error");
    } finally {
      setIntroSaving(false);
    }
  };

  return (
    <main className="mx-auto max-w-2xl p-6">
      <Stack direction="column" gap="sm">
        <NextLink href="/more" className="text-sm text-muted hover:underline">
          ← 더보기로
        </NextLink>
        <Stack justify="between" align="center">
          <Title size="md">FAQ · 콘텐츠 관리</Title>
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
        <Stack direction="column" gap="lg" className="mt-4">
          <Stack direction="column" gap="sm">
            <Text weight="bold" leaf>
              FAQ
            </Text>
            <Stack direction="column" gap="sm">
              {faqs.map((faq, i) => (
                <Card key={faq.faqId} padding="sm" onClick={isSuperAdmin ? () => openEdit(faq) : undefined}>
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

              {faqs.length === 0 && <EmptyState variant="card">등록된 FAQ가 없습니다.</EmptyState>}
            </Stack>
            <Text variant="sub">
              FAQ는 분류·검색 없이 위 순서 그대로 고객앱에 노출됩니다.
              {isSuperAdmin && " 항목을 눌러 순서를 바꿀 수 있어요."}
            </Text>
          </Stack>

          <Stack direction="column" gap="sm">
            <Text weight="bold" leaf>
              랜딩 히어로 배너 (3개)
            </Text>
            <Text variant="sub">
              고객앱 홈 화면 상단에서 자동으로 넘어가는 배너예요. 배너마다 PC용·모바일용 이미지가 따로 필요합니다.
            </Text>
            <BannerSizeGuide />

            <Tab
              variant="segment"
              items={banners.map((b) => ({ key: String(b.slot), label: `배너 ${b.slot}` }))}
              activeKey={String(activeBannerSlot)}
              onChange={(key) => setActiveBannerSlot(Number(key))}
            />

            {activeBanner && (
              <Card padding="sm">
                <Stack direction="column" gap="sm">
                  <LabeledBox label="제목" emphasis>
                    <Input
                      as="textarea"
                      rows={2}
                      value={activeBanner.title}
                      disabled={!isSuperAdmin}
                      onChange={(e) => updateBannerField(activeBanner.slot, "title", e.target.value)}
                    />
                  </LabeledBox>

                  <LabeledBox label="부제 (선택 입력)" emphasis>
                    <Input
                      as="textarea"
                      rows={2}
                      value={activeBanner.subtitle ?? ""}
                      disabled={!isSuperAdmin}
                      onChange={(e) => updateBannerField(activeBanner.slot, "subtitle", e.target.value)}
                    />
                  </LabeledBox>

                  <ImageAttachField
                    id={`banner-${activeBanner.slot}-pc`}
                    label="PC 이미지"
                    currentPath={activeBanner.pcImageUrl}
                    preview={imagePreviews[`${activeBanner.slot}:pc`] ?? null}
                    disabled={!isSuperAdmin}
                    onSelect={(file) => selectBannerImage(`${activeBanner.slot}:pc`, file)}
                    onClear={() => clearBannerImage(`${activeBanner.slot}:pc`)}
                  />

                  <ImageAttachField
                    id={`banner-${activeBanner.slot}-mobile`}
                    label="모바일 이미지"
                    currentPath={activeBanner.mobileImageUrl}
                    preview={imagePreviews[`${activeBanner.slot}:mobile`] ?? null}
                    disabled={!isSuperAdmin}
                    onSelect={(file) => selectBannerImage(`${activeBanner.slot}:mobile`, file)}
                    onClear={() => clearBannerImage(`${activeBanner.slot}:mobile`)}
                  />
                </Stack>
              </Card>
            )}


            {isSuperAdmin && (
              <Button fullWidth disabled={bannerSaving} onClick={() => void handleSaveBanners()}>
                {bannerSaving ? "저장 중…" : "배너 저장"}
              </Button>
            )}
          </Stack>

          <Stack direction="column" gap="sm">
            <Text weight="bold" leaf>
              서비스 소개 본문
            </Text>
            <LabeledBox label="본문" emphasis>
              <Input
                as="textarea"
                rows={6}
                value={introBody}
                disabled={!isSuperAdmin}
                onChange={(e) => setIntroBody(e.target.value)}
              />
            </LabeledBox>


            {isSuperAdmin && (
              <Button fullWidth disabled={introSaving} onClick={() => void handleSaveIntro()}>
                {introSaving ? "저장 중…" : "본문 저장"}
              </Button>
            )}
          </Stack>
        </Stack>
      )}

      <Popup open={formOpen} onClose={() => setFormOpen(false)} title={formMode === "add" ? "FAQ 등록" : "FAQ 수정"}>
        <Stack direction="column" gap="md">
          <LabeledBox label="질문" required>
            <Input value={questionDraft} maxLength={200} onChange={(e) => setQuestionDraft(e.target.value)} />
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

      <Toast open={!!toastMessage} onClose={() => setToastMessage(null)} message={toastMessage ?? ""} status={toastStatus} />
    </main>
  );
}
