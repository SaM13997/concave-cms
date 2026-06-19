export type FieldType = "text" | "textarea" | "richText" | "image" | "reference";

export type SchemaField = {
  id: string;
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  referenceType?: string;
  placeholder?: string;
};

export type ContentType = {
  slug: string;
  name: string;
  description: string;
  entryCount: number;
  fields: SchemaField[];
};

export type EntryStatus = "published" | "draft" | "published_with_draft";

export type ContentEntry = {
  id: string;
  typeSlug: string;
  title: string;
  status: EntryStatus;
  updatedAt: string;
  publishedAt?: string;
  values: Record<string, string>;
};

export type HistoryEvent = {
  id: string;
  timestamp: string;
  action: "created" | "updated" | "published" | "reverted";
  userName: string;
  summary: string;
  version: number;
};

export type PresenceUser = {
  id: string;
  name: string;
  initials: string;
  color: string;
};

export const contentTypes: ContentType[] = [
  {
    slug: "blog-post",
    name: "Blog Post",
    description: "Long-form articles with rich text and cover images",
    entryCount: 4,
    fields: [
      { id: "title", name: "title", label: "Title", type: "text", required: true },
      { id: "slug", name: "slug", label: "Slug", type: "text", required: true },
      {
        id: "excerpt",
        name: "excerpt",
        label: "Excerpt",
        type: "textarea",
        placeholder: "Short summary for listings",
      },
      { id: "body", name: "body", label: "Body", type: "richText", required: true },
      { id: "coverImage", name: "coverImage", label: "Cover image", type: "image" },
      {
        id: "author",
        name: "author",
        label: "Author",
        type: "reference",
        referenceType: "author",
      },
    ],
  },
  {
    slug: "page",
    name: "Page",
    description: "Static marketing and landing pages",
    entryCount: 2,
    fields: [
      { id: "title", name: "title", label: "Title", type: "text", required: true },
      { id: "slug", name: "slug", label: "Slug", type: "text", required: true },
      { id: "content", name: "content", label: "Content", type: "richText", required: true },
      { id: "heroImage", name: "heroImage", label: "Hero image", type: "image" },
    ],
  },
  {
    slug: "author",
    name: "Author",
    description: "Contributor profiles referenced by blog posts",
    entryCount: 2,
    fields: [
      { id: "name", name: "name", label: "Name", type: "text", required: true },
      { id: "bio", name: "bio", label: "Bio", type: "textarea" },
      { id: "avatar", name: "avatar", label: "Avatar", type: "image" },
    ],
  },
];

export const contentEntries: ContentEntry[] = [
  {
    id: "post-1",
    typeSlug: "blog-post",
    title: "Getting started with Concave",
    status: "published",
    updatedAt: "2026-06-15T14:30:00Z",
    publishedAt: "2026-06-10T09:00:00Z",
    values: {
      title: "Getting started with Concave",
      slug: "getting-started-with-concave",
      excerpt: "A quick tour of the Convex-native CMS workflow.",
      body: "<p>Concave connects your schema directly to Convex.</p>",
      coverImage: "media/hero-concave.jpg",
      author: "author-1",
    },
  },
  {
    id: "post-2",
    typeSlug: "blog-post",
    title: "Draft vs published content",
    status: "published_with_draft",
    updatedAt: "2026-06-17T11:20:00Z",
    publishedAt: "2026-06-12T16:45:00Z",
    values: {
      title: "Draft vs published content",
      slug: "draft-vs-published",
      excerpt: "How shadow drafting keeps production safe.",
      body: "<p>Unpublished edits stay in draft until you publish.</p>",
      coverImage: "media/draft-flow.png",
      author: "author-2",
    },
  },
  {
    id: "post-3",
    typeSlug: "blog-post",
    title: "Preview URLs explained",
    status: "draft",
    updatedAt: "2026-06-18T08:05:00Z",
    values: {
      title: "Preview URLs explained",
      slug: "preview-urls-explained",
      excerpt: "Share draft previews with stakeholders.",
      body: "<p>Preview tokens let marketers review before launch.</p>",
      author: "author-1",
    },
  },
  {
    id: "post-4",
    typeSlug: "blog-post",
    title: "Reactive content on the edge",
    status: "published",
    updatedAt: "2026-06-14T19:10:00Z",
    publishedAt: "2026-06-14T19:10:00Z",
    values: {
      title: "Reactive content on the edge",
      slug: "reactive-content-edge",
      excerpt: "Subscriptions propagate CMS changes instantly.",
      body: "<p>No sync jobs. No stale APIs.</p>",
      coverImage: "media/reactive.jpg",
      author: "author-2",
    },
  },
  {
    id: "page-1",
    typeSlug: "page",
    title: "Home",
    status: "published",
    updatedAt: "2026-06-08T12:00:00Z",
    publishedAt: "2026-06-01T10:00:00Z",
    values: {
      title: "Home",
      slug: "home",
      content: "<p>Welcome to Concave CMS.</p>",
      heroImage: "media/home-hero.jpg",
    },
  },
  {
    id: "page-2",
    typeSlug: "page",
    title: "Pricing (draft)",
    status: "draft",
    updatedAt: "2026-06-16T15:40:00Z",
    values: {
      title: "Pricing (draft)",
      slug: "pricing",
      content: "<p>Coming soon pricing tiers.</p>",
    },
  },
  {
    id: "author-1",
    typeSlug: "author",
    title: "Alex Rivera",
    status: "published",
    updatedAt: "2026-05-20T10:00:00Z",
    publishedAt: "2026-05-20T10:00:00Z",
    values: {
      name: "Alex Rivera",
      bio: "Product marketer and CMS power user.",
      avatar: "media/alex.jpg",
    },
  },
  {
    id: "author-2",
    typeSlug: "author",
    title: "Sam Chen",
    status: "published",
    updatedAt: "2026-05-22T10:00:00Z",
    publishedAt: "2026-05-22T10:00:00Z",
    values: {
      name: "Sam Chen",
      bio: "Developer advocate for Convex-native apps.",
      avatar: "media/sam.jpg",
    },
  },
];

