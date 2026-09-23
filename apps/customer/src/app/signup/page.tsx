"use client";

import { Suspense, useState } from "react";
import NextLink from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CUSTOMER_LOGIN_ID_PATTERN } from "@chinguya/types";
import { Banner, Title, Text, Stack, Button, Input, FormMessage, Alert } from "@chinguya/ui";
import { CustomerAuthError, useCustomerAuth } from "@/context/CustomerAuthContext";
import { SocialLoginButtons } from "@/components/SocialLoginButtons";
import { ScrollReveal } from "@/components/ScrollReveal";
import { AuthBackdrop } from "@/components/AuthBackdrop";

/**
 * 회원가입 — 와이어프레임 S0-C1(소셜 로그인) → S0-C2(아이디 입력) 2단계 흐름. 화면 두 개를
 * 별도 라우트로 나누지 않고 이 페이지 안에서 step으로 전환한다 — 와이어프레임에서도 둘 다
 * 같은 "계정" 그룹 아래 나란히 있고, 하나로 이어지는 가입 흐름("SIGN UP · 1/2")이기 때문이다.
 *
 * S0-C1 단계의 카카오 버튼은 카카오 동의 화면으로 나갔다가 콜백으로 돌아온다. 처음 온 사람이면
 * 콜백이 가입 쿠키를 심고 `?step=id`로 이 페이지에 돌려보내므로, step은 URL에서 읽는다(이미
 * 가입된 회원이면 콜백이 바로 로그인시켜 여기로 오지 않는다). 소셜 버튼의 브랜드 스타일(색·로고)은
 * SocialLoginButtons.tsx에서 다룬다.
 */
function SignupContent() {
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get("redirect") || "/profile";
  const step = params.get("step") === "id" ? "id" : "social";
  const { signup } = useCustomerAuth();

  const [loginId, setLoginId] = useState("");
  const [idError, setIdError] = useState<string | null>(null);
  // 가입 쿠키가 만료(10분)되면 아이디를 다시 입력해도 소용없어서, 카카오 인증부터 다시 하게 안내한다.
  const [signupExpired, setSignupExpired] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleComplete = async () => {
    if (submitting) return;
    const trimmed = loginId.trim();
    if (!CUSTOMER_LOGIN_ID_PATTERN.test(trimmed)) {
      setIdError("아이디는 영문 소문자와 숫자 4~20자로 입력해 주세요.");
      return;
    }
    setIdError(null);
    setSubmitting(true);
    try {
      await signup(trimmed);
      router.push(redirect);
    } catch (e) {
      setIdError(e instanceof CustomerAuthError ? e.message : "가입에 실패했습니다. 다시 시도해 주세요.");
      setSignupExpired(e instanceof CustomerAuthError && e.code === "SIGNUP_TOKEN_INVALID");
      setSubmitting(false);
    }
  };

  return (
    // relative + min-h-[inherit]: 하단 배경 그림(AuthBackdrop)이 화면 바닥에 붙도록 한 화면 높이를 이어받는다.
    // overflow-hidden: 그림이 main 밖으로 삐져나가 푸터를 덮지 않게.
    <main className="relative min-h-[inherit] overflow-hidden">
      <Banner size="sm" title="회원가입" image="/banner-notice.png" />

      <div className="relative z-10 mx-auto max-w-md p-6">
        <ScrollReveal>
        <Stack direction="column" gap="lg">
          <Title size="lg" center>
            회원가입
          </Title>

          {step === "social" ? (
            // "소셜 제공자는 추후 확장 가능한 구조" 같은 문구는 기획서(와이어프레임)에만 있는
            // 개발자용 설명이라 실제 고객 화면에는 넣지 않는다 — 여기는 소셜 버튼만 보여준다.
            <SocialLoginButtons redirect={redirect} />
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
                placeholder="영문 소문자·숫자 4~20자"
              />
              {idError ? (
                <FormMessage type="error">{idError}</FormMessage>
              ) : (
                <Alert status="info" icon={false}>
                  아이디는 가입 후에 바꿀 수 없어요. 여권 영문명은 예약 시점에 따로 받아요.
                </Alert>
              )}
              {signupExpired && (
                <NextLink
                  href={`/signup?redirect=${encodeURIComponent(redirect)}`}
                  className="text-sm text-secondary-700 underline"
                >
                  카카오 인증 다시 하기
                </NextLink>
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

      <AuthBackdrop />
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
