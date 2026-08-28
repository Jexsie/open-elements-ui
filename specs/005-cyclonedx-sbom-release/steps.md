# Implementation Steps: CycloneDX SBOM for releases

Ordered plan derived from `design.md` and `behaviors.md`. Checked off as implemented.

## Findings from probing `pnpm sbom` (11.3.0) — grounding the design

- Output goes to **stdout**; format flag is `--sbom-format cyclonedx` (required). Flags used:
  `--prod` / `--dev`, `--sbom-spec-version 1.7` (default), `--sbom-supplier`, `--sbom-authors`,
  `--sbom-type library`.
- Runtime (`--prod`) root has 11 `dependsOn` edges; `radix-ui`, `@base-ui/react`, `lucide-react`
  are absent entirely. `react`/`react-dom` appear only transitively (via `@tiptap/react`) at `19.2.5`.
- The **dev** SBOM root has exactly one direct edge per peer with the exact resolved version
  (`react`/`react-dom` `19.2.5`, `radix-ui` `1.4.3`, `@base-ui/react` `1.4.1`, `lucide-react` `0.500.0`).
  This is the authoritative source for peer versions, per the design.
- `@cyclonedx/cyclonedx-library` 10.2.0 validates CycloneDX **1.7** (resolves the design's open
  question), but its `JsonValidator` needs optional peers `ajv`, `ajv-formats`, `ajv-formats-draft2019`.
  Both real documents validate clean. These validator deps run only in `ci.yml` (no publish rights).

## Steps

1. [ ] Add devDependencies: `@cyclonedx/cyclonedx-library`, `ajv`, `ajv-formats`,
   `ajv-formats-draft2019` (validator + its required optional peers). *(done during probing)*
2. [ ] `.gitignore`: add `sbom/`.
3. [ ] `scripts/sbom-core.mjs` — pure, unit-testable core:
   - `fullName(component)` — package identity (`group/name` or `name`).
   - `enrichWithPeers(prodBom, devBom, pkg)` — add each `peerDependency` to the runtime doc using the
     dev-resolved version; dedupe by package identity so a transitively-present peer appears once; attach
     a `cdx:npm:peer` property with the declared range; add a root `dependsOn` edge; never expand the
     peer's subtree; throw if a peer is not a devDependency.
   - `sortBom(bom)` — sort `components` by `bom-ref` (+ `dependsOn`/`dependencies` for content stability).
   - `verifyStructure({prod, dev, pkg})` — returns `string[]` of violations: version match, supplier,
     runtime root edges == `dependencies` ∪ `peerDependencies` (exact), each peer present with exact
     version + marker property, each peer is a devDependency, dev root edges == `dependencies` ∪
     `devDependencies`.
   - File/schema helpers: `readDocument(path)`, `validateAgainstSchema(bom)`.
   - Constants: `SUPPLIER_NAME`, `SPEC_VERSION`.
4. [ ] `scripts/generate-sbom.mjs` — run `pnpm sbom` twice (prod/dev) via `execFileSync`, enrich prod
   with peers, `sortBom` both, write `sbom/sbom.cdx.json` and `sbom/sbom-dev.cdx.json`.
5. [ ] `scripts/verify-sbom.mjs` — read both files (exist/non-empty/parse, naming the file), schema-
   validate against 1.7, run `verifyStructure`; print every violation; exit non-zero on any.
6. [ ] `package.json` scripts: `sbom` (generate) and `sbom:verify` (verify). Not wired into `test`/`build`.
7. [ ] `vitest.config.ts`: include `scripts/**/*.test.mjs` so core tests run without a `pnpm sbom` spawn.
8. [ ] Tests `scripts/__tests__/*.test.mjs` covering every scenario in `behaviors.md` against fixtures
   (no `pnpm sbom` subprocess): enrichment (add/dedupe/no-subtree/stable order), accepted pair, exact
   16 root edges, and every rejection (missing/malformed/schema-invalid/version/supplier/added/removed
   dep/peer missing/peer without marker/peer not devDep/dev missing devDep), plus the no-peers library.
9. [ ] `ci.yml`: dedicated step — `pnpm run sbom` then `pnpm run sbom:verify` on PR and push to `main`.
10. [ ] `release.yml`: generate + verify **before** `pnpm stage publish`; attach both files to the draft
    release via `gh release create ... sbom/sbom.cdx.json sbom/sbom-dev.cdx.json`; note the authoritative
    document in the release body.
11. [ ] `README.md`: document the two SBOMs, that `sbom.cdx.json` is authoritative, the peer-version
    caveat (resolved from *our* lockfile, marked `cdx:npm:peer`), and how to obtain one per version.
12. [ ] Run generate + verify end-to-end; `pnpm test`, `typecheck`, `lint`, `format:check`, `build`.
13. [ ] spec-review + quality-review; iterate; set INDEX status `done`.
