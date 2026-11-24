import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 개발용 Next.js 표시 배지는 서비스 UI와 섞이지 않도록 끈다
  devIndicators: false,
  cacheComponents: true,
  partialPrefetching: true,
};

export default nextConfig;
