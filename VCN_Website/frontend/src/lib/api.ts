export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

const request = async <T>(
  path: string,
  init?: RequestInit & { next?: { revalidate?: number } },
): Promise<T> => {
  const startedAt = Date.now();

  const fetchOptions: any = {
    ...(init || {}),
    headers: {
      "Content-Type": "application/json",
      ...((init && (init as any).headers) || {}),
    },
    credentials: "include",
  };

  if (!fetchOptions.cache && !(fetchOptions.next && fetchOptions.next.revalidate)) {
    fetchOptions.cache = "no-store";
  }

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  const response = await fetch(`${API_URL}${path}`, fetchOptions);
  const durationMs = Date.now() - startedAt;
  const requestId = response.headers.get("x-request-id");

  if (typeof window !== "undefined") {
    console.info("[api-metric]", { path, status: response.status, durationMs, requestId });
  }

  if (!response.ok) {
    let message = "Request failed.";

    try {
      const body = await response.json();
      if (body?.message) {
        message = body.message;
        if (body?.details) {
          message = `${message} ${body.details}`;
        }
      }
    } catch {
      message = response.statusText || message;
    }

    throw new ApiError(message, response.status);
  }

  if (response.status === 204) {
    return null as T;
  }

  return response.json() as Promise<T>;
};

export const registerUser = async (payload: {
  username: string;
  email: string;
  password: string;
  role?: "admin" | "editor";
}): Promise<{ user: any }> => {
  return request<{ user: any }>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const loginUser = async (payload: {
  email: string;
  password: string;
}): Promise<{ user: any }> => {
  return request<{ user: any }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const logoutUser = async (): Promise<{ message: string }> => {
  return request<{ message: string }>("/api/auth/logout", {
    method: "POST",
  });
};

export const changePassword = async (payload: {
  currentPassword: string;
  newPassword: string;
}): Promise<{ message: string }> => {
  return request<{ message: string }>("/api/auth/change-password", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const getCurrentUser = async (): Promise<{ user: any }> => {
  return request<{ user: any }>("/api/auth/me", {
    method: "GET",
  });
};

export const exchangeAuthCode = async (payload: { code: string; appId?: string }) => {
  return request<{ user: any }>("/api/auth/exchange", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

import {
  CmsGlobalLayout,
  CmsPage,
  CmsPageVersion,
  CmsRedirectRule,
  CmsTag,
  PagePayload,
  PageQueryParams,
  PreviewPageResponse,
  PreviewTokenResponse,
  RedirectResolveResponse,
  RedirectPayload,
} from "@/lib/types";

export const fetchPages = async (query?: PageQueryParams): Promise<CmsPage[]> => {
  const params = new URLSearchParams();

  if (query?.q) {
    params.set("q", query.q);
  }

  if (query?.status && query.status !== "all") {
    params.set("status", query.status);
  }

  if (query?.pageType) {
    params.set("pageType", query.pageType);
  }

  if (query?.tag) {
    params.set("tag", query.tag);
  }

  const queryString = params.toString();
  const path = queryString ? `/api/pages?${queryString}` : "/api/pages";

  return request<CmsPage[]>(path);
};

export const fetchPublicPageBySlug = async (slug: string, revalidateSeconds = 60): Promise<CmsPage> => {
  return request<CmsPage>(`/api/pages/${slug}`, {
    next: { revalidate: revalidateSeconds },
  } as any);
};

export const fetchGlobalLayout = async (revalidateSeconds = 60): Promise<CmsGlobalLayout> => {
  return request<CmsGlobalLayout>("/api/pages/global/layout", {
    next: { revalidate: revalidateSeconds },
  } as any);
};

export const fetchPageById = async (id: number): Promise<CmsPage> => {
  return request<CmsPage>(`/api/pages/id/${id}`);
};

export const createPage = async (payload: PagePayload): Promise<CmsPage> => {
  return request<CmsPage>("/api/pages", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const updatePage = async (id: number, payload: Partial<PagePayload>): Promise<CmsPage> => {
  return request<CmsPage>(`/api/pages/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
};

export const deletePage = async (id: number): Promise<void> => {
  await request<void>(`/api/pages/${id}`, {
    method: "DELETE",
  });
};

export const fetchPageVersions = async (id: number): Promise<CmsPageVersion[]> => {
  return request<CmsPageVersion[]>(`/api/pages/${id}/versions`);
};

export const publishPageVersion = async (id: number, versionId: number): Promise<CmsPage> => {
  return request<CmsPage>(`/api/pages/${id}/publish-version`, {
    method: "POST",
    body: JSON.stringify({ versionId }),
  });
};

export const fetchRedirectRules = async (): Promise<CmsRedirectRule[]> => {
  return request<CmsRedirectRule[]>("/api/redirects");
};

export const createRedirectRule = async (payload: RedirectPayload): Promise<CmsRedirectRule> => {
  return request<CmsRedirectRule>("/api/redirects", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const createPreviewToken = async (pageId: number): Promise<PreviewTokenResponse> => {
  return request<PreviewTokenResponse>("/api/pages/preview-token", {
    method: "POST",
    body: JSON.stringify({ pageId }),
  });
};

export const fetchPreviewPage = async (previewToken: string): Promise<PreviewPageResponse> => {
  return request<PreviewPageResponse>(`/api/pages/preview/${previewToken}`);
};

export const resolvePublicRedirect = async (path: string): Promise<RedirectResolveResponse> => {
  const params = new URLSearchParams();
  params.set("path", path);
  return request<RedirectResolveResponse>(`/api/redirects/resolve?${params.toString()}`);
};

export const fetchTags = async (): Promise<CmsTag[]> => {
  return request<CmsTag[]>("/api/tags");
};

export const createTag = async (name: string): Promise<CmsTag> => {
  return request<CmsTag>("/api/tags", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
export { API_URL };
