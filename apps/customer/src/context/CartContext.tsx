"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  createApiClient,
  ApiError,
  type CustomerCart,
  type CustomerCartItem,
  type CustomerCartItemInput,
} from "@chinguya/api-client";
import { useCustomerAuth } from "@/context/CustomerAuthContext";

/**
 * 장바구니(S1-C3) = 서버의 임시 홀드 목록(GET /v1/cart). 상품 상세·예약(S3-C1/S1-C2)에서 담고,
 * 장바구니·내정보 화면이 읽는다. 계약: packages/api-spec/openapi/chinguya-slice1-openapi.yaml.
 *
 * 담는 순간 재고가 15분 동안 잡히고, 만료된 항목은 서버가 조회할 때 빼 준다. 로그인하지 않았으면
 * 장바구니가 없으므로 빈 장바구니로 둔다(담기는 화면이 로그인으로 보낸다).
 */

const api = createApiClient();

const EMPTY_CART: CustomerCart = { items: [], totalAmount: 0, earliestHoldExpiresAt: null };

interface CartContextValue {
  /** null이면 아직 불러오는 중이다. */
  cart: CustomerCart | null;
  items: CustomerCartItem[];
  loadError: string | null;
  /** 서버 장바구니를 다시 읽는다(만료 정리 반영). 실패하면 loadError에 담고 던지지 않는다. */
  reload: () => Promise<void>;
  /** 실패하면 ApiError를 그대로 던진다 — 화면이 401·409를 구분해 처리한다. */
  addItem: (input: CustomerCartItemInput) => Promise<CustomerCartItem>;
  removeItem: (cartItemId: string) => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { session, loading } = useCustomerAuth();
  const [cart, setCart] = useState<CustomerCart | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setCart(await api.customerCart.get());
      setLoadError(null);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setCart(EMPTY_CART);
        return;
      }
      setLoadError(err instanceof ApiError ? err.message : "장바구니를 불러오지 못했습니다.");
    }
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!session) {
      setCart(EMPTY_CART);
      return;
    }
    void reload();
  }, [session, loading, reload]);

  const addItem = useCallback(
    async (input: CustomerCartItemInput) => {
      const item = await api.customerCart.addItem(input);
      await reload();
      return item;
    },
    [reload],
  );

  const removeItem = useCallback(
    async (cartItemId: string) => {
      await api.customerCart.removeItem(cartItemId);
      await reload();
    },
    [reload],
  );

  const value = useMemo(
    () => ({ cart, items: cart?.items ?? [], loadError, reload, addItem, removeItem }),
    [cart, loadError, reload, addItem, removeItem],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart는 CartProvider 안에서만 쓸 수 있습니다");
  return ctx;
}
