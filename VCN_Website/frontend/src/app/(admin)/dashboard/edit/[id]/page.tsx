"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageEditor } from "@/components/admin/PageEditor";
import { Button } from "@/components/ui/Button";
import { ApiError, createPreviewToken, fetchPageById, fetchPageVersions, publishPageVersion, updatePage } from "@/lib/api";
import { CmsPage, CmsPageVersion, PagePayload } from "@/lib/types";

export default function EditPageView() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [page, setPage] = useState<CmsPage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [versions, setVersions] = useState<CmsPageVersion[]>([]);

  useEffect(() => {
    const loadPage = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const id = Number(params.id);
        const [data, versionData] = await Promise.all([fetchPageById(id), fetchPageVersions(id)]);
        setPage(data);
        setVersions(versionData);
      } catch (err) {
        if (err instanceof ApiError || err instanceof Error) {
          setError(err.message);
        } else {
          setError("Nie udało się pobrać strony.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    void loadPage();
  }, [params.id]);

  const handleSubmit = async (payload: PagePayload) => {
    if (!page) {
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const updated = await updatePage(page.id, payload);
      setPage(updated);
      const versionData = await fetchPageVersions(page.id);
      setVersions(versionData);
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError || err instanceof Error) {
        setError(err.message);
      } else {
        setError("Nie udało się zapisać zmian.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenPreview = async () => {
    if (!page) {
      return;
    }

    setError(null);
    setIsPreviewing(true);

    try {
      const preview = await createPreviewToken(page.id);
      router.push(preview.previewUrl);
    } catch (err) {
      if (err instanceof ApiError || err instanceof Error) {
        setError(err.message);
      } else {
        setError("Nie udało się uruchomić podglądu.");
      }
    } finally {
      setIsPreviewing(false);
    }
  };

  const handlePublishVersion = async (versionId: number) => {
    if (!page) {
      return;
    }

    setError(null);
    setIsPublishing(true);

    try {
      const updated = await publishPageVersion(page.id, versionId);
      setPage(updated);
      const versionData = await fetchPageVersions(page.id);
      setVersions(versionData);
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError || err instanceof Error) {
        setError(err.message);
      } else {
        setError("Nie udało się opublikować tej wersji.");
      }
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <>
      <header className="page-header">
        <div>
          <h1 className="page-title">Edycja strony</h1>
          <p className="page-description">
            {page ? (
              <>
                /{page.slug} · wersja {page.version} · {(page.tags ?? []).map((t) => t.name).join(", ") || "bez tagów"}
              </>
            ) : (
              "Ładowanie metadanych strony..."
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard">
            <Button type="button" variant="ghost">
              Powrót do listy
            </Button>
          </Link>
          <Button type="button" variant="ghost" onClick={() => void handleOpenPreview()} disabled={isPreviewing || isLoading}>
            {isPreviewing ? "Otwieranie..." : "Podgląd draft"}
          </Button>
        </div>
      </header>

      {error ? <p className="ds-alert-error mb-6">{error}</p> : null}

      {isLoading ? <p className="text-sm text-vcn-text">Ładowanie strony...</p> : null}

      {!isLoading && page ? (
        <div className="space-y-6">
          <PageEditor mode="edit" layout="stacked" initialPage={page} isSubmitting={isSubmitting} onSubmit={handleSubmit} />

          <section className="page-section">
            <h2 className="page-title mb-4 text-base">Historia wersji</h2>
            {versions.length === 0 ? <p className="text-sm text-vcn-text">Brak zapisanych wersji.</p> : null}
            {versions.length > 0 ? (
              <table className="ds-table">
                <thead>
                  <tr>
                    <th>Wersja</th>
                    <th>Slug</th>
                    <th>Edytował</th>
                    <th>Status</th>
                    <th className="text-right">Akcja</th>
                  </tr>
                </thead>
                <tbody>
                  {versions.map((version) => (
                    <tr key={version.id}>
                      <td className="font-medium text-vcn-heading">{version.versionNumber}</td>
                      <td>/{version.slug}</td>
                      <td>{version.editedBy?.username || "unknown"}</td>
                      <td>{version.isPublished ? "opublikowany" : "draft"}</td>
                      <td className="text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => void handlePublishVersion(version.id)}
                          disabled={isPublishing}
                        >
                          Opublikuj
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : null}
          </section>
        </div>
      ) : null}
    </>
  );
}
