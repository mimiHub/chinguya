"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Title,
  Text,
  Card,
  Stack,
  LabeledBox,
  Input,
  Button,
  Toast,
  Kv,
  Badge,
} from "@chinguya/ui";
import { useAdminAuth } from "@/context/AdminAuthContext";

// 배경 사진(모바일·PC 공통) 위에 흩뿌려 반짝이게 할 별 위치 — 고정값으로 충분한 장식용이라
// Math.random 대신 하드코딩한다(SSR 렌더와 클라이언트 렌더가 값을 다르게 뽑으면 하이드레이션
// 경고가 난다). 애니메이션은 공용 토큰 --animate-twinkle(theme.css) — 홈 카테고리 카드 사진
// 위의 반짝이는 점(apps/customer/src/app/page.tsx STARS)과 같은 효과를 재사용한다.
const NIGHT_SKY_STARS = [
  { top: "4%", left: "8%", size: 2, delay: "0s" },
  { top: "9%", left: "34%", size: 3, delay: "1.2s" },
  { top: "6%", left: "58%", size: 2, delay: "2s" },
  { top: "13%", left: "78%", size: 3, delay: "0.6s" },
  { top: "3%", left: "92%", size: 2, delay: "1.8s" },
  { top: "20%", left: "18%", size: 3, delay: "0.9s" },
  { top: "24%", left: "46%", size: 2, delay: "2.3s" },
  { top: "18%", left: "68%", size: 2, delay: "0.3s" },
  { top: "28%", left: "88%", size: 3, delay: "1.5s" },
  { top: "32%", left: "6%", size: 2, delay: "2.1s" },
  { top: "36%", left: "28%", size: 2, delay: "0.7s" },
  { top: "40%", left: "52%", size: 3, delay: "1.4s" },
  { top: "34%", left: "74%", size: 2, delay: "0.2s" },
  { top: "44%", left: "92%", size: 2, delay: "1.9s" },
  { top: "48%", left: "14%", size: 2, delay: "1.1s" },
  { top: "52%", left: "40%", size: 3, delay: "2.5s" },
  { top: "46%", left: "62%", size: 2, delay: "0.5s" },
  { top: "56%", left: "84%", size: 2, delay: "1.7s" },
  { top: "8%", left: "4%", size: 2, delay: "1.0s" },
  { top: "60%", left: "22%", size: 2, delay: "2.2s" },
];

/**
 * 하단 시드 계정 안내(chinguya-api 의 db/seed-dev/R__dev_seed.sql)를 개발 모드에서만 렌더하기 위한 플래그.
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
/**
 * 로그인 실패 안내는 폼 안에 계속 남는 인라인 박스 대신 Toast(공용 상태 메시지)로 띄운다 —
 * 실패해도 카드 레이아웃이 늘어나지 않고, 다른 화면의 성공/실패 알림과 톤이 통일된다. 다만
 * 서버 메시지가 "아이디 또는 비밀번호가 올바르지 않습니다" 식으로 어느 필드가 틀렸는지
 * 특정하지 않으므로(계정 존재 여부를 구분하지 않기 위한 의도적 설계), 두 입력창 모두에
 * error 테두리를 켜서 "여기를 다시 확인하라"는 걸 시각적으로 같이 알려준다.
 */
