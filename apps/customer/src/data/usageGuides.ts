import type { AssetCategory } from "@chinguya/types";

/**
 * 상품 상세 "상품 사용방법" 탭에 보여줄 안내 콘텐츠 — 자산 카테고리(자전거/낚싯대)별 단계 목록.
 *
 * ⚠️ 지금 들어 있는 사진·문구는 화면 확인용 **임시(샘플) 데이터**다. 개발/운영 쪽에서 실제 사용방법
 * 자료를 받으면 이 파일의 값만 바꾸면 된다(화면 코드는 건드릴 필요 없음).
 *   - 단계를 늘리거나 줄이려면 배열에 항목을 추가/삭제한다. 위에서부터 1, 2, 3… 번호가 자동으로 붙는다.
 *   - image: apps/customer/public/ 기준 경로. 새 이미지는 public/ 아래에 넣고 "/파일명.png"로 적는다.
 *     (예: public/usage/bike-1.jpg → "/usage/bike-1.jpg"). 생략하면 그 단계는 글만 보인다.
 *   - 카테고리에 항목이 없거나 빈 배열이면 화면엔 "준비 중" 안내가 나온다.
 *
 * 나중에 관리자(콘텐츠 관리)에서 직접 수정하게 되면 이 상수를 API 응답으로 바꾼다. 그때는 계약
 * (packages/api-spec)에 필드를 먼저 추가하는 순서를 지킨다 — 지금은 계약에 없는 필드라 앱 안 상수로 둔다.
 */
export interface UsageGuideStep {
  title: string;
  text: string;
  image?: string;
}

export const USAGE_GUIDES: Partial<Record<AssetCategory, UsageGuideStep[]>> = {
  BICYCLE: [
    {
      title: "대여 전 상태 확인",
      text: "수령 시 자전거의 타이어 공기압, 브레이크, 안장 높이를 직원과 함께 확인해 주세요. (임시 문구)",
      image: "/bike.png",
    },
    {
      title: "헬멧과 잠금장치 사용",
      text: "안전을 위해 헬멧을 꼭 착용해 주세요. 이동 중 잠시 세워둘 때는 기본 제공되는 잠금장치로 잠가 주세요. (임시 문구)",
      image: "/elec-bike.png",
    },
    {
      title: "주행 시 주의사항",
      text: "현지는 좌측통행입니다. 오르막과 내리막이 많으니 속도를 줄이고, 비 오는 날에는 특히 조심해 주세요. (임시 문구)",
      image: "/bike.png",
    },
    {
      title: "반납 방법",
      text: "예약한 반납 시간 전까지 대여한 지점으로 돌아와 직원에게 자전거를 인계해 주세요. 타지역 반납은 예약 시 선택한 경우에만 가능합니다. (임시 문구)",
    },
  ],
  FISHING_ROD: [
    {
      title: "구성품 확인",
      text: "낚싯대, 릴, 기본 채비가 모두 있는지 수령할 때 확인해 주세요. (임시 문구)",
      image: "/fishing-set.png",
    },
    {
      title: "릴과 채비 사용",
      text: "릴을 낚싯대에 고정한 뒤 라인이 가이드를 모두 통과했는지 확인하고 채비를 연결해 주세요. (임시 문구)",
      image: "/fishing-reel-set.png",
    },
    {
      title: "낚시 시 주의사항",
      text: "지정된 낚시 가능 구역에서만 사용해 주세요. 주변 사람과 충분한 거리를 두고 캐스팅해 주세요. (임시 문구)",
      image: "/fishing-set.png",
    },
    {
      title: "반납 방법",
      text: "사용 후 물기를 닦아 구성품을 모두 챙겨 반납해 주세요. 분실·파손 시 안내에 따라 비용이 청구될 수 있습니다. (임시 문구)",
    },
  ],
};
