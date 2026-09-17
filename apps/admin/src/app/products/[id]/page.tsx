"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import NextLink from "next/link";
import { useParams, useRouter } from "next/navigation";
import type { AdminProduct, Asset, RentalOptionKey } from "@chinguya/types";
import { ASSET_CATEGORY_LABEL, OPTIONS_BY_CATEGORY, RENTAL_OPTION_LABEL } from "@chinguya/types";
import { Title, Text, Chip, Card, Stack, LabeledBox, Input, Dropdown, Kv, Toggle, Button, Toast, Alert, ConfirmPopup, ComingSoon, IconX, HelpTooltip } from "@chinguya/ui";
import type { ToastStatus } from "@chinguya/ui";
import { createApiClient, ApiError, DEFAULT_API_BASE_URL } from "@chinguya/api-client";
import { useAdminAuth } from "@/context/AdminAuthContext";

/**
 * 상품 등록/수정(S1-A5) + 상품 삭제(A5-M1).
 *
 * Core API(POST/GET/PUT/DELETE /admin/products)에 실연동돼 있다 — 계약은
 * packages/api-spec/openapi/chinguya-admin-api.yaml.
 *
 * 상품 = **연결 자산 1개 + 대여 옵션 1개**. 그래서 상품명·부제 입력칸이 없다 — 상품명은
 * 서버가 `자산명 · 옵션` 으로 만들어 준다(displayName).
 *
 * 연결 자산·옵션은 **등록 때만** 고른다. 연결 상품의 옵션이 카테고리를 따라가므로 수정에서는
 * 읽기 전용이고, 요청 본문에도 없다. 고를 수 있는 옵션은 **연결 자산의 카테고리**가 정한다
 * (자전거 2시간/1일/2일/야간, 낚싯대 1일/2일). 타지역 반납 추가요금은 2일 상품에만 있다.
 *
 * 삭제는 소프트 삭제다(예약 이력 보존, 복원 API 없음).
 */

const api = createApiClient();

/** 서버 한도(10MB)와 같다. 넘는 파일은 올리기 전에 막는다 — content 페이지 배너 이미지와 동일한 기준. */
const IMAGE_MAX_BYTES = 10 * 1024 * 1024;
/** 상품 이미지 최대 장수. 업로드 칸에 "N/10"으로 같이 표시된다. */
const MAX_PRODUCT_IMAGES = 10;

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback;
}

/**
 * 관리자가 올린 이미지(`/content/images/…`)만 Core 프록시로 미리 볼 수 있다 — content 페이지의
 * 동명 헬퍼와 같은 이유(초기값이 없는 상품은 항상 이 경로라 분기할 일이 없다).
 */
function uploadedImageSrc(path: string): string {
  return `${DEFAULT_API_BASE_URL}${path}`;
}

/**
 * 상품 이미지 한 장 — 기존에 이미 올라간 이미지는 `file`이 없고 `url`이 서버 경로다.
 * 새로 고른 파일은 `file`이 있고 `url`은 브라우저 메모리 미리보기(blob:) 주소다. 저장할 때
 * `file`이 있는 것만 실제로 업로드하고, 그 결과 주소로 바꿔 최종 imageUrls를 만든다.
 */
interface ProductImageItem {
  key: string;
  file: File | null;
  url: string;
}

