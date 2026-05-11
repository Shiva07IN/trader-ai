import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "TraderAI — AI-Powered Indian Stock Market Research",
    template: "%s | TraderAI",
  },
  description:
    "Discover, analyze, and build AI-powered investment portfolios for Indian markets. Get real-time NSE/BSE insights, SWOT analysis, and personalized recommendations.",
  keywords: [
    "Indian stock market",
    "NSE",
    "BSE",
    "AI investing",
    "portfolio builder",
    "stock analysis",
    "Nifty 50",
    "stock screener",
  ],
  authors: [{ name: "TraderAI" }],
  creator: "TraderAI",
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://traderai.in",
    siteName: "TraderAI",
    title: "TraderAI — AI-Powered Indian Stock Market Research",
    description: "AI-driven portfolio builder, stock analysis, and market intelligence for Indian investors.",
  },
  twitter: {
    card: "summary_large_image",
    title: "TraderAI",
    description: "AI-powered Indian stock market research platform",
  },
  robots: { index: true, follow: true },
  metadataBase: new URL("https://traderai.in"),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
