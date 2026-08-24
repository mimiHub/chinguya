import { Title } from "@chinguya/ui/title";
import { Card } from "@chinguya/ui/card";
import { Stack } from "@chinguya/ui/stack";
import { Text } from "@chinguya/ui/text";
import { Badge } from "@chinguya/ui/badge";
import { Button } from "@chinguya/ui/button";
import { assets } from "@/data/assetData";

/**
 * S1-A2 자산 관리. "우리가 총 몇 대 갖고 있는지"만 보여주는 화면 — 날짜별로 고객에게
 * 얼마나 보여줄지는 이 화면이 아니라 재고 세팅(S1-A3, /inventory)에서 정한다.
 */
export default function AdminAssetsPage() {
  return (
    <main className="mx-auto max-w-2xl p-6">
      <Stack justify="between" align="center">
        <Title size="md">자산 관리</Title>
        {/* TODO: 실제 등록 폼/모달로 교체 예정 */}
        <Button size="sm" variant="subtle">
          + 등록
        </Button>
      </Stack>

      <Stack direction="column" gap="sm" className="mt-4">
        {assets.map((asset) => (
          <Card key={asset.id} padding="sm">
            <Stack justify="between" align="center">
              <Text weight="bold">{asset.name}</Text>
              <Badge variant="gray">수량 {asset.totalCount}</Badge>
            </Stack>
          </Card>
        ))}
      </Stack>      
    </main>
  );
}
