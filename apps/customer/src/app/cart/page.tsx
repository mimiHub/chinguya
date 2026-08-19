"use client";

import { useEffect, useMemo, useState } from "react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { OFF_SITE_RETURN_FEE_KRW } from "@chinguya/types";
import { Title } from "@chinguya/ui/title";
import { Text } from "@chinguya/ui/text";
import { Stack } from "@chinguya/ui/stack";
import { Card } from "@chinguya/ui/card";
import { Kv } from "@chinguya/ui/kv";
import { Input } from "@chinguya/ui/input";
import { Button } from "@chinguya/ui/button";
import { IconX } from "@chinguya/ui/icon-x";
import { Checkbox } from "@chinguya/ui/checkbox";
import { ConfirmPopup } from "@chinguya/ui/confirm-popup";
import { FormMessage } from "@chinguya/ui/form-message";
import { Alert } from "@chinguya/ui/alert";
import { Banner } from "@chinguya/ui/banner";
import { useCart, type CartLine } from "@/context/CartContext";
import { findRentalProductById, RENTAL_OPTION_LABEL } from "@/data/rentalData";
import { createReservation } from "@/data/reservationData";

function rentalDaysOf(line: CartLine): number {
  const start = new Date(line.useDateStart);
  const end = new Date(line.useDateEnd);
  return Math.round((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1;
}

function lineAmount(line: CartLine): number {
  const product = findRentalProductById(line.productId);
  if (!product) return 0;
  const unitPrice = product.priceByOption[line.option].customerPrice;
  const offSiteFee = line.offSiteReturn ? OFF_SITE_RETURN_FEE_KRW : 0;
  return unitPrice * line.qty * rentalDaysOf(line) + offSiteFee;
}

function formatCountdown(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const mm = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const ss = String(totalSeconds % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

/**
 * S1-C3 장바구니 · 예약 확인. 여러 항목을 한 번에 담아 여권 영문명 확인 후 "예약하고 입금 안내
 * 받기"로 넘어간다 — 이 화면에서 수량 변경은 안 되고(예약 화면 S1-C2에서만), 삭제만 가능하다.
 *
 * 실제 쇼핑몰(쿠팡 등)처럼 항목별 체크박스 + 전체 선택을 지원한다 — 합계·"예약하고 입금 안내
 * 받기"는 항상 "선택된 항목"만 대상으로 계산/처리된다. 선택 안 한 항목은 결제 후에도 장바구니에
 * 그대로 남는다.
 *
 * 실제로는 담긴 항목들이 하나의 주문(order)으로 묶여야 하지만, packages/types의
 * CustomerReservation은 항목 하나당 레코드 하나라서, 여기서는 선택된 항목 개수만큼
 * CustomerReservation을 만들고 그 id들을 입금 안내 화면(/deposit?ids=...)에 함께 넘겨서
 * "한 번의 입금 안내"로 묶어 보여준다.
 */
export default function CartPage() {
  const router = useRouter();
  const { items, removeItem, removeItems, holdExpiresAt, clear } = useCart();
  const [passportName, setPassportName] = useState("");
  const [removeTarget, setRemoveTarget] = useState<CartLine | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!holdExpiresAt) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [holdExpiresAt]);

  const remainingMs = holdExpiresAt ? holdExpiresAt - now : 0;
  const holdExpired = Boolean(holdExpiresAt) && remainingMs <= 0;

  useEffect(() => {
    if (holdExpired) clear();
  }, [holdExpired, clear]);

  // 담긴 항목이 바뀔 때마다 선택 목록을 맞춘다 — 새로 담긴 항목은 기본으로 선택된 상태로
  // 시작하고(실제 쇼핑몰과 동일한 동작), 삭제된 항목은 선택 목록에서도 같이 빠진다.
  useEffect(() => {
    setSelectedIds((prev) => {
      const itemIds = new Set(items.map((item) => item.cartLineId));
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
    () => items.filter((item) => selectedIds.has(item.cartLineId)),
    [items, selectedIds],
  );
  const allSelected = items.length > 0 && selectedItems.length === items.length;

  const toggleSelectAll = () => {
    setSelectedIds(allSelected ? new Set() : new Set(items.map((item) => item.cartLineId)));
  };

  const toggleSelect = (cartLineId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(cartLineId)) next.delete(cartLineId);
      else next.add(cartLineId);
      return next;
    });
  };

  const total = selectedItems.reduce((sum, line) => sum + lineAmount(line), 0);
  const canSubmit = selectedItems.length > 0 && passportName.trim().length > 0 && !holdExpired;

  const handleSubmit = () => {
    if (!canSubmit) return;

    const created = selectedItems.map((line) =>
      createReservation({
        productId: line.productId,
        rentalOption: line.option,
        passportName: passportName.trim(),
        useDate: line.useDateStart,
        useDateEnd: line.useDateStart === line.useDateEnd ? undefined : line.useDateEnd,
        quantity: line.qty,
        offSiteReturn: line.offSiteReturn,
        amountKrw: lineAmount(line),
      }),
    );

    // 선택하지 않은 항목은 장바구니에 그대로 두고, 예약(결제)한 선택 항목만 지운다.
    removeItems(selectedItems.map((line) => line.cartLineId));
    router.push(`/deposit?ids=${created.map((r) => r.id).join(",")}`);
  };

  return (
    <main>
      {/* 하단 탭 대메뉴 화면(장바구니)이라 배너를 크게 쓴다 */}
      <Banner size="lg" title="예약 확인" image="/banner-notice.png" />

      <div className={`mx-auto max-w-2xl p-6 ${items.length > 0 ? "pb-56 md:pb-10" : "pb-10"}`}>
      <Stack direction="column" gap="sm">
        {/*
          예전엔 href="/rental"로 고정돼 있어서, 예약(캘린더) 화면에서 "바로 예약"으로 들어왔든
          하단 탭으로 곧장 들어왔든 항상 상품조회로 돌아가 버렸다. router.back()으로 바꿔서
          실제로 들어온 화면(캘린더 화면 등)으로 되돌아가게 한다.
        */}
        <button
          type="button"
          onClick={() => router.back()}
          className="text-left text-sm text-muted hover:underline"
        >
          ← 이전 페이지로 이동
        </button>
        <Title size="lg">장바구니</Title>
      </Stack>

      {items.length === 0 ? (
        <Stack direction="column" gap="md" className="mt-8 items-center text-center">
          <Text tone="secondary">장바구니가 비어 있습니다.</Text>
          <NextLink href="/rental">
            <Button>상품 보러가기</Button>
          </NextLink>
        </Stack>
      ) : (
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
            {items.map((line) => {
              const product = findRentalProductById(line.productId);
              if (!product) return null;
              return (
                <Card key={line.cartLineId} padding="sm">
                  <Stack gap="sm" align="start">
                    
                      <Checkbox
                      checked={selectedIds.has(line.cartLineId)}
                      onChange={() => toggleSelect(line.cartLineId)}
                      aria-label={`${product.title} 선택`}
                      className="mt-1"
                    />
                    
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-gray-50 p-2">
                      <img
                        src={product.image}
                        alt={product.title}
                        className="h-full w-full object-contain"
                      />
                    </div>
                    
                    <Stack direction="column" className="min-w-0 flex-1" gap="xs">
                      <Stack direction="row" justify="between" gap="xs">
                        <Text weight="bold">{product.title}</Text>
                        <IconX aria-label={`${product.title} 삭제`} onClick={() => setRemoveTarget(line)} />
                      </Stack>
                      <Stack gap="xs" direction="column">
                        <Text variant="sub">
                          {RENTAL_OPTION_LABEL[line.option]} · {line.useDateStart}
                          {line.useDateStart !== line.useDateEnd ? ` ~ ${line.useDateEnd}` : ""}
                        </Text>
                        {line.offSiteReturn && (
                          <Text variant="sub" tone="accent" as="span">
                            타지역 반납 포함 (+ {OFF_SITE_RETURN_FEE_KRW.toLocaleString()}원)
                          </Text>
                        )}
                        <Text variant="sub" tone="ink" as="span">
                          {line.qty}
                          {product.category === "bike" ? "대" : "개"} / <b>{lineAmount(line).toLocaleString()}</b>원
                        </Text>
                        
                      </Stack>
                    </Stack>
                  </Stack>
                </Card>
              );
            })}            
          </Stack>
          </div>

          {holdExpiresAt && !holdExpired && (
            <Alert status="warning" className="mt-4" icon={false}>
              ⏱ [임시 홀드 중] 남은 시간 {formatCountdown(remainingMs)} — 중복 예약 방지를 위해
              시간 내에 예약을 완료해 주세요.
            </Alert>
          )}

          {holdExpired && (
            <Alert status="error" className="mt-4" icon={false}>
              임시 홀드 시간이 지나 장바구니가 비워졌습니다. 다시 담아 주세요.
            </Alert>
          )}

          <Stack direction="column" gap="sm" className="mt-6">
            <Title as="label" htmlFor="passport-name" size="sm" leaf tone="secondary">
              여권 영문명
            </Title>
            <Input
              id="passport-name"
              value={passportName}
              onChange={(e) => setPassportName(e.target.value)}
              placeholder="GILDONG HONG"
            />
            <FormMessage type="helper">예약 확정 전 필수 입력입니다.</FormMessage>
          </Stack>

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
      )}

      <ConfirmPopup
        open={Boolean(removeTarget)}
        message="장바구니에서 이 항목을 삭제할까요?"
        onConfirm={() => {
          if (removeTarget) removeItem(removeTarget.cartLineId);
          setRemoveTarget(null);
        }}
        onClose={() => setRemoveTarget(null)}
      />

      <ConfirmPopup
        open={bulkDeleteOpen}
        message={`선택한 ${selectedItems.length}개 항목을 삭제할까요?`}
        onConfirm={() => {
          removeItems(selectedItems.map((line) => line.cartLineId));
          setBulkDeleteOpen(false);
        }}
        onClose={() => setBulkDeleteOpen(false)}
      />
      </div>
    </main>
  );
}
