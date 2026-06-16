export type UserRole = "admin" | "editor";
export type CmsPageType = "page" | "global_header" | "global_footer";

export interface CmsTag {
  id: number;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CmsUser {
  id: number;
  username: string;
  email: string;
  role: UserRole;
}

export interface CmsPage {
  id: number;
  slug: string;
  pageType: CmsPageType;
  isSystem: boolean;
  metaTitle: string;
  metaDescription: string;
  h1: string;
  content: string;
  htmlContent: string;
  cssContent: string;
  jsContent: string;
  renderedHtml: string;
  renderedCss: string;
  renderedJs: string;
  version: number;
  isPublished: boolean;
  lastEditedById: number | null;
  lastEditor: CmsUser | null;
  tags: CmsTag[];
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  token: string;
  user: CmsUser;
}

export interface PagePayload {
  slug: string;
  pageType: CmsPageType;
  isSystem: boolean;
  metaTitle: string;
  metaDescription: string;
  h1: string;
  htmlContent: string;
  cssContent: string;
  jsContent: string;
  isPublished: boolean;
  tagIds?: number[];
}

export interface PageQueryParams {
  q?: string;
  status?: "all" | "published" | "draft";
  pageType?: CmsPageType;
  tag?: string;
}

export interface CmsGlobalLayout {
  header: CmsPage | null;
  footer: CmsPage | null;
}

export interface CmsPageVersion {
  id: number;
  pageId: number;
  versionNumber: number;
  slug: string;
  pageType: CmsPageType;
  isSystem: boolean;
  metaTitle: string;
  metaDescription: string;
  h1: string;
  content: string;
  htmlContent: string;
  cssContent: string;
  jsContent: string;
  renderedHtml: string;
  renderedCss: string;
  renderedJs: string;
  isPublished: boolean;
  editedById: number | null;
  editedBy: CmsUser | null;
  createdAt: string;
  updatedAt: string;
}

export interface CmsRedirectRule {
  id: number;
  fromPath: string;
  toPath: string;
  statusCode: 301 | 302 | 307 | 308;
  isActive: boolean;
  createdById: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface RedirectPayload {
  fromPath: string;
  toPath: string;
  statusCode: 301 | 302 | 307 | 308;
  isActive: boolean;
}

export interface PreviewTokenResponse {
  token: string;
  previewUrl: string;
}

export interface PreviewPageResponse {
  page: CmsPage;
  layout: CmsGlobalLayout;
}

export interface RedirectResolveResponse {
  id: number;
  fromPath: string;
  toPath: string;
  statusCode: 301 | 302 | 307 | 308;
  isActive: boolean;
  createdById: number | null;
  createdAt: string;
  updatedAt: string;
}
