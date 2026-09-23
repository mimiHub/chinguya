"use client";

import { Suspense, useState } from "react";
import NextLink from "next/link";
import { useSearchParams } from "next/navigation";
import { Banner, Title, Text, Stack, Toast } from "@chinguya/ui";
import { SocialLoginButtons } from "@/components/SocialLoginButtons";
import { ScrollReveal } from "@/components/ScrollReveal";
import { AuthBackdrop } from "@/components/AuthBackdrop";

/**
 * 로그인 화면 — 와이어프레임 S0-C1(소셜 로그인)을 재사용한다. 이 앱은 소셜 로그인만 있고
 * 아이디/비밀번호 로그인이 없다.
 *
 * 카카오 버튼을 누르면 카카오 동의를 거쳐 콜백(/api/customer/kakao/callback)에서 가입 여부로
 * 갈린다 — 가입된 회원은 바로 `redirect`로, 처음 온 사람은 아이디 입력(/signup?step=id, S0-C2)으로
 * 간다. 그래서 /signup 과 같은 버튼을 쓴다. 카카오 인증이 실패하면 콜백이 `?error=kakao`를
 * 붙여 이 화면으로 돌려보낸다.
 */
function LoginContent() {
  const params = useSearchParams();
  const redirect = params.get("redirect") || "/profile";
  const [failed, setFailed] = useState(() => params.get("error") === "kakao");

  return (
    // relative + min-h-[inherit]: 하단 배경 그림(AuthBackdrop)이 화면 바닥에 붙도록 한 화면 높이를 이어받는다.
    // overflow-hidden: 그림이 main 밖으로 삐져나가 푸터를 덮지 않게.
    <main className="relative min-h-[inherit] overflow-hidden">
      <Banner size="sm" title="로그인" image="/banner-notice.png" />

      <div className="relative z-10 mx-auto max-w-md p-6">
        <ScrollReveal>
        <Stack direction="column" gap="lg">
          <Title size="lg" center>
            로그인
          </Title>

          <SocialLoginButtons redirect={redirect} />

          <Text className="text-center text-sm">
            아직 계정이 없으신가요?{" "}
            <NextLink href="/signup" className="text-secondary-700 underline">
              회원가입
            </NextLink>
          </Text>
        </Stack>
        </ScrollReveal>
      </div>

      <AuthBackdrop />

      <Toast
        open={failed}
        onClose={() => setFailed(false)}
        message="카카오 로그인에 실패했어요. 다시 시도해 주세요."
        status="error"
      />
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
