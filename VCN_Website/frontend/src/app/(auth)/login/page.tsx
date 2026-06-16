"use client";

import Image from "next/image";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/Button";

export default function LoginPage() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startLogin = useCallback(() => {
    setError(null);
    setIsProcessing(true);

    try {
      const SSO_PANEL = process.env.NEXT_PUBLIC_SSO_PANEL_URL || "http://localhost:5173";
      const APP_ID = process.env.NEXT_PUBLIC_IAM_APP_ID || "1";
      const REDIRECT_URI = `${window.location.origin}/callback`;

      const params = new URLSearchParams({
        appId: APP_ID,
        redirectUri: REDIRECT_URI,
      });

      window.location.href = `${SSO_PANEL}/login?${params.toString()}`;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Nie udało się rozpocząć logowania.");
      setIsProcessing(false);
      console.error(e);
    }
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-6 py-12">
      <section className="w-full max-w-sm border border-vcn-border bg-white p-8">
        <div className="text-center">
          <Image src="/vcn-logo-dark.svg" alt="VCN" width={120} height={32} className="mx-auto h-8 w-auto" priority />
          <h1 className="mt-6 text-xl font-semibold text-vcn-heading">Logowanie do CMS</h1>
          <p className="mt-2 text-sm text-vcn-text">Zaloguj się przy użyciu systemu VCN IAM.</p>
        </div>

        <div className="mt-8">
          <Button type="button" onClick={startLogin} disabled={isProcessing} className="w-full">
            {isProcessing ? "Przekierowywanie..." : "Zaloguj przez VCN"}
          </Button>
          {error ? <p className="ds-alert-error mt-3">{error}</p> : null}
        </div>

        <p className="mt-6 text-center text-xs text-vcn-text">Powered by VCN IAM</p>
      </section>
    </main>
  );
}
