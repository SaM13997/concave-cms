#!/usr/bin/env node
/**
 * Restore Convex deployment data from an export directory.
 * WARNING: Overwrites data in the target deployment.
 *
 * Usage: node scripts/restore-import.mjs <export-dir>
 */
import { execSync } from "node:child_process";
import { existsSync } from "node:fs";

const inputDir = process.argv[2];
if (!inputDir || !existsSync(inputDir)) {
  console.error("Usage: node scripts/restore-import.mjs <export-dir>");
  process.exit(1);
}

console.log(`Restoring Convex snapshot from ${inputDir}...`);
execSync(`npx convex import --path "${inputDir}"`, { stdio: "inherit" });
console.log("Restore complete. Run smoke tests against the deployment.");
