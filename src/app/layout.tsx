import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GIOON · 오늘의 기운",
  description: "사주와 오행으로 매일 필요한 기운과 행운의 양말 색을 알려 주는 캐릭터 운세 앱",
  applicationName: "GIOON",
  appleWebApp: { capable: true, title: "GIOON", statusBarStyle: "default" },
  icons: { icon: "/icon.svg", apple: "/apple-icon.png" },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        {/* 한글 글리프는 쓰는 구간만 내려받는 동적 서브셋 (self-hosted) */}
        {/* eslint-disable-next-line @next/next/no-css-tags */}
        <link rel="stylesheet" href="/fonts/pretendard/pretendardvariable-dynamic-subset.css" />
      </head>
      <body>{children}</body>
    </html>
  );
}
