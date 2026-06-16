"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FullscreenLoader } from "@/components/ui/FullscreenLoader";
import { TopBar } from "@/components/admin/TopBar";
import { ApiError, getCurrentUser } from "@/lib/api";
import { setAuthenticated } from "@/lib/session";

interface AdminLayoutProps {
  children: React.ReactNode;
}

function RedirectToLogin() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/login");
  }, [router]);

  return <FullscreenLoader label="Przekierowanie do logowania..." />;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticatedState] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await getCurrentUser();
        setAuthenticated(true);
        setIsAuthenticatedState(true);
      } catch (err) {
        if (err instanceof ApiError || err instanceof Error) {
          console.log("Not authenticated:", err.message);
        }
        setAuthenticated(false);
        setIsAuthenticatedState(false);
      } finally {
        setIsLoading(false);
      }
    };

    void checkAuth();
  }, []);

  if (isLoading) {
    return <FullscreenLoader label="Sprawdzanie dostępu..." />;
  }

  if (!isAuthenticated) {
    return <RedirectToLogin />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <TopBar />
      <div className="app-main">{children}</div>
    </div>
  );
}