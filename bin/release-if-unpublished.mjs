#!/usr/bin/env node
// Publish the ROOT package iff its version isn't on npm yet.
//
// Why this exists: the publishable package IS the repo root, and the wave-45
// fold's `workspaces` field makes @changesets/cli exclude the monorepo root
// from its package set — `changeset publish` reports "No unpublished projects"
// and ships nothing (filed in METHODOLOGY-AMENDMENTS 2026-06-10). This script
// replaces it for the root package: idempotent (re-runs on every push to main
// are no-ops once the version is live), dependency-free, never throws — the
// exit code is the contract.
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

const { name, version } = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));

let published = "";
try {
  published = execSync(`npm view ${name} version`, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
} catch {
  // package not found = first publish; proceed.
}

if (published === version) {
  console.log(`release: ${name}@${version} already on npm — nothing to do`);
  process.exit(0);
}

console.log(`release: publishing ${name}@${version} (npm has ${published || "nothing"})`);
try {
  execSync("npm publish --access public", { stdio: "inherit" });
} catch {
  process.exit(1);
}

// Tag the release the way changeset publish used to (v<version>); push the tag
// only in CI where the checkout's token can. Soft-fail: a missing tag never
// blocks a successful publish.
try {
  execSync(`git tag v${version}`, { stdio: "inherit" });
  if (process.env.GITHUB_ACTIONS) execSync(`git push origin v${version}`, { stdio: "inherit" });
} catch {
  console.log(`release: published, but tagging v${version} failed — tag manually`);
}
process.exit(0);
