import { describe, expect, it } from "vitest";
import { rejectInjectionPayload } from "./inputValidation";
import { permissionsForRole, roleHasPermission } from "./permissions";
import { isPreviewTokenValid } from "./previewToken";

describe("security regression", () => {
  const now = 1_700_000_000_000;

  it("RBAC: editor cannot write schema", () => {
    expect(roleHasPermission("editor", "schema:write")).toBe(false);
    expect(roleHasPermission("admin", "schema:write")).toBe(true);
    expect(permissionsForRole("editor")).not.toContain("schema:write");
  });

  it("RBAC: admin has full permissions", () => {
    expect(roleHasPermission("admin", "content:write")).toBe(true);
    expect(roleHasPermission("admin", "schema:read")).toBe(true);
  });

  it("preview: expired token is rejected", () => {
    const result = isPreviewTokenValid({
      expiresAt: now - 1,
      draftRevision: 1,
      entryDraftRevision: 1,
      now,
    });
    expect(result.valid).toBe(false);
  });

  it("preview: revoked token is rejected (replay)", () => {
    const result = isPreviewTokenValid({
      expiresAt: now + 60_000,
      revokedAt: now - 1,
      draftRevision: 1,
      entryDraftRevision: 1,
      now,
    });
    expect(result.valid).toBe(false);
  });

  it("preview: stale token is rejected", () => {
    const result = isPreviewTokenValid({
      expiresAt: now + 60_000,
      draftRevision: 1,
      entryDraftRevision: 2,
      now,
    });
    expect(result.valid).toBe(false);
  });

  it("injection payloads are blocked in text fields", () => {
    const payloads = [
      "<script>document.cookie</script>",
      'javascript:alert("xss")',
      "<img src=x onerror=alert(1)>",
      "data:text/html,<script>alert(1)</script>",
    ];

    for (const payload of payloads) {
      expect(rejectInjectionPayload(payload)).toBe(true);
    }
  });
});
