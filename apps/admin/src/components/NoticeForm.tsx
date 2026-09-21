"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import {
  Title,
  Text,
  Stack,
  Chip,
  Button,
  Input,
  LabeledBox,
  Toggle,
  Alert,
  ConfirmPopup,
  Toast,
  IconX,
  type ToastStatus,
} from "@chinguya/ui";
import { NOTICE_CATEGORY_LABEL } from "@chinguya/types";
import { createApiClient, ApiError, type NoticeCategory, type NoticeInput } from "@chinguya/api-client";

const api = createApiClient();

/** 와이어프레임 a-noticeedit 의 '최대 5장'. 서버도 같은 값으로 막는다(400). */
const MAX_IMAGES = 5;

const CATEGORIES: NoticeCategory[] = ["NOTICE", "EVENT"];

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback;
}

/**
 * 공지사항·이벤트 글 작성/수정(`a-noticeedit`, S4-A4-M1). 등록·수정 두 라우트가 같이 쓴다.
 *
 * **본문 이미지는 마크다운 표기로 넣는다.** '이미지 올려 본문에 넣기'를 누르면 파일을 올려
 * 주소를 받고, `![설명](주소)` 를 **커서 위치에** 끼워 넣는다. 이 표기 외의 마크다운 문법은
 * 고객 화면에서도 글자 그대로 보인다 — 전용 에디터나 마크다운 렌더러를 붙이지 않고 "글 중간
 * 이미지"만 만족시키는 최소 범위다(2026-09-21 결정).
 *
 * 업로드는 콘텐츠 이미지 엔드포인트(S4-A3 배너와 같은 저장소)를 그대로 쓴다. 공지 API 는
 * 그렇게 받은 주소만 저장한다.
 *
 * **이벤트 기간은 카테고리가 이벤트일 때만** 보인다. 공지사항으로 바꾸면 입력칸이 사라지고
 * 값도 비운다 — 남겨 두면 서버가 400 으로 막는다(공지사항에는 기간이 없다).
 *
 * 작성일은 서버가 정한다(입력칸이 없다). 수정해도 작성일은 바뀌지 않는다.
 */
