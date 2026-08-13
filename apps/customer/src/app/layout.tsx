import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "친구야 · 고객 페이지",
  description: "친구야 고객용 모바일 웹 — 상품 조회·예약·입금 확인",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body>{children}</body>
    </html>
  );
}
