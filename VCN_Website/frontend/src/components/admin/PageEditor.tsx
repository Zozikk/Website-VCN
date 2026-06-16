"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { fetchTags } from "@/lib/api";
import { CmsPage, CmsPageType, CmsTag, PagePayload } from "@/lib/types";

interface PageEditorProps {
  mode: "create" | "edit";
  layout?: "split" | "stacked";
  initialPage?: CmsPage | null;
  isSubmitting: boolean;
  onSubmit: (payload: PagePayload) => Promise<void>;
}

const emptyState: PagePayload = {
  slug: "",
  pageType: "page",
  isSystem: false,
  metaTitle: "",
  metaDescription: "",
  h1: "",
  htmlContent: "<section>\n  <h2>Nowa sekcja</h2>\n  <p>Wpisz treść strony.</p>\n</section>",
  cssContent: "",
  jsContent: "",
  isPublished: false,
  tagIds: [],
};

const fromPage = (page: CmsPage): PagePayload => ({
  slug: page.slug,
  pageType: page.pageType,
  isSystem: page.isSystem,
  metaTitle: page.metaTitle,
  metaDescription: page.metaDescription,
  h1: page.h1,
  htmlContent: page.htmlContent || page.content,
  cssContent: page.cssContent || "",
  jsContent: page.jsContent || "",
  isPublished: page.isPublished,
  tagIds: page.tags?.map((tag) => tag.id) ?? [],
});

