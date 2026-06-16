import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { CmsPage } from "@/lib/types";

interface RecentPagesProps {
  pages: CmsPage[];
  isLoading: boolean;
}

export function RecentPages({ pages, isLoading }: RecentPagesProps) {
  const recent = pages.slice(0, 5);

  return (
    <div className="page-section">
      <h2 className="page-title mb-4 text-base">Ostatnie strony</h2>

      {isLoading ? <p className="text-sm text-vcn-text">Ładowanie...</p> : null}

      {!isLoading && recent.length === 0 ? (
        <p className="text-sm text-vcn-text">Brak stron do wyświetlenia.</p>
      ) : null}

      {!isLoading && recent.length > 0 ? (
        <ul className="divide-y divide-vcn-border">
          {recent.map((page) => (
            <li key={page.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
              <div>
                <p className="text-sm font-medium text-vcn-heading">/{page.slug}</p>
                <p className="text-xs text-vcn-text">{page.metaTitle}</p>
              </div>
              <Link href={`/dashboard/edit/${page.id}`}>
                <Button type="button" variant="ghost" size="sm">
                  Edytuj
                </Button>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
