"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Title } from "@chinguya/ui/title";
import { Text } from "@chinguya/ui/text";
import { Card } from "@chinguya/ui/card";
import { Stack } from "@chinguya/ui/stack";
import { LabeledBox } from "@chinguya/ui/labeled-box";
import { Input } from "@chinguya/ui/input";
import { Button } from "@chinguya/ui/button";
import { Alert } from "@chinguya/ui/alert";
import { useAdminAuth } from "@/context/AdminAuthContext";

/**
 * 하단 시드 계정 안내를 개발 모드에서만 렌더하기 위한 플래그.
 *
 * Next가 빌드 시점에 NODE_ENV를 상수로 치환하므로, 프로덕션 빌드에서는 해당 블록이
 * 번들에서 통째로 제거된다 — 배포할 때 지우는 걸 잊어도 노출되지 않는다. 시드 계정
 * 자체를 교체·비활성화하는 건 별개 작업이다(V3__admin_auth.sql 의 경고 참고).
 */
const isDev = process.env.NODE_ENV === "development";

/**
 * S0-A2 관리자 로그인.
 *
 * Core API(POST /admin/auth/login)에 인증을 위임한다. 액세스 토큰은 HttpOnly 쿠키로
 * 발급돼 이 화면이 직접 다루지 않고, 로그인 이후 라우트 보호는 middleware.ts가 맡는다.
 * 실패 문구는 서버가 준 message를 그대로 쓴다(계정 존재 여부를 구분하지 않는 문구).
 */
export default function AdminLoginPage() {
  const router = useRouter();
  const { login } = useAdminAuth();
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await login(id, password);
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "로그인에 실패했습니다.");
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center justify-center p-6">
      <Card className="w-full">
        <Stack direction="column" gap="lg">
          <Title size="lg" center>
            친구야 관리자
          </Title>

          <form onSubmit={handleSubmit}>
            <Stack direction="column" gap="md">
              <LabeledBox label="아이디">
                <Input value={id} onChange={(e) => setId(e.target.value)} placeholder="아이디" autoComplete="username" />
              </LabeledBox>

              <LabeledBox label="비밀번호">
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="비밀번호"
                  autoComplete="current-password"
                />
              </LabeledBox>

              {error && (
                <Alert status="error" icon={false}>
                  {error}
                </Alert>
              )}

              <Button type="submit" fullWidth disabled={submitting}>
                {submitting ? "로그인 중…" : "로그인"}
              </Button>
            </Stack>
          </form>

          {isDev && (
            <Text variant="sub" className="text-center">
              개발용 계정 (슈퍼어드민)
              <br />
              아이디: admin
              <br />
              비밀번호: ChinguyaAdmin!2026
            </Text>
          )}
        </Stack>
      </Card>
    </main>
  );
}
