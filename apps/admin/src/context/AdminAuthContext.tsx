"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { AdminSession } from "@chinguya/types";

/**
 * 로그인한 관리자 세션 (S0-A2).
 *
 * 토큰 자체는 HttpOnly 쿠키라 JS가 읽을 수 없다. 그래서 "내가 누구인지"는 BFF
 * (/api/admin/session)에 물어서 알아낸다. 화면은 토큰을 다루지 않고 이 훅만 쓴다.
 */

interface AdminAuthValue {
  session: AdminSession | null;
  /** 첫 세션 조회가 끝나기 전 true. 이 동안 로그인 여부로 UI를 판단하면 안 된다. */
  loading: boolean;
  /** 쓰기 권한 여부. 서버가 403으로 최종 강제하므로 UI 정합용이다. */
  isSuperAdmin: boolean;
  login: (loginId: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

/** BFF가 흘려보낸 Core 에러 본문({code, message})을 그대로 메시지로 쓴다. */
export class AdminAuthError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "AdminAuthError";
  }
}

const AdminAuthContext = createContext<AdminAuthValue | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<AdminSession | null>(null);
  const [loading, setLoading] = useState(true);

  // 진입·새로고침 때 세션을 확인한다. 미들웨어는 쿠키 유무만 보므로 만료된 토큰은
  // 여기서 걸러진다. 로그인 화면에서는 조회할 세션이 없으니 건너뛴다.
  useEffect(() => {
    if (pathname === "/login") {
      setSession(null);
      setLoading(false);
      return;
    }
    let alive = true;
    fetch("/api/admin/session")
      .then(async (res) => {
        if (!alive) return;
        if (res.ok) {
          setSession(await res.json());
        } else {
          setSession(null);
          router.replace("/login");
        }
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [pathname, router]);

  const login = useCallback(async (loginId: string, password: string) => {
    const res = await fetch("/api/admin/session", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ loginId, password }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new AdminAuthError(body?.code ?? "UNKNOWN", body?.message ?? "로그인에 실패했습니다.");
    }
    setSession(await res.json());
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/admin/session", { method: "DELETE" });
    setSession(null);
    router.push("/login");
  }, [router]);

  const value = useMemo(
    () => ({ session, loading, isSuperAdmin: session?.role === "SUPER_ADMIN", login, logout }),
    [session, loading, login, logout],
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth(): AdminAuthValue {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth는 AdminAuthProvider 안에서만 쓸 수 있습니다");
  return ctx;
}
