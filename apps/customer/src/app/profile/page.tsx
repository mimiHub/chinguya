"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CUSTOMER_SOCIAL_PROVIDER_LABEL } from "@chinguya/types";
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
import { useCart } from "@/context/CartContext";
import { listReservations } from "@/data/reservationData";
import { findRentalProductById } from "@/data/rentalData";
import { RENTAL_OPTION_LABEL } from "@chinguya/types";
import { useCustomerAuth } from "@/context/CustomerAuthContext";
import { ScrollReveal } from "@/components/ScrollReveal";

// 미리보기는 최근 1건만 보여준다(2건 이상 나열하지 않음) — 더 보고 싶으면 아래
// "전체보기" 버튼으로 실제 목록/장바구니 화면으로 유도한다.
const PREVIEW_COUNT = 1;

/**
 * 하단 탭 "내정보" — 회원정보 수정 화면(S0-C3)에 이 앱 다른 화면(예약 목록·장바구니)의
 * 미리보기도 함께 모아 대시보드 형태로 구성했다. 로그아웃 상태에서는 대시보드 대신
 * "로그인이 필요합니다" 안내만 보여준다.
 *
 * - 로그인 여부·아이디·연결 소셜은 실제 세션(useCustomerAuth, GET /v1/auth/me)에서 읽는다.
 *   로그아웃도 실제 세션을 지운다 — 확인 팝업 → 토스트 → 홈으로 이동은 기획(S0-C3 화면 이동:
 *   로그아웃/탈퇴 → 로그아웃 상태 홈)대로 동작한다.
 * - 여권 영문명도 실제 세션에서 읽고 PUT /v1/auth/me/passport-name 으로 저장한다. 저장된 값은
 *   **다음 예약의 기본값**이고, 이미 만들어진 예약은 확정 시점 스냅샷이라 바뀌지 않는다.
 * - TODO: 회원 탈퇴 API가 아직 없어서 지금은 로그아웃만 한다(계정은 남는다).
 */
export default function ProfilePage() {
  const router = useRouter();
  const { items } = useCart();
  const reservations = listReservations().slice(0, PREVIEW_COUNT);
  const cartPreview = items.slice(0, PREVIEW_COUNT);

  const [passportName, setPassportName] = useState("");
  const [passportError, setPassportError] = useState<string | null>(null);
  const [savingPassport, setSavingPassport] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  const { session, loading, savePassportName, logout } = useCustomerAuth();

  // 세션은 앱이 뜰 때 비동기로 오므로, 도착한 뒤 입력칸을 저장값으로 채운다.
  // 사용자가 이미 입력 중이면 덮어쓰지 않는다.
  useEffect(() => {
    if (session?.passportName) {
      setPassportName((current) => (current === "" ? session.passportName ?? "" : current));
    }
  }, [session?.passportName]);

  const handleSavePassportName = async () => {
    const trimmed = passportName.trim();
    if (!trimmed) {
      setPassportError("여권 영문명을 입력해 주세요.");
      return;
    }
    setPassportError(null);
    setSavingPassport(true);
    try {
      await savePassportName(trimmed);
      setPassportName(trimmed);
      setToastMessage("저장되었습니다");
    } catch (err) {
      setPassportError(err instanceof Error ? err.message : "저장에 실패했습니다.");
    } finally {
      setSavingPassport(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setToastMessage("로그아웃되었습니다");
    router.push("/");
  };

  const handleWithdraw = async () => {
    setWithdrawOpen(false);
    await logout();
    setToastMessage("회원 탈퇴가 처리되었습니다");
    router.push("/");
  };

  // 세션 조회가 끝나기 전에는 "로그인이 필요합니다"가 잠깐 비치지 않게 아무것도 그리지 않는다.
  if (loading) return null;

  if (!session) {
    return (
      <main>
        <Banner size="lg" title="계정" image="/banner-store.png" />
        <div className="mx-auto max-w-2xl p-6">
          <Card>
            <Stack direction="column" align="center" gap="sm" className="py-10 text-center">
              <Title size="lg" tone="secondary">로그인이 필요합니다</Title>
              <Text >내정보·예약 내역·장바구니를 보려면 <br /> 로그인해 주세요.</Text>
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
          <ScrollReveal>
          <Card>
            <Title leaf size="md">내정보</Title>
            <Kv items={[
              { key: "아이디", value: session.loginId },
              { key: "연결 소셜", value: CUSTOMER_SOCIAL_PROVIDER_LABEL[session.socialProvider] },
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
              <Button onClick={handleSavePassportName} disabled={savingPassport} className="mt-4" fullWidth>
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
          </ScrollReveal>

          <ScrollReveal delay={100}>
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
          </ScrollReveal>

          <ScrollReveal delay={150}>
          <Card>
            <Title leaf size="md">내 장바구니</Title>

            <Stack direction="column" gap="xs" className="mt-3">
              {cartPreview.length === 0 ? (
                <Text tone="secondary" className="py-4 text-center">장바구니가 비어 있습니다.</Text>
              ) : (
                cartPreview.map((item) => (
                  <Stack
                    key={item.cartItemId}
                    direction="column"
                    gap="xs"
                    className="border-b border-line py-3 last:border-b-0"
                  >
                    <Text weight="medium">{item.productName}</Text>
                    <Text variant="sub">
                      {RENTAL_OPTION_LABEL[item.optionType]} · ×{item.quantity}
                    </Text>
                    <Text weight="bold" className="text-right">
                      ₩ {item.lineTotal.toLocaleString()}
                    </Text>
                  </Stack>
                ))
              )}
            </Stack>
            <div className="border-t border-line" />
            <Button href="/cart" fullWidth className="mt-4">
              내 장바구니 전체보기
            </Button>
          </Card>
          </ScrollReveal>
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
