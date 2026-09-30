"use client";

import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import NextLink from "next/link";
import {
  Title,
  Text,
  Card,
  Tab,
  Stack,
  Button,
  Input,
  LabeledBox,
  Alert,
  Tooltip,
  HelpTooltip,
  Toast,
  Toggle,
} from "@chinguya/ui";
import type { ToastStatus } from "@chinguya/ui";
import { ASSET_CATEGORY_LABEL } from "@chinguya/types";
import {
  createApiClient,
  ApiError,
  DEFAULT_API_BASE_URL,
  type HeroBanner,
  type ProductBanner,
} from "@chinguya/api-client";
import { useAdminAuth } from "@/context/AdminAuthContext";

const api = createApiClient();

/** 서버 한도(10MB)와 같다. 넘는 파일은 올리기 전에 막는다 — 서버가 큰 본문을 끊으면 오류 문구도 못 받는다. */
const IMAGE_MAX_BYTES = 10 * 1024 * 1024;

type PreviewMap = Record<string, ImagePreview>;

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
          화면을 꽉 채우도록 잘라서 보여주는 방식이라(가운데/위쪽 기준으로 자름), 이 비율과 다르면
          중요한 부분이 잘릴 수 있어요. PC는 가운데, 모바일은 위쪽을 기준으로 잘리니 핵심 요소는 그
          쪽에 배치해 주세요.
        </p>
      )}
    </Alert>
  );
}

/**
 * 서비스 소개(S4-C2) 본문 편집 구역을 화면에 띄울지.
 *
 * **2026-09-21 결정: S4-C2 는 관리자 페이지에서 관리하지 않는다.** 그래서 이 구역을 숨긴다.
 * 고객 화면의 소개 문구·이미지는 그 화면이 직접 들고 있고, 바꿀 일이 생기면 배포로 바꾼다.
 *
 * 지우지 않고 플래그로 둔 것은 되돌릴 수 있게 하려는 것이다 — 서버의 소개글 API
 * (`GET·PUT /admin/content/intro`)와 저장 로직은 그대로 살아 있으므로, 다시 관리하기로
 * 정해지면 이 값만 true 로 바꾸면 된다.
 */
const SHOW_INTRO_SECTION: boolean = false;

/**
 * S4-A3 랜딩 배너 관리(CMS-lite) — 랜딩(안 A) 히어로 배너 편집. 배너 3장, 배너마다 PC/모바일
 * 이미지가 따로 필요하다. 장마다 노출 스위치로 끌 수 있다(숨김일 뿐 값은 남는다, 최소 1장은
 * 켜 둬야 함 — 2026-09-23). FAQ 관리(S4-A1)는 /faq 로 분리했다.
 *
 * 그 아래 '상품 배너'는 고객 홈 Rental 카드(자전거·낚싯대)의 대표 이미지다 — 카테고리마다 한 장,
 * 저장 버튼도 따로다.
 *
 * 서비스 소개(S4-C2) 본문 편집 구역도 있었지만 지금은 숨겨져 있다({@link SHOW_INTRO_SECTION}).
 *
 * Core API에 실연동돼 있다(/admin/content/*) — 계약은
 * packages/api-spec/openapi/chinguya-admin-api.yaml.
 *
 * 쓰기는 슈퍼어드민만 가능하다. 일반 관리자에게 입력칸을 잠그고 버튼을 숨기는 것은 서버
 * 403과 정합을 맞추는 것일 뿐 보안 경계가 아니다(경계는 SecurityConfig).
 *
 * 이미지 첨부: 파일을 고르면 브라우저 메모리에서 미리보기만 하고, "배너 저장"을 누를 때 올린
 * 뒤 받은 주소로 배너를 저장한다 — 고르기만 하고 떠나면 서버에 파일이 남지 않게 하려는 것이다.
 */
