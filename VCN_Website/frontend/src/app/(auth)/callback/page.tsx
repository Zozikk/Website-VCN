"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { exchangeAuthCode } from "@/lib/api";
import { setAuthenticated } from "@/lib/session";
import { Button } from "@/components/ui/Button";

export default function CallbackPage() {
  const search = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isWorking, setIsWorking] = useState(true);

  useEffect(() => {
    const doExchange = async () => {
      const code = search.get("code");
      const appId = search.get("appId");
      if (!code) {
        setError("Missing authorization code.");
        setIsWorking(false);
        return;
      }

      try {
        await exchangeAuthCode({ code, appId: appId || undefined });
        setAuthenticated(true);
        router.push("/dashboard");
      } catch (e: any) {
        setError(e?.message || "Exchange failed.");
      } finally {
        setIsWorking(false);
      }
    };

    doExchange();
  }, [search, router]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-6 py-12">
      <section className="w-full rounded-xl border border-slate-200 p-6">
        <h1 className="text-2xl font-semibold text-slate-900">Kończenie logowania</h1>
        <p className="mt-2 text-sm text-slate-600">Proszę czekać — trwa logowanie.</p>

        {isWorking ? (
          <div className="mt-6">
            <Button disabled>Trwa logowanie...</Button>
          </div>
        ) : error ? (
          <div className="mt-6">
            <p className="text-sm text-red-600">{error}</p>
            <Button onClick={() => router.push("/login")}>Wróć do logowania</Button>
          </div>
        ) : null}
      </section>
    </main>
  );
}
