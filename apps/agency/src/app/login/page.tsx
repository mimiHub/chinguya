"use client";

import { Suspense, useEffect, useState, type ReactNode } from "react";
import NextLink from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Title } from "@chinguya/ui/title";
import { Text } from "@chinguya/ui/text";
import { Stack } from "@chinguya/ui/stack";
import { LabeledBox } from "@chinguya/ui/labeled-box";
import { Input } from "@chinguya/ui/input";
import { Button } from "@chinguya/ui/button";
import { Alert } from "@chinguya/ui/alert";
import { findAgencyAccount } from "@/data/authData";
import { AUTH_SLIDES, AUTH_SLIDES_AUTOPLAY_MS, AuthBackgroundSlides } from "@/components/AuthBackgroundSlides";

/**
 * S2-G1/G2 계정 등록(초대 링크) · 로그인.
 *
 * 실제로는 관리자가 보낸 초대 이메일 링크(.../agency/login?token=…)로 들어와 계정을 처음
 * 설정하는 화면과, 등록을 마친 뒤 로그인하는 화면이 서로 다른 시점에 나타나는 별개의
 * 흐름이다 — 회원가입 후 로그인하는 일반적인 흐름과 같다. 그래서 두 폼을 한 화면에
 * 나란히 두지 않고, URL의 초대 토큰(?token=) 유무로 화면을 전환한다: 토큰이 있으면
 * 계정 등록 화면만, 없으면 로그인 화면만 보여준다. 계정 등록을 완료하면 로그인
 * 화면으로 돌아가 방금 만든 아이디로 로그인한다.
 *
 * 배경 슬라이드(banner-pc-1~3.png)와 로고(logo-pc.png)는 고객 앱(apps/customer/public)의
 * 홈 히어로(HomeCarousel.tsx)와 같은 파일을 그대로 가져와 apps/agency/public에 둔 것이다 —
 * 여행사 포털 로그인에서도 같은 브랜드 이미지를 쓰기 위함. 원본이 바뀌면 이 파일들도 같이
 * 갱신한다. 배경은 AuthBackgroundSlides가 5초 간격으로 자동 크로스페이드한다.
 *
 * 로그인 카드는 화면 우측에 붙지만, 초광폭 모니터에서 화면 끝까지 밀리지 않도록 콘텐츠
 * 영역 자체를 1240px 폭 가이드 안에서만 배치한다(배경은 계속 뷰포트 전체를 채운다).
 *
 * 아직 백엔드/세션이 없어서 로그인에 성공해도 상태가 남지 않는다(다른 앱들과 같은 한계).
 * 테스트 계정: agency01 / agency1234.
 */
export default function AgencyLoginPage() {
  return (
    <Suspense fallback={null}>
      <AgencyLoginPageContent />
    </Suspense>
  );
}

function AgencyLoginPageContent() {
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("token");

  if (inviteToken) {
    return <AgencyRegisterScreen />;
  }

  return (
    <AgencyLoginScreen
      registeredId={searchParams.get("id")}
      justRegistered={searchParams.get("registered") === "1"}
    />
  );
}

/**
 * 로그인/계정 등록 공통 뼈대: 전면 배경 슬라이드 위 좌상단 로고 + 우측 카드.
 *
 * 배경(AuthBackgroundSlides)은 뷰포트 전체를 채우지만, 로고·카드가 배치되는 콘텐츠
 * 영역은 max-w-[1240px]로 가운데 정렬한 가이드 안에만 둔다 — 초광폭 모니터에서 카드가
 * 화면 물리적 우측 끝까지 붙어버리는 걸 막기 위함(1240px는 이 두 잣기 요소가 자연스러워
 * 보이는 최대 폭으로 잡은 값).
 */
interface HeroMessage {
  title: string;
  subtitle?: string;
}

