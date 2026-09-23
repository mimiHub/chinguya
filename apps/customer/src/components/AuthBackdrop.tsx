import Image from "next/image";

/**
 * 로그인 / 회원가입 화면 하단에 깔리는 공통 배경 일러스트(자전거 타는 여자).
 *
 * - 순수 장식이라 alt="" + aria-hidden — 스크린리더가 읽지 않게 한다.
 * - absolute로 부모(main) 맨 아래에 붙인다. 부모는 `relative min-h-[inherit]`여야 한다 —
 *   layout.tsx가 준 "한 화면 높이"를 이어받아야 내용이 짧아도 그림이 화면 바닥에 붙는다.
 * - 흐리게(opacity) 깔아서 배경처럼 보이게 하고, pointer-events-none으로 클릭을 막지 않게 한다.
 *   화면이 낮아 폼과 겹치더라도 폼 쪽에 `relative z-10`을 줘서 글자가 그림 위에 오도록 한다.
 * - 원본 PNG(1535px, 1MB)는 좌우 투명 여백을 잘라내고 720px webp(약 200KB)로 줄여 public에 두었다.
 */
export function AuthBackdrop() {
  return (
    <Image
      src="/auth-bg-bike.webp"
      alt=""
      aria-hidden
      width={720}
      height={983}
      sizes="(min-width: 768px) 320px, 70vw"
      className="pointer-events-none absolute bottom-0 left-1/2 w-[70%] max-w-[320px] -translate-x-1/2 select-none opacity-40"
    />
  );
}
