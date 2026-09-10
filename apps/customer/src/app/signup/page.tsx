"use client";

import { Suspense, useState } from "react";
import NextLink from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Banner } from "@chinguya/ui/banner";
import { Title } from "@chinguya/ui/title";
import { Text } from "@chinguya/ui/text";
import { Stack } from "@chinguya/ui/stack";
import { Button } from "@chinguya/ui/button";
import { Input } from "@chinguya/ui/input";
import { FormMessage } from "@chinguya/ui/form-message";
import { Alert } from "@chinguya/ui/alert";
import { completeLogin, getPendingProvider, startSocialLogin, type SocialProvider } from "@/data/authData";
import { completeMemberSignup } from "@/data/memberData";
import { SOCIAL_PROVIDER_ORDER, SocialLoginButton } from "@/components/SocialLoginButtons";
import { ScrollReveal } from "@/components/ScrollReveal";

/**
 * 회원가입 — 와이어프레임 S0-C1(소셜 로그인) → S0-C2(아이디 입력) 2단계 흐름. 화면 두 개를
 * 별도 라우트로 나누지 않고 이 페이지 안에서 step으로 전환한다 — 와이어프레임에서도 둘 다
 * 같은 "계정" 그룹 아래 나란히 있고, 하나로 이어지는 가입 흐름("SIGN UP · 1/2")이라 URL이
 * 바뀔 이유가 없기 때문이다. 소셜 버튼의 브랜드 스타일(색·로고)은 SocialLoginButtons.tsx에서
 * 다룬다.
 */
function SignupContent() {
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get("redirect") || "/profile";

  const [step, setStep] = useState<"social" | "id">("social");
  const [loginId, setLoginId] = useState("");
  const [idError, setIdError] = useState<string | null>(null);

  const handleSocialLogin = (provider: SocialProvider) => {
    startSocialLogin(provider);
    setStep("id");
  };

  const handleComplete = () => {
    const trimmed = loginId.trim();
    if (!trimmed) {
      setIdError("아이디를 입력해 주세요.");
      return;
    }
    setIdError(null);
    completeMemberSignup(trimmed, getPendingProvider() ?? "카카오");
    completeLogin();
    router.push(redirect);
  };

  return (
    <main>
      <Banner size="sm" title="회원가입" image="/banner-notice.png" />

      <div className="mx-auto max-w-md p-6">
        <ScrollReveal>
        <Stack direction="column" gap="lg">
          <Title size="lg" center>
            회원가입
          </Title>

          {step === "social" ? (
            // "소셜 제공자는 추후 확장 가능한 구조" 같은 문구는 기획서(와이어프레임)에만 있는
            // 개발자용 설명이라 실제 고객 화면에는 넣지 않는다 — 여기는 소셜 버튼만 보여준다.
            <Stack direction="column" gap="sm">
              {SOCIAL_PROVIDER_ORDER.map((provider) => (
                <SocialLoginButton key={provider} provider={provider} onClick={() => handleSocialLogin(provider)} />
              ))}
            </Stack>
          ) : (
            <Stack direction="column" gap="sm">
              <Title as="label" htmlFor="signup-id" size="sm" leaf tone="secondary">
                아이디
              </Title>
              <Input
                id="signup-id"
                value={loginId}
                onChange={(e) => {
                  setLoginId(e.target.value);
                  if (idError) setIdError(null);
                }}
                placeholder="아이디를 입력해 주세요"
              />
              {idError ? (
                <FormMessage type="error">{idError}</FormMessage>
              ) : (
                <Alert status="info" icon={false}>
                  여권 영문명은 예약 시점에 따로 받아요. 지금은 아이디만 입력하면 돼요.
                </Alert>
              )}
              <Button onClick={handleComplete} fullWidth className="mt-2">
                가입 완료
              </Button>
            </Stack>
          )}

          <Text className="text-center text-sm">
            이미 계정이 있으신가요?{" "}
            <NextLink href="/login" className="text-secondary-700 underline">
              로그인
            </NextLink>
          </Text>
        </Stack>
        </ScrollReveal>
      </div>
    </main>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupContent />
    </Suspense>
  );
}
