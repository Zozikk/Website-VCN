"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ApiError, createTag, fetchTags } from "@/lib/api";
import { CmsTag } from "@/lib/types";

export default function TagsPage() {
  const [tags, setTags] = useState<CmsTag[]>([]);
  const [newTagName, setNewTagName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const loadTags = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchTags();
      setTags(data);
    } catch (err) {
      if (err instanceof ApiError || err instanceof Error) {
        setError(err.message);
      } else {
        setError("Nie udało się pobrać tagów.");
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTags();
  }, [loadTags]);

  const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setIsSubmitting(true);

    try {
      const created = await createTag(newTagName);
      setTags((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      setNewTagName("");
      setMessage(`Dodano tag: ${created.name}`);
    } catch (err) {
      if (err instanceof ApiError || err instanceof Error) {
        setError(err.message);
      } else {
        setError("Nie udało się dodać tagu.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <header className="page-header">
        <div>
          <h1 className="page-title">Tagi produktowe</h1>
          <p className="page-description">
            Organizuj strony według ekosystemu VCN (np. vnetlpr, vtools). Tagi są używane do filtrowania w panelu CMS.
          </p>
        </div>
      </header>

      {error ? <p className="ds-alert-error mb-6">{error}</p> : null}
      {message ? <p className="mb-6 border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">{message}</p> : null}

      <section className="page-section mb-6">
        <h2 className="page-title mb-4 text-base">Dodaj nowy tag</h2>
        <form className="flex flex-wrap items-end gap-3" onSubmit={handleCreate}>
          <div className="min-w-[240px] flex-1">
            <Input
              label="Nazwa tagu"
              value={newTagName}
              onChange={(event) => setNewTagName(event.target.value)}
              placeholder="np. vnetlpr"
              required
            />
          </div>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Dodawanie..." : "Dodaj tag"}
          </Button>
        </form>
      </section>

      <section className="page-section">
        <h2 className="page-title mb-4 text-base">Dostępne tagi</h2>
        {isLoading ? <p className="text-sm text-vcn-text">Ładowanie...</p> : null}
        {!isLoading && tags.length === 0 ? <p className="text-sm text-vcn-text">Brak tagów.</p> : null}
        {!isLoading && tags.length > 0 ? (
          <table className="ds-table">
            <thead>
              <tr>
                <th style={{ width: "80px" }}>ID</th>
                <th>Nazwa</th>
              </tr>
            </thead>
            <tbody>
              {tags.map((tag) => (
                <tr key={tag.id}>
                  <td>{tag.id}</td>
                  <td className="font-medium text-vcn-heading">{tag.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </section>
    </>
  );
}
