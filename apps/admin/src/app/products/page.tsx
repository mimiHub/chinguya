"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Title, Text, Card, Stack, Tab, Toggle, Link, Button, Alert, EmptyState, Toast } from "@chinguya/ui";
import { createApiClient, ApiError } from "@chinguya/api-client";
import type { AdminProduct, AssetCategory } from "@chinguya/types";
import { ASSET_CATEGORY_LABEL, RENTAL_OPTION_LABEL } from "@chinguya/types";
import { useAdminAuth } from "@/context/AdminAuthContext";

/**
 * 상품 관리 목록(S1-A4) — 카테고리 탭 · 자산별 묶음 · 표출 토글.
 *
 * Core API(GET /admin/products, PATCH /admin/products/{id}/visibility)에 실연동돼 있다 —
 * 계약은 packages/api-spec/openapi/chinguya-admin-api.yaml.
 *
 * 상품 = 연결 자산 1개 + 대여 옵션 1개다. 그래서 목록을 **연결 자산별로 묶어** 보여주고,
 * 상단 탭은 **연결 자산의 카테고리** 기준으로 가른다. 고객앱/여행사앱 표출은 서로 독립이라
 * 토글도 따로 둔다.
 *
 * 쓰기는 슈퍼어드민만 — 토글을 감추는 것은 서버 403과 정합을 맞추는 것일 뿐 보안 경계가
 * 아니다(경계는 SecurityConfig).
 */

const api = createApiClient();

const CATEGORY_TABS: { key: AssetCategory; label: string }[] = [
  { key: "BICYCLE", label: ASSET_CATEGORY_LABEL.BICYCLE },
  { key: "FISHING_ROD", label: ASSET_CATEGORY_LABEL.FISHING_ROD },
];

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback;
}

export default function AdminProductsPage() {
  const { isSuperAdmin } = useAdminAuth();

  const [category, setCategory] = useState<AssetCategory>("BICYCLE");
  const [products, setProducts] = useState<AdminProduct[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const reload = useCallback(async (next: AssetCategory) => {
    try {
      setLoadError(null);
      setProducts(await api.products.list({ category: next }));
    } catch (err) {
      setLoadError(errorMessage(err, "상품을 불러오지 못했습니다."));
    }
  }, []);

  useEffect(() => {
    setProducts(null);
    void reload(category);
  }, [category, reload]);

  /** 자산 1개 = 소제목 1개. 서버가 이미 카테고리·자산·옵션 순으로 정렬해 주므로 순서를 보존한다. */
  const groups = useMemo(() => {
    const byAsset = new Map<string, { assetName: string; items: AdminProduct[] }>();
    for (const product of products ?? []) {
      const group = byAsset.get(product.assetId) ?? { assetName: product.assetName, items: [] };
      group.items.push(product);
      byAsset.set(product.assetId, group);
    }
    return [...byAsset.values()];
  }, [products]);

  const toggleVisibility = async (product: AdminProduct, field: "customerVisible" | "agencyVisible") => {
    setPendingId(product.productId);
    try {
      const updated = await api.products.setVisibility(product.productId, { [field]: !product[field] });
      setProducts((prev) => prev?.map((p) => (p.productId === updated.productId ? updated : p)) ?? null);
    } catch (err) {
      setToastMessage(errorMessage(err, "표출 상태를 바꾸지 못했습니다."));
    } finally {
      setPendingId(null);
    }
  };

  return (
    <main className="mx-auto max-w-2xl p-6">
      <Stack justify="between" align="center">
        <Title size="md">상품 관리</Title>
        {isSuperAdmin && (
          <Button href="/products/new" variant="subtle" size="sm">
            + 등록
          </Button>
        )}
      </Stack>

      <Tab
        className="mt-4"
        variant="capsule"
        items={CATEGORY_TABS}
        activeKey={category}
        onChange={(key) => setCategory(key as AssetCategory)}
      />

      {loadError && (
        <Alert status="error" className="mt-4">
          {loadError}
        </Alert>
      )}

      {products === null && !loadError && (
        <Text variant="sub" className="mt-4">
          불러오는 중…
        </Text>
      )}

      {products !== null && groups.length === 0 && (
        <EmptyState className="mt-4">등록된 상품이 없습니다.</EmptyState>
      )}

      <Stack direction="column" gap="lg" className="mt-4">
        {groups.map((group) => (
          <Stack key={group.assetName} direction="column" gap="sm">
            <Text weight="bold" leaf>
              {group.assetName}
            </Text>
            {group.items.map((product) => (
              <Card key={product.productId} padding="sm">
                <Stack direction="column" gap="sm">
                  <Stack justify="between" align="center">
                    <Text weight="bold">{RENTAL_OPTION_LABEL[product.optionType]}</Text>
                    <Link href={`/products/${product.productId}`} variant="muted" size="sm">
                      수정
                    </Link>
                  </Stack>
                  <Text variant="sub">고객가 {product.customerPrice.toLocaleString()}원</Text>
                  {isSuperAdmin && (
                    <Stack gap="lg">
                      <Stack gap="xs" align="center">
                        <Text variant="sub" as="span">
                          고객
                        </Text>
                        <Toggle
                          on={product.customerVisible}
                          disabled={pendingId === product.productId}
                          onChange={() => toggleVisibility(product, "customerVisible")}
                        />
                      </Stack>
                      <Stack gap="xs" align="center">
                        <Text variant="sub" as="span">
                          여행사
                        </Text>
                        <Toggle
                          on={product.agencyVisible}
                          disabled={pendingId === product.productId}
                          onChange={() => toggleVisibility(product, "agencyVisible")}
                        />
                      </Stack>
                    </Stack>
                  )}
                </Stack>
              </Card>
            ))}
          </Stack>
        ))}
      </Stack>

      <Toast open={!!toastMessage} onClose={() => setToastMessage(null)} message={toastMessage ?? ""} />
    </main>
  );
}
