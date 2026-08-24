"use client";

import { useState } from "react";
import NextLink from "next/link";
import { useParams, useRouter } from "next/navigation";
import type { RentalCategoryKey, RentalOptionKey } from "@chinguya/types";
import { Title } from "@chinguya/ui/title";
import { Text } from "@chinguya/ui/text";
import { Chip } from "@chinguya/ui/chip";
import { Card } from "@chinguya/ui/card";
import { Stack } from "@chinguya/ui/stack";
import { LabeledBox } from "@chinguya/ui/labeled-box";
import { Input } from "@chinguya/ui/input";
import { Kv } from "@chinguya/ui/kv";
import { Toggle } from "@chinguya/ui/toggle";
import { Button } from "@chinguya/ui/button";
import { Toast } from "@chinguya/ui/toast";
import { ComingSoon } from "@chinguya/ui/coming-soon";
import {
  findAdminProductVariantById,
  CATALOG_TITLES,
  CATEGORY_LABEL,
  RENTAL_OPTION_LABEL,
  RENTAL_OPTION_ORDER,
} from "@/data/productData";

/**
 * S1-A5 상품 등록/수정.
 *
 * 와이어프레임에는 상품명/부제 입력칸이나 옵션별 가격표가 없다 — 상품 하나가 이미
 * "카테고리+대여기간" 조합 하나(예: "전기자전거 · 1일")라서, 그 조합의 고객가/여행사가 단일
 * 값만 입력하면 된다. 수정 화면에서는 어떤 조합인지(제목·대여기간)가 이미 정해져 있으니
 * 상단에 읽기 전용으로 보여주고, 신규 등록 화면에서만 카탈로그와 대여기간을 골라서 조합을 만든다.
 * 타지역 반납 추가요금은 "2일" 상품에만 있는 필드다.
 *
 * 저장 버튼은 지금은 실제 저장을 하지 않고 토스트만 보여준다 — 실제 연동 시
 * POST(신규)/PATCH(수정) /api/admin/products 호출로 교체한다.
 */
export default function AdminProductEditPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const isNew = params.id === "new";
  const existing = isNew ? undefined : findAdminProductVariantById(params.id);

  // 훅은 이른 return보다 먼저 선언해야 하므로(React 훅 규칙), 상품이 없을 수도 있는 상태 그대로
  // useState를 먼저 다 선언해두고, 렌더링 마지막에 "없는 상품" 화면으로 갈아끼운다.
  const firstCatalog = CATALOG_TITLES[0];
  const [category, setCategory] = useState<RentalCategoryKey>(existing?.category ?? firstCatalog?.category ?? "bike");
  const [title, setTitle] = useState(existing?.title ?? firstCatalog?.title ?? "");
  const [image, setImage] = useState(existing?.image ?? firstCatalog?.image ?? "");
  const [option, setOption] = useState<RentalOptionKey>(existing?.option ?? "2h");
  const [customerPrice, setCustomerPrice] = useState(existing?.price.customerPrice ?? 0);
  const [agencyPrice, setAgencyPrice] = useState(existing?.price.agencyPrice ?? 0);
  const [offSiteReturnFeeKrw, setOffSiteReturnFeeKrw] = useState(existing?.offSiteReturnFeeKrw ?? 0);
  const [description, setDescription] = useState(existing?.description ?? "");
  const [customerVisible, setCustomerVisible] = useState(existing?.customerVisible ?? true);
  const [agencyVisible, setAgencyVisible] = useState(existing?.agencyVisible ?? true);
  const [savedOpen, setSavedOpen] = useState(false);

  const isMultiDay = option === "2d";

  const handleSelectCatalog = (item: (typeof CATALOG_TITLES)[number]) => {
    setCategory(item.category);
    setTitle(item.title);
    setImage(item.image);
  };

  const handleSave = () => {
    // TODO: 실제 연동 시 여기서 POST(신규)/PATCH(수정) 호출 후 성공하면 목록으로 이동한다.
    setSavedOpen(true);
  };

  if (!isNew && !existing) {
    return <ComingSoon label="존재하지 않는 상품입니다" />;
  }

  return (
    <main className="mx-auto max-w-2xl p-6">
      <Stack direction="column" gap="sm">
        <NextLink href="/products" className="text-sm text-muted hover:underline">
          ← 목록으로
        </NextLink>

        <Title size="md">{isNew ? "상품 등록" : "상품 수정"}</Title>

        <Card>
          <Stack align="center">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md border border-line bg-white p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image} alt={title} className="h-full w-full object-contain" />
          </div>
          {!isNew && (
            <Text weight="bold">
              [{CATEGORY_LABEL[category]}] {title} · {RENTAL_OPTION_LABEL[option]}
            </Text>
          )}
        </Stack>
        </Card>
      </Stack>

      <Stack direction="column" gap="md" className="mt-4">
        {isNew && (
          <>
            <LabeledBox label="카탈로그" required>
              <Chip.List>
                {CATALOG_TITLES.map((item) => (
                  <Chip key={item.title} on={item.title === title} onClick={() => handleSelectCatalog(item)}>
                    {item.title}
                  </Chip>
                ))}
              </Chip.List>
            </LabeledBox>

            <LabeledBox label="대여기간" required>
              <Chip.List>
                {RENTAL_OPTION_ORDER.map((key) => (
                  <Chip key={key} on={key === option} onClick={() => setOption(key)}>
                    {RENTAL_OPTION_LABEL[key]}
                  </Chip>
                ))}
              </Chip.List>
            </LabeledBox>
          </>
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
              value={offSiteReturnFeeKrw}
              min={0}
              onChange={(e) => setOffSiteReturnFeeKrw(Number(e.target.value))}
            />
          </Stack>
        )}

        <LabeledBox label="상품 설명">
          <Input as="textarea" value={description} onChange={(e) => setDescription(e.target.value)} rows={5} />
        </LabeledBox>        

        <Text variant="sub">
          여행사가 컬럼은 항상 보유(고객앱 미노출). 타지역 반납은 2일 상품에만 표시됩니다.
        </Text>

        <Button fullWidth onClick={handleSave}>
          저장
        </Button>
      </Stack>

      <Toast
        open={savedOpen}
        onClose={() => {
          setSavedOpen(false);
          router.push("/products");
        }}
        message="저장되었습니다"
      />
    </main>
  );
}
