#!/usr/bin/env node
/**
 * Backup Convex deployment data to a timestamped directory.
 * Requires: npx convex CLI logged in, CONVEX_DEPLOYMENT or .env.local
 *
 * Usage: node scripts/backup-export.mjs [output-dir]
 */
import { execSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const outputDir = process.argv[2] ?? join("backups", timestamp);

mkdirSync(outputDir, { recursive: true });

console.log(`Exporting Convex snapshot to ${outputDir}...`);
execSync(`npx convex export --path "${outputDir}"`, { stdio: "inherit" });
console.log("Backup complete.");
