"use client";

import NextLink from "next/link";
import { Title } from "@chinguya/ui/title";
import { Card } from "@chinguya/ui/card";
import { Stack } from "@chinguya/ui/stack";
import { Text } from "@chinguya/ui/text";
import { Button } from "@chinguya/ui/button";
import { useAdminAuth } from "@/context/AdminAuthContext";

/**
 * S1 더보기 메뉴. 하단 탭바 4번째 탭 — 예약/상품처럼 이미 자기 탭이 따로 있는 화면 말고,
 * 나머지 관리 기능(자산·재고·계좌/정책·관리자 관리·여행사·인보이스·문의·FAQ)으로 가는
 * 통로 역할만 한다.
 */
const MENU_ITEMS: { label: string; href: string; description: string }[] = [
  { label: "예약 관리", href: "/reservations", description: "예약 목록 조회 · 상태 변경 · 미입금 강제 취소" },
  { label: "자산 관리", href: "/assets", description: "보유 자산(자전거/낚싯대) 종류 등록·수정·삭제" },
  { label: "재고 세팅", href: "/inventory", description: "기준 보유량 · 날짜별 재고 조정 · 여행사 할당 · 고객 가용 수량 · 휴무 설정" },
  { label: "할당 세팅", href: "/allocations", description: "여행사 할당 수량을 여행사별로 나눠서 세팅" },
  { label: "상품 관리", href: "/products", description: "상품별 가격 · 고객앱/여행사앱 표출 설정" },
  { label: "계좌 · 정책 설정", href: "/settings", description: "입금 계좌 정보, 취소 수수료율 등 정책값 관리" },
  { label: "관리자 관리", href: "/admins", description: "관리자 계정 추가/삭제, 슈퍼어드민 권한 관리" },
  { label: "여행사 관리", href: "/agencies", description: "여행사(거래처) 등록, 담당자 연락처, 활성/비활성 관리" },
  { label: "인보이스 관리", href: "/invoices", description: "여행사별 인보이스 발행, 정산 여부 확인" },
  { label: "문의 관리", href: "/inquiries", description: "고객 1:1 문의 확인 및 답변 등록" },
  { label: "FAQ · 콘텐츠 관리", href: "/content", description: "FAQ 등록/수정/삭제·순서, 랜딩·서비스 소개 콘텐츠 편집" },
];

export default function AdminMorePage() {
  const { logout } = useAdminAuth();

  return (
    <main className="mx-auto max-w-2xl p-6">
      <Title size="md">더보기</Title>

      <Stack direction="column" gap="sm" className="mt-4">
        {MENU_ITEMS.map((item) => (
          <NextLink key={item.href} href={item.href} className="block">
            <Card padding="sm">
              <Stack justify="between" align="center">
                <Stack direction="column" gap="xs">
                  <Text weight="bold">{item.label}</Text>
                  <Text variant="sub">{item.description}</Text>
                </Stack>
                <Text variant="sub" as="span">
                  ›
                </Text>
              </Stack>
            </Card>
          </NextLink>
        ))}
      </Stack>

      <Button onClick={() => void logout()} fullWidth className="mt-6">
        로그아웃
      </Button>
    </main>
  );
}
