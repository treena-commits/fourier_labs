import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TrendBet — Fashion Buyer Decision Copilot",
  description: "Help value-fashion buyers decide which trends deserve inventory commitment.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col antialiased">{children}</body>
    </html>
  );
}