export function NoticeForm({ noticeId }: { noticeId?: string }) {
  const router = useRouter();
  const isEdit = Boolean(noticeId);

  const [category, setCategory] = useState<NoticeCategory>("NOTICE");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [published, setPublished] = useState(true);
  const [pinned, setPinned] = useState(false);
  const [eventStartDate, setEventStartDate] = useState("");
  const [eventEndDate, setEventEndDate] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  const [loaded, setLoaded] = useState(!isEdit);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  /**
   * 본문 입력칸의 커서 위치. Input 컴포넌트는 ref 를 넘기지 않으므로(forwardRef 아님)
   * onSelect 로 받아 기억해 둔다 — 이미지 표기를 그 자리에 끼워 넣으려면 위치가 필요하다.
   */
  const [cursorAt, setCursorAt] = useState<number | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastStatus, setToastStatus] = useState<ToastStatus>("success");

  const bodyImageInputRef = useRef<HTMLInputElement>(null);
  const attachInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!noticeId) return;
    let active = true;
    api.notices
      .detail(noticeId)
      .then((detail) => {
        if (!active) return;
        setCategory(detail.category);
        setTitle(detail.title);
        setContent(detail.content);
        setPublished(detail.published);
        setPinned(detail.pinned);
        setEventStartDate(detail.eventStartDate ?? "");
        setEventEndDate(detail.eventEndDate ?? "");
        setImageUrls(detail.imageUrls);
        setLoaded(true);
      })
      .catch((err: unknown) => {
        if (active) setLoadError(errorMessage(err, "글을 불러오지 못했습니다."));
      });
    return () => {
      active = false;
    };
  }, [noticeId]);

  /** 카테고리를 공지사항으로 바꾸면 기간을 비운다 — 남겨 두면 서버가 400 으로 막는다. */
  const changeCategory = (next: NoticeCategory) => {
    setCategory(next);
    if (next === "NOTICE") {
      setEventStartDate("");
      setEventEndDate("");
    }
  };

  /** 올린 이미지 주소를 본문의 커서 위치에 `![설명](주소)` 로 끼워 넣는다. */
  const insertBodyImage = useCallback(async (file: File) => {
    setUploading(true);
    setFormError(null);
    try {
      const { imageUrl } = await api.content.uploadImage(file);
      const notation = `![${file.name}](${imageUrl})`;
      // 커서 위치를 모르면(입력칸을 아직 안 눌렀으면) 맨 뒤에 붙인다.
      setContent((prev) => {
        const at = cursorAt ?? prev.length;
        return `${prev.slice(0, at)}${notation}${prev.slice(at)}`;
      });
      setToastStatus("success");
      setToastMessage("본문에 이미지를 넣었습니다");
    } catch (err) {
      setToastStatus("error");
      setToastMessage(errorMessage(err, "이미지를 올리지 못했습니다."));
    } finally {
      setUploading(false);
    }
  }, [cursorAt]);

  const addAttachment = useCallback(
    async (file: File) => {
      if (imageUrls.length >= MAX_IMAGES) {
        setFormError(`첨부 이미지는 ${MAX_IMAGES}장까지 넣을 수 있습니다.`);
        return;
      }
      setUploading(true);
      setFormError(null);
      try {
        const { imageUrl } = await api.content.uploadImage(file);
        setImageUrls((prev) => [...prev, imageUrl]);
      } catch (err) {
        setToastStatus("error");
        setToastMessage(errorMessage(err, "이미지를 올리지 못했습니다."));
      } finally {
        setUploading(false);
      }
    },
    [imageUrls.length],
  );

  const handleSave = async () => {
    setSubmitting(true);
    setFormError(null);
    const body: NoticeInput = {
      category,
      title,
      content,
      published,
      pinned,
      // 공지사항이면 서버가 값이 있는 걸 거부하므로 아예 보내지 않는다.
      eventStartDate: category === "EVENT" && eventStartDate ? eventStartDate : null,
      eventEndDate: category === "EVENT" && eventEndDate ? eventEndDate : null,
      imageUrls,
    };
    try {
      if (noticeId) {
        await api.notices.update(noticeId, body);
      } else {
        await api.notices.create(body);
      }
      router.push("/notices");
    } catch (err) {
      // 서버가 어느 칸이 틀렸는지 메시지로 알려준다(VALIDATION_ERROR).
      setFormError(errorMessage(err, "저장하지 못했습니다."));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setDeleteOpen(false);
    setSubmitting(true);
    try {
      await api.notices.remove(noticeId!);
      router.push("/notices");
    } catch (err) {
      setToastStatus("error");
      setToastMessage(errorMessage(err, "삭제하지 못했습니다."));
      setSubmitting(false);
    }
  };

  if (loadError) {
    return (
      <main className="mx-auto max-w-2xl p-6">
        <NextLink href="/notices" className="text-sm text-muted hover:underline">
          ← 공지 · 이벤트로
        </NextLink>
        <Alert status="error" icon={true} className="mt-4">
          {loadError}
        </Alert>
      </main>
    );
  }

  if (!loaded) {
    return (
      <main className="mx-auto max-w-2xl p-6">
        <Text variant="sub">불러오는 중…</Text>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl p-6">
      <Stack direction="column" gap="sm">
        <NextLink href="/notices" className="text-sm text-muted hover:underline">
          ← 공지 · 이벤트로
        </NextLink>
        <Stack justify="between" align="center">
          <Title size="md">{isEdit ? "글 수정" : "글 등록"}</Title>
          {isEdit && (
            <Button variant="danger" size="sm" disabled={submitting} onClick={() => setDeleteOpen(true)}>
              삭제
            </Button>
          )}
        </Stack>
      </Stack>

      <Stack direction="column" gap="md" className="mt-4">
        <LabeledBox label="카테고리" required>
          <Chip.List>
            {CATEGORIES.map((key) => (
              <Chip key={key} on={key === category} onClick={() => changeCategory(key)}>
                {NOTICE_CATEGORY_LABEL[key]}
              </Chip>
            ))}
          </Chip.List>
        </LabeledBox>

        <LabeledBox label="제목" required>
          <Input value={title} maxLength={100} onChange={(e) => setTitle(e.target.value)} />
        </LabeledBox>

        {/* 기간은 이벤트에만 있다. 공지사항으로 바꾸면 이 블록이 사라지고 값도 비워진다. */}
        {category === "EVENT" && (
          <LabeledBox label="이벤트 기간" helper="비우면 상시로 봅니다. 넣을 때는 시작일이 종료일보다 앞서야 합니다.">
            <Stack gap="sm" align="center">
              <Input type="date" value={eventStartDate} onChange={(e) => setEventStartDate(e.target.value)} />
              <Text variant="sub">~</Text>
              <Input type="date" value={eventEndDate} onChange={(e) => setEventEndDate(e.target.value)} />
            </Stack>
          </LabeledBox>
        )}

        <LabeledBox
          label="본문"
          required
          helper="이미지는 아래 버튼으로 넣습니다. 굵게·목록 같은 다른 마크다운 문법은 고객 화면에서 글자 그대로 보입니다."
        >
          <Input
            as="textarea"
            rows={10}
            value={content}
            maxLength={4000}
            onChange={(e) => setContent(e.target.value)}
            onSelect={(e) => setCursorAt(e.currentTarget.selectionStart)}
          />
        </LabeledBox>

        <div>
          <Button
            variant="subtle"
            size="sm"
            disabled={uploading}
            onClick={() => bodyImageInputRef.current?.click()}
          >
            {uploading ? "올리는 중…" : "이미지 올려 본문에 넣기"}
          </Button>
          <input
            ref={bodyImageInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              // 같은 파일을 다시 골라도 change가 나게 값을 비운다.
              e.target.value = "";
              if (file) void insertBodyImage(file);
            }}
          />
        </div>

        <LabeledBox label={`첨부 이미지 (최대 ${MAX_IMAGES}장)`}>
          <Stack direction="column" gap="sm">
            {imageUrls.map((url, index) => (
              <Stack key={url} justify="between" align="center">
                {/* 올린 그림을 바로 확인할 수 있게 작은 미리보기를 둔다. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/api/core${url}`} alt="" className="h-12 w-16 rounded object-cover" />
                <Text variant="sub" className="min-w-0 flex-1 truncate">
                  {url}
                </Text>
                <Button
                  variant="subtle"
                  size="sm"
                  onClick={() => setImageUrls((prev) => prev.filter((_, i) => i !== index))}
                >
                  <IconX className="h-4 w-4" />
                </Button>
              </Stack>
            ))}
            {imageUrls.length < MAX_IMAGES && (
              <Button variant="subtle" size="sm" disabled={uploading} onClick={() => attachInputRef.current?.click()}>
                파일 선택
              </Button>
            )}
            <input
              ref={attachInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (file) void addAttachment(file);
              }}
            />
          </Stack>
        </LabeledBox>

        <Toggle on={published} label="공개" onChange={setPublished} />
        <Toggle on={pinned} label="상단 고정" onChange={setPinned} />

        {formError && (
          <Alert status="error" icon={true}>
            {formError}
          </Alert>
        )}

        <Button fullWidth disabled={submitting} onClick={() => void handleSave()}>
          {submitting ? "저장 중…" : "저장"}
        </Button>
      </Stack>

      <ConfirmPopup
        open={deleteOpen}
        title="정말 삭제하시겠습니까?"
        message="완전히 삭제되며 되돌릴 수 없습니다. 잠시 내리려면 삭제가 아니라 공개 토글을 끄세요."
        confirmLabel="삭제"
        danger={true}
        onConfirm={() => void handleDelete()}
        onClose={() => setDeleteOpen(false)}
      />
      <Toast
        open={!!toastMessage}
        status={toastStatus}
        onClose={() => setToastMessage(null)}
        message={toastMessage ?? ""}
      />
    </main>
  );
}
