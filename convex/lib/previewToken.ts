export const DEFAULT_PREVIEW_TTL_MS = 24 * 60 * 60 * 1000;

export function generatePreviewTokenValue(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function isPreviewTokenExpired(expiresAt: number, now: number): boolean {
  return now >= expiresAt;
}

export function isPreviewTokenRevoked(revokedAt: number | undefined): boolean {
  return revokedAt !== undefined;
}

export function isPreviewTokenValid(args: {
  expiresAt: number;
  revokedAt?: number;
  draftRevision: number;
  entryDraftRevision: number;
  now: number;
}): { valid: true } | { valid: false; reason: string } {
  if (isPreviewTokenRevoked(args.revokedAt)) {
    return { valid: false, reason: "Preview token has been revoked" };
  }

  if (isPreviewTokenExpired(args.expiresAt, args.now)) {
    return { valid: false, reason: "Preview token has expired" };
  }

  if (args.draftRevision !== args.entryDraftRevision) {
    return { valid: false, reason: "Preview token is stale; regenerate to view latest draft" };
  }

  return { valid: true };
}

export function previewExpiryWarning(expiresAt: number, now: number): "expired" | "soon" | "ok" {
  if (isPreviewTokenExpired(expiresAt, now)) {
    return "expired";
  }

  const remaining = expiresAt - now;
  if (remaining < 60 * 60 * 1000) {
    return "soon";
  }

  return "ok";
}
