"use client";

import { Suspense } from "react";
import NextLink from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Banner } from "@chinguya/ui/banner";
import { Title } from "@chinguya/ui/title";
import { Text } from "@chinguya/ui/text";
import { Stack } from "@chinguya/ui/stack";
import { completeLogin } from "@/data/authData";
import { SOCIAL_PROVIDER_ORDER, SocialLoginButton } from "@/components/SocialLoginButtons";
import { ScrollReveal } from "@/components/ScrollReveal";

/**
 * 로그인 화면 — 와이어프레임 S0-C1(소셜 로그인)을 재사용한다. 이 앱은 소셜 로그인만 있고
 * 아이디/비밀번호 로그인이 없어서, 실제로는 같은 소셜 인증 화면이 재방문 회원에게는
 * "로그인"으로, 처음 온 사람에게는 "회원가입 시작"으로 동작한다(인증 결과로 기존 계정
 * 여부가 갈림). 지금은 회원을 한 명만 다루는 목업이라 그 구분을 흉내낼 수 없어서, 이 화면은
 * "이미 가입된 회원"으로 가정하고 소셜 버튼을 누르면 바로 completeLogin()으로 로그인
 * 처리한다 — 신규 가입 흐름(S0-C1→S0-C2)은 /signup에서 따로 다룬다. 버튼 자체의
 * 브랜드 스타일(색·로고)은 SocialLoginButtons.tsx에서 다룬다.
 * TODO: 실제 연동 시 소셜 인증 콜백에서 기존 계정이면 로그인 세션 발급, 신규면 가입 흐름으로
 * 분기하도록 교체.
 */
function LoginContent() {
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get("redirect") || "/profile";

  // 소셜 제공자와 무관하게 동일하게 로그인 처리한다(제공자별 분기는 실제 인증 콜백이
  // 붙었을 때 필요해진다) — 그래서 어떤 버튼을 눌렀는지는 받지 않는다.
  const handleSocialLogin = () => {
    completeLogin();
    router.push(redirect);
  };

  return (
    <main>
      <Banner size="sm" title="로그인" image="/banner-notice.png" />

      <div className="mx-auto max-w-md p-6">
        <ScrollReveal>
        <Stack direction="column" gap="lg">
          <Title size="lg" center>
            로그인
          </Title>

          <Stack direction="column" gap="sm">
            {SOCIAL_PROVIDER_ORDER.map((provider) => (
              <SocialLoginButton key={provider} provider={provider} onClick={handleSocialLogin} />
            ))}
          </Stack>

          <Text className="text-center text-sm">
            아직 계정이 없으신가요?{" "}
            <NextLink href="/signup" className="text-secondary-700 underline">
              회원가입
            </NextLink>
          </Text>
        </Stack>
        </ScrollReveal>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  );
}
