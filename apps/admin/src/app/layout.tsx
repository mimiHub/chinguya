import type { Metadata } from "next";
import { TopHeader } from "@/components/TopHeader";
import { BottomNav } from "@/components/BottomNav";
import "./globals.css";

export const metadata: Metadata = {
  title: "친구야 · 관리자 콘솔",
  description: "친구야 관리자용 모바일 웹 — 자산·재고·예약·정산 운영",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body className="pb-16 md:pb-0">
        <TopHeader />
        {children}
        <BottomNav />
      </body>
    </html>
  );
}
