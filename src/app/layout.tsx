import type { Metadata } from "next";
import "./globals.css";
import Navigation from "@/components/Navigation";
import { AuthProvider } from "@/contexts/AuthContext";

export const metadata: Metadata = {
  title: "노무원큐 - 사업장 노무관리 솔루션",
  description: "근로계약서, 급여명세서, 연차관리 등 노무서류를 원큐로 관리하세요. 소규모 사업장을 위한 스마트 노무관리.",
  keywords: "노무관리, 근로계약서, 급여명세서, 임금대장, 취업규칙, HR, 인사관리, SaaS",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="min-h-screen">
        <AuthProvider>
          <Navigation />
          <main className="pt-14">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
