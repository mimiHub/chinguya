"use client";

import { Toast } from "@chinguya/ui";

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
 *   (노란 경고 아이콘 + "확인" 링크로 /inventory 이동)이다.
 * - 자동으로 사라지지 않게 onClose를 넘기지 않는다(Toast는 duration 뒤에 onClose만 부르고
 *   실제로 닫는 건 부모라서, 부모가 open을 계속 true로 두면 항상 떠 있다).
 *
 * **초과 판정과 집계는 서버가 한다**(GET /admin/dashboard, 2026-09-21 변경). 예전에는 이 컴포넌트가
 * 자산 목록을 받아 자산×월마다 재고 스냅샷을 불러 remaining < 0 · allocated > totalStock 을
 * 직접 골라냈는데, 호출이 자산 수만큼 늘고 범위도 이번 달·다음 달뿐이었다. 지금은 대시보드가
 * 받은 날짜 배열(오늘 ~ +3개월, 중복 없이 오름차순)을 그대로 받아 문구만 만든다.
 *
 * "확인" 링크는 가장 이른 초과 날짜의 재고 세팅 화면으로 이동한다(화면 이동 규칙: 초과 알림 →
 * a-inv의 해당 날짜). 자산은 넘기지 않는다 — 같은 날 여러 자산이 초과할 수 있어 서버도 날짜만
 * 세기 때문이다. 재고 세팅 화면에서 자산을 고른다.
 */
export function InventoryOverCapacityToast({ dates }: { dates: string[] | null }) {
  // 아직 안 불러온 상태(초기 로딩)에서는 아무것도 안 보여준다.
  if (dates === null) return null;

  const count = dates.length;
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
      actionLabel={count > 0 ? "확인" : undefined}
      actionHref={count > 0 ? `/inventory?date=${dates[0]}` : undefined}
    />
  );
}
