"use client";

import NextLink from "next/link";
import { Title, Card, Stack, Text, Button } from "@chinguya/ui";
import { useAdminAuth } from "@/context/AdminAuthContext";

interface MenuItem {
  label: string;
  href: string;
  description: string;
}

/**
 * S1 더보기 메뉴. 하단 탭바 마지막 탭 — 나머지 관리 기능으로 가는 통로 역할만 한다.
 *
 * 메뉴는 **그룹의 배열**로 둔다(그룹 구분은 2026-09-28 민철 결정). 그룹 1개를 카드 1장으로 묶고
 * (2026-09-29 — 구분선 대신 카드로 구분), 카드 안은 줄(MenuRow) 목록이다. 그룹을 더하거나
 * 순서를 바꿀 때는 데이터만 고치면 된다.
 */
const MENU_GROUPS: MenuItem[][] = [
  // 예약 운영
  [
    { label: "예약 관리", href: "/reservations", description: "예약 목록 조회 · 상태 변경 · 미입금 강제 취소" },
    { label: "계좌 · 정책 설정", href: "/settings", description: "입금 계좌 정보, 취소 수수료율 등 정책값 관리" },
  ],
  // 자산 · 재고 · 상품
  [
    { label: "자산 관리", href: "/assets", description: "보유 자산(자전거/낚싯대) 종류 등록·수정·삭제" },
    {
      label: "재고 세팅",
      href: "/inventory",
      description: "기준 보유량 · 날짜별 재고 조정 · 여행사 할당 · 고객 가용 수량 · 휴무 설정",
    },
    { label: "상품 관리", href: "/products", description: "상품별 가격 · 고객앱/여행사앱 표출 설정" },
  ],
  // 여행사
  [
    { label: "여행사 관리", href: "/agencies", description: "여행사(거래처) 등록, 담당자 연락처, 활성/비활성 관리" },
    { label: "인보이스 관리", href: "/invoices", description: "여행사별 인보이스 발행, 정산 여부 확인" },
  ],
  // 고객앱 콘텐츠 · 고객 응대
  [
    { label: "랜딩 배너 관리", href: "/landing", description: "고객앱 홈 히어로 배너 3장 편집·노출 설정" },
    { label: "공지 · 이벤트", href: "/notices", description: "고객앱 공지사항·이벤트 글 등록·공개·상단 고정" },
    { label: "문의 관리", href: "/inquiries", description: "고객 1:1 문의 확인 및 답변 등록" },
    { label: "FAQ 관리", href: "/faq", description: "FAQ 등록/수정/삭제·노출 순서" },
  ],
  // 시스템
  [
    { label: "관리자 관리", href: "/admins", description: "관리자 계정 추가/삭제, 슈퍼어드민 권한 관리" },
    {
      label: "컴포넌트 가이드",
      href: "/components",
      description: "@chinguya/ui 공통 컴포넌트 37종을 한 화면에서 모아 보기",
    },
  ],
];

/**
 * 그룹 카드 안의 한 줄. 카드 안에 또 카드를 넣으면 테두리·그림자가 겹쳐 답답해 보여서,
 * 줄은 테두리 없이 두고 줄 사이는 부모의 divide-y 얇은 점선(divide-dashed)으로 나눈다.
 * 여백은 두 겹이다 — 목록 래퍼 px-4(구분선이 카드 양끝에서 16px 들어옴) + 줄 px-3(글자는 28px 들어옴).
 * 그래서 구분선이 글자보다 조금 더 바깥까지 뻗는다. 누를 수 있는 영역이 줄 전체라는 걸 보여 주려고
 * hover 시 배경만 살짝 바꾼다(bg-bg-light 토큰).
 */
function MenuRow({ item }: { item: MenuItem }) {
  return (
    <NextLink
      href={item.href}
      className="flex items-center justify-between gap-3 px-3 py-4 transition-colors hover:bg-bg-light"
    >
      <Stack direction="column" gap="xs" className="min-w-0">
        <Text weight="bold">{item.label}</Text>
        <Text variant="sub">{item.description}</Text>
      </Stack>
      <Text variant="sub" as="span" aria-hidden="true">
        ›
      </Text>
    </NextLink>
  );
}

export default function AdminMorePage() {
  const { logout } = useAdminAuth();

  return (
    <main className="mx-auto max-w-2xl p-6">
      <Title size="md">더보기</Title>
      <Stack direction="column" gap="md" className="mt-4">
        {MENU_GROUPS.map((group, index) => (
          // 그룹 1개 = 카드 1장. 그룹 순서는 고정이라 index key로 충분하다.
          // padding="none"으로 두고 여백은 안쪽 래퍼(px-4)와 줄(px-3)이 나눠 맡는다.
          <Card key={index} padding="none" className="overflow-hidden">
            <div className="divide-y divide-dashed divide-line px-4">
              {group.map((item) => (
                <MenuRow key={item.href} item={item} />
              ))}
            </div>
          </Card>
        ))}
      </Stack>
      {/* PC 모드(md 이상)에서는 헤더 햄버거 드로어에 이미 로그아웃이 있어서 중복이다 —
          모바일 폭에서만 보여준다. */}
      <Button onClick={() => void logout()} fullWidth className="mt-6 md:hidden">
        로그아웃
      </Button>
    </main>
  );
}
