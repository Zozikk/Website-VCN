"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { CmsPage, PagePayload } from "@/lib/types";

interface PageFormProps {
  mode: "create" | "edit";
  initialPage?: CmsPage | null;
  isLoading: boolean;
  onSubmit: (payload: PagePayload) => Promise<void>;
  onCancelEdit?: () => void;
}

const defaultFormState: PagePayload = {
  slug: "",
  pageType: "page",
  isSystem: false,
  metaTitle: "",
  metaDescription: "",
  h1: "",
  htmlContent: "",
  cssContent: "",
  jsContent: "",
  isPublished: false,
};

const getInitialFormState = (mode: "create" | "edit", initialPage?: CmsPage | null): PagePayload => {
  if (mode === "edit" && initialPage) {
    return {
      slug: initialPage.slug,
      pageType: initialPage.pageType,
      isSystem: initialPage.isSystem,
      metaTitle: initialPage.metaTitle,
      metaDescription: initialPage.metaDescription,
      h1: initialPage.h1,
      htmlContent: initialPage.htmlContent || initialPage.content,
      cssContent: initialPage.cssContent || "",
      jsContent: initialPage.jsContent || "",
      isPublished: initialPage.isPublished,
    };
  }

  return defaultFormState;
};

export function PageForm({ mode, initialPage, isLoading, onSubmit, onCancelEdit }: PageFormProps) {
  const [formState, setFormState] = useState<PagePayload>(() => getInitialFormState(mode, initialPage));

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSubmit(formState);

    if (mode === "create") {
      setFormState(defaultFormState);
    }
  };

  return (
    <form className="flex flex-col gap-4 rounded-lg border border-slate-200 p-5" onSubmit={handleSubmit}>
      <h2 className="text-lg font-semibold text-slate-900">
        {mode === "create" ? "Dodaj nowa strone" : "Edytuj strone"}
      </h2>

      <Input
        label="Slug"
        placeholder="np. oferta/uslugi"
        value={formState.slug}
        onChange={(event) => setFormState((prev) => ({ ...prev, slug: event.target.value }))}
        required
      />

      <Input
        label="Meta title"
        value={formState.metaTitle}
        onChange={(event) => setFormState((prev) => ({ ...prev, metaTitle: event.target.value }))}
        required
      />

      <label className="flex flex-col gap-2 text-sm font-medium text-slate-700" htmlFor="meta-description">
        Meta description
        <textarea
          id="meta-description"
          className="min-h-24 rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-700"
          value={formState.metaDescription}
          onChange={(event) => setFormState((prev) => ({ ...prev, metaDescription: event.target.value }))}
        />
      </label>

      <Input
        label="H1"
        value={formState.h1}
        onChange={(event) => setFormState((prev) => ({ ...prev, h1: event.target.value }))}
        required
      />

      <label className="flex flex-col gap-2 text-sm font-medium text-slate-700" htmlFor="content-html">
        Content (HTML)
        <textarea
          id="content-html"
          className="min-h-40 rounded-md border border-slate-300 px-3 py-2 font-mono text-sm text-slate-900 outline-none focus:border-slate-700"
          value={formState.htmlContent}
          onChange={(event) => setFormState((prev) => ({ ...prev, htmlContent: event.target.value }))}
          required
        />
      </label>

      <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700" htmlFor="is-published">
        <input
          id="is-published"
          type="checkbox"
          checked={formState.isPublished}
          onChange={(event) => setFormState((prev) => ({ ...prev, isPublished: event.target.checked }))}
        />
        Opublikowana
      </label>

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Zapisywanie..." : mode === "create" ? "Dodaj strone" : "Zapisz zmiany"}
        </Button>
        {mode === "edit" && onCancelEdit ? (
          <Button type="button" variant="ghost" onClick={onCancelEdit}>
            Anuluj edycje
          </Button>
        ) : null}
      </div>
    </form>
  );
}
