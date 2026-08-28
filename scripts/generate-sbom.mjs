#!/usr/bin/env node
// Generate the two CycloneDX SBOM documents into sbom/ (gitignored, kept out of the npm tarball).
//
//   sbom/sbom.cdx.json      runtime dependencies + enriched peerDependencies  (authoritative)
//   sbom/sbom-dev.cdx.json  dependencies + devDependencies (build toolchain)   (transparency)
//
// Runs `pnpm sbom` twice (the generator is part of the pinned packageManager), enriches the runtime
// document with peers, sorts both for content stability, and writes them.

import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  SUPPLIER_NAME,
  SBOM_AUTHORS,
  SPEC_VERSION,
  enrichWithPeers,
  sortBom,
} from "./sbom-core.mjs";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(repoRoot, "sbom");

function runSbom(scopeFlag) {
  const stdout = execFileSync(
    "pnpm",
    [
      "sbom",
      "--sbom-format",
      "cyclonedx",
      scopeFlag,
      "--sbom-spec-version",
      SPEC_VERSION,
      "--sbom-type",
      "library",
      "--sbom-supplier",
      SUPPLIER_NAME,
      "--sbom-authors",
      SBOM_AUTHORS,
    ],
    { cwd: repoRoot, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
  );
  return JSON.parse(stdout);
}

function writeDocument(name, bom) {
  const path = join(outDir, name);
  writeFileSync(path, `${JSON.stringify(bom, null, 2)}\n`);
  return path;
}

const pkg = JSON.parse(
  execFileSync("node", ["-p", "JSON.stringify(require('./package.json'))"], {
    cwd: repoRoot,
    encoding: "utf8",
  }),
);

mkdirSync(outDir, { recursive: true });

// enrichWithPeers only reads the dev document (peers are structuredClone'd), so one run feeds both.
const dev = runSbom("--dev");
const prod = sortBom(enrichWithPeers(runSbom("--prod"), dev, pkg));
sortBom(dev);

const prodPath = writeDocument("sbom.cdx.json", prod);
const devPath = writeDocument("sbom-dev.cdx.json", dev);

console.log(`Wrote ${prodPath} (${prod.components.length} components, runtime + peers).`);
console.log(`Wrote ${devPath} (${dev.components.length} components, build toolchain).`);
