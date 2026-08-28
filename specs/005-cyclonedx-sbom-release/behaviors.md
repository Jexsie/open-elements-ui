# Behaviors: CycloneDX SBOM for releases

## SBOM generation

### Runtime SBOM describes the published package

- **Given** the repository is checked out at a version `X.Y.Z` with dependencies installed
- **When** `pnpm run sbom` is executed
- **Then** `sbom/sbom.cdx.json` exists, is valid CycloneDX 1.7, and its `metadata.component` has
  `name` `ui`, `group` `@open-elements`, `version` `X.Y.Z`, and `type` `library`

### Supplier metadata identifies the accountable party

- **Given** SBOM generation has run
- **When** either generated document is inspected
- **Then** `metadata.supplier.name` is `Open Elements GmbH`

### Dev SBOM covers the build toolchain

- **Given** the repository has both `dependencies` and `devDependencies`
- **When** `pnpm run sbom` is executed
- **Then** `sbom/sbom-dev.cdx.json` contains components for the build toolchain (e.g. `typescript`,
  `vitest`, `eslint`) that are absent from `sbom/sbom.cdx.json`

### Peer dependencies are added to the runtime SBOM

- **Given** `package.json` declares `radix-ui`, `@base-ui/react` and `lucide-react` as `peerDependencies`,
  and `pnpm sbom --prod` alone would omit them entirely
- **When** the runtime SBOM is generated
- **Then** each of them is present as a component with the exact version resolved in this repository's
  lockfile, carries a `cdx:npm:peer` property holding the declared range, and has a `dependsOn` edge from
  the root component

### A peer already present transitively is not duplicated

- **Given** `react` is declared as a `peerDependency` and also appears as a transitive dependency of
  `react-day-picker`
- **When** the runtime SBOM is generated
- **Then** `react` appears exactly once, gains the `cdx:npm:peer` property, and gains a `dependsOn` edge
  from the root component

### A peer's transitive subtree is not expanded

- **Given** `radix-ui` is added as a peer component
- **When** the runtime SBOM is generated
- **Then** the dependencies of `radix-ui` itself are not added as components, because the consumer's
  resolution is unknown

### Components are emitted in a stable order

- **Given** an unchanged checkout
- **When** `pnpm run sbom` is executed twice
- **Then** the `components` array of each document is ordered identically in both runs, sorted by
  `bom-ref`

### Generated documents stay out of the npm tarball

- **Given** `package.json` declares `files: ["dist", "src"]`
- **When** `pnpm run sbom` is executed and the package is packed
- **Then** the SBOM files are written to `sbom/` and no `*.cdx.json` file is contained in the tarball

## Verification — accepted documents

### A correct pair passes verification

- **Given** both SBOM documents have been generated from the current dependency tree
- **When** `pnpm run sbom:verify` is executed
- **Then** it exits with code `0` and reports both documents as valid

### Root edges match the declared dependencies exactly

- **Given** `package.json` declares 11 `dependencies` and 5 `peerDependencies`
- **When** the runtime SBOM is verified
- **Then** the root component has exactly 16 `dependsOn` edges — one per declared dependency and peer,
  with no extra direct edges

## Verification — rejected documents

### A missing document fails

- **Given** `sbom/sbom.cdx.json` does not exist
- **When** `pnpm run sbom:verify` is executed
- **Then** it exits non-zero and names the missing file

### A malformed document fails

- **Given** `sbom/sbom-dev.cdx.json` contains invalid JSON
- **When** verification runs
- **Then** it exits non-zero and reports a parse failure for that file

### A schema-invalid document fails

- **Given** a document that parses as JSON but violates the CycloneDX 1.7 schema
- **When** verification runs
- **Then** it exits non-zero and reports the schema violation

### A version mismatch fails

- **Given** the SBOM was generated before `package.json` was bumped from `0.9.0` to `0.10.0`
- **When** verification runs
- **Then** it exits non-zero and reports that `metadata.component.version` does not match the version in
  `package.json`

