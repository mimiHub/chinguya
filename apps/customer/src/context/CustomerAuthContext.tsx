"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { CustomerSession } from "@chinguya/types";

/**
 * 고객 로그인 세션 (S0-C1~C3).
 *
 * 토큰은 HttpOnly 쿠키라 JS가 읽을 수 없어서 BFF(/api/customer/session)에 물어본다. 화면은
 * 토큰을 다루지 않고 이 훅만 쓴다. 여행사 앱의 AgencyAuthContext 와 같은 구조지만 두 가지가 다르다.
 * - 고객 앱은 비로그인 열람이 되므로, 세션이 없어도 로그인 화면으로 보내지 않는다.
 * - 카카오 로그인은 페이지 전체가 BFF를 거쳐 이동했다 돌아오므로, 세션은 앱이 뜰 때 한 번만
 *   읽으면 된다. 가입(S0-C2)과 로그아웃만 이 컨텍스트가 직접 세션을 바꾼다.
 */

interface CustomerAuthValue {
  session: CustomerSession | null;
  /** 첫 세션 조회가 끝나기 전 true. 이 동안 로그인 여부로 UI를 판단하면 안 된다. */
  loading: boolean;
  /** S0-C2 가입 완료. 실패하면 CustomerAuthError를 던진다. */
  signup: (loginId: string) => Promise<void>;
  logout: () => Promise<void>;
}

/** BFF가 흘려보낸 Core 에러 본문({code, message})을 그대로 메시지로 쓴다. */
export class CustomerAuthError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "CustomerAuthError";
  }
}

const CustomerAuthContext = createContext<CustomerAuthValue | null>(null);

export function CustomerAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<CustomerSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    fetch("/api/customer/session")
      .then(async (res) => {
        if (alive && res.ok) setSession(await res.json());
      })
      // 네트워크 오류면 비로그인 상태로 보인다.
      .catch(() => {})
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const signup = useCallback(async (loginId: string) => {
    const res = await fetch("/api/customer/session/signup", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ loginId }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new CustomerAuthError(body?.code ?? "UNKNOWN", body?.message ?? "가입에 실패했습니다.");
    }
    setSession(await res.json());
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/customer/session", { method: "DELETE" });
    setSession(null);
  }, []);

  const value = useMemo(() => ({ session, loading, signup, logout }), [session, loading, signup, logout]);

  return <CustomerAuthContext.Provider value={value}>{children}</CustomerAuthContext.Provider>;
}

export function useCustomerAuth(): CustomerAuthValue {
  const ctx = useContext(CustomerAuthContext);
  if (!ctx) throw new Error("useCustomerAuth는 CustomerAuthProvider 안에서만 쓸 수 있습니다");
  return ctx;
}
