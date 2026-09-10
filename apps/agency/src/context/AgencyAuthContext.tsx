"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { AgencySession } from "@chinguya/types";

/**
 * 로그인한 여행사 세션 (S2-G2).
 *
 * 토큰 자체는 HttpOnly 쿠키라 JS가 읽을 수 없다. 그래서 "내가 어느 여행사인지"는 BFF
 * (/api/agency/session)에 물어서 알아낸다. 화면은 토큰을 다루지 않고 이 훅만 쓴다.
 *
 * 화면 이동마다 세션을 다시 조회하는 것이 이 앱에서는 단순한 방어가 아니다 — 관리자가
 * 여행사를 '사용 불가'로 바꾸면(S2-A1) Core가 403(AGENCY_INACTIVE)을 내고, 그 순간
 * 여기서 로그인 화면으로 돌려보낸다. JWT는 stateless라 이 조회가 유일한 차단 지점이다.
 */

interface AgencyAuthValue {
  session: AgencySession | null;
  /** 첫 세션 조회가 끝나기 전 true. 이 동안 로그인 여부로 UI를 판단하면 안 된다. */
  loading: boolean;
  login: (loginId: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

/** BFF가 흘려보낸 Core 에러 본문({code, message})을 그대로 메시지로 쓴다. */
export class AgencyAuthError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "AgencyAuthError";
  }
}

const AgencyAuthContext = createContext<AgencyAuthValue | null>(null);

export function AgencyAuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<AgencySession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 로그인·계정 등록 화면에는 조회할 세션이 없다(초대 링크로 들어오는 사람은 아직
    // 계정 자체가 없다).
    if (pathname === "/login") {
      setSession(null);
      setLoading(false);
      return;
    }
    let alive = true;
    fetch("/api/agency/session")
      .then(async (res) => {
        if (!alive) return;
        if (res.ok) {
          setSession(await res.json());
        } else {
          // 401(만료·로그아웃)이든 403(사용 불가)이든 갈 곳은 같다.
          // 실패 응답은 BFF가 이미 쿠키를 지우고 내려준다(route.ts 주석 참고) —
          // 그래야 미들웨어가 /login 을 다시 이곳으로 돌려보내지 않는다.
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
    const res = await fetch("/api/agency/session", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ loginId, password }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new AgencyAuthError(body?.code ?? "UNKNOWN", body?.message ?? "로그인에 실패했습니다.");
    }
    setSession(await res.json());
  }, []);

  const logout = useCallback(async () => {
    await fetch("/api/agency/session", { method: "DELETE" });
    setSession(null);
    router.push("/login");
  }, [router]);

  const value = useMemo(() => ({ session, loading, login, logout }), [session, loading, login, logout]);

  return <AgencyAuthContext.Provider value={value}>{children}</AgencyAuthContext.Provider>;
}

export function useAgencyAuth(): AgencyAuthValue {
  const ctx = useContext(AgencyAuthContext);
  if (!ctx) throw new Error("useAgencyAuth는 AgencyAuthProvider 안에서만 쓸 수 있습니다");
  return ctx;
}
