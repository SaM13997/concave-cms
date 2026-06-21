import { describe, expect, it } from "vitest";
import { diffSchemaVersions } from "./schemaDiff";

describe("diffSchemaVersions", () => {
  const before = {
    slug: "blog",
    name: "Blog",
    fields: [{ slug: "title", name: "Title", type: "text" as const, required: true, config: {} }],
  };

  it("detects name change", () => {
    const diffs = diffSchemaVersions(before, { ...before, name: "Blog Post" });
    expect(diffs).toContainEqual({
      path: "name",
      kind: "changed",
      before: "Blog",
      after: "Blog Post",
    });
  });

  it("detects added field", () => {
    const diffs = diffSchemaVersions(before, {
      ...before,
      fields: [
        ...before.fields,
        { slug: "body", name: "Body", type: "richtext" as const, required: false, config: {} },
      ],
    });
    expect(diffs.some((d) => d.kind === "added" && d.path === "fields.body")).toBe(true);
  });

  it("detects removed field", () => {
    const diffs = diffSchemaVersions(before, { ...before, fields: [] });
    expect(diffs.some((d) => d.kind === "removed" && d.path === "fields.title")).toBe(true);
  });

  it("detects changed field", () => {
    const diffs = diffSchemaVersions(before, {
      ...before,
      fields: [
        { slug: "title", name: "Headline", type: "text" as const, required: true, config: {} },
      ],
    });
    expect(diffs.some((d) => d.kind === "changed" && d.path === "fields.title")).toBe(true);
  });
});
