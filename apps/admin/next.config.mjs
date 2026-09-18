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
};

export default nextConfig;
