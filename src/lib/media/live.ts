import type { Id } from "../../../convex/_generated/dataModel";

export type MediaAssetType = "image" | "video" | "document";

type CmsUserSummary = {
  _id: Id<"cmsUsers">;
  email: string;
  name?: string;
};

const uploadDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export function getMediaAssetType(mimeType: string): MediaAssetType {
  if (mimeType.startsWith("image/")) {
    return "image";
  }

  if (mimeType.startsWith("video/")) {
    return "video";
  }

  return "document";
}

export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) {
    return "Unknown size";
  }
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatUploadDate(value: number | string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }

  return uploadDateFormatter.format(date);
}

export function getMediaUploaderLabel(
  uploadedBy: Id<"cmsUsers">,
  currentUser?: CmsUserSummary | null,
  team?: CmsUserSummary[] | null,
): string {
  if (currentUser && uploadedBy === currentUser._id) {
    return "You";
  }

  const teammate = team?.find((member) => member._id === uploadedBy);
  if (!teammate) {
    return "Team member";
  }

  const displayName = teammate.name?.trim();
  return displayName || teammate.email;
}
