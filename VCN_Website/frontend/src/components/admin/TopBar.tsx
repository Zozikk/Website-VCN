"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ApiError, getCurrentUser, logoutUser } from "@/lib/api";
import { clearToken, setAuthenticated } from "@/lib/session";
import { Button } from "@/components/ui/Button";

const navItems = [
  {
    label: "Strony",
    href: "/dashboard",
    match: (path: string) =>
      path === "/dashboard" || path.startsWith("/dashboard/edit") || path.startsWith("/dashboard/new"),
  },
  {
    label: "Redirecty",
    href: "/dashboard/redirects",
    match: (path: string) => path === "/dashboard/redirects",
  },
  {
    label: "Tagi",
    href: "/dashboard/tags",
    match: (path: string) => path === "/dashboard/tags",
  },
];

export function TopBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    getCurrentUser()
      .then((data) => setUserEmail(data.user?.email ?? data.user?.username ?? null))
      .catch(() => setUserEmail(null));
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    setUserEmail(null);
    setAuthenticated(false);
    clearToken();
    try {
      await logoutUser();
    } catch (err) {
      if (!(err instanceof ApiError)) {
        console.error(err);
      }
    }
    router.replace("/login");
    router.refresh();
  };

  return (
    <header className="app-header">
      <div className="app-header-inner">
        <Link href="/dashboard" className="shrink-0">
          <Image src="/vcn-logo-dark.svg" alt="VCN" width={100} height={28} className="h-7 w-auto" priority />
        </Link>

        <nav className="app-nav" aria-label="Nawigacja panelu CMS">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`app-nav-link ${item.match(pathname) ? "app-nav-link-active" : ""}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-4">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold text-vcn-heading">{userEmail ?? "Administrator"}</p>
            <p className="text-xs text-vcn-text">Panel CMS</p>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={() => void handleLogout()} disabled={isLoggingOut}>
            {isLoggingOut ? "..." : "Wyloguj"}
          </Button>
        </div>
      </div>
    </header>
  );
}
