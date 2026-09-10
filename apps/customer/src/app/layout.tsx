import type { Metadata } from "next";
import { BottomNav } from "@/components/BottomNav";
import { Footer } from "@/components/Footer";
import { TopNav } from "@/components/TopNav";
import { CartProvider } from "@/context/CartContext";
import "./globals.css";
import { MswProvider } from "./msw-provider";

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
      {/* 컨텐츠가 짧은 페이지(공지사항 등)에서는 Footer가 화면 중간에 붕 떠 보이는 문제가
          있었다 — body를 세로 flex로 만들고 {children}에 flex-1을 줘서, 내용이 짧을 땐
          남는 세로 공간을 {children}이 흡수해 Footer가 항상 화면 하단에 붙게 한다. 내용이
          길 땐 그냥 자연스럽게 페이지 전체가 스크롤된다(높이를 고정/제한하지 않았으므로). */}
      <body className="flex min-h-screen flex-col pb-16 md:pb-0">
        <MswProvider>
          <CartProvider>
            <TopNav />
            <div className="flex-1">{children}</div>
            <Footer />
            <BottomNav />
          </CartProvider>
        </MswProvider>
      </body>
    </html>
  );
}