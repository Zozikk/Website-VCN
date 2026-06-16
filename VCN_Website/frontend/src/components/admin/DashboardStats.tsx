import { CmsPage } from "@/lib/types";

interface DashboardStatsProps {
  pages: CmsPage[];
  isLoading: boolean;
}

export function DashboardStats({ pages, isLoading }: DashboardStatsProps) {
  const publishedCount = pages.filter((p) => p.isPublished).length;
  const draftCount = pages.filter((p) => !p.isPublished).length;

  const stats = [
    { label: "Wszystkie strony", value: pages.length },
    { label: "Opublikowane", value: publishedCount },
    { label: "Drafty", value: draftCount },
  ];

  return (
    <div className="mb-6 grid gap-4 sm:grid-cols-3">
      {stats.map((stat) => (
        <div key={stat.label} className="page-section py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-vcn-text">{stat.label}</p>
          <p className="mt-1 text-2xl font-semibold text-vcn-heading">{isLoading ? "–" : stat.value}</p>
        </div>
      ))}
    </div>
  );
}
