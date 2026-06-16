const fs = require("fs");
const path = require("path");
const readline = require("readline");
const { Op } = require("sequelize");
const { sequelize, User, Page } = require("../models");
const { processCmsContent } = require("../utils/contentPipeline");

const cliArgs = process.argv.slice(2);
const DRY_RUN = cliArgs.includes("--dry-run");
const sqlPathArg = cliArgs.find((arg) => !arg.startsWith("--"));
const reportPathArg = cliArgs.find((arg) => arg.startsWith("--report="));

const SOURCE_SQL_PATH = sqlPathArg
  ? path.resolve(process.cwd(), sqlPathArg)
  : path.resolve(__dirname, "../../../horror_wp1_1756977862.sql");
const REPORT_PATH = reportPathArg
  ? path.resolve(process.cwd(), reportPathArg.replace("--report=", ""))
  : path.resolve(process.cwd(), "wordpress-import-report.json");

const YOAST_TITLE_KEYS = new Set(["_yoast_wpseo_title", "rank_math_title"]);
const YOAST_DESCRIPTION_KEYS = new Set(["_yoast_wpseo_metadesc", "rank_math_description"]);

const unescapeSqlString = (value) => {
  return value
    .replace(/\\0/g, "\0")
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t")
    .replace(/\\b/g, "\b")
    .replace(/\\Z/g, "\x1a")
    .replace(/\\'/g, "'")
    .replace(/\\\\/g, "\\");
};

const parseValueToken = (rawToken) => {
  const token = rawToken.trim();

  if (token.toUpperCase() === "NULL") {
    return null;
  }

  if (token.startsWith("'") && token.endsWith("'")) {
    const stringValue = token.slice(1, -1);
    return unescapeSqlString(stringValue);
  }

  if (/^-?\d+$/.test(token)) {
    return Number(token);
  }

  return token;
};

const splitTupleValues = (tupleText) => {
  const values = [];
  let current = "";
  let inQuote = false;
  let escaped = false;

  for (let i = 0; i < tupleText.length; i += 1) {
    const char = tupleText[i];

    if (escaped) {
      current += char;
      escaped = false;
      continue;
    }

    if (char === "\\") {
      current += char;
      escaped = true;
      continue;
    }

    if (char === "'") {
      inQuote = !inQuote;
      current += char;
      continue;
    }

    if (!inQuote && char === ",") {
      values.push(parseValueToken(current));
      current = "";
      continue;
    }

    current += char;
  }

  if (current.length > 0) {
    values.push(parseValueToken(current));
  }

  return values;
};

const parseInsertTuples = (valuesText) => {
  const tuples = [];
  let inQuote = false;
  let escaped = false;
  let depth = 0;
  let tupleBuffer = "";

  for (let i = 0; i < valuesText.length; i += 1) {
    const char = valuesText[i];

    if (escaped) {
      if (depth > 0) {
        tupleBuffer += char;
      }
      escaped = false;
      continue;
    }

    if (char === "\\") {
      if (depth > 0) {
        tupleBuffer += char;
      }
      escaped = true;
      continue;
    }

    if (char === "'") {
      inQuote = !inQuote;
      if (depth > 0) {
        tupleBuffer += char;
      }
      continue;
    }

    if (!inQuote && char === "(") {
      depth += 1;
      if (depth === 1) {
        tupleBuffer = "";
        continue;
      }
    }

    if (!inQuote && char === ")") {
      depth -= 1;
      if (depth === 0) {
        tuples.push(splitTupleValues(tupleBuffer));
        tupleBuffer = "";
        continue;
      }
    }

    if (depth > 0) {
      tupleBuffer += char;
    }
  }

  return tuples;
};

const stripHtml = (value) => {
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
};

const normalizeSlug = (slug) => {
  if (!slug || typeof slug !== "string") {
    return null;
  }

  const normalized = slug.trim().replace(/^\/+|\/+$/g, "");
  return normalized.length ? normalized : null;
};

const detectGlobalCandidate = (post) => {
  const slug = (post.post_name || "").toLowerCase();
  const title = (post.post_title || "").toLowerCase();
  const content = (post.post_content || "").toLowerCase();

  const isHeaderCandidate =
    slug === "header" || slug.includes("header") || title.includes("header") || content.includes("<header");
  const isFooterCandidate =
    slug === "footer" || slug.includes("footer") || title.includes("footer") || content.includes("<footer");

  if (isHeaderCandidate && !isFooterCandidate) {
    return { type: "global_header", sourcePostId: post.id, sourceSlug: post.post_name || "", sourceTitle: post.post_title || "" };
  }

  if (isFooterCandidate && !isHeaderCandidate) {
    return { type: "global_footer", sourcePostId: post.id, sourceSlug: post.post_name || "", sourceTitle: post.post_title || "" };
  }

  return null;
};

const mapWordpressPostToPagePayload = (post, metaByPostId) => {
  const slug = normalizeSlug(post.post_name);
  if (!slug) {
    return null;
  }

  const meta = metaByPostId.get(post.id) || {};
  const content = (post.post_content || "").trim();
  const fallbackH1 = (post.post_title || "").trim() || slug;

  const firstH1Match = content.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const extractedH1 = firstH1Match ? stripHtml(firstH1Match[1]) : null;

  const excerptText = stripHtml(post.post_excerpt || "");
  const contentText = stripHtml(content);

  const metaTitle = (meta.metaTitle || "").trim() || fallbackH1;
  const metaDescription =
    (meta.metaDescription || "").trim() ||
    excerptText ||
    contentText.slice(0, 160);

  return {
    slug,
    pageType: "page",
    isSystem: false,
    metaTitle,
    metaDescription,
    h1: extractedH1 || fallbackH1,
    htmlContent: content || `<h1>${fallbackH1}</h1>`,
    cssContent: "",
    jsContent: "",
    isPublished: post.post_status === "publish",
  };
};

const main = async () => {
  if (!fs.existsSync(SOURCE_SQL_PATH)) {
    throw new Error(`SQL file not found: ${SOURCE_SQL_PATH}`);
  }

  await sequelize.authenticate();

  const defaultEditor = await User.findOne({
    where: {
      [Op.or]: [{ email: "kacper.witczak@vcn.pl" }, { role: "admin" }],
    },
    order: [["id", "ASC"]],
  });

  if (!defaultEditor) {
    throw new Error("Cannot import pages because no editor/admin user exists.");
  }

  const postsById = new Map();
  const metaByPostId = new Map();
  const migrationStats = {
    scannedPostRows: 0,
    eligiblePageRows: 0,
    skippedNonPageType: 0,
    skippedUnsupportedStatus: 0,
    skippedMissingSlug: 0,
    duplicateSlugPayloads: 0,
  };

  const stream = fs.createReadStream(SOURCE_SQL_PATH, { encoding: "utf-8" });
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

  const insertRegex = /^INSERT INTO `([^`]+)` VALUES (.*);$/;

  for await (const line of rl) {
    const match = line.match(insertRegex);
    if (!match) {
      continue;
    }

    const table = match[1];
    const valuesText = match[2];

    if (table !== "wp_posts" && table !== "wp_postmeta") {
      continue;
    }

    const tuples = parseInsertTuples(valuesText);

    if (table === "wp_posts") {
      for (const tuple of tuples) {
        const [
          id,
          postAuthor,
          postDate,
          postDateGmt,
          postContent,
          postTitle,
          postExcerpt,
          postStatus,
          commentStatus,
          pingStatus,
          postPassword,
          postName,
          toPing,
          pinged,
          postModified,
          postModifiedGmt,
          postContentFiltered,
          postParent,
          guid,
          menuOrder,
          postType,
          postMimeType,
          commentCount,
        ] = tuple;
        migrationStats.scannedPostRows += 1;

        if (postType !== "page") {
          migrationStats.skippedNonPageType += 1;
          continue;
        }

        if (!["publish", "draft", "private", "pending"].includes(postStatus)) {
          migrationStats.skippedUnsupportedStatus += 1;
          continue;
        }

        migrationStats.eligiblePageRows += 1;

        postsById.set(id, {
          id,
          post_author: postAuthor,
          post_date: postDate,
          post_date_gmt: postDateGmt,
          post_content: postContent || "",
          post_title: postTitle || "",
          post_excerpt: postExcerpt || "",
          post_status: postStatus,
          comment_status: commentStatus,
          ping_status: pingStatus,
          post_password: postPassword,
          post_name: postName,
          to_ping: toPing,
          pinged,
          post_modified: postModified,
          post_modified_gmt: postModifiedGmt,
          post_content_filtered: postContentFiltered,
          post_parent: postParent,
          guid,
          menu_order: menuOrder,
          post_type: postType,
          post_mime_type: postMimeType,
          comment_count: commentCount,
        });
      }
    }

    if (table === "wp_postmeta") {
      for (const tuple of tuples) {
        const [, postId, metaKey, metaValue] = tuple;

        if (!postsById.has(postId)) {
          continue;
        }

        if (!YOAST_TITLE_KEYS.has(metaKey) && !YOAST_DESCRIPTION_KEYS.has(metaKey)) {
          continue;
        }

        const existingMeta = metaByPostId.get(postId) || {};

        if (YOAST_TITLE_KEYS.has(metaKey) && !existingMeta.metaTitle) {
          existingMeta.metaTitle = metaValue || "";
        }

        if (YOAST_DESCRIPTION_KEYS.has(metaKey) && !existingMeta.metaDescription) {
          existingMeta.metaDescription = metaValue || "";
        }

        metaByPostId.set(postId, existingMeta);
      }
    }
  }

  const pagePayloads = [];
  const payloadBySlug = new Map();
  const globalCandidates = [];

  for (const post of postsById.values()) {
    const candidate = detectGlobalCandidate(post);
    if (candidate) {
      globalCandidates.push(candidate);
    }

    const payload = mapWordpressPostToPagePayload(post, metaByPostId);
    if (!payload) {
      migrationStats.skippedMissingSlug += 1;
      continue;
    }

    if (payloadBySlug.has(payload.slug)) {
      migrationStats.duplicateSlugPayloads += 1;
    }

    payloadBySlug.set(payload.slug, payload);
  }

  pagePayloads.push(...payloadBySlug.values());

  const buildReport = (result) => ({
    sourceSqlPath: SOURCE_SQL_PATH,
    dryRun: DRY_RUN,
    stats: migrationStats,
    totals: {
      importedPayloads: pagePayloads.length,
      created: result.created,
      updated: result.updated,
    },
    globalCandidates,
  });

  if (DRY_RUN) {
    console.log(`[DRY RUN] Parsed ${pagePayloads.length} WordPress pages from SQL dump.`);
    console.log(`[DRY RUN] Source file: ${SOURCE_SQL_PATH}`);
    const report = buildReport({ created: 0, updated: 0 });
    fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2), "utf-8");
    console.log(`[DRY RUN] Migration report saved to: ${REPORT_PATH}`);
    return;
  }

  let created = 0;
  let updated = 0;

  for (const payload of pagePayloads) {
    const processed = processCmsContent(payload);

    const existing = await Page.findOne({ where: { slug: payload.slug } });

    if (!existing) {
      await Page.create({
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
        lastEditedById: defaultEditor.id,
      });
      created += 1;
      continue;
    }

    await existing.update({
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
      version: existing.version + 1,
      isPublished: payload.isPublished,
      lastEditedById: defaultEditor.id,
    });
    updated += 1;
  }

  console.log(`Imported WordPress pages: total=${pagePayloads.length}, created=${created}, updated=${updated}`);
  const report = buildReport({ created, updated });
  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2), "utf-8");
  console.log(`Migration report saved to: ${REPORT_PATH}`);
};

main()
  .catch((error) => {
    console.error("WordPress import failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await sequelize.close();
  });
