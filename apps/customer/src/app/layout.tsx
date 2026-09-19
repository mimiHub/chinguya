import type { Metadata } from "next";
import { BottomNav } from "@/components/BottomNav";
import { Footer } from "@/components/Footer";
import { TopNav } from "@/components/TopNav";
import { CartProvider } from "@/context/CartContext";
import { CustomerAuthProvider } from "@/context/CustomerAuthContext";
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
      {/* 푸터는 '컨텐츠 영역이 한 화면을 다 채운 뒤'에만 나온다 — 컨텐츠가 짧아도 푸터가 컨텐츠 바로 밑으로 올라와
          보이지 않고, 스크롤을 내려야 화면 아래에서 나타난다. 그래서 {children} 래퍼에 최소 높이를 준다:
          모바일은 보이는 화면(dvh) − 하단 탭바(4rem), PC는 보이는 화면 전체(dvh는 모바일 주소창을 뺀 실제 보이는 높이). 컨텐츠가 더 길면 그냥 늘어난다.
          하단 탭바가 덮는 아래쪽 여백은 body가 아니라 Footer 안쪽 padding으로 잡는다(Footer.tsx 주석 참고).
          (예전엔 남는 공간을 flex-1로 채워 푸터를 화면 맨 아래에 붙였는데, 짧은 페이지에서 푸터가 컨텐츠 바로 밑으로 올라와 보였다.) */}
      <body>
        <MswProvider>
          <CustomerAuthProvider>
            <CartProvider>
              <TopNav />
              <div className="min-h-[calc(100dvh_-_4rem)] md:min-h-dvh">{children}</div>
              <Footer />
              <BottomNav />
            </CartProvider>
          </CustomerAuthProvider>
        </MswProvider>
      </body>
    </html>
  );
}