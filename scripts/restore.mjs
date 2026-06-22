#!/usr/bin/env node
/**
 * Self-hosted restore script (content entries).
 *
 * Usage:
 *   CONVEX_URL=https://... CONVEX_DEPLOY_KEY=... node scripts/restore.mjs path/to/full-snapshot.json [--dry-run]
 */

import { readFile } from "node:fs/promises";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

const convexUrl = process.env.CONVEX_URL;
const deployKey = process.env.CONVEX_DEPLOY_KEY;
const snapshotPath = process.argv[2];
const dryRun = process.argv.includes("--dry-run");

if (!convexUrl || !deployKey || !snapshotPath) {
  console.error(
    "Usage: CONVEX_URL=... CONVEX_DEPLOY_KEY=... node scripts/restore.mjs <snapshot.json> [--dry-run]",
  );
  process.exit(1);
}

const raw = await readFile(snapshotPath, "utf8");
const snapshot = JSON.parse(raw) as {
  contentEntries?: Array<Record<string, unknown>>;
};

if (!snapshot.contentEntries) {
  console.error("Snapshot file is missing contentEntries");
  process.exit(1);
}

const client = new ConvexHttpClient(convexUrl);
client.setAdminAuth(deployKey);

const result = await client.mutation(api.exports.restoreContentSnapshot, {
  entries: snapshot.contentEntries,
  dryRun,
});

console.log(JSON.stringify({ ...result, snapshotPath, dryRun }, null, 2));