export default function AdminProductEditPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { isSuperAdmin } = useAdminAuth();
  const isNew = params.id === "new";

  const [assets, setAssets] = useState<Asset[] | null>(null);
  const [existing, setExisting] = useState<AdminProduct | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [assetId, setAssetId] = useState("");
  const [option, setOption] = useState<RentalOptionKey>("DAY_1");
  const [customerPrice, setCustomerPrice] = useState(0);
  const [agencyPrice, setAgencyPrice] = useState(0);
  const [crossRegionFee, setCrossRegionFee] = useState(0);
  const [description, setDescription] = useState("");
  const [customerVisible, setCustomerVisible] = useState(true);
  const [agencyVisible, setAgencyVisible] = useState(true);
  const [images, setImages] = useState<ProductImageItem[]>([]);

  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastStatus, setToastStatus] = useState<ToastStatus>("info");
  const [deleteOpen, setDeleteOpen] = useState(false);

  const showToast = (message: string, status: ToastStatus) => {
    setToastMessage(message);
    setToastStatus(status);
  };

  const load = useCallback(async () => {
    try {
      setLoadError(null);
      // 연결 자산은 **활성 자산만** 고를 수 있다(기본값 includeDeleted=false).
      const [assetList, product] = await Promise.all([
        api.assets.list(),
        isNew ? Promise.resolve(null) : api.products.get(params.id),
      ]);
      setAssets(assetList);
      if (product) {
        setExisting(product);
        setAssetId(product.assetId);
        setOption(product.optionType);
        setCustomerPrice(product.customerPrice);
        setAgencyPrice(product.agencyPrice);
        setCrossRegionFee(product.crossRegionReturnExtraFee ?? 0);
        setDescription(product.description ?? "");
        setCustomerVisible(product.customerVisible);
        setAgencyVisible(product.agencyVisible);
        setImages(product.imageUrls.map((url, i) => ({ key: `existing-${i}-${url}`, file: null, url })));
      } else if (assetList.length > 0) {
        setAssetId(assetList[0]!.assetId);
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setNotFound(true);
        return;
      }
      setLoadError(errorMessage(err, "상품을 불러오지 못했습니다."));
    }
  }, [isNew, params.id]);

  useEffect(() => {
    void load();
  }, [load]);

  const selectedAsset = useMemo(
    () => assets?.find((a) => a.assetId === assetId) ?? null,
    [assets, assetId],
  );
  /** 고를 수 있는 옵션은 연결 자산의 카테고리가 정한다(S1-A5). */
  const availableOptions = selectedAsset ? OPTIONS_BY_CATEGORY[selectedAsset.category] : [];
  const isMultiDay = option === "DAY_2";

  /** 자산을 바꾸면 카테고리가 허용하지 않는 옵션이 남을 수 있어 첫 옵션으로 되돌린다. */
  const handleSelectAsset = (nextAssetId: string) => {
    setAssetId(nextAssetId);
    const next = assets?.find((a) => a.assetId === nextAssetId);
    if (next && !OPTIONS_BY_CATEGORY[next.category].includes(option)) {
      setOption(OPTIONS_BY_CATEGORY[next.category][0]!);
    }
  };

  /** 여러 장을 한 번에 골라도 순서대로 뒤에 붙인다. 10MB 넘는 파일과, 최대 장수(10장)를
   *  넘는 만큼은 걸러내고 나머지만 추가한다. */
  const addImageFiles = (files: FileList) => {
    const remainingSlots = Math.max(MAX_PRODUCT_IMAGES - images.length, 0);
    const incoming = Array.from(files);
    const overflow = incoming.length > remainingSlots;
    const toProcess = incoming.slice(0, remainingSlots);

    const accepted: ProductImageItem[] = [];
    let tooLarge = false;
    toProcess.forEach((file) => {
      if (file.size > IMAGE_MAX_BYTES) {
        tooLarge = true;
        return;
      }
      accepted.push({
        key: `new-${Date.now()}-${Math.random()}`,
        file,
        url: URL.createObjectURL(file),
      });
    });

    const errors: string[] = [];
    if (tooLarge) errors.push("이미지는 장당 10MB까지 올릴 수 있습니다.");
    if (overflow) errors.push(`최대 ${MAX_PRODUCT_IMAGES}장까지만 올릴 수 있습니다.`);
    if (errors.length > 0) showToast(`${errors.join(" ")} 넘는 파일은 제외했습니다.`, "error");
    if (accepted.length > 0) setImages((prev) => [...prev, ...accepted]);
  };

  const removeImage = (key: string) => {
    setImages((prev) => {
      const target = prev.find((item) => item.key === key);
      if (target?.file) URL.revokeObjectURL(target.url);
      return prev.filter((item) => item.key !== key);
    });
  };

  // 언마운트 시 아직 업로드 안 한 미리보기(blob:)만 정리한다 — 이미 올라간 이미지의
  // 서버 경로는 URL.revokeObjectURL 대상이 아니다.
  useEffect(() => {
    return () => {
      images.forEach((item) => {
        if (item.file) URL.revokeObjectURL(item.url);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      // 새로 고른 파일만 실제로 업로드하고, 기존 이미지는 주소를 그대로 쓴다. 순서가 곧
      // 표시 순서(0번 = 대표)라 Promise.all이 아니라 순서대로 하나씩 올린다.
      const finalImageUrls: string[] = [];
      for (const item of images) {
        if (item.file) {
          const uploaded = await api.content.uploadImage(item.file);
          finalImageUrls.push(uploaded.imageUrl);
        } else {
          finalImageUrls.push(item.url);
        }
      }

      // 타지역 반납 추가요금은 2일 상품에만 보낸다 — 그 외 옵션에 값을 주면 서버가 400이다.
      // imageUrls는 등록·수정 모두 빈 배열을 보내면 400이다("imageUrls는 비어있는 배열일
      // 수 없습니다" — 직접 테스트로 확인). 이미지가 없으면 등록이든 수정이든 필드 자체를
      // 빼야 한다. 수정에서 필드를 빼면 기존 이미지가 전부 지워지는 것으로 처리되므로,
      // 이미지를 하나도 없는 상태로 만들고 싶을 때(전부 삭제 후 저장)만 그 효과를 노려
      // 필드를 뺀다 — 이미지가 하나라도 있으면 항상 현재 목록을 명시해서 보낸다.
      const common = {
        customerPrice,
        agencyPrice,
        customerVisible,
        agencyVisible,
        crossRegionReturnExtraFee: isMultiDay && crossRegionFee > 0 ? crossRegionFee : null,
        description: description.trim() || null,
        ...(finalImageUrls.length > 0 ? { imageUrls: finalImageUrls } : {}),
      };
      if (isNew) {
        await api.products.create({ assetId, optionType: option, ...common });
      } else {
        await api.products.update(params.id, common);
      }
      showToast("저장되었습니다", "success");
    } catch (err) {
      showToast(errorMessage(err, "저장하지 못했습니다."), "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleteOpen(false);
    setSaving(true);
    try {
      await api.products.remove(params.id);
      showToast("삭제되었습니다", "success");
    } catch (err) {
      showToast(errorMessage(err, "삭제하지 못했습니다."), "error");
    } finally {
      setSaving(false);
    }
  };

  if (notFound) {
    return <ComingSoon label="존재하지 않는 상품입니다" />;
  }

  return (
    <main className="mx-auto max-w-2xl p-6">
      <Stack direction="column" gap="sm">
        <NextLink href="/products" className="text-sm text-muted hover:underline">
          ← 목록으로
        </NextLink>

        <Title size="md">{isNew ? "상품 등록" : "상품 수정"}</Title>

        {!isNew && existing && (
          <Card>
            {/* 상품명은 입력 항목이 아니라 서버가 `자산명 · 옵션` 으로 만들어 준다. */}
            <Text weight="bold">
              [{ASSET_CATEGORY_LABEL[existing.category]}] {existing.displayName}
            </Text>
          </Card>
        )}
      </Stack>

      {loadError && (
        <Alert status="error" className="mt-4">
          {loadError}
        </Alert>
      )}

      {assets === null && !loadError && (
        <Text variant="sub" className="mt-4">
          불러오는 중…
        </Text>
      )}

      {assets !== null && (
        <Stack direction="column" gap="md" className="mt-4">
          {isNew ? (
            <>
              <Card>
                <LabeledBox
                label={
                  <>
                    연결 자산
                    <HelpTooltip>활성 자산만 고를 수 있고, 등록 후에는 바꿀 수 없습니다.</HelpTooltip>
                  </>
                }
                required
                badge
              >
                <Dropdown
                  value={assetId || null}
                  onChange={handleSelectAsset}
                  options={assets.map((a) => ({
                    value: a.assetId,
                    label: `${a.name} (${ASSET_CATEGORY_LABEL[a.category]})`,
                  }))}
                />
              </LabeledBox>
              </Card>

              <Card>
                <LabeledBox
                label={
                  <>
                    대여 옵션
                    <HelpTooltip>연결 자산의 카테고리가 허용하는 옵션만 나옵니다.</HelpTooltip>
                  </>
                }
                required
                badge
              >
                <Chip.List>
                  {availableOptions.map((key) => (
                    <Chip key={key} on={key === option} onClick={() => setOption(key)}>
                      {RENTAL_OPTION_LABEL[key]}
                    </Chip>
                  ))}
                </Chip.List>
              </LabeledBox>
              </Card>
            </>
          ) : (
            <Card>
              <LabeledBox label="연결 자산 · 대여 옵션" badge helper="등록 때 정한 값이라 수정할 수 없습니다.">
              <Text>
                {existing?.assetName} · {RENTAL_OPTION_LABEL[option]}
              </Text>
            </LabeledBox>
            </Card>
          )}

          <Card>
            <LabeledBox
            label={
              <>
                상품 이미지
                <HelpTooltip>
                  여러 장을 한번에 고를 수 있고, 나열된 순서가 화면 표시 순서예요. 첫 번째가 대표
                  이미지입니다. PNG·JPG·WEBP, 장당 10MB까지.
                </HelpTooltip>
              </>
            }
            badge
          >
            <Stack direction="column" gap="sm">
              {/* 업로드 칸(카메라 아이콘 + N/10)을 목록 맨 앞에 두고, 전체를 한 줄 가로
                  스크롤로 — 태그 캡슐 선택기(Chip.List scrollArrows)와 같은 좌우 화살표
                  패턴을 재사용한다. 칩이 아니어도 이 컴포넌트는 그냥 가로 스크롤 컨테이너라
                  썸네일을 넣어도 그대로 동작한다. */}
              <Chip.List scrollArrows>
                <input
                  id="product-image-input"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  multiple
                  disabled={images.length >= MAX_PRODUCT_IMAGES}
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) addImageFiles(e.target.files);
                    e.target.value = "";
                  }}
                />
                <label
                  htmlFor="product-image-input"
                  className={[
                    "flex h-[60px] w-[60px] shrink-0 flex-col items-center justify-center gap-0.5 rounded-xl border border-line transition-colors",
                    images.length >= MAX_PRODUCT_IMAGES
                      ? "cursor-not-allowed opacity-40"
                      : "cursor-pointer text-muted hover:border-primary-500 hover:text-ink",
                  ].join(" ")}
                >
                  {/* 카메라 아이콘 — 별도 아이콘 라이브러리가 없어(icon-x·icon-hamburger와
                      같은 방식으로) 인라인 SVG로 그린다. */}
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4 8a2 2 0 0 1 2-2h1.17a1 1 0 0 0 .83-.45l.7-1.1A1 1 0 0 1 9.53 4h4.94a1 1 0 0 1 .83.45l.7 1.1a1 1 0 0 0 .83.45H18a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8Z"
                    />
                    <circle cx="12" cy="13" r="3.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="text-[10px] leading-none">
                    <span className={images.length >= MAX_PRODUCT_IMAGES ? "text-muted" : "font-bold text-warning"}>
                      {images.length}
                    </span>
                    <span className="text-muted">/{MAX_PRODUCT_IMAGES}</span>
                  </span>
                </label>
                {images.map((item, index) => (
                  // overflow-hidden을 이 래퍼에 두면 아래 X 버튼처럼 모서리 밖으로 나가는
                  // 요소까지 같이 잘려나간다 — 라운드 처리는 래퍼가 아니라 img 자신에게 주고,
                  // 래퍼는 테두리만 그린다(잘림 없이 X가 모서리 밖으로 나갈 수 있게).
                  <div key={item.key} className="relative h-[60px] w-[60px] shrink-0 rounded-xl border border-line">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.file ? item.url : uploadedImageSrc(item.url)}
                      alt=""
                      className="h-full w-full rounded-xl object-cover"
                    />
                    {index === 0 && (
                      <span className="absolute inset-x-0 bottom-0 rounded-b-xl bg-black/70 py-0.5 text-center text-[9px] font-bold leading-tight text-white">
                        대표사진
                      </span>
                    )}
                    {/* IconX 자체가 relative를 이미 갖고 있어(같은 position 속성 충돌 —
                        input.tsx의 border-line/border-error와 같은 케이스) absolute를
                        IconX의 className으로 넘기지 않고 감싸는 래퍼에 둔다. 원 모양이 썸네일
                        모서리에 반쯤 걸치도록 음수 오프셋을 쓴다(60px 크기에 맞춰 lg보다
                        작은 sm 크기 + 더 좁은 오프셋). */}
                    <div className="absolute -right-1.5 -top-1.5">
                      <IconX
                        size="xs"
                        aria-label="이미지 삭제"
                        className="bg-white text-ink shadow-md hover:bg-white"
                        onClick={() => removeImage(item.key)}
                      />
                    </div>
                  </div>
                ))}
              </Chip.List>
            </Stack>
          </LabeledBox>
          </Card>

          <Card>
            <Stack justify="between" align="center">
            <Text variant="sub" as="span">
              고객가 (KRW)
            </Text>
            <Input
              type="number"
              size="sm"
              fullWidth={false}
              className="w-32 text-right"
              value={customerPrice}
              min={0}
              onChange={(e) => setCustomerPrice(Number(e.target.value))}
            />
          </Stack>
          </Card>

          <Card>
            <Stack justify="between" align="center">
            <Text variant="sub" as="span">
              여행사가 (KRW)
            </Text>
            <Input
              type="number"
              size="sm"
              fullWidth={false}
              className="w-32 text-right"
              value={agencyPrice}
              min={0}
              onChange={(e) => setAgencyPrice(Number(e.target.value))}
            />
          </Stack>
          </Card>

          <Card>
            <Kv
            items={[
              { key: "고객앱 표출", value: <Toggle on={customerVisible} onChange={setCustomerVisible} /> },
              { key: "여행사앱 표출", value: <Toggle on={agencyVisible} onChange={setAgencyVisible} /> },
            ]}
          />
          </Card>

          {isMultiDay && (
            <Card>
              <Stack justify="between" align="center">
              <Text variant="sub" as="span">
                타지역 반납 추가요금
              </Text>
              <Input
                type="number"
                size="sm"
                fullWidth={false}
                className="w-32 text-right"
                value={crossRegionFee}
                min={0}
                onChange={(e) => setCrossRegionFee(Number(e.target.value))}
              />
            </Stack>
            </Card>
          )}

         <Card>
          <Stack direction="column">
             <LabeledBox
             label={
               <>
                 상품 설명
                 <HelpTooltip>
                   여행사가 컬럼은 항상 보유(고객앱 미노출). 타지역 반납은 2일 상품에만 표시됩니다.
                 </HelpTooltip>
               </>
             }
             badge
           >
            <Input as="textarea" value={description} onChange={(e) => setDescription(e.target.value)} rows={5} />
          </LabeledBox>
          </Stack>
         </Card>

          {isSuperAdmin && (
            <Stack direction="column" gap="sm">
              <Button fullWidth disabled={saving || (isNew && !assetId)} onClick={handleSave}>
                저장
              </Button>
              {!isNew && (
                <Button variant="outline" fullWidth disabled={saving} onClick={() => setDeleteOpen(true)}>
                  상품 삭제
                </Button>
              )}
            </Stack>
          )}
        </Stack>
      )}

      {/* A5-M1 — 소프트 삭제라 예약 이력은 남지만 복원 API가 없다. */}
      <ConfirmPopup
        open={deleteOpen}
        title="상품을 삭제할까요?"
        message="목록에서 사라집니다. 이미 만들어진 예약 이력은 남지만 되돌릴 수는 없습니다."
        confirmLabel="삭제"
        danger
        onConfirm={handleDelete}
        onClose={() => setDeleteOpen(false)}
      />

      <Toast
        open={!!toastMessage}
        onClose={() => {
          const wasSuccess = toastStatus === "success";
          setToastMessage(null);
          if (wasSuccess) router.push("/products");
        }}
        message={toastMessage ?? ""}
        status={toastStatus}
      />
    </main>
  );
}
