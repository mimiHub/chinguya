"use client";

import { useState } from "react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { Title } from "@chinguya/ui/title";
import { Text } from "@chinguya/ui/text";
import { Stack } from "@chinguya/ui/stack";
import { LabeledBox } from "@chinguya/ui/labeled-box";
import { Input } from "@chinguya/ui/input";
import { Button } from "@chinguya/ui/button";
import { Toast } from "@chinguya/ui/toast";
import { depositAccount, cancellationFeeRules } from "@/data/settingsData";

/**
 * S1-A10 계좌 · 정책 설정.
 * 입금 계좌(고객이 예약 후 직접 입금할 곳)와 취소 수수료율(이용일까지 남은 일수별 요율)을
 * 관리자가 설정한다. 저장 버튼은 지금은 실제 저장을 하지 않고 토스트만 보여준다 — 실제 연동
 * 시 PUT /api/admin/settings 호출로 교체한다.
 */
export default function AdminSettingsPage() {
  const router = useRouter();

  const [bankName, setBankName] = useState(depositAccount.bankName);
  const [accountNumber, setAccountNumber] = useState(depositAccount.accountNumber);
  const [accountHolder, setAccountHolder] = useState(depositAccount.accountHolder);
  const [rules, setRules] = useState(cancellationFeeRules);
  const [savedOpen, setSavedOpen] = useState(false);

  const updateFeeRate = (index: number, feeRatePercent: number) => {
    setRules((prev) => prev.map((rule, i) => (i === index ? { ...rule, feeRate: feeRatePercent / 100 } : rule)));
  };

  const handleSave = () => {
    // TODO: 실제 연동 시 여기서 PUT /api/admin/settings 호출로 교체한다.
    setSavedOpen(true);
  };

  return (
    <main className="mx-auto max-w-2xl p-6">
      <Stack direction="column" gap="sm">
        <NextLink href="/more" className="text-sm text-muted hover:underline">
          ← 더보기로
        </NextLink>
        <Title size="md">계좌 · 정책 설정</Title>
      </Stack>

      {/* 섹션 사이(특히 저장 버튼 위)는 gap="lg"로 넉넉하게 띄운다 — mt-* 마진 대신 Stack의
          gap으로 간격을 준다. */}
      <Stack direction="column" gap="lg" className="mt-4">
        <Stack direction="column" gap="sm">
          <Text weight="bold" leaf>
            입금 계좌
          </Text>
          <Stack direction="column" gap="sm">
            <LabeledBox label="은행명">
              <Input value={bankName} onChange={(e) => setBankName(e.target.value)} />
            </LabeledBox>
            <LabeledBox label="계좌번호">
              <Input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} />
            </LabeledBox>
            <LabeledBox label="예금주">
              <Input value={accountHolder} onChange={(e) => setAccountHolder(e.target.value)} />
            </LabeledBox>
          </Stack>
          <Text variant="sub">
            고객이 예약 후 이 계좌로 직접 입금합니다.
          </Text>
        </Stack>

        <Stack direction="column" gap="sm">
          <Text weight="bold" leaf>
            취소 수수료율
          </Text>
          <Stack direction="column" gap="sm">
            {rules.map((rule, i) => (
              <Stack key={rule.daysBeforeUse} justify="between" align="center">
                <Text variant="sub" as="span">
                  이용일 {rule.daysBeforeUse}일 전까지
                </Text>
                <Stack gap="xs" align="center">
                  <Input
                    type="number"
                    size="sm"
                    fullWidth={false}
                    className="w-20 text-right"
                    value={Math.round(rule.feeRate * 100)}
                    min={0}
                    max={100}
                    onChange={(e) => updateFeeRate(i, Number(e.target.value))}
                  />
                  <Text variant="sub" as="span">
                    %
                  </Text>
                </Stack>
              </Stack>
            ))}
          </Stack>
          <Text variant="sub">
            이용일까지 남은 일수가 짧을수록 수수료율이 높습니다. 환불 이체는 관리자가 수동으로 처리합니다.
          </Text>
        </Stack>

        <Button fullWidth onClick={handleSave}>
          저장
        </Button>
      </Stack>

      <Toast
        open={savedOpen}
        onClose={() => {
          setSavedOpen(false);
          router.push("/more");
        }}
        message="저장되었습니다"
      />
    </main>
  );
}
