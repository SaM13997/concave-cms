export function extractBodyHtml(data: unknown): string | null {
  if (!data || typeof data !== "object") {
    return null;
  }

  const record = data as Record<string, unknown>;
  const body = record.body;

  if (typeof body === "string") {
    return body;
  }

  if (body && typeof body === "object" && "html" in body && typeof body.html === "string") {
    return body.html;
  }

  return null;
}
