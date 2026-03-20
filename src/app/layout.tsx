import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: 'EduFlow AI - 통합 입시 컨설팅 관리 시스템',
  description: 'AI 기반 고등학교 생활기록부 관리 및 고객 관리 솔루션',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
