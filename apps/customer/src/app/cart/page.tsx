"use client";

import { useEffect, useMemo, useState } from "react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { createApiClient, ApiError, type CustomerCartItem } from "@chinguya/api-client";
import { RENTAL_OPTION_LABEL } from "@chinguya/types";
import { Title, Text, Stack, Card, Kv, Input, Button, IconX, Checkbox, ConfirmPopup, FormMessage, Alert, Banner } from "@chinguya/ui";
import { useCart } from "@/context/CartContext";
import { useCustomerAuth } from "@/context/CustomerAuthContext";
import { ScrollReveal } from "@/components/ScrollReveal";

/**
 * 장바구니 · 예약 확인 `cart`(S1-C3). 담긴 항목(= 임시 홀드)을 고르고 여권 영문명을 확인한 뒤
 * "예약하고 입금 안내 받기"로 예약을 확정한다. 수량 변경은 여기서 안 되고(상품 상세·예약에서만) 삭제만 된다.
 *
 * Core API 실연동: GET /v1/cart, DELETE /v1/cart/items/{id}, POST /v1/bookings.
 * 계약은 packages/api-spec/openapi/chinguya-slice1-openapi.yaml.
 *
 * - 선택한 항목들이 **예약번호 하나**로 묶인다(1 예약번호 = N 항목). 선택하지 않은 항목은 장바구니에 남는다.
 * - 임시 홀드는 항목마다 담은 뒤 15분이다. 가장 이른 만료까지 남은 시간을 보여 주고, 만료되면 장바구니를
 *   다시 읽는다(서버가 만료 항목을 뺀다).
 * - 여권 영문명은 저장값이 있으면 채워 두고, 없으면 필수로 입력받는다. 처음 입력한 값은 다음 예약의
 *   기본값으로 저장된다(서버).
 */

const api = createApiClient();

function formatCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const mm = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const ss = String(totalSeconds % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

function datesLabel(item: CustomerCartItem): string {
  const first = item.dates[0] ?? "";
  const last = item.dates[item.dates.length - 1] ?? first;
  return first === last ? first : `${first} ~ ${last}`;
}

export default function CartPage() {
  const router = useRouter();
  const { session, loading: authLoading } = useCustomerAuth();
  const { cart, items, loadError, reload, removeItem } = useCart();
  const [passportName, setPassportName] = useState("");
  const [passportTouched, setPassportTouched] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<CustomerCartItem | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [now, setNow] = useState(() => Date.now());
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // 저장된 여권 영문명으로 채운다 — 사용자가 이미 고치고 있으면 덮어쓰지 않는다.
  useEffect(() => {
    if (!passportTouched && session?.passportName) setPassportName(session.passportName);
  }, [session?.passportName, passportTouched]);

  const earliestExpiry = cart?.earliestHoldExpiresAt ? new Date(cart.earliestHoldExpiresAt).getTime() : null;
  const remainingMs = earliestExpiry ? earliestExpiry - now : 0;
  const holdExpired = Boolean(earliestExpiry) && remainingMs <= 0;

  useEffect(() => {
    if (!earliestExpiry) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [earliestExpiry]);

  // 가장 이른 홀드가 끝나면 서버에서 다시 읽는다 — 만료 항목이 빠지고 다음 만료 시각으로 타이머가 이어진다.
  useEffect(() => {
    if (holdExpired) void reload();
  }, [holdExpired, reload]);

  // 담긴 항목이 바뀔 때마다 선택 목록을 맞춘다 — 새 항목은 선택된 채로 시작하고, 빠진 항목은 선택에서도 뺀다.
  useEffect(() => {
    setSelectedIds((prev) => {
      const itemIds = new Set(items.map((item) => item.cartItemId));
      let changed = false;
      const next = new Set<string>();
      prev.forEach((id) => {
        if (itemIds.has(id)) next.add(id);
        else changed = true;
      });
      itemIds.forEach((id) => {
        if (!next.has(id)) {
          next.add(id);
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [items]);

  const selectedItems = useMemo(
    () => items.filter((item) => selectedIds.has(item.cartItemId)),
    [items, selectedIds],
  );
  const allSelected = items.length > 0 && selectedItems.length === items.length;
  const total = selectedItems.reduce((sum, item) => sum + item.lineTotal, 0);
  const canSubmit = selectedItems.length > 0 && passportName.trim().length > 0 && !submitting;

  const toggleSelectAll = () => {
    setSelectedIds(allSelected ? new Set() : new Set(items.map((item) => item.cartItemId)));
  };

  const toggleSelect = (cartItemId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(cartItemId)) next.delete(cartItemId);
      else next.add(cartItemId);
      return next;
    });
  };

  const removeItems = async (targets: CustomerCartItem[]) => {
    setActionError(null);
    try {
      for (const item of targets) {
        await removeItem(item.cartItemId);
      }
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "항목을 삭제하지 못했습니다.");
      await reload();
    }
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setActionError(null);
    try {
      const booking = await api.customerBookings.create({
        passportName: passportName.trim(),
        cartItemIds: selectedItems.map((item) => item.cartItemId),
      });
      router.push(`/deposit?bookingId=${booking.bookingId}`);
      void reload();
    } catch (err) {
      if (err instanceof ApiError && err.code === "HOLD_EXPIRED") {
        setActionError("임시 홀드 시간이 지난 항목이 있어 예약하지 못했습니다. 장바구니를 확인한 뒤 다시 시도해 주세요.");
        await reload();
      } else {
        setActionError(err instanceof ApiError ? err.message : "예약하지 못했습니다.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const content = (() => {
    if (authLoading || (session && cart === null && !loadError)) {
      return (
        <Text variant="sub" className="mt-6">
          불러오는 중…
        </Text>
      );
    }
    if (!session) {
      return (
        <Stack direction="column" gap="md" className="mt-8 items-center text-center">
          <Card className="w-full">
            <Text tone="secondary">장바구니는 로그인 후 이용할 수 있습니다.</Text>
          </Card>
          <Button href={`/login?redirect=${encodeURIComponent("/cart")}`}>로그인</Button>
        </Stack>
      );
    }
    if (loadError) {
      return (
        <Alert status="error" className="mt-6">
          {loadError}
        </Alert>
      );
    }
    if (items.length === 0) {
      return (
        <Stack direction="column" gap="md" className="mt-8 items-center text-center">
          <Card className="w-full">
            <Text tone="secondary">장바구니가 비어 있습니다.</Text>
          </Card>
          <div className="w-full border-t border-line" />
          <NextLink href="/rental">
            <Button>상품 보러가기</Button>
          </NextLink>
        </Stack>
      );
    }
    return (
      <>
        <Stack justify="between" align="center" className="mt-4">
          <Stack gap="sm" align="center">
            <Checkbox checked={allSelected} onChange={toggleSelectAll} aria-label="전체 선택" />
            <Text weight="medium" as="span">
              전체 선택 <span className="text-sm text-muted">({selectedItems.length}/{items.length})</span>
            </Text>
          </Stack>
          <button
            type="button"
            disabled={selectedItems.length === 0}
            onClick={() => setBulkDeleteOpen(true)}
            className="text-sm text-muted"
          >
            선택 삭제
          </button>
        </Stack>

        {/* 담긴 항목이 많아지면 카드 목록만 이 영역 안에서 스크롤되게 한다(제목·버튼은 고정) */}
        <div className="mt-2 max-h-[300px] overflow-y-auto pr-1">
        <Stack direction="column" gap="sm">
          {items.map((item) => (
            <ScrollReveal key={item.cartItemId}>
            <Card padding="sm">
              <Stack gap="sm" align="start">
                <Checkbox
                  checked={selectedIds.has(item.cartItemId)}
                  onChange={() => toggleSelect(item.cartItemId)}
                  aria-label={`${item.productName} 선택`}
                  className="mt-1"
                />
                <Stack direction="column" className="min-w-0 flex-1" gap="xs">
                  <Stack direction="row" justify="between" gap="xs">
                    <Text weight="bold">{item.productName}</Text>
                    <IconX aria-label={`${item.productName} 삭제`} onClick={() => setRemoveTarget(item)} />
                  </Stack>
                  <Stack gap="xs" direction="column">
                    <Text variant="sub">
                      {RENTAL_OPTION_LABEL[item.optionType]} · {datesLabel(item)}
                    </Text>
                    {item.crossRegionReturn && (
                      <Text variant="sub" tone="accent" as="span">
                        타지역 반납 포함 (+ {(item.extraFee ?? 0).toLocaleString()}원)
                      </Text>
                    )}
                    <Text variant="sub" tone="ink" as="span">
                      ×{item.quantity} / <b>{item.lineTotal.toLocaleString()}</b>원
                    </Text>
                  </Stack>
                </Stack>
              </Stack>
            </Card>
            </ScrollReveal>
          ))}
        </Stack>
        </div>

        {earliestExpiry && !holdExpired && (
          <ScrollReveal>
          <Alert status="warning" className="mt-4" icon={false}>
            ⏱ [임시 홀드 중] 남은 시간 {formatCountdown(remainingMs)} — 중복 예약 방지를 위해
            시간 내에 예약을 완료해 주세요. 시간이 지난 항목은 장바구니에서 빠집니다.
          </Alert>
          </ScrollReveal>
        )}

        {actionError && (
          <Alert status="error" className="mt-4" icon={false}>
            {actionError}
          </Alert>
        )}

        <ScrollReveal>
        <Stack direction="column" gap="sm" className="mt-6">
          <Title as="label" htmlFor="passport-name" size="sm" leaf tone="secondary">
            여권 영문명
          </Title>
          <Input
            id="passport-name"
            value={passportName}
            onChange={(e) => {
              setPassportTouched(true);
              setPassportName(e.target.value);
            }}
            placeholder="GILDONG HONG"
          />
          <FormMessage type="helper">예약 확정 전 필수 입력입니다.</FormMessage>
        </Stack>
        </ScrollReveal>

        {/*
          모바일에서는 하단 탭바(BottomNav, h-16) 바로 위에 합계·버튼을 고정해서 스크롤 없이도
          항상 보이게 한다(쿠팡 등 실제 쇼핑몰 장바구니와 동일한 패턴). md 이상(데스크톱 확인용)
          에서는 굳이 고정할 필요가 없어 원래 위치(폼 아래)에 자연스럽게 놓이도록 되돌린다.
        */}
        <div className="fixed inset-x-0 bottom-16 z-[90] border-t border-line bg-white p-4 md:static md:z-auto md:mt-6 md:border-0 md:bg-transparent md:p-0">
          <div className="mx-auto max-w-2xl">
            <Kv items={[{ key: "합계", value: `₩ ${total.toLocaleString()}` }]} />
            <Button fullWidth className="mt-3" disabled={!canSubmit} onClick={handleSubmit}>
              예약하고 입금 안내 받기 · {selectedItems.length}건
            </Button>
          </div>
        </div>
      </>
    );
  })();

  return (
    <main>
      {/* 하단 탭 대메뉴 화면(장바구니)이라 배너를 크게 쓴다 */}
      <Banner size="lg" title="예약 확인" image="/banner-notice.png" />

      <div className={`mx-auto max-w-2xl p-6 ${items.length > 0 ? "pb-56 md:pb-10" : "pb-10"}`}>
      <Stack direction="column" gap="sm">
        {/* 실제로 들어온 화면(상품 상세 등)으로 되돌아가게 router.back()을 쓴다. */}
        <button
          type="button"
          onClick={() => router.back()}
          className="text-left text-sm text-muted hover:underline"
        >
          ← 이전 페이지로 이동
        </button>
        <Title size="lg">장바구니</Title>
      </Stack>

      {content}

      <ConfirmPopup
        open={Boolean(removeTarget)}
        message="장바구니에서 이 항목을 삭제할까요?"
        onConfirm={() => {
          if (removeTarget) void removeItems([removeTarget]);
          setRemoveTarget(null);
        }}
        onClose={() => setRemoveTarget(null)}
      />

      <ConfirmPopup
        open={bulkDeleteOpen}
        message={`선택한 ${selectedItems.length}개 항목을 삭제할까요?`}
        onConfirm={() => {
          void removeItems(selectedItems);
          setBulkDeleteOpen(false);
        }}
        onClose={() => setBulkDeleteOpen(false)}
      />
      </div>
    </main>
  );
}