export default function AdminLandingPage() {
  const { isSuperAdmin } = useAdminAuth();

  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [banners, setBanners] = useState<HeroBanner[]>([]);
  // 배너 3장을 한 화면에 다 펼치면 스크롤이 너무 길어져서, 탭으로 하나씩만 보여준다.
  const [activeBannerSlot, setActiveBannerSlot] = useState(1);
  const activeBanner = banners.find((b) => b.slot === activeBannerSlot) ?? null;
  // 키 형식: "<slot>:pc" | "<slot>:mobile" — 배너 3개 × 2장이라 배열보다 맵이 다루기 쉽다.
  const [imagePreviews, setImagePreviews] = useState<PreviewMap>({});
  const [bannerSaving, setBannerSaving] = useState(false);

  const [productBanners, setProductBanners] = useState<ProductBanner[]>([]);
  // 키: 카테고리("BICYCLE" | "FISHING_ROD"). 히어로 배너 미리보기와 따로 둬야 한쪽 저장이 다른 쪽 선택을 지우지 않는다.
  const [productPreviews, setProductPreviews] = useState<PreviewMap>({});
  const [productSaving, setProductSaving] = useState(false);

  const [introBody, setIntroBody] = useState("");
  const [introSaving, setIntroSaving] = useState(false);

  // 배너/소개글 저장 성공·실패를 같은 Toast로 보여준다.
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastStatus, setToastStatus] = useState<ToastStatus>("info");
  const showToast = (message: string, status: ToastStatus) => {
    setToastMessage(message);
    setToastStatus(status);
  };

  useEffect(() => {
    // 소개글은 구역이 숨겨져 있으면 부르지 않는다 — 안 보여줄 값을 받으려고 요청을 하나 더
    // 낼 이유가 없다. 다시 켜면(SHOW_INTRO_SECTION) 이 호출도 같이 살아난다.
    Promise.all([
      api.content.banners(),
      api.content.productBanners(),
      SHOW_INTRO_SECTION ? api.content.intro() : Promise.resolve(null),
    ])
      .then(([bannerList, productList, intro]) => {
        // visible 이 없으면(백엔드가 아직 이 필드를 안 내려주는 동안) 켜진 것으로 본다 — 기존 동작과 같다.
        setBanners(bannerList.map((b) => ({ ...b, visible: b.visible !== false })));
        setActiveBannerSlot(bannerList[0]?.slot ?? 1);
        setProductBanners(productList);
        if (intro) {
          setIntroBody(intro.body);
        }
        setLoaded(true);
      })
      .catch((err) => setLoadError(errorMessage(err, "콘텐츠를 불러오지 못했습니다.")));
  }, []);

  const updateBannerField = (slot: number, field: "title" | "subtitle", value: string) => {
    setBanners((prev) => prev.map((b) => (b.slot === slot ? { ...b, [field]: value } : b)));
  };

  // 노출 스위치. 끄는 건 삭제가 아니라 숨김이라 제목·이미지는 그대로 남는다(다시 켜면 바로 돌아옴).
  // 마지막 남은 1장은 끌 수 없다 — 고객 랜딩 히어로·여행사 로그인 배경이 비면 안 되기 때문(서버도
  // 400 NO_VISIBLE_BANNER로 막는다). 저장 전 화면 상태만 바뀌고 '배너 저장'을 눌러야 반영된다.
  const visibleBannerCount = banners.filter((b) => b.visible).length;
  const toggleBannerVisible = (slot: number, next: boolean) => {
    if (!next && visibleBannerCount <= 1) {
      showToast("배너는 최소 1개는 켜 두어야 합니다.", "error");
      return;
    }
    setBanners((prev) => prev.map((b) => (b.slot === slot ? { ...b, visible: next } : b)));
  };

  // 브라우저 메모리에만 잠깐 띄우는 미리보기 URL이라, 새 파일을 고르거나 제거할 때
  // 이전 URL을 반드시 해제해야 한다(안 하면 탭을 오래 켜둘수록 메모리에 계속 쌓인다).
  // 히어로 배너·상품 배너가 같이 쓴다 — 미리보기 맵(setPreviews)만 다르다.
  const selectImage = (setPreviews: Dispatch<SetStateAction<PreviewMap>>, key: string, file: File) => {
    if (file.size > IMAGE_MAX_BYTES) {
      showToast("이미지는 10MB까지 올릴 수 있습니다.", "error");
      return;
    }
    setPreviews((prev) => {
      const old = prev[key];
      if (old) URL.revokeObjectURL(old.url);
      return { ...prev, [key]: { url: URL.createObjectURL(file), fileName: file.name, file } };
    });
  };

  const clearImage = (setPreviews: Dispatch<SetStateAction<PreviewMap>>, key: string) => {
    setPreviews((prev) => {
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
    if (!banners.some((b) => b.visible)) {
      showToast("배너는 최소 1개는 켜 두어야 합니다.", "error");
      return;
    }
    // 꺼 둔 배너도 제목은 필요하다 — 값을 보관해 두었다가 다시 켤 수 있게 하는 구조라 서버가 3장 모두 검증한다.
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
      const saved = await api.content.updateBanners(next);
      setBanners(saved.map((b) => ({ ...b, visible: b.visible !== false })));
      Object.values(imagePreviews).forEach((p) => URL.revokeObjectURL(p.url));
      setImagePreviews({});
      showToast("배너가 저장되었습니다", "success");
    } catch (err) {
      showToast(errorMessage(err, "배너를 저장하지 못했습니다."), "error");
    } finally {
      setBannerSaving(false);
    }
  };

  // 고른 이미지만 올리고, 받은 주소로 2건을 통째로 저장한다(히어로 배너 저장과 같은 방식).
  const handleSaveProductBanners = async () => {
    setProductSaving(true);
    try {
      const next = await Promise.all(
        productBanners.map(async (b) => {
          const preview = productPreviews[b.category];
          return preview ? { ...b, imageUrl: (await api.content.uploadImage(preview.file)).imageUrl } : b;
        }),
      );
      setProductBanners(await api.content.updateProductBanners(next));
      Object.values(productPreviews).forEach((p) => URL.revokeObjectURL(p.url));
      setProductPreviews({});
      showToast("상품 배너가 저장되었습니다", "success");
    } catch (err) {
      showToast(errorMessage(err, "상품 배너를 저장하지 못했습니다."), "error");
    } finally {
      setProductSaving(false);
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
          <Title size="md">랜딩 배너 관리</Title>
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
            {/* 배너 설명은 본문 대신 제목 옆 '?' 말풍선으로(인보이스 관리와 같은 방식). */}
            <Text weight="bold" leaf>
              랜딩 히어로 배너 (3개)
              <HelpTooltip label="랜딩 히어로 배너 안내">
                고객앱 홈 화면 상단에서 자동으로 넘어가는 배너예요. 배너마다 PC용·모바일용 이미지가
                따로 필요합니다. 노출 스위치로 일부 배너만 꺼 둘 수 있어요(최소 1개는 켜져 있어야 해요).
              </HelpTooltip>
            </Text>
            <BannerSizeGuide />

            <Tab
              variant="segment"
              items={banners.map((b) => ({
                key: String(b.slot),
                // 꺼 둔 배너는 탭에서도 바로 보이게 표시한다(탭을 하나씩 열어 보지 않아도 되게).
                label: b.visible ? `배너 ${b.slot}` : `배너 ${b.slot} (꺼짐)`,
              }))}
              activeKey={String(activeBannerSlot)}
              onChange={(key) => setActiveBannerSlot(Number(key))}
            />

            {activeBanner && (
              <Card padding="sm">
                <Stack direction="column" gap="sm">
                  {/* 스위치는 라벨과 같은 줄 오른쪽에 둔다(labelAction) — 라벨 아래 따로 두면 라벨과 떨어져
                      보이고 줄도 하나 더 먹는다. 상태 설명은 도움말 한 줄로만 보여준다(스위치 옆 "노출 중"
                      글자와 도움말이 같은 말을 두 번 하던 것을 하나로 정리). */}
                  <LabeledBox
                    label="배너 노출"
                    emphasis
                    labelAction={
                      <Toggle
                        aria-label={`배너 ${activeBanner.slot} 노출`}
                        on={activeBanner.visible}
                        disabled={!isSuperAdmin}
                        onChange={(next) => toggleBannerVisible(activeBanner.slot, next)}
                      />
                    }
                    helper={
                      activeBanner.visible
                        ? "고객앱 홈과 여행사 로그인 배경에 노출돼요."
                        : "숨김 상태예요. 입력한 내용은 그대로 보관돼요."
                    }
                  />

                  <LabeledBox label="제목" emphasis>
                    <Input
                      as="textarea"
                      rows={2}
                      value={activeBanner.title}
                      disabled={!isSuperAdmin}
                      onChange={(e) =>
                        updateBannerField(activeBanner.slot, "title", e.target.value)
                      }
                    />
                  </LabeledBox>

                  <LabeledBox label="부제 (선택 입력)" emphasis>
                    <Input
                      as="textarea"
                      rows={2}
                      value={activeBanner.subtitle ?? ""}
                      disabled={!isSuperAdmin}
                      onChange={(e) =>
                        updateBannerField(activeBanner.slot, "subtitle", e.target.value)
                      }
                    />
                  </LabeledBox>

                  <ImageAttachField
                    id={`banner-${activeBanner.slot}-pc`}
                    label="PC 이미지"
                    currentPath={activeBanner.pcImageUrl}
                    preview={imagePreviews[`${activeBanner.slot}:pc`] ?? null}
                    disabled={!isSuperAdmin}
                    onSelect={(file) => selectImage(setImagePreviews, `${activeBanner.slot}:pc`, file)}
                    onClear={() => clearImage(setImagePreviews, `${activeBanner.slot}:pc`)}
                  />

                  <ImageAttachField
                    id={`banner-${activeBanner.slot}-mobile`}
                    label="모바일 이미지"
                    currentPath={activeBanner.mobileImageUrl}
                    preview={imagePreviews[`${activeBanner.slot}:mobile`] ?? null}
                    disabled={!isSuperAdmin}
                    onSelect={(file) => selectImage(setImagePreviews, `${activeBanner.slot}:mobile`, file)}
                    onClear={() => clearImage(setImagePreviews, `${activeBanner.slot}:mobile`)}
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
              상품 배너 (2개)
              <HelpTooltip label="상품 배너 안내">
                고객앱 홈 화면 Rental 섹션의 자전거·낚싯대 카드에 들어가는 이미지예요. 카드를 누르면 해당
                상품 목록으로 이동해요.
              </HelpTooltip>
            </Text>
            <Alert status="info" icon={false}>
              <p>
                [권장 사이즈] <br />
                1200 × 900px(4:3) — 카드 비율에 맞춰 가운데 기준으로 잘려요.
              </p>
            </Alert>

            <Card padding="sm">
              <Stack direction="column" gap="sm">
                {productBanners.map((b) => (
                  <ImageAttachField
                    key={b.category}
                    id={`product-banner-${b.category}`}
                    label={ASSET_CATEGORY_LABEL[b.category]}
                    currentPath={b.imageUrl}
                    preview={productPreviews[b.category] ?? null}
                    disabled={!isSuperAdmin}
                    onSelect={(file) => selectImage(setProductPreviews, b.category, file)}
                    onClear={() => clearImage(setProductPreviews, b.category)}
                  />
                ))}
              </Stack>
            </Card>

            {isSuperAdmin && (
              <Button fullWidth disabled={productSaving} onClick={() => void handleSaveProductBanners()}>
                {productSaving ? "저장 중…" : "상품 배너 저장"}
              </Button>
            )}
          </Stack>

          {SHOW_INTRO_SECTION && (
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
          )}
        </Stack>
      )}

      <Toast
        open={!!toastMessage}
        onClose={() => setToastMessage(null)}
        message={toastMessage ?? ""}
        status={toastStatus}
      />
    </main>
  );
}
