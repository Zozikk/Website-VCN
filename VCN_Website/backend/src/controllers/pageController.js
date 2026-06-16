const { Op } = require("sequelize");
const jwt = require("jsonwebtoken");
const env = require("../config/env");
const { Page, PageVersion, RedirectRule, User, Tag, PageTag } = require("../models");
const { processCmsContent } = require("../utils/contentPipeline");
const { getTagsInclude, syncPageTags } = require("../utils/tagService");

const serializePage = (page) => {
  const data = page.toJSON();

  return {
    id: data.id,
    slug: data.slug,
    pageType: data.pageType,
    isSystem: data.isSystem,
    metaTitle: data.metaTitle,
    metaDescription: data.metaDescription,
    h1: data.h1,
    content: data.content,
    htmlContent: data.htmlContent,
    cssContent: data.cssContent,
    jsContent: data.jsContent,
    renderedHtml: data.renderedHtml,
    renderedCss: data.renderedCss,
    renderedJs: data.renderedJs,
    version: data.version,
    isPublished: data.isPublished,
    lastEditedById: data.lastEditedById,
    lastEditor: data.lastEditor
      ? {
          id: data.lastEditor.id,
          username: data.lastEditor.username,
          email: data.lastEditor.email,
          role: data.lastEditor.role,
        }
      : null,
    tags: (data.tags || []).map((tag) => ({ id: tag.id, name: tag.name })),
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
};

const getEditorInclude = () => [
  { model: User, as: "lastEditor", attributes: ["id", "username", "email", "role"] },
  ...getTagsInclude(),
];
const getVersionEditorInclude = () => [{ model: User, as: "editedBy", attributes: ["id", "username", "email", "role"] }];

const normalizeSlug = (slug) => slug.trim().replace(/^\/+|\/+$/g, "").toLowerCase();

const resolveCanonicalSlug = (pageType, slug) => {
  if (pageType === "global_header") {
    return "global/header";
  }

  if (pageType === "global_footer") {
    return "global/footer";
  }

  return normalizeSlug(slug);
};

const buildProcessedContent = (body, fallback) => {
  const htmlContent = body.htmlContent ?? body.content ?? fallback.htmlContent ?? fallback.content ?? "";
  const cssContent = body.cssContent ?? fallback.cssContent ?? "";
  const jsContent = body.jsContent ?? fallback.jsContent ?? "";

  return processCmsContent({
    slug: normalizeSlug(body.slug ?? fallback.slug),
    htmlContent,
    cssContent,
    jsContent,
  });
};

const serializePageVersion = (version) => {
  const data = version.toJSON();

  return {
    id: data.id,
    pageId: data.pageId,
    versionNumber: data.versionNumber,
    slug: data.slug,
    pageType: data.pageType,
    isSystem: data.isSystem,
    metaTitle: data.metaTitle,
    metaDescription: data.metaDescription,
    h1: data.h1,
    content: data.content,
    htmlContent: data.htmlContent,
    cssContent: data.cssContent,
    jsContent: data.jsContent,
    renderedHtml: data.renderedHtml,
    renderedCss: data.renderedCss,
    renderedJs: data.renderedJs,
    isPublished: data.isPublished,
    editedById: data.editedById,
    editedBy: data.editedBy
      ? {
          id: data.editedBy.id,
          username: data.editedBy.username,
          email: data.editedBy.email,
          role: data.editedBy.role,
        }
      : null,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
};

const createVersionSnapshot = async (page, editedById) => {
  return PageVersion.create({
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

const ensureRedirectFromPreviousSlug = async ({ previousSlug, nextSlug, userId }) => {
  if (!previousSlug || !nextSlug || previousSlug === nextSlug) {
    return;
  }

  const fromPath = `/${previousSlug}`;
  const toPath = `/${nextSlug}`;

  if (fromPath === toPath) {
    return;
  }

  const existing = await RedirectRule.findOne({ where: { fromPath } });

  if (existing) {
    await existing.update({
      toPath,
      statusCode: 301,
      isActive: true,
      createdById: userId,
    });
    return;
  }

  await RedirectRule.create({
    fromPath,
    toPath,
    statusCode: 301,
    isActive: true,
    createdById: userId,
  });
};

const createPage = async (req, res, next) => {
  try {
    const { slug, pageType, isSystem, metaTitle, metaDescription, h1, isPublished } = req.body;
    const normalizedSlug = resolveCanonicalSlug(pageType || "page", slug);

    const existingPage = await Page.findOne({ where: { slug: normalizedSlug } });

    if (existingPage) {
      return res.status(409).json({ message: "Page with this slug already exists." });
    }

    const processed = buildProcessedContent({ ...req.body, slug: normalizedSlug }, {});

    const page = await Page.create({
      slug: normalizedSlug,
      pageType: pageType || "page",
      isSystem: Boolean(isSystem),
      metaTitle,
      metaDescription: metaDescription || "",
      h1,
      content: processed.htmlContent,
      htmlContent: processed.htmlContent,
      cssContent: processed.cssContent,
      jsContent: processed.jsContent,
      renderedHtml: processed.renderedHtml,
      renderedCss: processed.renderedCss,
      renderedJs: processed.renderedJs,
      version: 1,
      isPublished: Boolean(isPublished),
      lastEditedById: req.user.id,
    });

    const pageWithEditor = await Page.findByPk(page.id, {
      include: getEditorInclude(),
    });

    await createVersionSnapshot(pageWithEditor, req.user.id);

    if (Array.isArray(req.body.tagIds)) {
      await syncPageTags(page.id, req.body.tagIds);
    }

    const pageWithTags = await Page.findByPk(page.id, {
      include: getEditorInclude(),
    });

    return res.status(201).json(serializePage(pageWithTags));
  } catch (error) {
    return next(error);
  }
};

const getPages = async (req, res, next) => {
  try {
    const where = {};
    const { publishedOnly, status, pageType, q, tag } = req.query;

    if (publishedOnly === "true") {
      where.isPublished = true;
    }

    if (status === "published") {
      where.isPublished = true;
    }

    if (status === "draft") {
      where.isPublished = false;
    }

    if (pageType) {
      where.pageType = pageType;
    }

    if (q) {
      where[Op.or] = [
        { slug: { [Op.like]: `%${q}%` } },
        { metaTitle: { [Op.like]: `%${q}%` } },
        { h1: { [Op.like]: `%${q}%` } },
      ];
    }

    if (tag) {
      const tagRecord = await Tag.findOne({ where: { name: String(tag).trim().toLowerCase() } });

      if (!tagRecord) {
        return res.json([]);
      }

      const pageTags = await PageTag.findAll({
        where: { tagId: tagRecord.id },
        attributes: ["pageId"],
      });

      const pageIds = pageTags.map((entry) => entry.pageId);

      if (!pageIds.length) {
        return res.json([]);
      }

      where.id = { [Op.in]: pageIds };
    }

    const pages = await Page.findAll({
      where,
      order: [["updatedAt", "DESC"]],
      include: getEditorInclude(),
    });

    return res.json(pages.map(serializePage));
  } catch (error) {
    return next(error);
  }
};

const getPageBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const normalizedSlug = normalizeSlug(slug);

    const page = await Page.findOne({
      where: { slug: normalizedSlug },
      include: getEditorInclude(),
    });

    if (!page) {
      return res.status(404).json({ message: "Page not found." });
    }

    return res.json(serializePage(page));
  } catch (error) {
    return next(error);
  }
};

const getPageById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const page = await Page.findByPk(id, {
      include: getEditorInclude(),
    });

    if (!page) {
      return res.status(404).json({ message: "Page not found." });
    }

    return res.json(serializePage(page));
  } catch (error) {
    return next(error);
  }
};

const updatePage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { slug, pageType, isSystem, metaTitle, metaDescription, h1, isPublished } = req.body;

    const page = await Page.findByPk(id);

    if (!page) {
      return res.status(404).json({ message: "Page not found." });
    }

    const nextType = pageType ?? page.pageType;
    const normalizedSlug = resolveCanonicalSlug(nextType, slug || page.slug);

    if (normalizedSlug !== page.slug) {
      const slugConflict = await Page.findOne({ where: { slug: normalizedSlug } });

      if (slugConflict) {
        return res.status(409).json({ message: "Page with this slug already exists." });
      }
    }

    const processed = buildProcessedContent(
      {
        ...req.body,
        slug: normalizedSlug,
      },
      page,
    );

    const previousSlug = page.slug;

    await page.update({
      slug: normalizedSlug,
      pageType: nextType,
      isSystem: isSystem !== undefined ? Boolean(isSystem) : page.isSystem,
      metaTitle: metaTitle ?? page.metaTitle,
      metaDescription: metaDescription ?? page.metaDescription,
      h1: h1 ?? page.h1,
      content: processed.htmlContent,
      htmlContent: processed.htmlContent,
      cssContent: processed.cssContent,
      jsContent: processed.jsContent,
      renderedHtml: processed.renderedHtml,
      renderedCss: processed.renderedCss,
      renderedJs: processed.renderedJs,
      version: page.version + 1,
      isPublished: isPublished !== undefined ? Boolean(isPublished) : page.isPublished,
      lastEditedById: req.user.id,
    });

    await ensureRedirectFromPreviousSlug({
      previousSlug,
      nextSlug: normalizedSlug,
      userId: req.user.id,
    });

    const pageWithEditor = await Page.findByPk(page.id, {
      include: getEditorInclude(),
    });

    await createVersionSnapshot(pageWithEditor, req.user.id);

    if (Array.isArray(req.body.tagIds)) {
      await syncPageTags(page.id, req.body.tagIds);
    }

    const pageWithTags = await Page.findByPk(page.id, {
      include: getEditorInclude(),
    });

    // Trigger frontend on-demand revalidation for the updated page (best-effort)
    try {
      const revalidatePath = `/${pageWithTags.slug}`;
      const revalidateUrl = `${env.frontendBaseUrl.replace(/\/+$/, "")}/api/revalidate`;

      if (typeof fetch === "function") {
        await fetch(revalidateUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ secret: env.revalidateSecret, path: revalidatePath }),
        });
      }
    } catch (err) {
      console.warn("[revalidate] failed to notify frontend:", err);
    }

    return res.json(serializePage(pageWithTags));
  } catch (error) {
    return next(error);
  }
};

