import { Text } from "@chinguya/ui";

/**
 * 공지 본문 렌더 — `![설명](주소)` **이미지 표기만** 이미지로 바꾸고 나머지는 글자 그대로 둔다.
 *
 * 마크다운 라이브러리를 붙이지 않은 것이 의도다(2026-09-21 결정). 관리자가 넣을 수 있는 것도
 * 이미지 표기뿐이라, 굵게·목록 같은 다른 문법은 관리자 화면에서도 "글자 그대로 보인다"고
 * 안내한다 — 여기서 해석하면 그 안내가 거짓이 된다.
 *
 * 줄바꿈은 `whitespace-pre-line` 으로 보존한다(관리자가 입력한 그대로).
 */

/** `![설명](주소)` — 설명은 비어도 되고, 주소에는 `)` 가 없다고 본다(업로드가 만든 주소는 안전하다). */
const IMAGE_NOTATION = /!\[([^\]]*)\]\(([^)]+)\)/g;

interface Segment {
  type: "text" | "image";
  value: string;
  alt?: string;
}

/** 본문을 텍스트·이미지 조각으로 가른다. 표기가 없으면 텍스트 한 덩어리다. */
export function splitNoticeBody(content: string): Segment[] {
  const segments: Segment[] = [];
  let lastIndex = 0;

  // exec 를 돌리므로 lastIndex 가 남지 않도록 매번 새 정규식을 쓴다.
  const pattern = new RegExp(IMAGE_NOTATION);
  let match = pattern.exec(content);
  while (match !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: "text", value: content.slice(lastIndex, match.index) });
    }
    // 그룹은 정규식상 반드시 잡히지만 타입상 optional 이라 기본값을 준다.
    segments.push({ type: "image", value: match[2] ?? "", alt: match[1] ?? "" });
    lastIndex = match.index + match[0].length;
    match = pattern.exec(content);
  }
  if (lastIndex < content.length) {
    segments.push({ type: "text", value: content.slice(lastIndex) });
  }
  return segments;
}

export function NoticeBody({ content }: { content: string }) {
  const segments = splitNoticeBody(content);

  return (
    <div className="flex flex-col gap-3">
      {segments.map((segment, i) =>
        segment.type === "image" ? (
          // 관리자가 올린 이미지는 Core 의 콘텐츠 이미지 경로에 있다 — 브라우저는 자기 오리진
          // 프록시(/api/core)를 거쳐 읽는다. next/image 는 외부 주소 설정이 필요해 쓰지 않는다.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={`img-${i}`}
            src={`/api/core${segment.value}`}
            alt={segment.alt ?? ""}
            className="w-full rounded"
          />
        ) : (
          <Text key={`text-${i}`} className="whitespace-pre-line leading-relaxed">
            {segment.value}
          </Text>
        ),
      )}
    </div>
  );
}
