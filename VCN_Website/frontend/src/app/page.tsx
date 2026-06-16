import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchGlobalLayout, fetchPublicPageBySlug } from "@/lib/api";
import { CmsGlobalLayout, CmsPage } from "@/lib/types";
import { CmsScriptRunner } from "@/components/ui/CmsScriptRunner";

const HOMEPAGE_SLUG = "home";

const renderCmsSection = (page: CmsPage | null, fallbackClassName: string) => {
  if (!page || !page.isPublished) {
    return null;
  }

  return (
    <section data-page-slug={page.slug} className={fallbackClassName}>
      <style dangerouslySetInnerHTML={{ __html: page.renderedCss || "" }} />
      <div dangerouslySetInnerHTML={{ __html: page.renderedHtml || page.content }} />
      <CmsScriptRunner script={page.renderedJs || ""} slug={page.slug} />
    </section>
  );
};

export async function generateMetadata(): Promise<Metadata> {
  const page = await fetchPublicPageBySlug(HOMEPAGE_SLUG).catch(() => null);

  if (!page || !page.isPublished) {
    return {
      title: "Page not found",
      description: "Requested page does not exist.",
    };
  }

  return {
    title: page.metaTitle,
    description: page.metaDescription,
  };
}

export default async function Home() {
  const page = await fetchPublicPageBySlug(HOMEPAGE_SLUG).catch(() => null);
  const layout = await fetchGlobalLayout().catch(() => ({ header: null, footer: null } as CmsGlobalLayout));

  if (!page || !page.isPublished) {
    notFound();
  }

  return (
    <>
      {renderCmsSection(layout.header, "w-full")}
      <main data-page-slug={page.slug} className="mx-auto min-h-screen w-full max-w-4xl px-6 py-12">
        <style dangerouslySetInnerHTML={{ __html: page.renderedCss || "" }} />
        <article className="prose max-w-none" data-cms-root="true">
          <h1>{page.h1}</h1>
          <div dangerouslySetInnerHTML={{ __html: page.renderedHtml || page.content }} />
        </article>
        <CmsScriptRunner script={page.renderedJs || ""} slug={page.slug} />
      </main>
      {renderCmsSection(layout.footer, "w-full")}
    </>
  );
}