### A missing supplier fails

- **Given** a document whose `metadata.supplier` is absent
- **When** verification runs
- **Then** it exits non-zero and reports the missing supplier

### A newly added dependency that is not in the SBOM fails

- **Given** a new runtime dependency was added to `package.json` without regenerating the SBOM
- **When** verification runs
- **Then** it exits non-zero and names the dependency that is missing from the root's `dependsOn` edges

### A removed dependency still in the SBOM fails

- **Given** a runtime dependency was removed from `package.json` without regenerating the SBOM
- **When** verification runs
- **Then** it exits non-zero and names the extra `dependsOn` edge

### A peer missing from the runtime SBOM fails

- **Given** the enrichment step did not add `lucide-react` to the runtime SBOM
- **When** verification runs
- **Then** it exits non-zero and names the peer that is missing

### A peer without the marker property fails

- **Given** `radix-ui` is present in the runtime SBOM but carries no `cdx:npm:peer` property
- **When** verification runs
- **Then** it exits non-zero, because a reader could not distinguish it from a resolved dependency

### A peer that is not a devDependency fails with an explicit message

- **Given** `package.json` declares a `peerDependency` that is not also a `devDependency`, so no version
  can be resolved for it
- **When** SBOM generation or verification runs
- **Then** it exits non-zero and states that every `peerDependency` must also be declared as a
  `devDependency` so its version can be resolved

### A dev SBOM missing a devDependency fails

- **Given** a devDependency was added without regenerating the SBOM
- **When** verification runs
- **Then** it exits non-zero and names the devDependency missing from the dev SBOM's root edges

## CI integration

### Pull requests verify the SBOM

- **Given** a pull request against `main`
- **When** the CI workflow runs
- **Then** it generates both SBOMs and runs verification as a dedicated step

### A broken SBOM turns the pull request red

- **Given** a pull request that adds a dependency in a way that breaks SBOM verification
- **When** CI runs
- **Then** the workflow fails and the pull request is not mergeable on a green build

### The local test loop is unaffected

- **Given** a developer runs `pnpm test` locally
- **When** the test suite executes
- **Then** no SBOM is generated and no `pnpm sbom` subprocess is started

## Release flow

### The SBOM is produced before anything is published

- **Given** a tag `vX.Y.Z` is pushed
- **When** the release workflow runs
- **Then** SBOM generation and verification complete successfully before `pnpm stage publish` is invoked

### A failing SBOM aborts the release before publishing

- **Given** SBOM verification fails during a release run
- **When** the workflow reaches that step
- **Then** the job fails, `pnpm stage publish` is never executed, no version enters the npm staging queue,
  and no GitHub release is created

### Both documents are attached to the draft release

- **Given** a successful release run
- **When** the draft GitHub release is created
- **Then** `sbom.cdx.json` and `sbom-dev.cdx.json` are attached as release assets and are downloadable
  once a maintainer publishes the release

### The runtime document is identifiable as the authoritative one

- **Given** a published release page with both assets
- **When** an auditor looks for the SBOM to answer a supplier assessment
- **Then** the release notes state that `sbom.cdx.json` is the authoritative document and
  `sbom-dev.cdx.json` covers the build toolchain only

## Edge cases

### A patch release without dependency changes still gets a fresh SBOM

- **Given** version `0.10.1` changes only source code, with an unchanged dependency tree
- **When** the release runs
- **Then** both SBOMs are regenerated and their `metadata.component.version` is `0.10.1`

### Two runs of an unchanged checkout are content-stable

- **Given** an unchanged checkout
- **When** `pnpm run sbom` is executed twice
- **Then** the two runs differ only in `serialNumber` and `metadata.timestamp`, while the component set,
  their versions, and the dependency edges are identical

### A library without peer dependencies generates cleanly

- **Given** a TypeScript/pnpm library that declares no `peerDependencies`
- **When** the same scripts are applied to it
- **Then** generation and verification succeed and the enrichment step is a no-op, so the pattern
  transfers to other libraries unchanged
