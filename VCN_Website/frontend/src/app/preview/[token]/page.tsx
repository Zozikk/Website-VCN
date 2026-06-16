import { notFound } from "next/navigation";
import { CmsScriptRunner } from "@/components/ui/CmsScriptRunner";
import { fetchPreviewPage } from "@/lib/api";

interface PreviewPageProps {
  params: Promise<{
    token: string;
  }>;
}

const renderCmsSection = (
  page: {
    slug: string;
    renderedCss: string;
    renderedHtml: string;
    content: string;
    renderedJs: string;
  } | null,
  fallbackClassName: string,
) => {
  if (!page) {
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

export default async function PreviewPage({ params }: PreviewPageProps) {
  const { token } = await params;

  if (!token) {
    notFound();
  }

  const preview = await fetchPreviewPage(token).catch(() => null);

  if (!preview?.page) {
    notFound();
  }

  return (
    <>
      <div className="bg-amber-100 px-4 py-2 text-center text-sm font-semibold text-amber-900">
        Preview mode (draft): strona nie jest publicznie opublikowana.
      </div>
      {renderCmsSection(preview.layout.header, "w-full")}
      <main data-page-slug={preview.page.slug} className="mx-auto min-h-screen w-full max-w-4xl px-6 py-12">
        <style dangerouslySetInnerHTML={{ __html: preview.page.renderedCss || "" }} />
        <article className="prose max-w-none" data-cms-root="true">
          <h1>{preview.page.h1}</h1>
          <div dangerouslySetInnerHTML={{ __html: preview.page.renderedHtml || preview.page.content }} />
        </article>
        <CmsScriptRunner script={preview.page.renderedJs || ""} slug={preview.page.slug} />
      </main>
      {renderCmsSection(preview.layout.footer, "w-full")}
    </>
  );
}
