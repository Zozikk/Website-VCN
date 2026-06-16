const fs = require("fs");
const path = require("path");
const { Op } = require("sequelize");
const { sequelize, User, Page, PageVersion } = require("../models");

const cliArgs = process.argv.slice(2);
const DRY_RUN = cliArgs.includes("--dry-run");
const sourceDirArg = cliArgs.find((arg) => !arg.startsWith("--"));

const SOURCE_DIR = sourceDirArg
  ? path.resolve(process.cwd(), sourceDirArg)
  : path.resolve(__dirname, "../../../../output");

const HOME_SLUG = "home";
const GLOBAL_HEADER_SLUG = "global/header";
const GLOBAL_FOOTER_SLUG = "global/footer";

const escapeForRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

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
  return decodeHtmlEntities(String(value || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim());
};

const extractTagInner = (source, tagName) => {
  const match = source.match(new RegExp(`<${tagName}\\b[^>]*>([\\s\\S]*?)<\/${tagName}>`, "i"));
  return match ? match[1] : "";
};

const extractTagOuter = (source, tagName) => {
  const match = source.match(new RegExp(`<${tagName}\\b[^>]*>[\\s\\S]*?<\/${tagName}>`, "i"));
  return match ? match[0] : "";
};

const removeTagBlocks = (source, tagName) => {
  return source.replace(new RegExp(`<${tagName}\\b[^>]*>[\\s\\S]*?<\/${tagName}>`, "gi"), "");
};

const extractMetaContent = (html, nameOrProperty) => {
  const escaped = escapeForRegex(nameOrProperty);
  const patterns = [
    new RegExp(`<meta\\s+[^>]*${nameOrProperty.includes(":") ? "property" : "name"}=["']${escaped}["'][^>]*content=["']([\\s\\S]*?)["'][^>]*>`, "i"),
    new RegExp(`<meta\\s+[^>]*content=["']([\\s\\S]*?)["'][^>]*${nameOrProperty.includes(":") ? "property" : "name"}=["']${escaped}["'][^>]*>`, "i"),
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }

  return "";
};

const extractTitle = (html) => {
  const match = html.match(/<title>([\s\S]*?)<\/title>/i);
  return match ? stripHtml(match[1]) : "";
};

const extractHeadStyles = (html) => {
  const headMatch = html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i);

  if (!headMatch) {
    return "";
  }

  return extractBlocks(headMatch[1], "style").join("\n\n");
};

const extractBodyInner = (html) => {
  const bodyMatch = html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i);
  return bodyMatch ? bodyMatch[1].trim() : html.trim();
};

const removeBlockTags = (source, tagName) => {
  return source.replace(new RegExp(`<${tagName}\\b[^>]*>[\\s\\S]*?<\/${tagName}>`, "gi"), "");
};

const extractFirstHeading = (html) => {
  const match = html.match(/<(h[1-6])\b[^>]*>([\s\S]*?)<\/\1>/i);

  if (!match) {
    return { headingHtml: "", headingText: "" };
  }

  return {
    headingHtml: match[0],
    headingText: stripHtml(match[2]),
  };
};

const extractSectionContent = (html) => {
  return removeBlockTags(removeBlockTags(extractBodyInner(html), "header"), "footer").trim();
};

const stripScriptsAndStyles = (html) => {
  return html.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, "").trim();
};

const extractBlocks = (html, tagName) => {
  const matches = html.match(new RegExp(`<${tagName}\\b[^>]*>[\\s\\S]*?<\/${tagName}>`, "gi"));
  return matches || [];
};

const collectFiles = async (dirPath) => {
  const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.name.startsWith(".") || entry.name.startsWith("_")) {
      continue;
    }

    const entryPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      const nestedFiles = await collectFiles(entryPath);
      files.push(...nestedFiles);
      continue;
    }

    if (entry.isFile() && entry.name.toLowerCase() === "index.html") {
      files.push(entryPath);
    }
  }

  return files;
};

const normalizeSlugFromPath = (filePath) => {
  const relativeDir = path.relative(SOURCE_DIR, path.dirname(filePath));
  const segments = relativeDir
    .split(path.sep)
    .map((segment) => segment.trim())
    .filter((segment) => segment && !segment.startsWith(".") && !segment.startsWith("_"));

  if (segments.length === 0) {
    return HOME_SLUG;
  }

  return segments.join("/").toLowerCase();
};

