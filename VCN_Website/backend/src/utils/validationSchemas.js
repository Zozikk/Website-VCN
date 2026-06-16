const { z } = require("zod");

const roleSchema = z.enum(["admin", "editor"]);
const pageTypeSchema = z.enum(["page", "global_header", "global_footer"]);

const slugValueSchema = z
  .string()
  .trim()
  .min(1)
  .max(180)
  .regex(/^[a-z0-9]+(?:\/[a-z0-9-]+|-[a-z0-9]+|[a-z0-9])*$/i, "Slug can only include letters, numbers, hyphens and '/' separators.");

const basePageBodyFieldsSchema = z.object({
  slug: slugValueSchema,
  pageType: pageTypeSchema.optional().default("page"),
  isSystem: z.boolean().optional().default(false),
  metaTitle: z.string().trim().min(1).max(255),
  metaDescription: z.string().trim().max(1000).optional().default(""),
  h1: z.string().trim().min(1).max(255),
  content: z.string().trim().min(1).optional(),
  htmlContent: z.string().trim().min(1).optional(),
  cssContent: z.string().optional().default(""),
  jsContent: z.string().optional().default(""),
  isPublished: z.boolean().optional().default(false),
  tagIds: z.array(z.coerce.number().int().positive()).optional().default([]),
});

const basePageBodySchema = basePageBodyFieldsSchema.superRefine((value, ctx) => {
  if (!value.content && !value.htmlContent) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["htmlContent"],
      message: "Either htmlContent or content is required.",
    });
  }
});

const createPageSchema = z.object({
  body: basePageBodySchema,
  params: z.object({}),
  query: z.object({}).passthrough(),
});

const updatePageBodySchema = basePageBodyFieldsSchema.partial().superRefine((value, ctx) => {
  if (Object.keys(value).length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: [],
      message: "At least one field must be provided for update.",
    });
  }

  if (value.content === "" || value.htmlContent === "") {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["htmlContent"],
      message: "htmlContent cannot be empty when provided.",
    });
  }
});

const updatePageSchema = z.object({
  body: updatePageBodySchema,
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
  query: z.object({}).passthrough(),
});

const getPageBySlugSchema = z.object({
  body: z.object({}).passthrough(),
  params: z.object({
    slug: slugValueSchema,
  }),
  query: z.object({}).passthrough(),
});

const deletePageSchema = z.object({
  body: z.object({}).passthrough(),
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
  query: z.object({}).passthrough(),
});

const getPageByIdSchema = z.object({
  body: z.object({}).passthrough(),
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
  query: z.object({}).passthrough(),
});

const getPagesSchema = z.object({
  body: z.object({}).passthrough(),
  params: z.object({}).passthrough(),
  query: z.object({
    publishedOnly: z.enum(["true", "false"]).optional(),
    status: z.enum(["all", "published", "draft"]).optional(),
    pageType: pageTypeSchema.optional(),
    q: z.string().trim().max(255).optional(),
  }),
});

const getGlobalLayoutSchema = z.object({
  body: z.object({}).passthrough(),
  params: z.object({}).passthrough(),
  query: z.object({
    includeDraft: z.enum(["true", "false"]).optional(),
  }),
});

const getPageVersionsSchema = z.object({
  body: z.object({}).passthrough(),
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
  query: z.object({}).passthrough(),
});

const publishPageVersionSchema = z.object({
  body: z.object({
    versionId: z.coerce.number().int().positive(),
  }),
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
  query: z.object({}).passthrough(),
});

const redirectPathSchema = z
  .string()
  .trim()
  .min(1)
  .max(255)
  .regex(/^\/?[a-zA-Z0-9\-/_]+$/, "Redirect path may include only letters, numbers, '-', '_' and '/' characters.");

const getRedirectsSchema = z.object({
  body: z.object({}).passthrough(),
  params: z.object({}).passthrough(),
  query: z.object({}).passthrough(),
});

const createRedirectSchema = z.object({
  body: z.object({
    fromPath: redirectPathSchema,
    toPath: redirectPathSchema,
    statusCode: z.union([z.literal(301), z.literal(302), z.literal(307), z.literal(308)]).optional().default(301),
    isActive: z.boolean().optional().default(true),
  }),
  params: z.object({}).passthrough(),
  query: z.object({}).passthrough(),
});

const resolveRedirectSchema = z.object({
  body: z.object({}).passthrough(),
  params: z.object({}).passthrough(),
  query: z.object({
    path: redirectPathSchema,
  }),
});

const previewTokenSchema = z.object({
  body: z.object({
    pageId: z.coerce.number().int().positive(),
  }),
  params: z.object({}).passthrough(),
  query: z.object({}).passthrough(),
});

const previewPageSchema = z.object({
  body: z.object({}).passthrough(),
  params: z.object({
    token: z.string().trim().min(1),
  }),
  query: z.object({}).passthrough(),
});

const registerSchema = z.object({
  body: z.object({
    username: z.string().trim().min(3).max(50),
    email: z.string().trim().email(),
    password: z.string().min(8).max(200),
    role: roleSchema.optional(),
  }),
  params: z.object({}).passthrough(),
  query: z.object({}).passthrough(),
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().trim().email(),
    password: z.string().min(1),
  }),
  params: z.object({}).passthrough(),
  query: z.object({}).passthrough(),
});

module.exports = {
  registerSchema,
  loginSchema,
  createPageSchema,
  updatePageSchema,
  getPageBySlugSchema,
  getPageByIdSchema,
  deletePageSchema,
  getPagesSchema,
  getGlobalLayoutSchema,
  getPageVersionsSchema,
  publishPageVersionSchema,
  getRedirectsSchema,
  createRedirectSchema,
  resolveRedirectSchema,
  previewTokenSchema,
  previewPageSchema,
};
