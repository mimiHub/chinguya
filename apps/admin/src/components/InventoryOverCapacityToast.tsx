"use client";

import { useEffect, useState } from "react";
import { Toast } from "@chinguya/ui";
import { createApiClient } from "@chinguya/api-client";

const api = createApiClient();

interface OverCapacityDay {
  assetId: string;
  assetName: string;
  date: string;
}

/** 토스트에 날짜를 몇 개까지 직접 보여줄지 — 넘으면 "외 N건"으로 줄인다. */
const MAX_SHOWN = 4;

/** "2026-07-28" → "7/28" (월·일의 앞자리 0은 뗀다) */
function formatMonthDay(date: string): string {
  const [, month, day] = date.split("-");
  return `${Number(month)}/${Number(day)}`;
}

/**
 * 대시보드(S1-A1) "재고 초과 알림" — chinguya-wireframes/docs/관리자_상세설명.md
 * (2026-09-04 갱신, 커밋 94119af)이 요구하는 항목:
 *   재고 초과 알림 = 그 날짜의 예약 수가 총 보유를 넘은 날. a-inv(S1-A3)에서 재고를 예약 수보다
 *   낮게 내렸을 때 발생하며, 해소될 때까지 상시 노출한다. 여행사 할당 합이
 *   총 보유를 넘은 날(할당 초과)도 같은 알림에 포함한다.
 *
 * 예전에는 대시보드 본문에 상시 노출되는 어두운 알림 줄(Alert)이었는데, 화면 자리를 차지해서
 * 하단 토스트 팝업(공용 Toast)으로 바꿨다. 다만 토스트처럼 사라지지 않고 하단에 항상 떠 있다.
 * - 문구는 0건이면 "재고 초과 날짜 0건"(초록 체크), 1건 이상이면 "재고 초과 날짜 2건 · 7/28, 8/3"
 *   (노란 경고 아이콘 + "확인" 링크로 /inventory 이동)이다. 여러 자산이 같은 날 초과해도 날짜는
 *   한 번만 세고, 날짜가 많으면 앞의 4개만 보여준 뒤 "외 N건"으로 줄인다.
 * - 자동으로 사라지지 않게 onClose를 넘기지 않는다(Toast는 duration 뒤에 onClose만 부르고
 *   실제로 닫는 건 부모라서, 부모가 open을 계속 true로 두면 항상 떠 있다).
 *
 * 초과로 세는 날 = ① 그 날짜의 예약 수가 총 보유를 넘은 날(remaining < 0) 또는 ② 여행사 할당
 * 합이 총 보유를 넘은 날(allocated > totalStock, '할당 초과'). 와이어프레임대로 둘을 같은 알림에
 * 합쳐서 센다. "확인" 링크는 가장 이른 초과 날짜의 재고 세팅 화면(자산·날짜가 이미 선택된 상태)으로
 * 이동한다(/inventory?asset=…&date=YYYY-MM-DD — 화면 이동 규칙: 초과 알림 → a-inv의 해당 날짜).
 *
 * 재고 세팅(/inventory)이 이미 Core API 실연동으로 옮겨갔으므로(구 할당 세팅 화면 /allocations와
 * 그 전용 목업 assetData.ts·inventoryData.ts·allocationData.ts는 삭제됨 — 와이어프레임상 S1-A3로
 * 흡수), 여기서도 같은 real API(api.inventory.snapshot)로 이번 달·다음 달 스냅샷을 모든 자산에
 * 대해 훑어 remaining(고객 가용 − 예약) < 0인 날짜를 찾는다.
 *
 * ⚠ api-client의 InventoryDaySnapshot 주석대로 reserved는 아직 예약 백엔드 미연동이라 항상 0으로
 * 내려온다 — 그래서 지금은 실질적으로 초과 케이스가 거의 안 나온다(= 대개 "0건"으로 뜬다).
 * 예약 백엔드가 연동되면 코드 변경 없이 그대로 동작한다. 클라이언트 컴포넌트로 분리한 이유는
 * 대시보드 본문(page.tsx)은 여전히 목업 데이터 기반 서버 컴포넌트라, 이 부분만 real API를
 * useEffect로 불러오기 위함이다.
 */
export function InventoryOverCapacityToast() {
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
                .then((snapshot) => ({ assetId: asset.assetId, assetName: asset.name, snapshot }))
                .catch(() => ({ assetId: asset.assetId, assetName: asset.name, snapshot: [] })),
            ),
          ),
        ),
      )
      .then((results) => {
        if (!alive) return;
        const found: OverCapacityDay[] = [];
        for (const { assetId, assetName, snapshot } of results) {
          for (const day of snapshot) {
            // 예약 초과(remaining < 0) 또는 할당 초과(여행사 할당 합 > 총 보유)
            if (day.remaining < 0 || day.allocated > day.totalStock) {
              found.push({ assetId, assetName, date: day.date });
            }
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

  // 아직 안 불러온 상태(초기 로딩)에서만 아무것도 안 보여준다.
  if (days === null) return null;

  // 같은 날 여러 자산이 초과해도 "날짜"는 한 번만 센다(days는 이미 날짜순 정렬).
  const dates = [...new Set(days.map((d) => d.date))];
  const count = dates.length;
  const first = days[0]; // days는 날짜순 정렬 — 가장 이른 초과 날짜
  const message =
    count === 0
      ? "재고 초과 날짜 0건"
      : `재고 초과 날짜 ${count}건 · ${dates.slice(0, MAX_SHOWN).map(formatMonthDay).join(", ")}${
          count > MAX_SHOWN ? ` 외 ${count - MAX_SHOWN}건` : ""
        }`;

  return (
    <Toast
      open
      status={count > 0 ? "warning" : "success"}
      message={message}
      actionLabel={first ? "확인" : undefined}
      actionHref={first ? `/inventory?asset=${encodeURIComponent(first.assetId)}&date=${first.date}` : undefined}
    />
  );
}
