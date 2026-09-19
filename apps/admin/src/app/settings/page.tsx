"use client";

import { useEffect, useState } from "react";
import NextLink from "next/link";
import { Title, Text, Stack, LabeledBox, Input, Button, Card, Alert, Toast } from "@chinguya/ui";
import type { ToastStatus } from "@chinguya/ui";
import { createApiClient, ApiError } from "@chinguya/api-client";
import { useAdminAuth } from "@/context/AdminAuthContext";

/**
 * S1-A10 계좌 · 정책 설정 (a-set).
 *
 * Core API(GET/PUT /admin/settings)에 실연동돼 있다 — 계약은
 * packages/api-spec/openapi/chinguya-admin-api.yaml.
 *
 * 입금 계좌(고객이 예약 후 직접 입금할 곳), 취소 수수료 요율표(이용일까지 남은 일수별 요율),
 * 여행사 취소 마감일을 한 번에 저장한다. 요율표는 구간의 시작 일수와 요율만 보내고, 구간의
 * 끝은 서버가 "다음 구간 시작 − 1"로 채운다.
 *
 * 쓰기는 슈퍼어드민만 가능하다. 일반 관리자에게 입력칸을 잠그고 버튼을 숨기는 것은 서버
 * 403과 정합을 맞추는 것일 뿐 보안 경계가 아니다(경계는 SecurityConfig).
 */

const api = createApiClient();

/** 입력 중인 요율 구간. 빈 칸을 표현하려고 숫자 대신 입력 문자열을 그대로 둔다. */
interface TierDraft {
  minDaysBefore: string;
  feePercent: string;
}

function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) return err.message;
  return fallback;
}

/** 0.125 → "12.5". 요율이 소수 셋째 자리까지라 퍼센트로는 한 자리까지만 나온다. */
function toPercentText(feeRate: number): string {
  return String(Math.round(feeRate * 1000) / 10);
}

