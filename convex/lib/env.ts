export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getPublicUrl() {
  const url = process.env.SITE_URL ?? process.env.BETTER_AUTH_URL;

  if (!url) {
    return "http://localhost:3000";
  }

  return url;
}
