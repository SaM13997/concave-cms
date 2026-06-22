const PUBLIC_PATH_PREFIXES = ["/login", "/api/auth"] as const;

/**
 * Returns true when a pathname is intentionally public (no session required).
 */
export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/**
 * Returns true when a route should require an authenticated session.
 */
export function shouldProtectRoute(pathname: string): boolean {
  return !isPublicPath(pathname);
}

/**
 * Allow only same-app relative redirects to prevent open-redirect attacks.
 */
export function sanitizeRedirectTarget(target: string | undefined): string | undefined {
  if (!target || target.length === 0) {
    return undefined;
  }

  if (!target.startsWith("/")) {
    return undefined;
  }

  if (target.startsWith("//")) {
    return undefined;
  }

  return target;
}

export function getPostLoginPath(redirect: string | undefined, fallback = "/"): string {
  return sanitizeRedirectTarget(redirect) ?? fallback;
}