const chooseEditor = async () => {
  return User.findOne({
    where: {
      [Op.or]: [{ role: "admin" }, { role: "editor" }],
    },
    order: [["id", "ASC"]],
  });
};

const buildImportedPage = (html, slug, pageType = "page", overrides = {}) => {
  const title = extractTitle(html);
  const metaDescription = extractMetaContent(html, "description");
  const metaTitle = extractMetaContent(html, "og:title") || title || slug;
  const pageContent = extractSectionContent(html);
  const pageScripts = extractBlocks(pageContent, "script").join("\n\n");
  const pageStyles = overrides.cssContent ?? extractHeadStyles(html);
  const pageJs = overrides.jsContent ?? pageScripts;
  const bodyWithoutScripts = stripScriptsAndStyles(pageContent);
  const heading = extractFirstHeading(bodyWithoutScripts);
  const cleanedHtml = heading.headingHtml
    ? bodyWithoutScripts.replace(heading.headingHtml, "").replace(/^\s+/, "").trim()
    : bodyWithoutScripts;

  return {
    slug,
    pageType,
    isSystem: pageType !== "page",
    metaTitle,
    metaDescription,
    h1: heading.headingText || title || slug,
    content: cleanedHtml,
    htmlContent: cleanedHtml,
    cssContent: pageStyles,
    jsContent: pageJs,
    renderedHtml: cleanedHtml,
    renderedCss: pageStyles,
    renderedJs: pageJs,
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

const upsertPage = async (pagePayload, editorId) => {
  const existing = await Page.findOne({ where: { slug: pagePayload.slug } });

  if (existing) {
    await existing.update({
      ...pagePayload,
      version: existing.version + 1,
      lastEditedById: editorId,
    });

    await createVersionSnapshot(existing, editorId);
    return { action: "updated", page: existing };
  }

  const created = await Page.create({
    ...pagePayload,
    version: 1,
    lastEditedById: editorId,
  });

  await createVersionSnapshot(created, editorId);
  return { action: "created", page: created };
};

const main = async () => {
  if (!fs.existsSync(SOURCE_DIR)) {
    throw new Error(`Source folder not found: ${SOURCE_DIR}`);
  }

  const htmlFiles = await collectFiles(SOURCE_DIR);

  if (htmlFiles.length === 0) {
    throw new Error(`No index.html files found under: ${SOURCE_DIR}`);
  }

  const previewFiles = htmlFiles.slice(0, 3).map((filePath) => normalizeSlugFromPath(filePath));
  console.log(`Found ${htmlFiles.length} HTML pages under ${SOURCE_DIR}`);
  console.log(`Sample slugs: ${previewFiles.join(", ")}`);

  if (DRY_RUN) {
    return;
  }

  await sequelize.authenticate();
  await sequelize.sync();

  const editor = await chooseEditor();

  if (!editor) {
    throw new Error("Cannot import static export because no admin/editor user exists in DB.");
  }

  const rootHtmlFile = htmlFiles.find((filePath) => normalizeSlugFromPath(filePath) === HOME_SLUG) || htmlFiles[0];
  const rootHtml = fs.readFileSync(rootHtmlFile, "utf8");
  const rootHeader = stripScriptsAndStyles(extractTagOuter(rootHtml, "header"));
  const rootFooter = stripScriptsAndStyles(extractTagOuter(rootHtml, "footer"));
  const rootSharedCss = extractHeadStyles(rootHtml);

  const globalHeader = buildImportedPage(rootHeader, GLOBAL_HEADER_SLUG, "global_header", { cssContent: rootSharedCss });
  const globalFooter = buildImportedPage(rootFooter, GLOBAL_FOOTER_SLUG, "global_footer", { cssContent: rootSharedCss });

  const headerResult = await upsertPage(globalHeader, editor.id);
  const footerResult = await upsertPage(globalFooter, editor.id);

  console.log(`Global layout ${headerResult.action}: ${globalHeader.slug}`);
  console.log(`Global layout ${footerResult.action}: ${globalFooter.slug}`);

  let imported = 0;

  for (const filePath of htmlFiles) {
    const slug = normalizeSlugFromPath(filePath);
    const html = fs.readFileSync(filePath, "utf8");
    const pagePayload = buildImportedPage(html, slug, "page");

    const result = await upsertPage(pagePayload, editor.id);
    imported += 1;
    console.log(`${result.action === "created" ? "Created" : "Updated"}: ${slug}`);
  }

  console.log(`Import complete: ${imported} pages processed.`);
};

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("Static export import failed:", error.message);
    process.exit(1);
  });