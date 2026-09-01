// Coverage for the file-reading and schema-validation helpers used by verify-sbom.mjs
// (behaviors: a missing / malformed / schema-invalid document fails). No `pnpm sbom` subprocess:
// documents are written to a temp directory as fixtures.

import { afterAll, beforeAll, describe, it, expect } from "vitest";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { readDocument, validateAgainstSchema } from "../sbom-core.mjs";

let dir;

beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), "sbom-io-"));
});

afterAll(() => {
  rmSync(dir, { recursive: true, force: true });
});

describe("readDocument", () => {
  it("names a document that does not exist", () => {
    const path = join(dir, "does-not-exist.cdx.json");
    const { errors, bom } = readDocument(path);
    expect(bom).toBeNull();
    expect(errors[0]).toContain(path);
  });

  it("reports an empty document", () => {
    const path = join(dir, "empty.cdx.json");
    writeFileSync(path, "   \n");
    const { errors, bom } = readDocument(path);
    expect(bom).toBeNull();
    expect(errors[0]).toMatch(/empty/);
  });

  it("reports a parse failure for malformed JSON, naming the file", () => {
    const path = join(dir, "malformed.cdx.json");
    writeFileSync(path, "{ not valid json ");
    const { errors, bom } = readDocument(path);
    expect(bom).toBeNull();
    expect(errors[0]).toContain(path);
    expect(errors[0]).toMatch(/JSON/);
  });

  it("parses a well-formed document", () => {
    const path = join(dir, "ok.cdx.json");
    writeFileSync(path, JSON.stringify({ bomFormat: "CycloneDX", specVersion: "1.7" }));
    const { errors, bom } = readDocument(path);
    expect(errors).toEqual([]);
    expect(bom.bomFormat).toBe("CycloneDX");
  });
});

describe("validateAgainstSchema", () => {
  it("accepts a document that satisfies the CycloneDX 1.7 schema", async () => {
    const valid = {
      bomFormat: "CycloneDX",
      specVersion: "1.7",
      version: 1,
      metadata: { component: { type: "library", name: "ui", version: "1.0.0" } },
      components: [],
    };
    expect(await validateAgainstSchema(valid, "ok.cdx.json")).toBeNull();
  });

  it("rejects a document that violates the schema, naming the file", async () => {
    const invalid = { bomFormat: "NOT-CYCLONEDX", specVersion: "1.7" };
    const error = await validateAgainstSchema(invalid, "bad.cdx.json");
    expect(error).not.toBeNull();
    expect(error).toContain("bad.cdx.json");
    expect(error).toMatch(/CycloneDX 1\.7 schema/);
  });
});