export default function AdminLoginPage() {
  const router = useRouter();
  const { login } = useAdminAuth();
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  // 시드 계정 안내는 기본은 접어두고(로그인 카드가 이 안내 때문에 너무 길어져 있었다),
  // 필요할 때만 펼쳐 보게 한다. FAQ 아코디언(apps/customer/contact/page.tsx openFaqId)과
  // 같은 +/− 토글 버튼 패턴을 재사용했다.
  const [showSeedAccounts, setShowSeedAccounts] = useState(false);

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
    // h-full: 로그인 화면은 헤더·하단탭이 없어 레이아웃(layout.tsx)의 공용 스크롤
    // 컨테이너가 화면 높이를 그대로 이 main에 내주는데, 그 컨테이너엔 원래 BottomNav
    // 자리를 비워두는 pb-16(모바일)이 붙어 있다. min-h-screen(100vh 고정)을 쓰면
    // "뷰포트 전체 + 그 pb-16"만큼을 요구하게 돼 컨테이너 높이를 넘겨 세로 스크롤이
    // 생겼었다 — h-full로 그 컨테이너가 실제로 내준 높이에 맞춰 스크롤은 없앴다.
    <main className="relative flex h-full items-center justify-center p-6">
      {/* 배경 이미지 + 어두운 오버레이 + 별 — absolute(부모 main 기준) 대신 fixed(뷰포트
          기준)로 깐다. main은 위 pb-16 때문에 실제 뷰포트보다 살짝 짧아서, absolute로
          두면 main 박스 아래로 그 pb-16만큼 배경이 안 덮인 여백이 그대로 보였다. fixed는
          부모 높이·패딩과 무관하게 항상 뷰포트 전체를 채우므로 그 여백까지 이미지로
          덮인다. 로그인 카드(Card)는 그대로 일반 흐름(relative)에 남아 main의 flex
          중앙 정렬을 따른다.
          오버레이를 카드보다 아래(배경 바로 위) 레이어에 둬야 카드 테두리·그림자가
          묻히지 않는다. 모바일은 세로 구도로 찍힌 별도 이미지(login-bg-mobile.jpg)를
          쓰고, md 이상(태블릿·PC)은 가로 구도 이미지(login-bg.jpg)를 쓴다 — 같은
          사진이라도 가로/세로 원본이 서로 달라 한쪽 화면비로만 두면 구도가 잘려
          나간다. */}
      <div
        className="fixed inset-0 bg-cover bg-center md:hidden"
        style={{ backgroundImage: "url(/login-bg-mobile.jpg)" }}
        aria-hidden="true"
      />
      <div
        className="fixed inset-0 hidden bg-cover bg-center md:block"
        style={{ backgroundImage: "url(/login-bg.jpg)" }}
        aria-hidden="true"
      />
      <div className="fixed inset-0 bg-black/60" aria-hidden="true" />

      {/* 밤하늘 반짝이는 별 — 오버레이 위에 그려야 어두워진 하늘 톤 위에서도 또렷하게
          반짝인다. 모바일·PC 배경 이미지 둘 다 하늘이 화면 상단~중단에 있어 같은 좌표를
          공유해도 어색하지 않다. */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        {NIGHT_SKY_STARS.map((star, i) => (
          <span
            key={i}
            className="animate-twinkle absolute rounded-full bg-white opacity-0 shadow-[0_0_4px_1px_rgba(255,255,255,0.85)]"
            style={{
              top: star.top,
              left: star.left,
              width: star.size,
              height: star.size,
              animationDelay: star.delay,
            }}
          />
        ))}
      </div>

      {/* 로그인 카드 — 반투명 남색 유리 느낌으로 별이 총총한 배경 위에 뜬 카드.
          Card는 배경·테두리색·그림자를 클래스 하나로 통째로 고르는 구조라(위 tint/shadow
          prop 주석 참고) 이렇게 사진 배경에 맞춘 반투명 색은 className을 덧붙이는 대신
          shadow={false}·padding="none"으로 기본 클래스를 비우고 style로 직접 지정한다
          (inline style이 항상 class보다 우선이라 값이 확실히 반영된다).
          - 배경: 사용자가 고른 #000e1e7d(짙은 남색, 반투명)를 그대로 살리되 살짝만 진하게
            해서(0.58) 별·산 실루엣이 배경에 비치는 유리질감은 유지하면서 입력칸 글자
            대비는 더 확보했다.
          - 테두리: #222(무채색 회색)는 이 남색 배경 위에서 거의 안 보이고 사진 톤과도
            안 어울려서, 옅은 흰색 라인(rgba(255,255,255,.12))으로 바꿨다 — 유리 카드
            가장자리가 달빛을 받아 살짝 빛나는 느낌.
          - 그림자: 사용자가 고른 #101821 글로우는 배경(#000e1e)과 색이 미묘하게 달라
            따로 놀았다. 배경과 같은 남색 계열로 맞추고(rgba(6,14,28,.6)) 카드가 어두운
            하늘 속에 자연스럽게 스며들게 했다.
          - backdrop-blur를 더해 카드 뒤 사진이 반투명 배경을 그대로 뚫고 보이지 않고
            살짝 흐려지게 했다 — 입력칸 글자 가독성 보강용(색감 조정과 별개로 추가한 것,
            빼고 싶으면 이 클래스만 제거하면 됨). */}
      {/* 로그인 카드 + 달맞이 고양이 마스코트를 한 wrapper로 묶는다 — 고양이를 카드 위에
          "얹힌" 것처럼 겹쳐 보이게 하려면 카드 기준으로 absolute 배치해야 하는데, Card
          자신에 걸린 max-w-md는 그대로 두고 이 wrapper에서 폭을 잡아야 고양이가 카드
          가로 중앙에 정확히 맞는다. */}
      <div className="relative w-full max-w-md">
        {/* 달을 보는 고양이 — 카드 상단 테두리 선 위에 걸터앉은 것처럼 배치(참고 시안
            이미지 기준, 카드 안쪽으로 많이 파고들지 않고 꼬리 끝만 살짝 걸치는 정도).
            원래 꼬리만 움직이는 애니메이션을 넣었었는데(mask + opacity 순간전환 3레이어),
            직접 보니 움직임 자체가 부자연스럽다는 피드백으로 애니메이션은 걷어내고
            login-cat-a.png 한 장만 고정으로 둔다.
            고양이 자체는 고정이지만, 정수리 쪽(머리 꼭대기 중앙)에 작은 하트를 하나 얹어서
            --animate-heart-pop(theme.css)으로 반짝 나타났다 사라지길 반복하게 했다 —
            도형은 next/image 최적화가 의미 없는 아주 작은 장식이라 색을 자유롭게 바꿀 수
            있는 인라인 SVG로 직접 그렸다(이미지 파일 없이). 이 wrapper는 고양이 이미지와
            하트를 같은 좌표계에 놓기 위한 것일 뿐, 아래 절대 위치 값은 전부 이전의
            고양이 단독 배치값(top-0 -translate-y-[92%])을 그대로 옮겨온 것이다.
            하트의 translate-x가 정확히 중앙(-50%)이 아니라 +7px만큼 오른쪽으로 치우친
            이유: login-cat-a.png는 꼬리까지 포함해 내용물에 딱 맞게 잘라둔 이미지라
            (union bbox 크롭) 캔버스 자체가 좌우 대칭이 아니다 — 꼬리가 왼쪽으로 더 많이
            뻗어 있어서 이미지/박스의 가로 중앙이 실제 "머리" 중앙보다 왼쪽에 있다(직접
            픽셀로 재보면 캔버스 중앙 대비 머리 중앙이 약 6~7px 오른쪽). 그래서 하트를
            단순히 박스 중앙에 두면 머리보다 왼쪽으로 치우쳐 보였다 — 이 오프셋으로
            보정했다. 장식 요소라 pointer-events-none + aria-hidden 처리. */}
        <div
          className="pointer-events-none absolute left-1/2 top-0 z-10 h-24 w-16 -translate-x-1/2 -translate-y-[92%]"
          aria-hidden="true"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- 고정 크기(96x64) 장식용 마스코트, next/image 최적화 불필요 */}
          <img
            src="/login-cat-a.png"
            alt=""
            className="absolute inset-0 h-full w-full object-contain object-bottom drop-shadow-[0_4px_10px_rgba(0,0,0,0.45)]"
          />
          <svg
            viewBox="0 0 24 24"
            fill="#ff8fab"
            className="animate-heart-pop absolute -top-[6px] left-1/2 h-3.5 w-3.5 translate-x-[calc(-50%+7px)] drop-shadow-[0_0_4px_rgba(255,143,171,0.85)]"
          >
            <path d="M12,21.35l-1.45-1.32C5.4,15.36,2,12.28,2,8.5 2,5.42,4.42,3,7.5,3c1.74,0,3.41,0.81,4.5,2.09C13.09,3.81,14.76,3,16.5,3 19.58,3,22,5.42,22,8.5c0,3.78-3.4,6.86-8.55,11.54L12,21.35z" />
          </svg>
        </div>

        <Card
          padding="none"
          shadow={false}
          className="relative w-full backdrop-blur-md"
          style={{
            backgroundColor: "rgba(0, 14, 30, 0.2)",
            borderColor: "rgba(255, 255, 255, 0.12)",
            boxShadow: "0 0 48px rgba(6, 14, 28, 0.6)",
            padding: "25px",
          }}
        >
          <Stack direction="column" gap="lg">
            <Title size="lg" center>
              친구야 관리자
            </Title>

            <form onSubmit={handleSubmit}>
              <Stack direction="column" gap="md">
                <LabeledBox label="아이디">
                  {/* Input 기본 배경(bg-surface)은 baseFieldClass에 고정으로 박혀 있어(input.tsx
                    주석 참고) className으로 다른 bg-*를 덧붙이면 어느 게 이길지 보장이 안 된다
                    — Card를 반투명 남색으로 바꿀 때와 같은 이유로, 여기도 style로 직접 투명하게
                    지정한다(인라인 style이 항상 클래스보다 우선). 테두리(border-line)는 그대로
                    둬서 입력칸 경계는 여전히 보인다. */}
                  <Input
                    value={id}
                    onChange={(e) => setId(e.target.value)}
                    placeholder="아이디"
                    autoComplete="username"
                    error={!!error}
                    style={{ backgroundColor: "transparent" }}
                  />
                </LabeledBox>

                <LabeledBox label="비밀번호">
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="비밀번호"
                    autoComplete="current-password"
                    error={!!error}
                    style={{ backgroundColor: "transparent" }}
                  />
                </LabeledBox>

                <Button type="submit" fullWidth disabled={submitting}>
                  {submitting ? "로그인 중…" : "로그인"}
                </Button>
              </Stack>
            </form>

            {/* 개발용 시드 계정 안내 — 예전엔 <dl>을 그냥 맨몸으로 던져놔서(위 히스토리 참고)
              라벨/값 구분이 시각적으로 전혀 없었고, 그다음엔 항상 펼쳐진 상태라 로그인
              카드 자리를 너무 많이 차지했다. FAQ 아코디언과 같은 +/− 토글 버튼으로 헤더만
              누르면 펼쳐지게 했었는데, 그 방식(내용이 문서 흐름 안에서 그대로 펼쳐짐)은
              Card 높이를 늘려버려서, main이 로그인 카드를 화면 세로 중앙에 정렬하는
              구조상 카드가 커질 때마다 카드 전체(로그인 폼·고양이까지)가 위로 쓸려
              올라가 보이는 문제가 있었다. 그래서 Dropdown 컴포넌트(dropdown.tsx)와 같은
              패턴으로 바꿨다 — 펼쳐지는 내용을 문서 흐름에 끼워 넣는 대신 absolute로
              버튼 바로 아래에 "띄워서" 그린다. 문서 흐름에 안 끼기 때문에 Card 자기
              높이는 열려도 절대 안 바뀌고, 그 결과 카드도 로그인 폼도 위로 밀리지 않는다
              — 대신 카드 테두리 밖(카드 아래 사진 배경 위)으로 드롭다운처럼 내려와 겹쳐
              보인다. 카드의 반투명 유리 배경과 달리 사진 위에 바로 뜨는 패널이라 글자
              가독성을 위해 배경을 훨씬 불투명하게 줬다. */}
            {isDev && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowSeedAccounts((v) => !v)}
                  className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-transparent px-4 py-3 text-left focus:outline-none"
                  style={{ WebkitTapHighlightColor: "transparent" }}
                >
                  <Text variant="caption" tone="white-muted" className="tracking-wide">
                    개발용 테스트 계정
                  </Text>
                  <span aria-hidden="true" className="shrink-0 text-sm text-white/60">
                    {showSeedAccounts ? "−" : "+"}
                  </span>
                </button>

                {showSeedAccounts && (
                  <>
                    {/* Dropdown.tsx와 동일하게, 패널 바깥을 누르면 닫히도록 화면 전체를
                        덮는 투명 레이어를 패널보다 먼저(아래 z-index) 깔아둔다. */}
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowSeedAccounts(false)}
                    />
                    {/* NoticeBox는 style prop을 안 받는 컴포넌트라(className만 지원)
                        이 패널만의 불투명한 남색 배경을 인라인으로 줄 수 없어서, 여기는
                        NoticeBox 대신 같은 톤의 일반 div로 직접 그린다. */}
                    <div
                      className="absolute top-full left-0 z-50 mt-2 w-full rounded-lg border border-white/10 px-4 py-3 shadow-lg backdrop-blur-md"
                      style={{ backgroundColor: "rgba(6, 14, 28, 0.95)" }}
                    >
                      <Stack direction="column" gap="sm">
                        <div>
                          <Badge variant="info" className="mb-1">
                            슈퍼어드민
                          </Badge>
                          <Kv
                            size="xs"
                            items={[
                              { key: "아이디", value: "admin" },
                              { key: "비밀번호", value: "staff1234" },
                            ]}
                          />
                        </div>
                        <div>
                          <Badge variant="gray" className="mb-1">
                            일반 관리자 (조회 전용)
                          </Badge>
                          <Kv
                            size="xs"
                            items={[
                              { key: "아이디", value: "staff01" },
                              { key: "비밀번호", value: "staff1234" },
                            ]}
                          />
                        </div>
                      </Stack>
                    </div>
                  </>
                )}
              </div>
            )}
          </Stack>
        </Card>
      </div>

      <Toast open={!!error} onClose={() => setError(null)} message={error ?? ""} status="error" />
    </main>
  );
}
