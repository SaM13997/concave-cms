export type MediaAssetType = "image" | "video" | "document";

export type MediaAsset = {
  id: string;
  name: string;
  type: MediaAssetType;
  mimeType: string;
  sizeBytes: number;
  width?: number;
  height?: number;
  alt?: string;
  tags: string[];
  uploadedAt: string;
  uploadedBy: string;
  url: string;
};

export const mockMediaAssets: MediaAsset[] = [
  {
    id: "media_001",
    name: "hero-banner.jpg",
    type: "image",
    mimeType: "image/jpeg",
    sizeBytes: 245_760,
    width: 1920,
    height: 1080,
    alt: "Abstract gradient hero banner",
    tags: ["hero", "marketing"],
    uploadedAt: "2026-06-10T14:22:00Z",
    uploadedBy: "Alex Chen",
    url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=300&fit=crop",
  },
  {
    id: "media_002",
    name: "team-photo.png",
    type: "image",
    mimeType: "image/png",
    sizeBytes: 512_000,
    width: 1200,
    height: 800,
    alt: "Team collaborating in office",
    tags: ["team", "about"],
    uploadedAt: "2026-06-08T09:15:00Z",
    uploadedBy: "Jordan Lee",
    url: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&h=300&fit=crop",
  },
  {
    id: "media_003",
    name: "product-demo.mp4",
    type: "video",
    mimeType: "video/mp4",
    sizeBytes: 4_194_304,
    tags: ["product", "demo"],
    uploadedAt: "2026-06-05T16:45:00Z",
    uploadedBy: "Sam Rivera",
    url: "https://images.unsplash.com/photo-1536240478700-b869070f927d?w=400&h=300&fit=crop",
  },
  {
    id: "media_004",
    name: "brand-guidelines.pdf",
    type: "document",
    mimeType: "application/pdf",
    sizeBytes: 1_048_576,
    tags: ["brand", "docs"],
    uploadedAt: "2026-06-01T11:00:00Z",
    uploadedBy: "Alex Chen",
    url: "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=400&h=300&fit=crop",
  },
  {
    id: "media_005",
    name: "blog-cover-winter.jpg",
    type: "image",
    mimeType: "image/jpeg",
    sizeBytes: 189_440,
    width: 1600,
    height: 900,
    alt: "Snowy mountain landscape",
    tags: ["blog", "seasonal"],
    uploadedAt: "2026-05-28T08:30:00Z",
    uploadedBy: "Jordan Lee",
    url: "https://images.unsplash.com/photo-1483728642387-6bc3bdd8c335?w=400&h=300&fit=crop",
  },
  {
    id: "media_006",
    name: "icon-set.svg",
    type: "image",
    mimeType: "image/svg+xml",
    sizeBytes: 12_288,
    tags: ["icons", "ui"],
    uploadedAt: "2026-05-20T13:10:00Z",
    uploadedBy: "Sam Rivera",
    url: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=300&fit=crop",
  },
];

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const monthLabels = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

export function formatUploadDate(isoTimestamp: string): string {
  const date = new Date(isoTimestamp);

  if (Number.isNaN(date.getTime())) {
    return isoTimestamp;
  }

  return `${monthLabels[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()}`;
}

export function filterMediaAssets(
  assets: MediaAsset[],
  query: string,
  typeFilter: MediaAssetType | "all",
): MediaAsset[] {
  const normalizedQuery = query.trim().toLowerCase();

  return assets.filter((asset) => {
    const matchesType = typeFilter === "all" || asset.type === typeFilter;
    if (!matchesType) return false;
    if (!normalizedQuery) return true;

    return (
      asset.name.toLowerCase().includes(normalizedQuery) ||
      asset.tags.some((tag) => tag.toLowerCase().includes(normalizedQuery)) ||
      asset.uploadedBy.toLowerCase().includes(normalizedQuery)
    );
  });
}
