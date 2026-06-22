import { describe, expect, it } from "vitest";
import {
  DEFAULT_PREVIEW_TTL_MS,
  isPreviewTokenExpired,
  isPreviewTokenRevoked,
  isPreviewTokenValid,
  previewExpiryWarning,
} from "./previewToken";

describe("previewToken validation", () => {
  const now = 1_700_000_000_000;

  it("rejects revoked tokens", () => {
    const result = isPreviewTokenValid({
      expiresAt: now + DEFAULT_PREVIEW_TTL_MS,
      revokedAt: now - 1000,
      draftRevision: 2,
      entryDraftRevision: 2,
      now,
    });
    expect(result).toEqual({ valid: false, reason: "Preview token has been revoked" });
    expect(isPreviewTokenRevoked(now - 1)).toBe(true);
  });

  it("rejects expired tokens", () => {
    const result = isPreviewTokenValid({
      expiresAt: now - 1,
      draftRevision: 1,
      entryDraftRevision: 1,
      now,
    });
    expect(result).toEqual({ valid: false, reason: "Preview token has expired" });
    expect(isPreviewTokenExpired(now - 1, now)).toBe(true);
  });

  it("rejects stale tokens when draft revision changed", () => {
    const result = isPreviewTokenValid({
      expiresAt: now + DEFAULT_PREVIEW_TTL_MS,
      draftRevision: 1,
      entryDraftRevision: 2,
      now,
    });
    expect(result).toEqual({
      valid: false,
      reason: "Preview token is stale; regenerate to view latest draft",
    });
  });

  it("accepts valid tokens bound to current draft revision", () => {
    const result = isPreviewTokenValid({
      expiresAt: now + DEFAULT_PREVIEW_TTL_MS,
      draftRevision: 3,
      entryDraftRevision: 3,
      now,
    });
    expect(result).toEqual({ valid: true });
  });

  it("previewExpiryWarning surfaces soon and expired states", () => {
    expect(previewExpiryWarning(now - 1, now)).toBe("expired");
    expect(previewExpiryWarning(now + 30 * 60 * 1000, now)).toBe("soon");
    expect(previewExpiryWarning(now + 5 * 60 * 60 * 1000, now)).toBe("ok");
  });
});