const deletePage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const page = await Page.findByPk(id);

    if (!page) {
      return res.status(404).json({ message: "Page not found." });
    }

    await page.destroy();

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
};

const getGlobalLayout = async (req, res, next) => {
  try {
    const includeDraft = req.query.includeDraft === "true";
    const where = includeDraft ? {} : { isPublished: true };

    const [header, footer] = await Promise.all([
      Page.findOne({
        where: { ...where, pageType: "global_header" },
        include: getEditorInclude(),
        order: [["updatedAt", "DESC"]],
      }),
      Page.findOne({
        where: { ...where, pageType: "global_footer" },
        include: getEditorInclude(),
        order: [["updatedAt", "DESC"]],
      }),
    ]);

    return res.json({
      header: header ? serializePage(header) : null,
      footer: footer ? serializePage(footer) : null,
    });
  } catch (error) {
    return next(error);
  }
};

const getPageVersions = async (req, res, next) => {
  try {
    const { id } = req.params;
    const page = await Page.findByPk(id);

    if (!page) {
      return res.status(404).json({ message: "Page not found." });
    }

    const versions = await PageVersion.findAll({
      where: { pageId: page.id },
      include: getVersionEditorInclude(),
      order: [["versionNumber", "DESC"]],
    });

    return res.json(versions.map(serializePageVersion));
  } catch (error) {
    return next(error);
  }
};

