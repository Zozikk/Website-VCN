const fs = require("fs");
const path = require("path");
const { Op } = require("sequelize");
const { sequelize, User, Page, PageVersion } = require("../models");
const { processCmsContent } = require("../utils/contentPipeline");

const DEFAULT_SLUG = "home";

const decodeHtmlEntities = (value) => {
  return value
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#039;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
};

const stripHtml = (value) => {
  return decodeHtmlEntities(value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim());
};

const extractFirstMatch = (source, regex) => {
  const match = source.match(regex);
  return match ? match[1].trim() : "";
};

const extractMainContent = (html) => {
  const mainMatch = html.match(/<main[^>]*>[\s\S]*?<\/main>/i);
  if (mainMatch) {
    return mainMatch[0];
  }

  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch) {
    return bodyMatch[1].trim();
  }

  return html;
};

const buildPayload = (html) => {
  const title = extractFirstMatch(html, /<title>([\s\S]*?)<\/title>/i);
  const metaDescription =
    extractFirstMatch(html, /<meta\s+name=["']description["']\s+content=["']([\s\S]*?)["'][^>]*>/i) ||
    extractFirstMatch(html, /<meta\s+content=["']([\s\S]*?)["']\s+name=["']description["'][^>]*>/i);

  const mainHtml = extractMainContent(html);
  const h1FromContent = extractFirstMatch(mainHtml, /<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const h1 = stripHtml(h1FromContent) || stripHtml(title) || "Strona glowna";
  const finalMetaTitle = stripHtml(title) || h1;
  const finalMetaDescription = stripHtml(metaDescription).slice(0, 1000);

  return {
    slug: DEFAULT_SLUG,
    pageType: "page",
    isSystem: false,
    metaTitle: finalMetaTitle,
    metaDescription: finalMetaDescription,
    h1,
    htmlContent: mainHtml,
    cssContent: "",
    jsContent: "",
    isPublished: true,
  };
};

const createVersionSnapshot = async (page, editedById) => {
  await PageVersion.create({
    pageId: page.id,
    versionNumber: page.version,
    slug: page.slug,
    pageType: page.pageType,
    isSystem: page.isSystem,
    metaTitle: page.metaTitle,
    metaDescription: page.metaDescription,
    h1: page.h1,
    content: page.content,
    htmlContent: page.htmlContent,
    cssContent: page.cssContent,
    jsContent: page.jsContent,
    renderedHtml: page.renderedHtml,
    renderedCss: page.renderedCss,
    renderedJs: page.renderedJs,
    isPublished: page.isPublished,
    editedById,
  });
};

const main = async () => {
  const sourcePathArg = process.argv[2];
  if (!sourcePathArg) {
    throw new Error("Usage: node src/scripts/importHomepageDump.js <path-to-index.html>");
  }

  const sourcePath = path.resolve(process.cwd(), sourcePathArg);
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`File not found: ${sourcePath}`);
  }

  const html = fs.readFileSync(sourcePath, "utf8");
  const payload = buildPayload(html);
  const processed = processCmsContent({
    slug: payload.slug,
    htmlContent: payload.htmlContent,
    cssContent: payload.cssContent,
    jsContent: payload.jsContent,
  });

  await sequelize.authenticate();
  await sequelize.sync();

  const editor = await User.findOne({
    where: {
      [Op.or]: [{ role: "admin" }, { role: "editor" }],
    },
    order: [["id", "ASC"]],
  });

  if (!editor) {
    throw new Error("Cannot import homepage because no admin/editor user exists in DB.");
  }

  const existing = await Page.findOne({ where: { slug: payload.slug } });

  if (existing) {
    await existing.update({
      pageType: payload.pageType,
      isSystem: payload.isSystem,
      metaTitle: payload.metaTitle,
      metaDescription: payload.metaDescription,
      h1: payload.h1,
      content: processed.htmlContent,
      htmlContent: processed.htmlContent,
      cssContent: processed.cssContent,
      jsContent: processed.jsContent,
      renderedHtml: processed.renderedHtml,
      renderedCss: processed.renderedCss,
      renderedJs: processed.renderedJs,
      version: existing.version + 1,
      isPublished: payload.isPublished,
      lastEditedById: editor.id,
    });

    await createVersionSnapshot(existing, editor.id);
    console.log(`Updated homepage slug '${payload.slug}' (version ${existing.version}).`);
  } else {
    const created = await Page.create({
      slug: payload.slug,
      pageType: payload.pageType,
      isSystem: payload.isSystem,
      metaTitle: payload.metaTitle,
      metaDescription: payload.metaDescription,
      h1: payload.h1,
      content: processed.htmlContent,
      htmlContent: processed.htmlContent,
      cssContent: processed.cssContent,
      jsContent: processed.jsContent,
      renderedHtml: processed.renderedHtml,
      renderedCss: processed.renderedCss,
      renderedJs: processed.renderedJs,
      version: 1,
      isPublished: payload.isPublished,
      lastEditedById: editor.id,
    });

    await createVersionSnapshot(created, editor.id);
    console.log(`Created homepage slug '${payload.slug}' (version ${created.version}).`);
  }
};

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("Homepage import failed:", error.message);
    process.exit(1);
  });
