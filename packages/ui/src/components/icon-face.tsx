export type IconFaceMood = "happy" | "sad";

export interface IconFaceProps {
  /** 표정. "happy"(웃는 얼굴, 기본) | "sad"(슬픈 얼굴) — 입 모양만 위아래로 뒤집힌다. */
  mood?: IconFaceMood;
  /** 크기·색은 Tailwind 클래스로 준다(예: "h-7 w-7 text-stat-primary"). 색은 currentColor를 따른다. */
  className?: string;
}

/** 입 모양 — 웃는 입은 아래로 볼록한 곡선, 슬픈 입은 그 곡선을 위아래로 뒤집은 것(위로 볼록). */
const mouthPath: Record<IconFaceMood, string> = {
  happy: "M8 14.25c1 1.5 2.4 2.25 4 2.25s3-.75 4-2.25",
  sad: "M8 16.5c1-1.5 2.4-2.25 4-2.25s3 .75 4 2.25",
};

/**
 * 표정 선 아이콘(윤곽선만, 채우기 없음). 대시보드 수치 카드(Stat)의 모서리 장식처럼
 * "새 소식이 있음(웃음) / 없음(슬픔)"을 한눈에 보여줄 때 쓴다. 눈·윤곽은 그대로고 입만 바뀐다.
 * 색은 currentColor라 글자색(text-*)을 그대로 따라간다.
 */
export function IconFace({ mood = "happy", className = "h-6 w-6" }: IconFaceProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <circle cx="12" cy="12" r="9.25" />
      <path d={mouthPath[mood]} />
      <path d="M9 9.5v.5M15 9.5v.5" strokeWidth="2.25" />
    </svg>
  );
}
