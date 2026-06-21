import { describe, expect, it } from "vitest";
import {
  assertSchemaInvariants,
  validateReferentialIntegrity,
  validateSchemaDescriptor,
} from "./schemaInvariants";

describe("validateSchemaDescriptor", () => {
  it("accepts a valid draft schema", () => {
    const errors = validateSchemaDescriptor({
      slug: "blog-post",
      name: "Blog Post",
      fields: [{ slug: "title", name: "Title", type: "text", required: true, config: {} }],
      status: "draft",
    });
    expect(errors).toEqual([]);
  });

  it("rejects empty slug with FIELD_REQUIRED", () => {
    const errors = validateSchemaDescriptor({
      slug: "",
      name: "Blog",
      fields: [],
      status: "draft",
    });
    expect(errors.some((e) => e.code === "FIELD_REQUIRED" && e.field === "slug")).toBe(true);
  });

  it("rejects invalid slug format", () => {
    const errors = validateSchemaDescriptor({
      slug: "Blog-Post",
      name: "Blog",
      fields: [],
      status: "draft",
    });
    expect(errors.some((e) => e.code === "DUPLICATE_SLUG" && e.field === "slug")).toBe(true);
  });

  it("requires fields for active schemas", () => {
    const errors = validateSchemaDescriptor({
      slug: "blog",
      name: "Blog",
      fields: [],
      status: "active",
    });
    expect(errors.some((e) => e.code === "FIELD_REQUIRED" && e.field === "fields")).toBe(true);
  });

  it("rejects duplicate field slugs with DUPLICATE_SLUG", () => {
    const errors = validateSchemaDescriptor({
      slug: "blog",
      name: "Blog",
      fields: [
        { slug: "title", name: "Title", type: "text", required: true, config: {} },
        { slug: "title", name: "Title 2", type: "text", required: false, config: {} },
      ],
      status: "draft",
    });
    expect(errors.some((e) => e.code === "DUPLICATE_SLUG")).toBe(true);
  });

  it("rejects invalid field type with INVALID_TYPE", () => {
    const errors = validateSchemaDescriptor({
      slug: "blog",
      name: "Blog",
      fields: [
        {
          slug: "bad",
          name: "Bad",
          type: "unknown" as "text",
          required: false,
          config: {},
        },
      ],
      status: "draft",
    });
    expect(errors.some((e) => e.code === "INVALID_TYPE")).toBe(true);
  });

  it("requires reference target for reference fields", () => {
    const errors = validateSchemaDescriptor({
      slug: "blog",
      name: "Blog",
      fields: [{ slug: "author", name: "Author", type: "reference", required: true, config: {} }],
      status: "draft",
    });
    expect(errors.some((e) => e.code === "REFERENCE_TARGET_MISSING")).toBe(true);
  });

  it("rejects reference to unknown active schema", () => {
    const errors = validateSchemaDescriptor(
      {
        slug: "blog",
        name: "Blog",
        fields: [
          {
            slug: "author",
            name: "Author",
            type: "reference",
            required: true,
            config: { referenceTo: "author-profile" },
          },
        ],
        status: "draft",
      },
      ["post"],
    );
    expect(errors.some((e) => e.code === "REFERENCE_TARGET_MISSING")).toBe(true);
  });

  it("accepts reference to known active schema", () => {
    const errors = validateSchemaDescriptor(
      {
        slug: "blog",
        name: "Blog",
        fields: [
          {
            slug: "author",
            name: "Author",
            type: "reference",
            required: true,
            config: { referenceTo: "author-profile" },
          },
        ],
        status: "draft",
      },
      ["author-profile"],
    );
    expect(errors).toEqual([]);
  });
});

describe("assertSchemaInvariants", () => {
  it("throws with combined messages when invalid", () => {
    expect(() =>
      assertSchemaInvariants({
        slug: "",
        name: "",
        fields: [],
        status: "active",
      }),
    ).toThrow(/Schema slug is required/);
  });
});

describe("validateReferentialIntegrity", () => {
  it("returns null when target exists", () => {
    expect(validateReferentialIntegrity("post", ["post", "page"])).toBeNull();
  });

  it("returns error when target missing", () => {
    const error = validateReferentialIntegrity("missing", ["post"]);
    expect(error?.code).toBe("REFERENCE_TARGET_MISSING");
  });
});
