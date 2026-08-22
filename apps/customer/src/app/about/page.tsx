"use client";

import { useState } from "react";
import { Banner } from "@chinguya/ui/banner";
import { Card } from "@chinguya/ui/card";
import { Kv } from "@chinguya/ui/kv";
import { Title } from "@chinguya/ui/title";
import { Text } from "@chinguya/ui/text";
import { Stack } from "@chinguya/ui/stack";
import { Tab } from "@chinguya/ui/tab";

type AboutTab = "store" | "brand";

const TABS: { key: AboutTab; label: string }[] = [
  { key: "store", label: "매장안내" },
  { key: "brand", label: "브랜드 스토리" },
];

// 매장안내 — 주소는 원문(일본어)과 한국어 표기를 함께 보여준다(실제 방문지 안내 목적).
const STORE_INFO = [
  { key: "주소", value: ["(871-0024) 長崎県対馬市厳原町大手橋1051", "(871-0024) 나가사키현 쓰시마시 이즈하라마치 오테바시1051"] },
  { key: "영업시간", value: "10:00 ~ 15:00" },
  { key: "정기 휴일", value: "매주 목요일" },
  { key: "전화", value: "070-7842-7101" },
];

// "이런 걸 함께 즐길 수 있어요" 특징 카드 — public/에 이미 있는 테마별 스티커 이미지를 아이콘으로 재사용한다.
const FEATURES = [
  { icon: "/sticker-coffee.png", title: "Cafe", desc: "쓰시마 원두 커피" },
  { icon: "/sticker-beer.png", title: "Beer", desc: "저녁엔 펍으로" },
  { icon: "/sticker-hamburger.png", title: "Burger", desc: "쓰시마 버거" },
  { icon: "/sticker-wiFi.png", title: "Wi-Fi", desc: "원화(KRW) 결제 가능" },
  { icon: "/sticker-bike.png", title: "자전거 대여", desc: "섬 곳곳을 자유롭게" },
  { icon: "/sticker-tent.png", title: "캠핑 렌탈", desc: "K2 풀세트 렌탈" },
  { icon: "/sticker-flag.png", title: "한국어 응대", desc: "언어 걱정 없이" },
  { icon: "/sticker-cooler.png", title: "아이스박스 · 튜브", desc: "물놀이 용품 대여" },
];

/**
 * 회사소개 — 상단 네비게이션 대메뉴 전용 화면. 하위 탭(매장안내/브랜드 스토리)은 상단 대메뉴
 * 칩과 같은 알약(capsule) 모양으로 통일했다. 원래 /news 안에 "공지사항"과 함께 칩으로
 * 묶여 있었는데, 파일 하나가 너무 커져서 각자 대메뉴로 다시 분리했다.
 */
export default function AboutPage() {
  const [tab, setTab] = useState<AboutTab>("store");

  return (
    <main>
      <Banner size="lg" title="회사소개" image="/banner-about.png" />

      <div className="mx-auto max-w-2xl p-6">
        <Tab variant="capsule" items={TABS} activeKey={tab} onChange={(key) => setTab(key as AboutTab)} />

        <div className="mt-4">
          {tab === "store" ? (
            <Card>
              <Kv leaf items={STORE_INFO.map((row) => ({ key: row.key, value: row.value, align: "left" as const }))} />
            </Card>
          ) : (
            <Stack direction="column" gap="lg">
              <Card>
                <Stack direction="column" gap="xs">
                  <Title size="lg">Chinguya &amp; KiYo</Title>
                  <Text variant="sub">Tsushima Burger</Text>
                </Stack>

                <hr className="my-4 border-line" />

                <Stack direction="column" gap="sm">
                  <Text weight="bold">대마도 이즈하라, 여행자를 위한 카페 &amp; 펍</Text>
                  <Text className="leading-relaxed">
                    친구야(Chinguya &amp; KiYo)는 일본 나가사키현 쓰시마시 이즈하라마치에 자리한 카페 겸 펍입니다.
                    부산에서 배로 약 1시간 거리의 대마도에서, 한국인 여행자가 부담 없이 쉬어갈 수 있는 공간을
                    만들고 싶다는 마음으로 문을 열었습니다.
                  </Text>
                  <Text className="leading-relaxed">
                    낮에는 커피와 대마도 특산 재료로 만든 쓰시마 버거를 즐기는 카페로, 저녁에는 맥주 한잔을
                    나누는 펍으로 운영됩니다. 한국어 응대와 원화(KRW) 결제가 모두 가능해 언어와 환전 걱정 없이
                    편하게 이용하실 수 있어요.
                  </Text>
                  <Text className="leading-relaxed">
                    자전거와 캠핑 장비 렌탈도 함께 운영하고 있어, 친구야는 대마도 곳곳을 자유롭게 둘러보는
                    여행의 든든한 출발점이 되어드립니다.
                  </Text>
                </Stack>
              </Card>

              <Card padding="sm" polaroid sticker="/sticker02.png">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/about-interior.png"
                  alt="친구야의 아늑한 실내 공간"
                  className="aspect-[4/3] w-full rounded-lg object-cover"
                />
                <Text variant="sub" size="xs" className="mt-2 text-center">
                  친구야의 아늑한 실내 공간
                </Text>
              </Card>

              <Stack direction="column" gap="sm">
                <Title leaf size="md">
                  이런 걸 함께 즐길 수 있어요
                </Title>

                <div className="grid grid-cols-2 gap-3">
                  {FEATURES.map((feature) => (
                    <Card key={feature.title} tint="primary" padding="sm">
                      <Stack direction="column" align="center" gap="xs" className="text-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={feature.icon} alt="" className="h-10 w-10 object-contain" />
                        <Text weight="bold" size="sm">
                          {feature.title}
                        </Text>
                        <Text variant="sub" size="xs">
                          {feature.desc}
                        </Text>
                      </Stack>
                    </Card>
                  ))}
                </div>
              </Stack>
            </Stack>
          )}
        </div>
      </div>
    </main>
  );
}
