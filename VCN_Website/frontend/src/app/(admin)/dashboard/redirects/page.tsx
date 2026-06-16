"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ApiError, createRedirectRule, fetchRedirectRules } from "@/lib/api";
import { CmsRedirectRule, RedirectPayload } from "@/lib/types";

const defaultFormState: RedirectPayload = {
  fromPath: "",
  toPath: "",
  statusCode: 301,
  isActive: true,
};

export default function RedirectsPage() {
  const [redirects, setRedirects] = useState<CmsRedirectRule[]>([]);
  const [formState, setFormState] = useState<RedirectPayload>(defaultFormState);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRedirects = async () => {
    setError(null);
    setIsLoading(true);

    try {
      const data = await fetchRedirectRules();
      setRedirects(data);
    } catch (err) {
      if (err instanceof ApiError || err instanceof Error) {
        setError(err.message);
      } else {
        setError("Nie udało się pobrać redirectów.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadRedirects();
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const created = await createRedirectRule(formState);
      setRedirects((prev) => [created, ...prev]);
      setFormState(defaultFormState);
    } catch (err) {
      if (err instanceof ApiError || err instanceof Error) {
        setError(err.message);
      } else {
        setError("Nie udało się dodać redirectu.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <header className="page-header">
        <div>
          <h1 className="page-title">Redirecty SEO</h1>
          <p className="page-description">Zarządzanie przekierowaniami 301/302/307/308.</p>
        </div>
        <Link href="/dashboard">
          <Button type="button" variant="ghost">
            Powrót do listy
          </Button>
        </Link>
      </header>

      {error ? <p className="ds-alert-error mb-6">{error}</p> : null}

      <section className="page-section mb-6">
        <h2 className="page-title mb-4 text-base">Dodaj redirect</h2>
        <form className="grid gap-4 md:grid-cols-[1fr_1fr_160px_auto]" onSubmit={handleSubmit}>
          <Input
            label="Ścieżka źródłowa"
            placeholder="/stary-url"
            value={formState.fromPath}
            onChange={(event) => setFormState((prev) => ({ ...prev, fromPath: event.target.value }))}
            required
          />
          <Input
            label="Ścieżka docelowa"
            placeholder="/nowy-url"
            value={formState.toPath}
            onChange={(event) => setFormState((prev) => ({ ...prev, toPath: event.target.value }))}
            required
          />
          <label className="flex flex-col gap-1.5 text-sm font-medium text-vcn-heading" htmlFor="status-code">
            Kod statusu
            <select
              id="status-code"
              value={formState.statusCode}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, statusCode: Number(event.target.value) as RedirectPayload["statusCode"] }))
              }
              className="ds-input"
            >
              <option value={301}>301</option>
              <option value={302}>302</option>
              <option value={307}>307</option>
              <option value={308}>308</option>
            </select>
          </label>
          <div className="flex items-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Zapisywanie..." : "Dodaj"}
            </Button>
          </div>
        </form>
      </section>

      <section className="page-section">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="page-title text-base">Lista redirectów</h2>
          <Button type="button" variant="ghost" size="sm" onClick={() => void loadRedirects()}>
            Odśwież
          </Button>
        </div>

        {isLoading ? <p className="text-sm text-vcn-text">Ładowanie...</p> : null}

        {!isLoading && redirects.length === 0 ? (
          <p className="border border-dashed border-vcn-border p-4 text-sm text-vcn-text">Brak redirectów.</p>
        ) : null}

        {!isLoading && redirects.length > 0 ? (
          <table className="ds-table">
            <thead>
              <tr>
                <th>Źródło</th>
                <th>Cel</th>
                <th>Status</th>
                <th>Aktywny</th>
              </tr>
            </thead>
            <tbody>
              {redirects.map((redirect) => (
                <tr key={redirect.id}>
                  <td className="font-medium text-vcn-heading">{redirect.fromPath}</td>
                  <td>{redirect.toPath}</td>
                  <td>{redirect.statusCode}</td>
                  <td>{redirect.isActive ? "Tak" : "Nie"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </section>
    </>
  );
}
