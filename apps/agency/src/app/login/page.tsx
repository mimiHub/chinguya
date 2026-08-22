"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Title } from "@chinguya/ui/title";
import { Text } from "@chinguya/ui/text";
import { Stack } from "@chinguya/ui/stack";
import { LabeledBox } from "@chinguya/ui/labeled-box";
import { Input } from "@chinguya/ui/input";
import { Button } from "@chinguya/ui/button";
import { Alert } from "@chinguya/ui/alert";
import { findAgencyAccount } from "@/data/authData";

/**
 * S2-G1/G2 계정 등록(초대 링크) · 로그인. 실제로는 관리자가 보낸 초대 이메일 링크
 * (.../agency/invite?token=…)로 들어와 계정을 처음 설정하는 화면과, 등록 후 로그인하는 화면이
 * 한 페이지에 나란히 있다 — 왼쪽이 신규 등록, 오른쪽이 기존 계정 로그인이다.
 *
 * 아직 백엔드/세션이 없어서 로그인에 성공해도 상태가 남지 않는다(다른 앱들과 같은 한계).
 * 테스트 계정: agency01 / agency1234.
 */
export default function AgencyLoginPage() {
  const router = useRouter();

  const [newId, setNewId] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [registerError, setRegisterError] = useState<string | null>(null);

  const [loginId, setLoginId] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newId.trim() || !newPassword) {
      setRegisterError("아이디와 비밀번호를 입력해 주세요.");
      return;
    }
    if (newPassword !== newPasswordConfirm) {
      setRegisterError("비밀번호가 일치하지 않습니다.");
      return;
    }
    // TODO: 실제 연동 시 초대 토큰과 함께 POST /api/agency/invite/complete 호출로 교체.
    setRegisterError(null);
    router.push("/");
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const account = findAgencyAccount(loginId, loginPassword);
    if (!account) {
      setLoginError("아이디 또는 비밀번호가 올바르지 않습니다.");
      return;
    }
    setLoginError(null);
    // TODO: 실제 연동 시 여기서 세션/토큰을 저장한다.
    router.push("/");
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl items-center justify-center p-6">
      <div className="w-full overflow-hidden rounded-lg border border-line bg-white shadow-[0_2px_10px_rgba(0,0,0,0.05)]">
        <div className="flex flex-col md:flex-row">
          <div className="flex-1 border-b border-line p-8 md:border-b-0 md:border-r">
            <Title size="md" subtitle="관리자 초대 이메일 링크로 진입했습니다">
              계정 등록
            </Title>

            <form onSubmit={handleRegister} className="mt-6">
              <Stack direction="column" gap="md">
                <LabeledBox label="아이디">
                  <Input value={newId} onChange={(e) => setNewId(e.target.value)} placeholder="사용할 아이디" />
                </LabeledBox>
                <LabeledBox label="비밀번호">
                  <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" />
                </LabeledBox>
                <LabeledBox label="비밀번호 확인">
                  <Input
                    type="password"
                    value={newPasswordConfirm}
                    onChange={(e) => setNewPasswordConfirm(e.target.value)}
                    placeholder="••••••••"
                  />
                </LabeledBox>
                {registerError && (
                  <Alert status="error" icon={false}>
                    {registerError}
                  </Alert>
                )}
                <Button type="submit" fullWidth>
                  계정 등록 완료
                </Button>
                <Text variant="sub">링크 유효기간은 1주일입니다.</Text>
              </Stack>
            </form>
          </div>

          <div className="flex-1 bg-bg-light p-8">
            <Title size="md">로그인 (등록 후)</Title>

            <form onSubmit={handleLogin} className="mt-6">
              <Stack direction="column" gap="md">
                <LabeledBox label="아이디">
                  <Input value={loginId} onChange={(e) => setLoginId(e.target.value)} placeholder="agency01" autoComplete="username" />
                </LabeledBox>
                <LabeledBox label="비밀번호">
                  <Input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                </LabeledBox>
                {loginError && (
                  <Alert status="error" icon={false}>
                    {loginError}
                  </Alert>
                )}
                <Button type="submit" variant="secondary" fullWidth>
                  로그인
                </Button>
                <Text variant="sub">테스트 계정: agency01 / agency1234</Text>
              </Stack>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
