"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { DashboardStats } from "@/components/admin/DashboardStats";
import { RecentPages } from "@/components/admin/RecentPages";
import { ApiError, deletePage, fetchPages, fetchTags } from "@/lib/api";
import { CmsPage, CmsPageType } from "@/lib/types";

type StatusFilter = "all" | "published" | "draft";
type PageTypeFilter = "all" | CmsPageType;

export default function DashboardPage() {
  const [pages, setPages] = useState<CmsPage[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [pageType, setPageType] = useState<PageTypeFilter>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tag, setTag] = useState("");
  const [availableTags, setAvailableTags] = useState<{ id: number; name: string }[]>([]);

  const filteredPages = useMemo(() => {
    return [...pages].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [pages]);

  const loadPages = useCallback(async () => {
    setError(null);
    setIsLoading(true);

    try {
      const data = await fetchPages({
        q: query.trim() || undefined,
        status,
        pageType: pageType === "all" ? undefined : pageType,
        tag: tag || undefined,
      });
      setPages(data);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Nie można pobrać listy stron.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [query, status, pageType, tag]);

  useEffect(() => {
    void fetchTags()
      .then(setAvailableTags)
      .catch(() => setAvailableTags([]));
  }, []);

  useEffect(() => {
    void loadPages();
  }, [loadPages]);

  const handleDelete = async (page: CmsPage) => {
    setError(null);
    setIsDeleting(true);

    try {
      await deletePage(page.id);
      setPages((prev) => prev.filter((item) => item.id !== page.id));
    } catch (err) {
      if (err instanceof ApiError || err instanceof Error) {
        setError(err.message);
      } else {
        setError("Nie udało się usunąć strony.");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <header className="page-header">
        <div>
          <h1 className="page-title">Strony CMS</h1>
          <p className="page-description">Zarządzaj treścią, publikacją i wersjami stron.</p>
        </div>
        <Link href="/dashboard/new">
          <Button type="button">Nowa strona</Button>
        </Link>
      </header>

      {error ? <p className="ds-alert-error mb-6">{error}</p> : null}

      <DashboardStats pages={pages} isLoading={isLoading} />

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <section className="page-section">
          <div className="mb-4 grid gap-3 md:grid-cols-[1fr_160px_160px_160px_160px_auto]">
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Szukaj po slug, title lub H1..."
              className="ds-input"
            />

            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as StatusFilter)}
              className="ds-input"
            >
              <option value="all">Wszystkie statusy</option>
              <option value="published">Opublikowane</option>
              <option value="draft">Draft</option>
            </select>

            <select
              value={pageType}
              onChange={(event) => setPageType(event.target.value as PageTypeFilter)}
              className="ds-input"
            >
              <option value="all">Wszystkie typy</option>
              <option value="page">Strona</option>
              <option value="global_header">Globalny header</option>
              <option value="global_footer">Globalny footer</option>
            </select>

            <select value={tag} onChange={(event) => setTag(event.target.value)} className="ds-input">
              <option value="">Wszystkie tagi</option>
              {availableTags.map((item) => (
                <option key={item.id} value={item.name}>
                  {item.name}
                </option>
              ))}
            </select>

            <Button type="button" variant="ghost" onClick={() => void loadPages()}>
              Odśwież
            </Button>
          </div>

          {isLoading ? <p className="text-sm text-vcn-text">Ładowanie stron...</p> : null}

          {!isLoading && filteredPages.length === 0 ? (
            <p className="border border-dashed border-vcn-border p-6 text-center text-sm text-vcn-text">
              Brak wyników dla aktualnych filtrów.
            </p>
          ) : null}

          {!isLoading && filteredPages.length > 0 ? (
            <table className="ds-table">
              <thead>
                <tr>
                  <th>Slug</th>
                  <th>Tytuł</th>
                  <th>Status</th>
                  <th>Tagi</th>
                  <th>Typ</th>
                  <th className="text-right">Akcje</th>
                </tr>
              </thead>
              <tbody>
                {filteredPages.map((page) => (
                  <tr key={page.id}>
                    <td className="font-medium text-vcn-heading">/{page.slug}</td>
                    <td>
                      <span className="block text-vcn-heading">{page.metaTitle}</span>
                      <span className="text-xs text-vcn-text">H1: {page.h1}</span>
                    </td>
                    <td>
                      <span
                        className={`inline-block border px-2 py-0.5 text-xs font-medium ${
                          page.isPublished
                            ? "border-green-200 bg-green-50 text-green-700"
                            : "border-amber-200 bg-amber-50 text-amber-700"
                        }`}
                      >
                        {page.isPublished ? "Opublikowana" : "Draft"}
                      </span>
                    </td>
                    <td className="text-xs">{(page.tags ?? []).map((t) => t.name).join(", ") || "—"}</td>
                    <td className="text-xs">{page.pageType}</td>
                    <td>
                      <div className="flex justify-end gap-2">
                        <Link href={`/dashboard/edit/${page.id}`}>
                          <Button type="button" variant="ghost" size="sm">
                            Edytuj
                          </Button>
                        </Link>
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          onClick={() => void handleDelete(page)}
                          disabled={isDeleting}
                        >
                          Usuń
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}
        </section>

        <aside>
          <RecentPages pages={pages} isLoading={isLoading} />
        </aside>
      </div>
    </>
  );
}
