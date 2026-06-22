import { describe, expect, it } from "vitest";
import { planSchemaApply } from "./schemaApply";

const baseFields = [
  { slug: "title", name: "Title", type: "text" as const, required: true, config: {} },
];

describe("planSchemaApply", () => {
  it("accepts valid new draft schema", () => {
    const result = planSchemaApply(
      {
        slug: "blog",
        name: "Blog",
        fields: baseFields,
        status: "draft",
        version: 1,
      },
      [],
      {
        confirmDestructive: false,
        entryCount: 0,
        entriesWithFieldCounts: new Map(),
        overwriteConflict: false,
      },
    );
    expect(result).toEqual({ ok: true, newVersion: 1 });
  });

  it("rejects validation errors", () => {
    const result = planSchemaApply(
      {
        slug: "",
        name: "Blog",
        fields: [],
        status: "draft",
        version: 1,
      },
      [],
      {
        confirmDestructive: false,
        entryCount: 0,
        entriesWithFieldCounts: new Map(),
        overwriteConflict: false,
      },
    );
    expect(result.ok).toBe(false);
    if (!result.ok && result.reason === "validation") {
      expect(result.errors.length).toBeGreaterThan(0);
    }
  });

  it("detects version conflict", () => {
    const result = planSchemaApply(
      {
        slug: "blog",
        name: "Blog",
        fields: baseFields,
        status: "draft",
        version: 3,
        baseActiveVersion: 2,
      },
      ["blog"],
      {
        confirmDestructive: false,
        entryCount: 0,
        entriesWithFieldCounts: new Map(),
        overwriteConflict: false,
      },
    );
    expect(result).toEqual({
      ok: false,
      reason: "conflict",
      currentVersion: 3,
      baseActiveVersion: 2,
    });
  });

  it("allows overwrite on conflict when requested", () => {
    const result = planSchemaApply(
      {
        slug: "blog",
        name: "Blog",
        fields: baseFields,
        status: "draft",
        version: 3,
        baseActiveVersion: 2,
      },
      ["blog"],
      {
        confirmDestructive: false,
        entryCount: 0,
        entriesWithFieldCounts: new Map(),
        overwriteConflict: true,
      },
    );
    expect(result).toEqual({ ok: true, newVersion: 4 });
  });

  it("blocks destructive field deletion without confirmation", () => {
    const activeFields = [
      { slug: "title", name: "Title", type: "text" as const, required: true, config: {} },
      { slug: "body", name: "Body", type: "richtext" as const, required: false, config: {} },
    ];
    const result = planSchemaApply(
      {
        slug: "blog",
        name: "Blog",
        fields: [
          { slug: "title", name: "Title", type: "text" as const, required: true, config: {} },
        ],
        status: "draft",
        version: 1,
        activeFields,
      },
      ["blog"],
      {
        confirmDestructive: false,
        entryCount: 5,
        entriesWithFieldCounts: new Map([["body", 3]]),
        overwriteConflict: false,
      },
    );
    expect(result.ok).toBe(false);
    if (!result.ok && result.reason === "destructive") {
      expect(result.changes.length).toBeGreaterThan(0);
    }
  });

  it("allows destructive changes with confirmation", () => {
    const activeFields = [
      { slug: "title", name: "Title", type: "text" as const, required: true, config: {} },
      { slug: "body", name: "Body", type: "richtext" as const, required: false, config: {} },
    ];
    const draftFields = [
      { slug: "title", name: "Title", type: "text" as const, required: true, config: {} },
    ];
    const result = planSchemaApply(
      {
        slug: "blog",
        name: "Blog",
        fields: draftFields,
        status: "draft",
        version: 1,
        activeFields,
      },
      ["blog"],
      {
        confirmDestructive: true,
        entryCount: 5,
        entriesWithFieldCounts: new Map([["body", 3]]),
        overwriteConflict: false,
      },
    );
    expect(result.ok).toBe(true);
  });

  it("rejects apply on active schema without draft overlay", () => {
    const result = planSchemaApply(
      {
        slug: "blog",
        name: "Blog",
        fields: baseFields,
        status: "active",
        version: 1,
      },
      ["blog"],
      {
        confirmDestructive: false,
        entryCount: 0,
        entriesWithFieldCounts: new Map(),
        overwriteConflict: false,
      },
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("invalid_state");
    }
  });
});
