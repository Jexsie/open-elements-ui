#!/usr/bin/env node
// Verify the two generated SBOM documents. Exits non-zero (naming every failure) if either document
// is missing, malformed, schema-invalid, or inconsistent with package.json. Run in ci.yml on every
// pull request and in release.yml before publishing — never as a Vitest test (see scripts/__tests__,
// which exercise the same core logic against fixtures without a `pnpm sbom` subprocess).

import { execFileSync } from "node:child_process";
import { join } from "node:path";

import { readDocument, validateAgainstSchema, verifyStructure } from "./sbom-core.mjs";

const repoRoot = process.cwd();
const prodPath = join(repoRoot, "sbom", "sbom.cdx.json");
const devPath = join(repoRoot, "sbom", "sbom-dev.cdx.json");

const pkg = JSON.parse(
  execFileSync("node", ["-p", "JSON.stringify(require('./package.json'))"], {
    cwd: repoRoot,
    encoding: "utf8",
  }),
);

const errors = [];

const prodDoc = readDocument(prodPath);
const devDoc = readDocument(devPath);
errors.push(...prodDoc.errors, ...devDoc.errors);

for (const [doc, path] of [
  [prodDoc, prodPath],
  [devDoc, devPath],
]) {
  if (doc.bom) {
    const schemaError = await validateAgainstSchema(doc.bom, path);
    if (schemaError) {
      errors.push(schemaError);
    }
  }
}

// Structural checks only make sense once both documents parsed.
if (prodDoc.bom && devDoc.bom) {
  errors.push(...verifyStructure({ prod: prodDoc.bom, dev: devDoc.bom, pkg }));
}

if (errors.length > 0) {
  console.error(`SBOM verification failed with ${errors.length} problem(s):`);
  for (const error of errors) {
    console.error(`  - ${error}`);
  }
  process.exit(1);
}

console.log("SBOM verification passed: sbom.cdx.json and sbom-dev.cdx.json are valid and consistent.");