const extractRootIdFromCss = (cssContent: string): string | null => {
  const match = cssContent.match(/#([A-Za-z][\w-]*)\b/);
  return match ? match[1] : null;
};

const ensurePreviewRootId = (htmlContent: string, cssContent: string): string => {
  const rootId = extractRootIdFromCss(cssContent);

  if (!rootId) {
    return htmlContent;
  }

  const idPattern = new RegExp(`id=["']${rootId}["']`, "i");
  if (idPattern.test(htmlContent)) {
    return htmlContent;
  }

  return `<div id="${rootId}">${htmlContent}</div>`;
};

export function PageEditor({
  mode,
  layout = "split",
  initialPage,
  isSubmitting,
  onSubmit,
}: PageEditorProps) {
  const [availableTags, setAvailableTags] = useState<CmsTag[]>([]);
  const [formState, setFormState] = useState<PagePayload>(() => {
    if (mode === "edit" && initialPage) {
      return fromPage(initialPage);
    }

    return emptyState;
  });

  useEffect(() => {
    void fetchTags()
      .then(setAvailableTags)
      .catch(() => setAvailableTags([]));
  }, []);

  const previewDoc = useMemo(() => {
    const previewHtml = ensurePreviewRootId(formState.htmlContent, formState.cssContent);

    return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      :root { color-scheme: light; }
      body { font-family: "Segoe UI", Tahoma, sans-serif; margin: 0; padding: 20px; color: #333; }
      ${formState.cssContent}
    </style>
  </head>
  <body>
    <main data-preview-root="true">
      ${previewHtml}
    </main>
    <script>
      (function () {
        try {
          ${formState.jsContent}
        } catch (error) {
          console.error('Preview script error:', error);
        }
      })();
    </script>
  </body>
</html>`;
  }, [formState.cssContent, formState.htmlContent, formState.jsContent]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSubmit(formState);

    if (mode === "create") {
      setFormState(emptyState);
    }
  };

  const isGlobalType = formState.pageType !== "page";

  const handlePageTypeChange = (nextType: CmsPageType) => {
    const nextSlug =
      nextType === "global_header" ? "global/header" : nextType === "global_footer" ? "global/footer" : formState.slug;

    setFormState((prev) => ({
      ...prev,
      pageType: nextType,
      slug: nextType === "page" ? prev.slug : nextSlug,
      isSystem: nextType !== "page",
    }));
  };

  const toggleTag = (tagId: number) => {
    setFormState((prev) => {
      const current = prev.tagIds ?? [];
      const next = current.includes(tagId) ? current.filter((id) => id !== tagId) : [...current, tagId];
      return { ...prev, tagIds: next };
    });
  };

  const form = (
    <form className="page-section space-y-5" onSubmit={handleSubmit}>
      <div className="flex items-center justify-between border-b border-vcn-border pb-4">
        <h2 className="page-title text-base">{mode === "create" ? "Formularz strony" : "Treść i metadane"}</h2>
        <span className="border border-vcn-border px-2 py-0.5 text-xs text-vcn-text">
          {formState.isPublished ? "Opublikowana" : "Draft"}
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm font-medium text-vcn-heading" htmlFor="page-type">
          Typ treści
          <select
            id="page-type"
            value={formState.pageType}
            onChange={(event) => handlePageTypeChange(event.target.value as CmsPageType)}
            className="ds-input"
          >
            <option value="page">Standardowa strona</option>
            <option value="global_header">Globalny header</option>
            <option value="global_footer">Globalny footer</option>
          </select>
        </label>
        <Input
          label="Slug"
          value={formState.slug}
          placeholder="np. oferta/www"
          onChange={(event) => setFormState((prev) => ({ ...prev, slug: event.target.value }))}
          required
          disabled={isGlobalType}
        />
        <Input
          label="H1"
          value={formState.h1}
          onChange={(event) => setFormState((prev) => ({ ...prev, h1: event.target.value }))}
          required
        />
        <Input
          label="Meta title"
          value={formState.metaTitle}
          onChange={(event) => setFormState((prev) => ({ ...prev, metaTitle: event.target.value }))}
          required
        />
      </div>

      {isGlobalType ? (
        <p className="text-xs text-vcn-text">Dla globalnych sekcji slug jest przypisany automatycznie.</p>
      ) : null}

      <label className="flex flex-col gap-1.5 text-sm font-medium text-vcn-heading" htmlFor="meta-description">
        Meta description
        <textarea
          id="meta-description"
          className="ds-textarea min-h-20"
          value={formState.metaDescription}
          onChange={(event) => setFormState((prev) => ({ ...prev, metaDescription: event.target.value }))}
        />
      </label>

      <div>
        <p className="mb-2 text-sm font-medium text-vcn-heading">Tagi produktowe</p>
        <div className="flex flex-wrap gap-2">
          {availableTags.length === 0 ? <p className="text-sm text-vcn-text">Brak tagów. Dodaj je w sekcji Tagi.</p> : null}
          {availableTags.map((tag) => {
            const checked = (formState.tagIds ?? []).includes(tag.id);
            return (
              <label
                key={tag.id}
                className={`cursor-pointer border px-3 py-1.5 text-sm ${checked ? "border-vcn-red bg-red-50 text-vcn-red" : "border-vcn-border text-vcn-text"}`}
              >
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={checked}
                  onChange={() => toggleTag(tag.id)}
                />
                {tag.name}
              </label>
            );
          })}
        </div>
      </div>

      <label className="flex flex-col gap-1.5 text-sm font-medium text-vcn-heading" htmlFor="html-content">
        HTML
        <textarea
          id="html-content"
          className="ds-textarea min-h-64 font-mono"
          value={formState.htmlContent}
          onChange={(event) => setFormState((prev) => ({ ...prev, htmlContent: event.target.value }))}
          required
        />
      </label>

      <div className="grid gap-4 lg:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm font-medium text-vcn-heading" htmlFor="css-content">
          CSS
          <textarea
            id="css-content"
            className="ds-textarea min-h-48 font-mono"
            value={formState.cssContent}
            onChange={(event) => setFormState((prev) => ({ ...prev, cssContent: event.target.value }))}
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm font-medium text-vcn-heading" htmlFor="js-content">
          JS (lekki runtime)
          <textarea
            id="js-content"
            className="ds-textarea min-h-48 font-mono"
            value={formState.jsContent}
            onChange={(event) => setFormState((prev) => ({ ...prev, jsContent: event.target.value }))}
          />
        </label>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-vcn-border pt-4">
        <label className="inline-flex items-center gap-2 text-sm font-medium text-vcn-heading" htmlFor="is-published">
          <input
            id="is-published"
            type="checkbox"
            checked={formState.isPublished}
            onChange={(event) => setFormState((prev) => ({ ...prev, isPublished: event.target.checked }))}
          />
          Opublikowana
        </label>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Zapisywanie..." : mode === "create" ? "Utwórz stronę" : "Zapisz zmiany"}
        </Button>
      </div>
    </form>
  );

  const preview = (
    <aside className="page-section">
      <h2 className="page-title mb-3 text-sm">Podgląd na żywo</h2>
      <iframe title="CMS live preview" srcDoc={previewDoc} className="h-[520px] w-full border border-vcn-border bg-white" />
    </aside>
  );

  if (layout === "stacked") {
    return (
      <section className="space-y-6">
        {form}
        {preview}
      </section>
    );
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
      {form}
      {preview}
    </section>
  );
}
