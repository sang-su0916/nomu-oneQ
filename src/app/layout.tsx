import type { Metadata } from "next";
import "./globals.css";
import Navigation from "@/components/Navigation";

export const metadata: Metadata = {
  title: "노무뚝딱 - 노무서류 관리 시스템",
  description: "근로계약서, 임금대장, 급여명세서, 취업규칙을 간편하게 작성하고 출력하세요. 노무 전문가를 위한 서류 관리 솔루션.",
  keywords: "노무관리, 근로계약서, 급여명세서, 임금대장, 취업규칙, HR, 인사관리",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link 
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css" 
          rel="stylesheet" 
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Nanum+Gothic:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen">
        <Navigation />
        <main className="pt-14">
          {children}
        </main>
      </body>
    </html>
  );
}
