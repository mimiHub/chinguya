"use client";

import { useEffect, useState } from "react";

export function MswProvider({ children }: { children: React.ReactNode }) {
  const enabled = process.env.NEXT_PUBLIC_API_MOCKING === "enabled";
  const [ready, setReady] = useState(!enabled);

  useEffect(() => {
    if (!enabled) return;
    let on = true;
    import("@chinguya/mocks/browser").then(async ({ worker }) => {
      await worker.start({ onUnhandledRequest: "warn" });
      if (on) setReady(true);
    });
    return () => {
      on = false;
    };
  }, [enabled]);

  if (!ready) return null;
  return <>{children}</>;
}
