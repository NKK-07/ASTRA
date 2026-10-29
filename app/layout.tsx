import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "@fontsource/noto-sans-devanagari/400.css";
import "@fontsource/noto-sans-devanagari/600.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "AstraTest Bharat",
  description: "One front door to India's defence test ranges, from prototype to procurement. Unclassified demo.",
  icons: { icon: "/icon.svg" }
};

export const viewport: Viewport = { themeColor: "#0A0B0D", colorScheme: "dark" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
