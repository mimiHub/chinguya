import { Stack } from "@chinguya/ui/stack";
import { Text } from "@chinguya/ui/text";

interface InfoLine {
  label: string;
  value: string;
}

// 라벨: 값 형태로 나열되는 정보 — Kv 컴포넌트는 밝은 배경(text-muted 라벨/text-ink 값)
// 기준이라 어두운 푸터 배경엔 안 맞아서, 흰색 톤이 되는 Text만으로 직접 구성한다.
const INFO_LINES: InfoLine[] = [
  { label: "주소:", value: "부산광역시 동구 중앙대로 169, 318호 넷투재팬" },
  { label: "영업시간:", value: "(10:00 ~ 15:00)" },
  { label: "대여서비스 문의:", value: "예약문의(한국) : 010-9129-3051 | 일본사고시 긴급 연락 : 090-1970-7077" },
  { label: "사업자등록번호:", value: "105-87-19839 · 대표: 김인태" },
];

// 모든 페이지 하단 공통 푸터. 로고는 TopNav가 배너 위 투명 상태에서 쓰는 것과 같은 방식
// (brightness-0 invert)으로 원본 로고 이미지를 흰색으로 반전해서 쓴다.
export function Footer() {
  return (
    <footer className="bg-ink px-6 py-10">
      <div className="mx-auto max-w-2xl md:max-w-5xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-pc.png" alt="친구야 카페" className="h-9 w-auto object-contain brightness-0 invert" />

        <Stack direction="column" gap="sm" className="mt-6">
          {INFO_LINES.map((line) => (
            <Text key={line.label} tone="white" size="sm">
              <Text as="span" tone="white" size="sm">
                {line.label}
              </Text>{" "}
              {line.value}
            </Text>
          ))}
        </Stack>

        <Text tone="white-muted" size="xs" className="mt-6">
          © 2026 copyright NETJAPAN.co.ltd all right reserved.
        </Text>
      </div>
    </footer>
  );
}
