"use client";

import { Button } from "@/components/ui/Button";
import { CmsPage } from "@/lib/types";

interface PageListProps {
  pages: CmsPage[];
  selectedPageId: number | null;
  isLoading: boolean;
  onEdit: (page: CmsPage) => void;
  onDelete: (page: CmsPage) => Promise<void>;
}

export function PageList({ pages, selectedPageId, isLoading, onEdit, onDelete }: PageListProps) {
  if (!pages.length) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 p-5 text-sm text-slate-600">
        Brak stron w systemie. Dodaj pierwsza strone.
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {pages.map((page) => (
        <li
          key={page.id}
          className={`rounded-lg border p-4 ${selectedPageId === page.id ? "border-slate-900" : "border-slate-200"}`}
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-900">/{page.slug}</p>
              <p className="text-sm text-slate-700">{page.metaTitle}</p>
              <p className="text-xs text-slate-500">Last editor: {page.lastEditor?.username || "unknown"}</p>
              <p className="text-xs text-slate-500">Status: {page.isPublished ? "published" : "draft"}</p>
            </div>

            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={() => onEdit(page)} disabled={isLoading}>
                Edytuj
              </Button>
              <Button
                type="button"
                variant="danger"
                onClick={() => onDelete(page)}
                disabled={isLoading}
              >
                Usun
              </Button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}