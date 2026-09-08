"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { OFF_SITE_RETURN_FEE_KRW } from "@chinguya/types";
import { Banner } from "@chinguya/ui/banner";
import { Card } from "@chinguya/ui/card";
import { Title } from "@chinguya/ui/title";
import { Text } from "@chinguya/ui/text";
import { EmptyState } from "@chinguya/ui/empty-state";
import { Stack } from "@chinguya/ui/stack";
import { Kv } from "@chinguya/ui/kv";
import { Button } from "@chinguya/ui/button";
import { Input } from "@chinguya/ui/input";
import { FormMessage } from "@chinguya/ui/form-message";
import { Alert } from "@chinguya/ui/alert";
import { ConfirmPopup } from "@chinguya/ui/confirm-popup";
import { Toast } from "@chinguya/ui/toast";
import { StatusBadge } from "@chinguya/ui/badge";
import { useCart, type CartLine } from "@/context/CartContext";
import { listReservations } from "@/data/reservationData";
import { findRentalProductById, RENTAL_OPTION_LABEL } from "@/data/rentalData";
import { getMember, updatePassportName } from "@/data/memberData";
import { getIsLoggedIn, logout } from "@/data/authData";

// 미리보기는 최근 1건만 보여준다(2건 이상 나열하지 않음) — 더 보고 싶으면 아래
// "전체보기" 버튼으로 실제 목록/장바구니 화면으로 유도한다.
const PREVIEW_COUNT = 1;

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
 * 하단 탭 "내정보" — 회원정보 수정 화면(S0-C3)에 이 앱 다른 화면(예약 목록·장바구니)의
 * 미리보기도 함께 모아 대시보드 형태로 구성했다. 로그인 세션은 authData.ts 목업(모듈 변수)
 * 기준이라 로그아웃 상태에서는 대시보드 대신 "로그인이 필요합니다" 안내만 보여준다.
 *
 * - 계정 정보는 getMember()/updatePassportName()(memberData.ts, 목업 저장소)로 다룬다.
 *   실제로는 로그인 세션의 사용자 계정 API로 대체될 자리다.
 * - 로그인 여부는 getIsLoggedIn()(authData.ts)으로 읽는다. 로그아웃·회원 탈퇴는 logout()을
 *   호출해 실제로 로그인 상태를 false로 바꾼다 — 확인 팝업 → 토스트 → 홈으로 이동까지는
 *   기획(S0-C3 화면 이동: 로그아웃/탈퇴 → 로그아웃 상태 홈)대로 동작한다. TODO: 실제 연동
 *   시 로그아웃은 POST /api/customer/logout, 탈퇴는 DELETE /api/customer/member 호출로
 *   교체(지금은 목업 세션 플래그만 바꾼다).
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

  const loggedIn = getIsLoggedIn();

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
    logout();
    setToastMessage("로그아웃되었습니다");
    router.push("/");
  };

  const handleWithdraw = () => {
    setWithdrawOpen(false);
    logout();
    setToastMessage("회원 탈퇴가 처리되었습니다");
    router.push("/");
  };

  if (!loggedIn) {
    return (
      <main>
        <Banner size="lg" title="계정" image="/banner-store.png" />
        <div className="mx-auto max-w-2xl p-6">
          <Card>
            <Stack direction="column" align="center" gap="sm" className="py-10 text-center">
              <Title size="md">로그인이 필요합니다</Title>
              <Text tone="secondary">내정보·예약 내역·장바구니를 보려면 먼저 로그인해 주세요.</Text>
              <Button href="/login?redirect=/profile" className="mt-2">
                로그인하러 가기
              </Button>
            </Stack>
          </Card>
        </div>
      </main>
    );
  }

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
                <Alert status="info" icon={false}>
                  예약 시 신원 확인용으로 쓰입니다. 언제든 바꿀 수 있어요.
                </Alert>
              )}
              <Button onClick={handleSavePassportName} className="mt-4" fullWidth>
                저장
              </Button>
            </Stack>

            <div className="mt-4 flex gap-2 border-t border-dashed border-line pt-4">
              <Button variant="outline" fullWidth onClick={handleLogout}>
                로그아웃
              </Button>
              <Button fullWidth className="text-error" onClick={() => setWithdrawOpen(true)}>
                회원 탈퇴
              </Button>
            </div>
          </Card>

          <Card>
            <Title leaf size="md">내 예약 상황</Title>

            <Stack direction="column" gap="xs" className="mt-3">
              {reservations.length === 0 ? (
                <EmptyState>아직 예약 내역이 없습니다.</EmptyState>
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
            <div className="border-t border-line" />
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
            <div className="border-t border-line" />
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
