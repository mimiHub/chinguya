import { Stack } from "@chinguya/ui/stack";
import { Text } from "@chinguya/ui/text";

interface InfoLine {
  label: string;
  /** 보통 문자열 하나지만, 대여서비스 문의처럼 항목이 여러 개면 배열로 줘서 한 줄씩 떨어뜨린다. */
  value: string | string[];
}

// 라벨: 값 형태로 나열되는 정보 — Kv 컴포넌트는 밝은 배경(text-muted 라벨/text-ink 값)
// 기준이라 어두운 푸터 배경엔 안 맞아서, 흰색 톤이 되는 Text만으로 직접 구성한다.
const INFO_LINES: InfoLine[] = [
  { label: "주소:", value: "부산광역시 동구 중앙대로 169, 318호 넷투재팬" },
  { label: "영업시간:", value: "(10:00 ~ 15:00)" },
  {
    label: "대여서비스 문의:",
    // 원래 "예약문의(한국) : ... | 일본사고시 긴급 연락 : ..."을 " | "로 이어붙인 한 줄이었는데,
    // 모바일 좁은 화면에서 줄바꿈이 이상한 위치에서 끊겨 지저분해 보였다. 항목마다 따로 줄을
    // 떨어뜨려서(라벨 밑에 리스트 2개) 폭에 상관없이 항상 깔끔하게 보이도록 바꿨다.
    value: ["예약문의(한국) : 010-9129-3051", "일본 사고 시 긴급 연락 : 090-1970-7077"],
  },
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
            <div key={line.label}>
              <Text as="span" tone="white" size="sm">
                {line.label}
              </Text>
              {Array.isArray(line.value) ? (
                <Stack direction="column" gap="xs" className="mt-1">
                  {line.value.map((item) => (
                    <Stack key={item} gap="xs" align="center">
                      {/* 위 라벨(대여서비스 문의:)에 딸린 하위 리스트라는 걸 보여주는 점 —
                          다른 화면의 "부제목" 강조 점(primary-500, 굵은 글씨)과는 목적이 달라서
                          여기선 눈에 덜 띄는 흐린 흰색 점을 쓴다. */}
                      <span aria-hidden className="h-1 w-1 shrink-0 rounded-full bg-white/60" />
                      <Text tone="white" size="sm">
                        {item}
                      </Text>
                    </Stack>
                  ))}
                </Stack>
              ) : (
                <Text as="span" tone="white" size="sm">
                  {" "}
                  {line.value}
                </Text>
              )}
            </div>
          ))}
        </Stack>

        <Text tone="white-muted" size="xs" className="mt-6">
          © 2026 copyright NETJAPAN.co.ltd all right reserved.
        </Text>
      </div>
    </footer>
  );
}
