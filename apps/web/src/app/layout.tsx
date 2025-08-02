import "@/styles/globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { SITE_INFO } from "@/utils/constants";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: `${SITE_INFO.name} - Discord Bot`,
  icons: "/logo.png",
  description: SITE_INFO.description,
  keywords: [
    "discord bot",
    "free",
    "moderation",
    "tickets",
    "open source",
    "no paywall",
  ],
  authors: [{ name: "Pure Community" }],
  openGraph: {
    title: `${SITE_INFO.name} - ${SITE_INFO.tagline}`,
    description: SITE_INFO.description,
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_INFO.name} - ${SITE_INFO.tagline}`,
    description: SITE_INFO.description,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${inter.className} antialiased bg-slate-900 text-white`}
      >
        {children}
      </body>
    </html>
  );
}
