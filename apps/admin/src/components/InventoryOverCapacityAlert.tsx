"use client";

import { useEffect, useState } from "react";
import NextLink from "next/link";
import { Alert } from "@chinguya/ui";
import { createApiClient } from "@chinguya/api-client";

const api = createApiClient();

interface OverCapacityDay {
  assetName: string;
  date: string;
}

/**
 * 대시보드(S1-A1) "재고 초과 알림 줄" — chinguya-wireframes/docs/관리자_상세설명.md
 * (2026-09-04 갱신, 커밋 94119af)이 요구하는 항목:
 *   재고 초과 알림 = 그 날짜의 예약 수가 총 보유를 넘은 날. a-inv(S1-A3)에서 재고를 예약 수보다
 *   낮게 내렸을 때 발생하며, 해소될 때까지 상시 노출한다. 여행사 할당 합이 총 보유를 넘은 날
 *   (할당 초과)도 같은 줄에 표시한다.
 *
 * 재고 세팅(/inventory)이 이미 Core API 실연동으로 옮겨갔으므로(구 할당 세팅 화면 /allocations와
 * 그 전용 목업 assetData.ts·inventoryData.ts·allocationData.ts는 삭제됨 — 와이어프레임상 S1-A3로
 * 흡수), 여기서도 같은 real API(api.inventory.snapshot)로 이번 달·다음 달 스냅샷을 모든 자산에
 * 대해 훑어 remaining(고객 가용 − 예약) < 0인 날짜를 찾는다.
 *
 * ⚠ api-client의 InventoryDaySnapshot 주석대로 reserved는 아직 예약 백엔드 미연동이라 항상 0으로
 * 내려온다 — 그래서 지금은 실질적으로 초과 케이스가 거의 안 나오지만, 0건이어도 이 줄 자체는
 * 항상 노출한다(요청사항) — "지금은 초과가 없다"는 것도 대시보드에서 바로 확인할 수 있어야
 * 하기 때문. 예약 백엔드가 연동되면 코드 변경 없이 그대로 동작한다. 클라이언트 컴포넌트로 분리한
 * 이유는 대시보드 본문(page.tsx)은 여전히 목업 데이터 기반 서버 컴포넌트라, 이 부분만 real API를
 * useEffect로 불러오기 위함이다.
 */
export function InventoryOverCapacityAlert() {
  const [days, setDays] = useState<OverCapacityDay[] | null>(null);

  useEffect(() => {
    let alive = true;
    const now = new Date();
    const months = [
      { year: now.getFullYear(), month: now.getMonth() + 1 },
      {
        year: now.getMonth() === 11 ? now.getFullYear() + 1 : now.getFullYear(),
        month: ((now.getMonth() + 1) % 12) + 1,
      },
    ];

    api.assets
      .list(false)
      .then((assets) =>
        Promise.all(
          assets.flatMap((asset) =>
            months.map(({ year, month }) =>
              api.inventory
                .snapshot(asset.assetId, year, month)
                .then((snapshot) => ({ assetName: asset.name, snapshot }))
                .catch(() => ({ assetName: asset.name, snapshot: [] })),
            ),
          ),
        ),
      )
      .then((results) => {
        if (!alive) return;
        const found: OverCapacityDay[] = [];
        for (const { assetName, snapshot } of results) {
          for (const day of snapshot) {
            if (day.remaining < 0) found.push({ assetName, date: day.date });
          }
        }
        found.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
        setDays(found);
      })
      .catch(() => {
        if (alive) setDays([]);
      });

    return () => {
      alive = false;
    };
  }, []);

  // 아직 안 불러온 상태(초기 로딩)에서만 아무것도 안 보여준다 — 0건일 때도 줄 자체는 항상
  // 노출해서(요청사항), "지금 재고 초과가 없다"는 것도 화면에서 바로 확인할 수 있게 한다.
  if (days === null) return null;

  if (days.length === 0) {
    return (
      <Alert status="success" tone="dark" title="재고 초과 알림">
        현재 재고 초과 없음
      </Alert>
    );
  }

  return (
    <NextLink href="/inventory" className="block">
      <Alert status="warning" tone="dark" title="재고 초과 알림">
        {days.map((d) => `${d.assetName} ${d.date}`).join(", ")}
      </Alert>
    </NextLink>
  );
}
