#!/usr/bin/env node
/**
 * Self-hosted backup script.
 *
 * Usage:
 *   CONVEX_URL=https://... CONVEX_DEPLOY_KEY=... node scripts/backup.mjs [output-dir]
 *
 * Writes schema + content snapshot JSON files with timestamps.
 */

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

const convexUrl = process.env.CONVEX_URL;
const deployKey = process.env.CONVEX_DEPLOY_KEY;
const outputDir = process.argv[2] ?? "backups";

if (!convexUrl) {
  console.error("CONVEX_URL is required");
  process.exit(1);
}

if (!deployKey) {
  console.error("CONVEX_DEPLOY_KEY is required for authenticated export");
  process.exit(1);
}

const client = new ConvexHttpClient(convexUrl);
client.setAdminAuth(deployKey);

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const targetDir = join(outputDir, timestamp);

await mkdir(targetDir, { recursive: true });

const snapshot = await client.query(api.exports.exportFullSnapshot, {});
const snapshotPath = join(targetDir, "full-snapshot.json");
await writeFile(snapshotPath, JSON.stringify(snapshot, null, 2), "utf8");

const manifest = {
  createdAt: new Date().toISOString(),
  convexUrl,
  schemaCount: snapshot.schemas.length,
  contentEntryCount: snapshot.contentEntries.length,
  files: ["full-snapshot.json"],
};

await writeFile(join(targetDir, "manifest.json"), JSON.stringify(manifest, null, 2), "utf8");

console.log(`Backup written to ${targetDir}`);
console.log(
  JSON.stringify({
    schemas: snapshot.schemas.length,
    contentEntries: snapshot.contentEntries.length,
  }),
);
