"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const EXCLUDED_PREFIXES = ["/dashboard", "/login"];

export default function PublicShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPublic = !EXCLUDED_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  if (!isPublic) {
    return <>{children}</>;
  }

  return (
    <>
      <Header />
      <div className="flex-1 flex flex-col">{children}</div>
      <Footer />
    </>
  );
}
