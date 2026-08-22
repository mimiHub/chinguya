"use client";

import { Suspense, useState } from "react";
import NextLink from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Title } from "@chinguya/ui/title";
import { Stack } from "@chinguya/ui/stack";
import { Card } from "@chinguya/ui/card";
import { Kv } from "@chinguya/ui/kv";
import { Button } from "@chinguya/ui/button";
import { Alert } from "@chinguya/ui/alert";
import { ComingSoon } from "@chinguya/ui/coming-soon";
import { Toast } from "@chinguya/ui/toast";
import { Banner } from "@chinguya/ui/banner";
import { findReservationsByIds } from "@/data/reservationData";
import { depositAccount } from "@/data/depositAccountData";

/**
 * S1-C4 입금 안내 · 확인 요청. 장바구니(S1-C3)에서 만들어진 예약 id들(콤마 구분)을 쿼리로
 * 받아 하나의 입금 안내로 묶어 보여준다. PG 미사용 — 안내 계좌로 직접 입금 후 "입금 확인 요청"을
 * 누르면 상태를 확인하러 예약 목록으로 이동한다.
 *
 * 예약은 장바구니에서 "예약하고 입금 안내 받기"를 누른 시점에 이미 상태 "접수"로 만들어져
 * 있다(문서 규칙: 접수 = 예약 생성 상태). "입금 확인 요청" 버튼은 실제로는 관리자에게 입금
 * 사실을 알리는 액션이라, 여기서는 토스트만 보여주고 상태를 다시 바꾸지는 않는다 — 관리자가
 * 입금을 확인하면 admin 쪽에서 상태를 "완료"로 바꾼다.
 */
function DepositContent() {
  const params = useSearchParams();
  const router = useRouter();
  const ids = (params.get("ids") ?? "").split(",").filter(Boolean);
  const reservations = findReservationsByIds(ids);
  const [requested, setRequested] = useState(false);

  if (reservations.length === 0) {
    return <ComingSoon label="예약 정보를 찾을 수 없습니다" />;
  }

  const totalAmount = reservations.reduce((sum, r) => sum + r.amountKrw, 0);
  const primaryId = reservations[0]?.id;
  const label = reservations.length > 1 ? `${primaryId} 외 ${reservations.length - 1}건` : primaryId;

  return (
    <main>
      {/* 소메뉴 배너는 소속된 대메뉴("장바구니/예약 확인")의 이름을 그대로 쓴다 */}
      <Banner size="sm" title="예약 확인" image="/banner-notice.png" />

      <div className="mx-auto max-w-2xl p-6">
      <Stack direction="column" gap="sm">
        <NextLink href="/cart" className="text-sm text-muted hover:underline">
          ← 이전 페이지로 이동
        </NextLink>
        <Title size="lg">입금 안내</Title>
      </Stack>

      <Card className="mt-4">
        <Kv
          items={[
            { key: "예약번호", value: label },
            { key: "입금 계좌", value: `${depositAccount.bankName} ${depositAccount.accountNumber}` },
            { key: "예금주", value: depositAccount.accountHolder },
            { key: "입금액", value: `₩ ${totalAmount.toLocaleString()}` },
          ]}
        />
      </Card>

      <Alert status="info" className="mt-4" icon={false}>
        PG 미사용. 안내 계좌(관리자 설정 1개)로 입금 후 아래 버튼으로 확인 요청 → 상태 접수.
        24시간 내 미입금 시 관리자가 강제취소할 수 있습니다.
      </Alert>

      <Button
        fullWidth
        className="mt-6"
        onClick={() => {
          setRequested(true);
        }}
      >
        입금 확인 요청
      </Button>

      <Toast
        open={requested}
        onClose={() => {
          setRequested(false);
          router.push("/mypage");
        }}
        message="입금 확인 요청이 접수되었습니다"
        actionLabel="내 예약 보기"
        actionHref="/mypage"
      />
      </div>
    </main>
  );
}

export default function DepositPage() {
  return (
    <Suspense fallback={null}>
      <DepositContent />
    </Suspense>
  );
}
