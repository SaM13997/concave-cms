export type SearchResultGroup = "content" | "schema" | "media";

export type SearchResult = {
  id: string;
  group: SearchResultGroup;
  title: string;
  subtitle?: string;
  href: string;
};

/**
 * BLOCKER(BE-007): Replace with global search API (RBAC-filtered, ranked).
 */
export const mockSearchResults: SearchResult[] = [
  {
    id: "content-post-hello",
    group: "content",
    title: "Hello World",
    subtitle: "Post · Draft",
    href: "/content/post/hello-world",
  },
  {
    id: "content-post-launch",
    group: "content",
    title: "Launch announcement",
    subtitle: "Post · Published",
    href: "/content/post/launch-announcement",
  },
  {
    id: "content-page-about",
    group: "content",
    title: "About us",
    subtitle: "Page · Published",
    href: "/content/page/about-us",
  },
  {
    id: "schema-post",
    group: "schema",
    title: "Post",
    subtitle: "Table · 6 fields",
    href: "/schema/post",
  },
  {
    id: "schema-page",
    group: "schema",
    title: "Page",
    subtitle: "Table · 4 fields",
    href: "/schema/page",
  },
  {
    id: "schema-author",
    group: "schema",
    title: "Author",
    subtitle: "Table · 3 fields",
    href: "/schema/author",
  },
  {
    id: "media-hero",
    group: "media",
    title: "hero-banner.jpg",
    subtitle: "Image · 1920×1080",
    href: "/media?asset=hero-banner",
  },
  {
    id: "media-logo",
    group: "media",
    title: "logo-dark.svg",
    subtitle: "Vector",
    href: "/media?asset=logo-dark",
  },
  {
    id: "media-team",
    group: "media",
    title: "team-photo.png",
    subtitle: "Image · 800×600",
    href: "/media?asset=team-photo",
  },
];

const groupLabels: Record<SearchResultGroup, string> = {
  content: "Content",
  schema: "Schema",
  media: "Media",
};

export function getSearchGroupLabel(group: SearchResultGroup): string {
  return groupLabels[group];
}

export function filterMockSearch(query: string): SearchResult[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) {
    return mockSearchResults;
  }

  return mockSearchResults.filter((result) => {
    const haystack = [result.title, result.subtitle, result.group].filter(Boolean).join(" ");
    return haystack.toLowerCase().includes(trimmed);
  });
}

export function groupSearchResults(
  results: SearchResult[],
): Record<SearchResultGroup, SearchResult[]> {
  return results.reduce(
    (groups, result) => {
      groups[result.group].push(result);
      return groups;
    },
    {
      content: [] as SearchResult[],
      schema: [] as SearchResult[],
      media: [] as SearchResult[],
    },
  );
}
