import { describe, expect, it } from "vitest";
import { exportSchemaArtifact, exportSchemaArtifactBody } from "./schemaExport";

const blogFixture = {
  slug: "blog-post",
  name: "Blog Post",
  descriptorVersion: 1,
  fields: [
    { slug: "body", name: "Body", type: "richtext" as const, required: false, config: {} },
    { slug: "title", name: "Title", type: "text" as const, required: true, config: {} },
  ],
};

const authorFixture = {
  slug: "author",
  name: "Author",
  descriptorVersion: 1,
  fields: [{ slug: "name", name: "Name", type: "text" as const, required: true, config: {} }],
};

describe("exportSchemaArtifact", () => {
  it("produces deterministic output for same input", () => {
    const a = exportSchemaArtifactBody([blogFixture, authorFixture]);
    const b = exportSchemaArtifactBody([authorFixture, blogFixture]);
    expect(a).toEqual(b);
  });

  it("sorts schemas by slug", () => {
    const artifact = exportSchemaArtifactBody([blogFixture, authorFixture]);
    expect(artifact.schemas.map((s) => s.slug)).toEqual(["author", "blog-post"]);
  });

  it("sorts fields by slug within schema", () => {
    const artifact = exportSchemaArtifactBody([blogFixture]);
    expect(artifact.schemas[0].fields.map((f) => f.slug)).toEqual(["body", "title"]);
  });

  it("excludes exportedAt from body comparison", () => {
    const withTime1 = exportSchemaArtifact([blogFixture], "2024-01-01T00:00:00.000Z");
    const withTime2 = exportSchemaArtifact([blogFixture], "2025-06-01T00:00:00.000Z");
    const body1 = exportSchemaArtifactBody([blogFixture]);
    const body2 = exportSchemaArtifactBody([blogFixture]);
    expect(body1).toEqual(body2);
    expect(withTime1.exportedAt).not.toBe(withTime2.exportedAt);
  });

  it("sets formatVersion to 1", () => {
    const artifact = exportSchemaArtifactBody([blogFixture]);
    expect(artifact.formatVersion).toBe(1);
  });
});
