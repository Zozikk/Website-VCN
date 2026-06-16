import type { Metadata } from "next";
import { Source_Sans_3 } from "next/font/google";
import "./globals.css";
import PublicShell from "@/components/layout/PublicShell";

const sourceSans = Source_Sans_3({
  variable: "--font-source-sans",
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "600", "700", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "VCN – System awizacji i przepustek",
  description: "VCN dostarcza nowoczesne systemy kontroli dostępu, awizacji i przepustek dla firm.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pl"
      suppressHydrationWarning
      className={`${sourceSans.variable} h-full antialiased`}
    >
      <head>
        <meta name="darkreader-lock" />
      </head>
      <body suppressHydrationWarning className="min-h-full flex flex-col bg-white">
        <PublicShell>{children}</PublicShell>
      </body>
    </html>
  );
}
