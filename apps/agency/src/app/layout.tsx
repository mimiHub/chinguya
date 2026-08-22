import type { Metadata } from "next";
import { Sidebar } from "@/components/Sidebar";
import "./globals.css";

export const metadata: Metadata = {
  title: "친구야 · 여행사 포털",
  description: "친구야 여행사용 데스크톱 웹 — 할당 재고 예약·월별 정산",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <div className="flex min-h-screen">
          <Sidebar />
          <div className="flex-1 p-8">{children}</div>
        </div>
      </body>
    </html>
  );
}
