"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { OFF_SITE_RETURN_FEE_KRW } from "@chinguya/types";
import { Banner } from "@chinguya/ui/banner";
import { Card } from "@chinguya/ui/card";
import { Title } from "@chinguya/ui/title";
import { Text } from "@chinguya/ui/text";
import { Stack } from "@chinguya/ui/stack";
import { Kv } from "@chinguya/ui/kv";
import { Button } from "@chinguya/ui/button";
import { Input } from "@chinguya/ui/input";
import { FormMessage } from "@chinguya/ui/form-message";
import { ConfirmPopup } from "@chinguya/ui/confirm-popup";
import { Toast } from "@chinguya/ui/toast";
import { StatusBadge } from "@chinguya/ui/badge";
import { useCart, type CartLine } from "@/context/CartContext";
import { listReservations } from "@/data/reservationData";
import { findRentalProductById, RENTAL_OPTION_LABEL } from "@/data/rentalData";
import { getMember, updatePassportName } from "@/data/memberData";

// 미리보기라 너무 길어지지 않게 최근 몇 건만 보여준다 — 전체는 "전체보기" 버튼으로 이동.
const PREVIEW_COUNT = 3;

function rentalDaysOf(line: CartLine): number {
  const start = new Date(line.useDateStart);
  const end = new Date(line.useDateEnd);
  return Math.round((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1;
}

function lineAmount(line: CartLine): number {
  const product = findRentalProductById(line.productId);
  if (!product) return 0;
  const unitPrice = product.priceByOption[line.option].customerPrice;
  const offSiteFee = line.offSiteReturn ? OFF_SITE_RETURN_FEE_KRW : 0;
  return unitPrice * line.qty * rentalDaysOf(line) + offSiteFee;
}

/**
 * 하단 탭 "내정보" — 로그인 기능이 없어서 회원정보 수정 화면(S0-C3)을 그대로 만들 수는
 * 없지만, 로그인이 붙었을 때 개발자가 세션 연동만 하면 되도록 그 화면의 요소(아이디·연결
 * 소셜 읽기 / 여권 영문명 변경·저장 / 로그아웃 / 회원 탈퇴)는 전부 미리 만들어뒀다. 여기에
 * 이 앱 다른 화면(예약 목록·장바구니)의 미리보기도 함께 모아 대시보드 형태로 구성했다.
 *
 * - 계정 정보는 getMember()/updatePassportName()(memberData.ts, 목업 저장소)로 다룬다.
 *   실제로는 로그인 세션의 사용자 계정 API로 대체될 자리다.
 * - 로그아웃·회원 탈퇴는 실제 세션이 없어서 지금은 "그 상태를 흉내만" 낸다 — 확인 팝업 →
 *   토스트 → 홈으로 이동까지는 기획(S0-C3 화면 이동: 로그아웃/탈퇴 → 로그아웃 상태 홈)대로
 *   동작하지만, 진짜로 로그아웃/탈퇴 처리를 하는 API 호출은 없다. TODO: 실제 연동 시
 *   로그아웃은 POST /api/customer/logout, 탈퇴는 DELETE /api/customer/member 호출로 교체.
 */
export default function ProfilePage() {
  const router = useRouter();
  const { items } = useCart();
  const reservations = listReservations().slice(0, PREVIEW_COUNT);
  const cartPreview = items.slice(0, PREVIEW_COUNT);

  const member = getMember();
  const [passportName, setPassportName] = useState(member.passportName);
  const [passportError, setPassportError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  const handleSavePassportName = () => {
    const trimmed = passportName.trim();
    if (!trimmed) {
      setPassportError("여권 영문명을 입력해 주세요.");
      return;
    }
    setPassportError(null);
    updatePassportName(trimmed);
    setPassportName(trimmed);
    setToastMessage("저장되었습니다");
  };

  const handleLogout = () => {
    // 실제 로그인 세션이 없어서 지금은 홈으로 보내는 것으로 "로그아웃 상태 홈" 이동만 흉내낸다.
    setToastMessage("로그아웃되었습니다");
    router.push("/");
  };

  const handleWithdraw = () => {
    setWithdrawOpen(false);
    setToastMessage("회원 탈퇴가 처리되었습니다");
    router.push("/");
  };

  return (
    <main>
      <Banner size="lg" title="계정" image="/banner-store.png" />

      <div className="mx-auto max-w-2xl p-6">
        <Stack direction="column" gap="lg">
          <Card>
            <Title leaf size="md">내정보</Title>
            <Kv items={[
              { key: "이메일(아이디)", value: member.email },
              { key: "연결 소셜", value: member.connectedSocial },
            ]} />

            <Stack direction="column" gap="sm" className="mt-4">
              <Title as="label" htmlFor="passport-name" size="sm" leaf tone="secondary">
                여권 영문명
              </Title>
              <Input
                id="passport-name"
                value={passportName}
                onChange={(e) => {
                  setPassportName(e.target.value);
                  if (passportError) setPassportError(null);
                }}
                placeholder="GILDONG HONG"
              />
              {passportError ? (
                <FormMessage type="error">{passportError}</FormMessage>
              ) : (
                <FormMessage type="helper">예약 시 신원 확인용으로 쓰입니다. 언제든 바꿀 수 있어요.</FormMessage>
              )}
              <Button onClick={handleSavePassportName} align="end">
                저장
              </Button>
            </Stack>

            <div className="mt-4 flex gap-2 border-t border-dashed border-line pt-4">
              <Button variant="outline" fullWidth onClick={handleLogout}>
                로그아웃
              </Button>
              <Button variant="text" fullWidth className="text-error" onClick={() => setWithdrawOpen(true)}>
                회원 탈퇴
              </Button>
            </div>
          </Card>

          <Card>
            <Title leaf size="md">내 예약 상황</Title>

            <Stack direction="column" gap="xs" className="mt-3">
              {reservations.length === 0 ? (
                <Text tone="secondary" className="py-4 text-center">아직 예약 내역이 없습니다.</Text>
              ) : (
                reservations.map((reservation) => {
                  const product = findRentalProductById(reservation.productId);
                  return (
                    <div
                      key={reservation.id}
                      className="flex items-center justify-between gap-2 border-b border-line py-3 last:border-b-0"
                    >
                      <Stack direction="column" gap="xs">
                        <Text weight="medium">{reservation.id}</Text>
                        <Text variant="sub">
                          {product ? `${product.title} · ${RENTAL_OPTION_LABEL[reservation.rentalOption]}` : ""}
                        </Text>
                      </Stack>
                      <StatusBadge status={reservation.status} />
                    </div>
                  );
                })
              )}
            </Stack>

            <Button href="/mypage" fullWidth className="mt-4">
              내 예약 전체보기
            </Button>
          </Card>

          <Card>
            <Title leaf size="md">내 장바구니</Title>

            <Stack direction="column" gap="xs" className="mt-3">
              {cartPreview.length === 0 ? (
                <Text tone="secondary" className="py-4 text-center">장바구니가 비어 있습니다.</Text>
              ) : (
                cartPreview.map((line) => {
                  const product = findRentalProductById(line.productId);
                  if (!product) return null;
                  return (
                    <Stack
                      key={line.cartLineId}
                      direction="column"
                      gap="xs"
                      className="border-b border-line py-3 last:border-b-0"
                    >
                      <Text weight="medium">{product.name}</Text>
                      <Text variant="sub">
                        {RENTAL_OPTION_LABEL[line.option]} · {line.qty}{product.category === "bike" ? "대" : "개"}
                      </Text>
                      <Text weight="bold" className="text-right">
                        ₩ {lineAmount(line).toLocaleString()}
                      </Text>
                    </Stack>
                  );
                })
              )}
            </Stack>

            <Button href="/cart" fullWidth className="mt-4">
              내 장바구니 전체보기
            </Button>
          </Card>
        </Stack>
      </div>

      <ConfirmPopup
        open={withdrawOpen}
        title="회원 탈퇴"
        message="탈퇴하면 계정 정보가 삭제됩니다. 이 작업은 되돌릴 수 없습니다."
        confirmLabel="탈퇴"
        onConfirm={handleWithdraw}
        onClose={() => setWithdrawOpen(false)}
      />

      <Toast open={!!toastMessage} onClose={() => setToastMessage(null)} message={toastMessage ?? ""} />
    </main>
  );
}
