import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { fetchGlobalLayout, resolvePublicRedirect, fetchPublicPageBySlug } from "@/lib/api";
import { CmsGlobalLayout, CmsPage } from "@/lib/types";
import { CmsScriptRunner } from "@/components/ui/CmsScriptRunner";

interface SlugPageProps {
  params: Promise<{
    slug: string[];
  }>;
}

const isReservedSlugPath = (slugValue: string) => {
  return slugValue === ".well-known" || slugValue.startsWith(".well-known/");
};

// Use ISR for public pages via `fetchPublicPageBySlug` (default revalidate 60s)

const resolveRedirectForSlug = async (slug: string) => {
  return resolvePublicRedirect(`/${slug}`).catch(() => null);
};

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

export async function generateMetadata({ params }: SlugPageProps): Promise<Metadata> {
  const { slug } = await params;
  const slugValue = slug?.join("/");

  if (!slugValue || isReservedSlugPath(slugValue)) {
    return {
      title: "Page not found",
      description: "Requested page does not exist.",
    };
  }

  const page = await fetchPublicPageBySlug(slugValue, 60);

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

export default async function SlugPage({ params }: SlugPageProps) {
  const { slug } = await params;
  const slugValue = slug?.join("/");

  if (!slugValue || isReservedSlugPath(slugValue)) {
    notFound();
  }

  const page = await fetchPublicPageBySlug(slugValue, 60);
  if (!page || !page.isPublished) {
    const redirectRule = await resolveRedirectForSlug(slugValue);

    if (redirectRule?.toPath) {
      redirect(redirectRule.toPath);
    }
  }
  const layout = await fetchGlobalLayout(60).catch(() => ({ header: null, footer: null } as CmsGlobalLayout));

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