function AuthScreenLayout({ children, heroMessage }: { children: ReactNode; heroMessage?: HeroMessage }) {
  const [slideIndex, setSlideIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setSlideIndex((i) => (i + 1) % AUTH_SLIDES.length);
    }, AUTH_SLIDES_AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, []);

  return (
    <main className="relative min-h-screen w-full overflow-hidden">
      <AuthBackgroundSlides index={slideIndex} />

      {/* 배경 사진 위 로고·히어로 문구 글자색(흰색)과의 명도 대비를 확보하기 위한 어두운
          오버레이 — 사진이 밝은 톤이라 drop-shadow만으로는 부족했다. */}
      <div className="absolute inset-0 bg-black/40" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-[1240px] items-center justify-center gap-10 p-6 sm:justify-end">
        {/* 로고 자체가 올리브·갈색 계열의 어두운 톤이라, 히어로 문구용 어두운 오버레이
            위에서는 배경과 색이 비슷해져 잘 안 보인다 — 배경 칩을 대는 대신 CSS 필터
            (brightness-0 invert)로 로고 자체를 흰색으로 바꿔서 히어로 문구와 같은 방식으로
            보이게 한다. */}
        {/* eslint-disable-next-line @next/next/no-img-element -- 고정 로고 이미지, next/image 최적화가 필요 없는 크기 */}
        <img
          src="/logo-pc.png"
          alt="Cafe Chinguya"
          className="absolute left-0 top-8 h-9 w-auto brightness-0 invert drop-shadow"
        />

        {/* 고객 앱 히어로(HomeCarousel.tsx) 문구와 같은 스타일(굵고 큰 흰 글씨 + drop-shadow) —
            위치만 카드 왼쪽 여백으로 옮겼다(고객 히어로는 화면 하단 중앙이지만, 여기는 그
            자리에 점 인디케이터가 있고 카드가 우측에 있어서 그대로 쓰면 겹친다). */}
        {heroMessage && (
          <div className="hidden flex-1 text-center sm:block">
            <p className="whitespace-pre-line text-2xl font-bold leading-tight text-white drop-shadow md:text-4xl">
              {heroMessage.title}
            </p>
            {heroMessage.subtitle && (
              <p className="mt-3 whitespace-pre-line text-base text-white/90 drop-shadow md:text-lg">
                {heroMessage.subtitle}
              </p>
            )}
          </div>
        )}

        <div className="w-full max-w-sm rounded-lg bg-white/95 p-8 shadow-[0_4px_24px_rgba(0,0,0,0.18)] backdrop-blur-sm">
          {children}
        </div>
      </div>

      {/* 히어로 하단 점 인디케이터 — 자동재생과 별개로 눌러서 배너를 직접 넘길 수 있다.
          콘텐츠 레이어(위 div)보다 뒤에 그려서 그 위에 깔리지만, inset-x-0/bottom-6일
          뿐 높이가 없어 카드 클릭을 가리지는 않는다. */}
      <div className="absolute inset-x-0 bottom-6 z-10 flex justify-center gap-1.5">
        {AUTH_SLIDES.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`${i + 1}번째 배너로 이동`}
            onClick={() => setSlideIndex(i)}
            className={`h-1.5 cursor-pointer rounded-full bg-white transition-all ${
              i === slideIndex ? "w-5 opacity-100" : "w-1.5 opacity-50"
            }`}
          />
        ))}
      </div>
    </main>
  );
}

function AgencyRegisterScreen() {
  const router = useRouter();

  const [newId, setNewId] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [registerError, setRegisterError] = useState<string | null>(null);

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
    router.push(`/login?registered=1&id=${encodeURIComponent(newId)}`);
  };

  return (
    <AuthScreenLayout heroMessage={{ title: "환영합니다!", subtitle: "관리자 초대 이메일 링크로 진입했습니다." }}>
      <Title size="xl" center className="!text-xl">계정 등록</Title>

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
    </AuthScreenLayout>
  );
}

function AgencyLoginScreen({ registeredId, justRegistered }: { registeredId: string | null; justRegistered: boolean }) {
  const router = useRouter();

  const [loginId, setLoginId] = useState(registeredId ?? "");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);

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
    <AuthScreenLayout
      heroMessage={
        justRegistered ? { title: "환영합니다!", subtitle: "계정이 등록되었습니다.\n로그인해 주세요." } : undefined
      }
    >
      <Title size="xl" center className="!text-xl">로그인</Title>

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
          <Button type="submit" fullWidth>
            로그인
          </Button>
          <Text variant="sub">테스트 계정: agency01 / agency1234</Text>
        </Stack>
      </form>

      {/* 실제로는 관리자가 보낸 초대 이메일의 토큰 링크로만 등록 화면에 들어간다(자유
          가입 아님). 지금은 그 이메일 발송이 없어서 데모용 토큰으로 바로 이동시킨다 —
          고객 앱의 "회원가입" 링크와 같은 자리·같은 스타일로 맞췄다. */}
      <Text className="mt-4 text-center text-sm">
        아직 계정이 없으신가요?{" "}
        <NextLink href="/login?token=demo" className="text-secondary-700 underline">
          계정 등록
        </NextLink>
      </Text>
    </AuthScreenLayout>
  );
}
