"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { RentalOptionKey } from "@chinguya/types";

/**
 * 장바구니(S1-C3) 상태. 로그인·서버 저장이 없는 스캐폴드라 React Context로만 들고 있다 —
 * 페이지 이동(클라이언트 라우팅) 중에는 유지되지만 새로고침하면 초기화된다(다른 목업 저장소들과
 * 같은 한계). 실제로는 서버 세션/장바구니 API로 대체될 자리다.
 */
export interface CartLine {
  cartLineId: string;
  productId: string;
  option: RentalOptionKey;
  /** 대여 시작일(YYYY-MM-DD) */
  useDateStart: string;
  /** 2일 옵션일 때만 시작일과 다르다. 그 외엔 useDateStart와 같음 */
  useDateEnd: string;
  qty: number;
  offSiteReturn: boolean;
}

interface CartContextValue {
  items: CartLine[];
  /** 담긴 항목 수(수량 합산 아님 — 라인 개수) */
  addItem: (line: Omit<CartLine, "cartLineId">) => void;
  removeItem: (cartLineId: string) => void;
  /** 여러 항목을 한 번에 지운다(장바구니의 "선택 삭제", 선택 결제 후 정리 등에 사용) */
  removeItems: (cartLineIds: string[]) => void;
  clear: () => void;
  /**
   * 임시 홀드 만료 시각(ms epoch). 장바구니에 처음 담을 때 10분 뒤로 세팅되고, 이후 계속
   * 담아도 갱신되지 않는다(와이어프레임의 "임시 홀드 중 · 남은 시간" 카운트다운과 동일한 목적 —
   * 먼저 담은 항목 기준으로 만료됨).
   */
  holdExpiresAt: number | null;
}

const HOLD_DURATION_MS = 10 * 60 * 1000;

const CartContext = createContext<CartContextValue | null>(null);

let cartLineSeq = 0;

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartLine[]>([]);
  const [holdExpiresAt, setHoldExpiresAt] = useState<number | null>(null);

  const addItem = useCallback((line: Omit<CartLine, "cartLineId">) => {
    cartLineSeq += 1;
    setItems((prev) => [...prev, { ...line, cartLineId: `cart-${cartLineSeq}` }]);
    setHoldExpiresAt((prev) => prev ?? Date.now() + HOLD_DURATION_MS);
  }, []);

  const removeItem = useCallback((cartLineId: string) => {
    setItems((prev) => {
      const next = prev.filter((item) => item.cartLineId !== cartLineId);
      if (next.length === 0) setHoldExpiresAt(null);
      return next;
    });
  }, []);

  const removeItems = useCallback((cartLineIds: string[]) => {
    const idSet = new Set(cartLineIds);
    setItems((prev) => {
      const next = prev.filter((item) => !idSet.has(item.cartLineId));
      if (next.length === 0) setHoldExpiresAt(null);
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setItems([]);
    setHoldExpiresAt(null);
  }, []);

  const value = useMemo(
    () => ({ items, addItem, removeItem, removeItems, clear, holdExpiresAt }),
    [items, addItem, removeItem, removeItems, clear, holdExpiresAt],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart는 CartProvider 안에서만 쓸 수 있습니다");
  return ctx;
}