export default function AdminSettingsPage() {
  const { isSuperAdmin } = useAdminAuth();

  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [tiers, setTiers] = useState<TierDraft[]>([]);
  const [deadlineDays, setDeadlineDays] = useState("");
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastStatus, setToastStatus] = useState<ToastStatus>("info");

  useEffect(() => {
    api.settings
      .get()
      .then((settings) => {
        // 계좌는 운영 최초 상태에서 null이다 — 빈 칸으로 두고 처음 등록하게 한다.
        setBankName(settings.depositAccount?.bankName ?? "");
        setAccountNumber(settings.depositAccount?.accountNumber ?? "");
        setAccountHolder(settings.depositAccount?.accountHolder ?? "");
        setTiers(
          settings.cancellationPolicy.map((tier) => ({
            minDaysBefore: String(tier.minDaysBefore),
            feePercent: toPercentText(tier.feeRate),
          })),
        );
        setDeadlineDays(String(settings.agencyCancelDeadlineDays));
        setLoaded(true);
      })
      .catch((err) => setLoadError(errorMessage(err, "설정을 불러오지 못했습니다.")));
  }, []);

  const updateTier = (index: number, patch: Partial<TierDraft>) => {
    setTiers((prev) => prev.map((tier, i) => (i === index ? { ...tier, ...patch } : tier)));
  };

  const handleSave = async () => {
    const fields = [bankName, accountNumber, accountHolder, deadlineDays, ...tiers.flatMap((t) => [t.minDaysBefore, t.feePercent])];
    if (fields.some((value) => value.trim() === "")) {
      setToastMessage("빈 칸을 모두 입력해 주세요.");
      setToastStatus("error");
      return;
    }

    setSaving(true);
    try {
      await api.settings.update({
        depositAccount: { bankName, accountNumber, accountHolder },
        cancellationPolicy: tiers.map((tier) => ({
          minDaysBefore: Number(tier.minDaysBefore),
          // 퍼센트 소수 한 자리까지만 남긴다 — 서버는 요율 소수 넷째 자리부터 400으로 거절한다.
          feeRate: Math.round(Number(tier.feePercent) * 10) / 1000,
        })),
        agencyCancelDeadlineDays: Number(deadlineDays),
      });
      setToastMessage("저장되었습니다");
      setToastStatus("success");
    } catch (err) {
      setToastMessage(errorMessage(err, "설정을 저장하지 못했습니다."));
      setToastStatus("error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="mx-auto max-w-2xl p-6">
      <Stack direction="column" gap="sm">
        <NextLink href="/more" className="text-sm text-muted hover:underline">
          ← 더보기로
        </NextLink>
        <Title size="md">계좌 · 정책 설정</Title>
      </Stack>

      {loadError && (
        <Alert status="error" className="mt-4">
          {loadError}
        </Alert>
      )}

      {!loaded && !loadError && (
        <Stack direction="column" className="mt-4">
          <Text variant="sub">불러오는 중…</Text>
        </Stack>
      )}

      {/* 섹션 사이(특히 저장 버튼 위)는 gap="lg"로 넉넉하게 띄운다 — mt-* 마진 대신 Stack의
          gap으로 간격을 준다. */}
      {loaded && (
        <Stack direction="column" gap="lg" className="mt-4">
          <Stack direction="column" gap="sm">
            <Text weight="bold" leaf>
              입금 계좌
            </Text>
            <Card>
              <Stack direction="column" gap="sm">
                <LabeledBox label="은행명">
                  <Input value={bankName} disabled={!isSuperAdmin} onChange={(e) => setBankName(e.target.value)} />
                </LabeledBox>
                <LabeledBox label="계좌번호">
                  <Input value={accountNumber} disabled={!isSuperAdmin} onChange={(e) => setAccountNumber(e.target.value)} />
                </LabeledBox>
                <LabeledBox label="예금주">
                  <Input value={accountHolder} disabled={!isSuperAdmin} onChange={(e) => setAccountHolder(e.target.value)} />
                </LabeledBox>
                <Text variant="sub">
                  고객이 예약 후 이 계좌로 직접 입금합니다.
                </Text>
              </Stack>            
            </Card>            
          </Stack>

          <Stack direction="column" gap="sm">
            <Stack justify="between">
              <Text weight="bold" leaf>
              취소 수수료율
            </Text>
            {isSuperAdmin && (
              <Button
                size="sm"
                variant="subtle"
                align="start"
                onClick={() => setTiers((prev) => [...prev, { minDaysBefore: "", feePercent: "" }])}
              >
                + 구간 추가
              </Button>
            )}
            </Stack>
            <Card>
              <Stack direction="column" gap="sm">
              {tiers.map((tier, i) => (
                <Stack key={i} justify="between" align="center">
                  <Stack gap="xs" align="center">
                    <Text variant="sub" as="span">
                      남은 일수
                    </Text>
                    <Input
                      type="number"
                      size="sm"
                      fullWidth={false}
                      className="w-16 text-right"
                      value={tier.minDaysBefore}
                      min={0}
                      disabled={!isSuperAdmin}
                      onChange={(e) => updateTier(i, { minDaysBefore: e.target.value })}
                    />
                    <Text variant="sub" as="span">
                      일 이상
                    </Text>
                  </Stack>
                  <Stack gap="xs" align="center">
                    <Input
                      type="number"
                      size="sm"
                      fullWidth={false}
                      className="w-20 text-right"
                      value={tier.feePercent}
                      min={0}
                      max={100}
                      step={0.1}
                      disabled={!isSuperAdmin}
                      onChange={(e) => updateTier(i, { feePercent: e.target.value })}
                    />
                    <Text variant="sub" as="span">
                      %
                    </Text>
                    {isSuperAdmin && (
                      <Button
                        size="sm"
                        variant="text"
                        disabled={tiers.length === 1}
                        onClick={() => setTiers((prev) => prev.filter((_, j) => j !== i))}
                      >
                        삭제
                      </Button>
                    )}
                  </Stack>
                </Stack>
              ))}
              {/* 입력 줄들과 아래 안내 문구를 구분하는 선 — 위아래로 gap(8px)+여백 4px씩 */}
              <div className="my-1 border-t border-line" />
              <Text variant="sub">
              남은 일수가 여러 구간에 걸리면 일수가 가장 큰 구간의 요율이 적용됩니다. 0일(당일) 구간은 꼭
              있어야 합니다. 환불 이체는 관리자가 수동으로 처리합니다.
            </Text>
            </Stack>
            </Card>           
          </Stack>

          <Stack direction="column" gap="sm">
            <Text weight="bold" leaf>
              여행사 취소 마감
            </Text>
            <Card>
              <Stack justify="between" align="center">
                <Text variant="sub" as="span">
                  이용일 기준
                </Text>
                <Stack gap="xs" align="center">
                  <Text variant="sub" as="span">
                    D-
                  </Text>
                  <Input
                    type="number"
                    size="sm"
                    fullWidth={false}
                    className="w-16 text-right"
                    value={deadlineDays}
                    min={0}
                    disabled={!isSuperAdmin}
                    onChange={(e) => setDeadlineDays(e.target.value)}
                  />
                  <Text variant="sub" as="span">
                    까지
                  </Text>
                </Stack>
              </Stack>
              <div className="my-3 border-t border-line" />
              <Text variant="sub">
                여행사는 이 날까지 예약을 즉시 취소할 수 있습니다(기본 D-3).
              </Text>
            </Card>
          </Stack>

          {isSuperAdmin && (
            <Button fullWidth disabled={saving} onClick={() => void handleSave()}>
              {saving ? "저장 중…" : "저장"}
            </Button>
          )}
        </Stack>
      )}

      <Toast
        open={!!toastMessage}
        onClose={() => setToastMessage(null)}
        message={toastMessage ?? ""}
        status={toastStatus}
      />
    </main>
  );
}
