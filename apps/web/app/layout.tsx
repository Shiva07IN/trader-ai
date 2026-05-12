import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "next-auth/react";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "TraderAI — AI-Powered Indian Stock Market Intelligence",
  description: "Deep research, portfolio intelligence, and market insights for serious Indian investors.",
  manifest: "/manifest.json",
  themeColor: "#13121B",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased" style={{ background: "#13121B", color: "#E4E1EE", fontFamily: "Inter, sans-serif" }}>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