const historyByEntry: Record<string, HistoryEvent[]> = {
  "post-1": [
    {
      id: "h1",
      timestamp: "2026-06-10T09:00:00Z",
      action: "published",
      userName: "Alex Rivera",
      summary: "Published initial version",
      version: 3,
    },
    {
      id: "h2",
      timestamp: "2026-06-09T16:20:00Z",
      action: "updated",
      userName: "Alex Rivera",
      summary: "Edited body copy",
      version: 2,
    },
    {
      id: "h3",
      timestamp: "2026-06-08T11:00:00Z",
      action: "created",
      userName: "Sam Chen",
      summary: "Created entry",
      version: 1,
    },
  ],
  "post-2": [
    {
      id: "h4",
      timestamp: "2026-06-17T11:20:00Z",
      action: "updated",
      userName: "Sam Chen",
      summary: "Saved draft changes to excerpt",
      version: 5,
    },
    {
      id: "h5",
      timestamp: "2026-06-12T16:45:00Z",
      action: "published",
      userName: "Alex Rivera",
      summary: "Published version 4",
      version: 4,
    },
  ],
  "post-3": [
    {
      id: "h6",
      timestamp: "2026-06-18T08:05:00Z",
      action: "created",
      userName: "Alex Rivera",
      summary: "Created draft entry",
      version: 1,
    },
  ],
};

const presenceByEntry: Record<string, PresenceUser[]> = {
  "post-2": [
    { id: "u1", name: "Sam Chen", initials: "SC", color: "bg-emerald-500" },
    { id: "u2", name: "Alex Rivera", initials: "AR", color: "bg-violet-500" },
  ],
  "post-3": [{ id: "u1", name: "Sam Chen", initials: "SC", color: "bg-emerald-500" }],
};

export function getContentTypes(): ContentType[] {
  return contentTypes;
}

export function getContentType(slug: string): ContentType | undefined {
  return contentTypes.find((type) => type.slug === slug);
}

export function getEntriesForType(typeSlug: string): ContentEntry[] {
  return contentEntries.filter((entry) => entry.typeSlug === typeSlug);
}

export function getEntry(typeSlug: string, entryId: string): ContentEntry | undefined {
  return contentEntries.find((entry) => entry.typeSlug === typeSlug && entry.id === entryId);
}

export function getHistoryForEntry(entryId: string): HistoryEvent[] {
  return (
    historyByEntry[entryId] ?? [
      {
        id: "default",
        timestamp: new Date().toISOString(),
        action: "created",
        userName: "You",
        summary: "Entry created (mock)",
        version: 1,
      },
    ]
  );
}

export function getPresenceForEntry(entryId: string): PresenceUser[] {
  return presenceByEntry[entryId] ?? [];
}

export function getMockPreviewUrl(typeSlug: string, entryId: string): string {
  return `https://preview.concave.local/${typeSlug}/${entryId}?token=mock_preview_${entryId}`;
}

export function getReferenceOptions(referenceType: string): Array<{ id: string; label: string }> {
  return getEntriesForType(referenceType).map((entry) => ({
    id: entry.id,
    label: entry.title,
  }));
}

export function formatRelativeDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function getStatusLabel(status: EntryStatus): string {
  switch (status) {
    case "published":
      return "Published";
    case "draft":
      return "Draft";
    case "published_with_draft":
      return "Unpublished changes";
  }
}
