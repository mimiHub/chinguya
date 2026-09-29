import path from "node:path";

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@chinguya/ui", "@chinguya/types", "@chinguya/api-client"],
  // 개발 EC2 배포용. 이게 없으면 서버에 monorepo node_modules 를 통째로 올려야 하는데,
  // 그 인스턴스는 디스크 여유가 얼마 없다. standalone 은 실제로 쓰이는 파일만 추려 담는다.
  output: "standalone",
  // pnpm 워크스페이스라 추적 기준을 저장소 루트로 올려야 packages/* 심볼릭 링크를 따라간다.
  // 기본값(앱 디렉터리)이면 @chinguya/ui 같은 워크스페이스 패키지가 번들에서 빠진다.
  outputFileTracingRoot: path.join(import.meta.dirname, "../../"),
  // S4-A1·S4-A3 분리(2026-09-28)로 없어진 옛 경로. 즐겨찾기·공유 링크가 404가 되지 않게 옮겨 준다.
  // permanent: false(307)로 둔다 — 308은 브라우저가 영구 캐시해서, 나중에 /content 를 다른 용도로
  // 되살리면 이미 한 번 들어온 사람은 계속 /landing 으로 튕긴다.
  async redirects() {
    return [{ source: "/content", destination: "/landing", permanent: false }];
  },
};

export default nextConfig;
