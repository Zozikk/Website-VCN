const TOKEN_KEY = "cms_jwt";

interface JwtPayload {
  exp?: number;
  sub?: number;
  username?: string;
  role?: "admin" | "editor";
}

const decodeBase64Url = (value: string): string => {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const withPadding = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");

  if (typeof window === "undefined") {
    return Buffer.from(withPadding, "base64").toString("utf-8");
  }

  return window.atob(withPadding);
};

export const decodeJwtPayload = (token: string): JwtPayload | null => {
  try {
    const parts = token.split(".");

    if (parts.length !== 3) {
      return null;
    }

    return JSON.parse(decodeBase64Url(parts[1]));
  } catch {
    return null;
  }
};

export const isTokenExpired = (token: string): boolean => {
  const payload = decodeJwtPayload(token);

  if (!payload?.exp) {
    return true;
  }

  const now = Math.floor(Date.now() / 1000);
  return payload.exp <= now;
};

let isAuthenticatedCache: boolean | null = null;

export const getToken = (): string | null => {
  if (typeof window === "undefined") {
    return null;
  }

  // Since httpOnly cookies can't be read by JS, we return a placeholder
  // The actual authentication is checked via /api/auth/me endpoint
  return isAuthenticatedCache ? "authenticated" : null;
};

export const setAuthenticated = (authenticated: boolean): void => {
  isAuthenticatedCache = authenticated;
};

export const clearToken = (): void => {
  if (typeof document === "undefined") {
    return;
  }

  isAuthenticatedCache = null;
  // Cookie will be cleared by backend via Set-Cookie: max-age=0
};