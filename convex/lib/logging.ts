export type LogLevel = "info" | "warn" | "error";

export function createCorrelationId(): string {
  const timePart = Date.now().toString(36);
  const randomPart = Math.random().toString(36).slice(2, 10);
  return `corr_${timePart}_${randomPart}`;
}

export function logStructured(
  level: LogLevel,
  message: string,
  context: Record<string, unknown> = {},
): void {
  const payload = {
    level,
    message,
    timestamp: Date.now(),
    ...context,
  };

  if (level === "error") {
    console.error(JSON.stringify(payload));
    return;
  }

  if (level === "warn") {
    console.warn(JSON.stringify(payload));
    return;
  }

  console.log(JSON.stringify(payload));
}
