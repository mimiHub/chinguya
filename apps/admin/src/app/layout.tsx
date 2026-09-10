import type { Metadata } from "next";
import { TopHeader } from "@/components/TopHeader";
import { BottomNav } from "@/components/BottomNav";
import { AdminAuthProvider } from "@/context/AdminAuthContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "친구야 · 관리자 콘솔",
  description: "친구야 관리자용 모바일 웹 — 자산·재고·예약·정산 운영",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // 예전엔 body가 그냥 흘러내려서(콘텐츠가 길면) 화면 전체가 스크롤됐다 — 헤더도 같이
    // 밀려 올라가 버려 PC 폭에서 페이지가 길어질수록 헤더를 다시 보려면 맨 위로 스크롤해야
    // 하는 불편이 있었다. html/body를 뷰포트 높이에 고정하고 헤더·하단탭은 그 안에서
    // 제자리를 지키게 한 뒤, {children}만 자기 영역 안에서 스크롤되게 한다.
    <html lang="ko" className="h-full overflow-hidden">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body className="flex h-full flex-col overflow-hidden">
        <AdminAuthProvider>
          <TopHeader />
          <div className="min-h-0 flex-1 overflow-y-auto pb-16 md:pb-0">{children}</div>
          <BottomNav />
        </AdminAuthProvider>
      </body>
    </html>
  );
}
