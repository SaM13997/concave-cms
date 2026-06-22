import { describe, expect, it } from "vitest";
import { countRestorableEntries } from "./restoreDrill";

describe("restore drill", () => {
  it("counts restorable vs skipped entries", () => {
    const snapshot = [
      { contentType: "blog", title: "Post A", status: "draft" as const },
      { contentType: "blog", title: "Post B", status: "published" as const },
    ];
    const existing = [{ contentType: "blog", title: "Post A", status: "draft" as const }];

    expect(countRestorableEntries(snapshot, existing)).toEqual({ restored: 1, skipped: 1 });
  });

  it("restores all when database is wiped", () => {
    const snapshot = [
      { contentType: "blog", title: "Post A", status: "draft" as const },
      { contentType: "blog", title: "Post B", status: "published" as const },
    ];

    expect(countRestorableEntries(snapshot, [])).toEqual({ restored: 2, skipped: 0 });
  });
});
