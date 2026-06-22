export type SearchResultGroup = "content" | "schema" | "media";

export type SearchResult = {
  id: string;
  group: SearchResultGroup;
  title: string;
  subtitle?: string;
  href: string;
};

const groupLabels: Record<SearchResultGroup, string> = {
  content: "Content",
  schema: "Schema",
  media: "Media",
};

export function getSearchGroupLabel(group: SearchResultGroup): string {
  return groupLabels[group];
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
