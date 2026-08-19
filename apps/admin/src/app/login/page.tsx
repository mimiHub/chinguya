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
import { findAdminAccount } from "@/data/authData";

/**
 * S0-A2 관리자 로그인.
 *
 * 아직 실제 백엔드/세션이 없어서 로그인에 성공해도 "로그인 상태"가 남지 않는다(새로고침하면
 * 풀림) — 지금은 대시보드로 이동하는 화면 흐름만 만들어둔 것이고, 실제 세션/토큰 저장과
 * "로그인 안 하면 다른 화면 접근 못 하게 막기"(라우트 보호)는 다음 단계에서 붙인다.
 * 테스트 계정: admin1 / admin1234 (일반 관리자), super1 / super1234 (슈퍼어드민).
 */
export default function AdminLoginPage() {
  const router = useRouter();
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const account = findAdminAccount(id, password);
    if (!account) {
      setError("아이디 또는 비밀번호가 올바르지 않습니다.");
      return;
    }
    setError(null);
    // TODO: 실제 연동 시 여기서 세션/토큰을 저장하고, 이후 각 화면에서 로그인 여부를 확인한다.
    router.push("/");
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

              <Button type="submit" fullWidth>
                로그인
              </Button>
            </Stack>
          </form>

          <Text variant="sub" className="text-center">
            테스트 계정: admin1 / admin1234 (관리자), super1 / super1234 (슈퍼어드민)
          </Text>
        </Stack>
      </Card>
    </main>
  );
}