const publishPageVersion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { versionId } = req.body;

    const page = await Page.findByPk(id);

    if (!page) {
      return res.status(404).json({ message: "Page not found." });
    }

    const version = await PageVersion.findOne({
      where: {
        id: versionId,
        pageId: page.id,
      },
    });

    if (!version) {
      return res.status(404).json({ message: "Version not found for this page." });
    }

    await page.update({
      slug: version.slug,
      pageType: version.pageType,
      isSystem: version.isSystem,
      metaTitle: version.metaTitle,
      metaDescription: version.metaDescription,
      h1: version.h1,
      content: version.content,
      htmlContent: version.htmlContent,
      cssContent: version.cssContent,
      jsContent: version.jsContent,
      renderedHtml: version.renderedHtml,
      renderedCss: version.renderedCss,
      renderedJs: version.renderedJs,
      version: page.version + 1,
      isPublished: true,
      lastEditedById: req.user.id,
    });

    if (version.isPublished !== true) {
      await version.update({
        isPublished: true,
      });
    }

    const pageWithEditor = await Page.findByPk(page.id, {
      include: getEditorInclude(),
    });

    await createVersionSnapshot(pageWithEditor, req.user.id);

    return res.json(serializePage(pageWithEditor));
  } catch (error) {
    return next(error);
  }
};

const createPreviewToken = async (req, res, next) => {
  try {
    const { pageId } = req.body;
    const page = await Page.findByPk(pageId);

    if (!page) {
      return res.status(404).json({ message: "Page not found." });
    }

    const token = jwt.sign(
      {
        pageId: page.id,
        role: req.user.role,
        type: "cms_preview",
      },
      env.previewTokenSecret,
      {
        expiresIn: env.previewTokenExpiresIn,
      },
    );

    return res.json({
      token,
      previewUrl: `/preview/${token}`,
    });
  } catch (error) {
    return next(error);
  }
};

const getPreviewPageByToken = async (req, res, next) => {
  try {
    const { token } = req.params;
    const payload = jwt.verify(token, env.previewTokenSecret);

    if (payload?.type !== "cms_preview" || !payload?.pageId) {
      return res.status(401).json({ message: "Invalid preview token." });
    }

    const page = await Page.findByPk(payload.pageId, {
      include: getEditorInclude(),
    });

    if (!page) {
      return res.status(404).json({ message: "Page not found." });
    }

    const [header, footer] = await Promise.all([
      Page.findOne({
        where: { pageType: "global_header" },
        include: getEditorInclude(),
        order: [["updatedAt", "DESC"]],
      }),
      Page.findOne({
        where: { pageType: "global_footer" },
        include: getEditorInclude(),
        order: [["updatedAt", "DESC"]],
      }),
    ]);

    return res.json({
      page: serializePage(page),
      layout: {
        header: header ? serializePage(header) : null,
        footer: footer ? serializePage(footer) : null,
      },
    });
  } catch (error) {
    if (error.name === "TokenExpiredError" || error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid or expired preview token." });
    }

    return next(error);
  }
};

module.exports = {
  createPage,
  getPages,
  getPageBySlug,
  getPageById,
  updatePage,
  deletePage,
  getGlobalLayout,
  getPageVersions,
  publishPageVersion,
  createPreviewToken,
  getPreviewPageByToken,
};
