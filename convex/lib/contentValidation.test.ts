import { describe, expect, it } from "vitest";
import type { Id } from "../_generated/dataModel";
import { assertEntryData, isRichTextValue, validateEntryData } from "./contentValidation";
import type { SchemaField } from "./schemaTypes";

const authorId = "author123" as Id<"contentEntries">;
const mediaId = "media456" as Id<"mediaAssets">;

const blogFields: SchemaField[] = [
  { slug: "body", name: "Body", type: "richtext", required: true, config: {} },
  {
    slug: "author",
    name: "Author",
    type: "reference",
    required: false,
    config: { referenceTo: "author" },
  },
  { slug: "cover", name: "Cover", type: "image", required: false, config: {} },
  { slug: "published", name: "Published", type: "boolean", required: false, config: {} },
];

const authorFields: SchemaField[] = [
  { slug: "bio", name: "Bio", type: "text", required: false, config: {} },
];

function mockOptions(overrides?: { references?: Set<string>; media?: Set<string> }) {
  const refs = overrides?.references ?? new Set([authorId]);
  const media = overrides?.media ?? new Set([mediaId]);

  return {
    referenceExists: (entryId: Id<"contentEntries">, targetType: string) =>
      targetType === "author" && refs.has(entryId),
    mediaExists: (assetId: Id<"mediaAssets">) => media.has(assetId),
  };
}

describe("isRichTextValue", () => {
  it("accepts valid rich text objects", () => {
    expect(isRichTextValue({ format: "html", html: "<p>Hi</p>" })).toBe(true);
  });

  it("rejects invalid values", () => {
    expect(isRichTextValue("plain text")).toBe(false);
    expect(isRichTextValue({ format: "markdown", html: "" })).toBe(false);
  });
});

describe("validateEntryData", () => {
  it("accepts valid entry with richtext, reference, and image", () => {
    const errors = validateEntryData(
      blogFields,
      {
        body: { format: "html", html: "<p>Hello world</p>" },
        author: authorId,
        cover: mediaId,
        published: true,
      },
      mockOptions(),
    );
    expect(errors).toEqual([]);
  });

  it("rejects missing required richtext field", () => {
    const errors = validateEntryData(blogFields, {}, mockOptions());
    expect(errors.some((e) => e.code === "FIELD_REQUIRED" && e.field === "body")).toBe(true);
  });

  it("rejects invalid reference target", () => {
    const errors = validateEntryData(
      blogFields,
      {
        body: { format: "html", html: "<p>Hi</p>" },
        author: "missing" as Id<"contentEntries">,
      },
      mockOptions({ references: new Set() }),
    );
    expect(errors.some((e) => e.code === "REFERENCE_NOT_FOUND")).toBe(true);
  });

  it("rejects reference with wrong content type", () => {
    const errors = validateEntryData(
      blogFields,
      {
        body: { format: "html", html: "<p>Hi</p>" },
        author: authorId,
      },
      {
        referenceExists: (_id, targetType) => targetType === "blog",
        mediaExists: () => true,
      },
    );
    expect(errors.some((e) => e.code === "REFERENCE_NOT_FOUND")).toBe(true);
  });

  it("rejects unknown fields not in schema", () => {
    const errors = validateEntryData(authorFields, { bio: "Hello", extra: "nope" }, mockOptions());
    expect(errors.some((e) => e.code === "UNKNOWN_FIELD" && e.field === "extra")).toBe(true);
  });

  it("rejects invalid media asset", () => {
    const errors = validateEntryData(
      blogFields,
      {
        body: { format: "html", html: "<p>Hi</p>" },
        cover: "bad" as Id<"mediaAssets">,
      },
      mockOptions({ media: new Set() }),
    );
    expect(errors.some((e) => e.code === "MEDIA_NOT_FOUND")).toBe(true);
  });

  it("validates select options", () => {
    const fields: SchemaField[] = [
      {
        slug: "status",
        name: "Status",
        type: "select",
        required: true,
        config: { options: ["draft", "published"] },
      },
    ];
    const valid = validateEntryData(fields, { status: "draft" }, mockOptions());
    expect(valid).toEqual([]);

    const invalid = validateEntryData(fields, { status: "archived" }, mockOptions());
    expect(invalid.some((e) => e.code === "INVALID_OPTION")).toBe(true);
  });
});

describe("assertEntryData", () => {
  it("throws with combined error messages", () => {
    expect(() => assertEntryData(blogFields, {}, mockOptions())).toThrow(/Body.*required/i);
  });

  it("passes for valid multi-type CRUD data", () => {
    expect(() =>
      assertEntryData(
        blogFields,
        {
          body: { format: "html", html: "<h1>Post</h1>" },
          author: authorId,
          cover: mediaId,
        },
        mockOptions(),
      ),
    ).not.toThrow();
  });
});

describe("integration: CRUD validation across content types", () => {
  it("author type accepts text bio", () => {
    const errors = validateEntryData(authorFields, { bio: "Writer" }, mockOptions());
    expect(errors).toEqual([]);
  });

  it("blog type requires body when creating", () => {
    const errors = validateEntryData(blogFields, { author: authorId }, mockOptions());
    expect(errors.some((e) => e.field === "body")).toBe(true);
  });

  it("optional reference can be omitted on create", () => {
    const errors = validateEntryData(
      blogFields,
      { body: { format: "html", html: "<p>Solo post</p>" } },
      mockOptions(),
    );
    expect(errors).toEqual([]);
  });
});
