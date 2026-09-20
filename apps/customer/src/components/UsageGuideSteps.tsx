import type { AssetCategory } from "@chinguya/types";
import { Card, EmptyState, Stack, Text, Title } from "@chinguya/ui";
import { USAGE_GUIDES } from "@/data/usageGuides";

/**
 * 카테고리별 사용방법 단계 카드 목록 — 상품 상세의 "상품 사용방법" 탭과 고객지원의 "사용방법" 탭이 함께 쓴다.
 * 데이터는 data/usageGuides.ts 하나뿐이라, 어느 화면에서 봐도 같은 내용이 나온다.
 * 단계 번호(1, 2, 3…)는 배열 순서대로 자동으로 붙고, 항목이 없으면 "준비 중" 안내를 보여준다.
 */
export function UsageGuideSteps({ category }: { category: AssetCategory }) {
  const steps = USAGE_GUIDES[category] ?? [];

  if (steps.length === 0) {
    return <EmptyState variant="card">사용방법 안내를 준비 중입니다.</EmptyState>;
  }

  return (
    <Stack direction="column" gap="lg">
      {steps.map((step, index) => (
        <Card key={step.title}>
          <Stack direction="column" gap="sm">
            {step.image && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={step.image}
                alt={step.title}
                className="w-full rounded-lg bg-gray-50 p-5 object-contain"
              />
            )}
            <Title size="sm">
              {index + 1}. {step.title}
            </Title>
            <Text variant="sub">{step.text}</Text>
          </Stack>
        </Card>
      ))}
    </Stack>
  );
}
