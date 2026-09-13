"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import NextLink from "next/link";
import { useParams, useRouter } from "next/navigation";
import type { AdminProduct, Asset, RentalOptionKey } from "@chinguya/types";
import { ASSET_CATEGORY_LABEL, OPTIONS_BY_CATEGORY, RENTAL_OPTION_LABEL } from "@chinguya/types";
import { Title } from "@chinguya/ui/title";
import { Text } from "@chinguya/ui/text";
import { Chip } from "@chinguya/ui/chip";
import { Card } from "@chinguya/ui/card";
import { Stack } from "@chinguya/ui/stack";
import { LabeledBox } from "@chinguya/ui/labeled-box";
import { Input } from "@chinguya/ui/input";
import { Dropdown } from "@chinguya/ui/dropdown";
import { Kv } from "@chinguya/ui/kv";
import { Toggle } from "@chinguya/ui/toggle";
import { Button } from "@chinguya/ui/button";
import { Toast } from "@chinguya/ui/toast";
import { Alert } from "@chinguya/ui/alert";
import { ConfirmPopup } from "@chinguya/ui/confirm-popup";
import { ComingSoon } from "@chinguya/ui/coming-soon";
import { createApiClient, ApiError } from "@chinguya/api-client";
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

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback;
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

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

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

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      // 타지역 반납 추가요금은 2일 상품에만 보낸다 — 그 외 옵션에 값을 주면 서버가 400이다.
      const common = {
        customerPrice,
        agencyPrice,
        customerVisible,
        agencyVisible,
        crossRegionReturnExtraFee: isMultiDay && crossRegionFee > 0 ? crossRegionFee : null,
        description: description.trim() || null,
      };
      if (isNew) {
        await api.products.create({ assetId, optionType: option, ...common });
      } else {
        await api.products.update(params.id, common);
      }
      setToastMessage("저장되었습니다");
    } catch (err) {
      setSaveError(errorMessage(err, "저장하지 못했습니다."));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleteOpen(false);
    setSaving(true);
    try {
      await api.products.remove(params.id);
      setToastMessage("삭제되었습니다");
    } catch (err) {
      setSaveError(errorMessage(err, "삭제하지 못했습니다."));
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
              <LabeledBox
                label="연결 자산"
                required
                helper="활성 자산만 고를 수 있고, 등록 후에는 바꿀 수 없습니다."
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

              <LabeledBox label="대여 옵션" required helper="연결 자산의 카테고리가 허용하는 옵션만 나옵니다.">
                <Chip.List>
                  {availableOptions.map((key) => (
                    <Chip key={key} on={key === option} onClick={() => setOption(key)}>
                      {RENTAL_OPTION_LABEL[key]}
                    </Chip>
                  ))}
                </Chip.List>
              </LabeledBox>
            </>
          ) : (
            <LabeledBox label="연결 자산 · 대여 옵션" helper="등록 때 정한 값이라 수정할 수 없습니다.">
              <Text>
                {existing?.assetName} · {RENTAL_OPTION_LABEL[option]}
              </Text>
            </LabeledBox>
          )}

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

          <Kv
            items={[
              { key: "고객앱 표출", value: <Toggle on={customerVisible} onChange={setCustomerVisible} /> },
              { key: "여행사앱 표출", value: <Toggle on={agencyVisible} onChange={setAgencyVisible} /> },
            ]}
          />

          {isMultiDay && (
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
          )}

          <LabeledBox label="상품 설명">
            <Input as="textarea" value={description} onChange={(e) => setDescription(e.target.value)} rows={5} />
          </LabeledBox>

          <Text variant="sub">
            여행사가 컬럼은 항상 보유(고객앱 미노출). 타지역 반납은 2일 상품에만 표시됩니다.
          </Text>

          {saveError && <Alert status="error">{saveError}</Alert>}

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
          setToastMessage(null);
          router.push("/products");
        }}
        message={toastMessage ?? ""}
      />
    </main>
  );
}
