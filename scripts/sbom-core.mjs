// Core logic for CycloneDX SBOM generation and verification.
//
// Everything here is pure and free of `pnpm sbom` subprocesses so it can be unit
// tested against fixtures without the installed store (see scripts/__tests__).
// The thin CLI wrappers generate-sbom.mjs and verify-sbom.mjs supply the I/O.

import { readFileSync } from "node:fs";

/** Component type for the root package and the accountable supplier (CRA supplier assessment). */
export const SUPPLIER_NAME = "Open Elements GmbH";
export const SBOM_AUTHORS = "Open Elements GmbH";
/** CycloneDX spec version. pnpm's default; validated by @cyclonedx/cyclonedx-library. */
export const SPEC_VERSION = "1.7";
/** Marks a component that was added as a peerDependency, holding its declared range. */
export const PEER_PROPERTY = "cdx:npm:peer";

/** Package identity used to match a package.json dependency name against an SBOM component. */
export function fullName(component) {
  return component.group ? `${component.group}/${component.name}` : component.name;
}

function rootDependency(bom) {
  const rootRef = bom.metadata?.component?.["bom-ref"];
  const dep = bom.dependencies?.find((d) => d.ref === rootRef);
  if (!dep) {
    throw new Error("SBOM has no dependency entry for its root component.");
  }
  return dep;
}

/** Direct dependency components of the root (one edge per declared dependency / devDependency). */
function directComponents(bom) {
  const byRef = new Map((bom.components ?? []).map((c) => [c["bom-ref"], c]));
  return rootDependency(bom)
    .dependsOn.map((ref) => byRef.get(ref))
    .filter(Boolean);
}

/**
 * Enrich the runtime SBOM with the library's peerDependencies.
 *
 * `pnpm sbom --prod` omits peers, which makes the runtime document misleading. Each peer is added
 * with the exact version resolved in this repository's lockfile (read from the dev SBOM, where every
 * peer is also a devDependency), deduplicated by package identity so a peer that is already present
 * transitively is not duplicated, marked with a `cdx:npm:peer` property holding the declared range,
 * and linked from the root via a `dependsOn` edge. The peer's own subtree is never expanded, because
 * the consumer's resolution is unknown.
 *
 * Throws if a peerDependency is not also a devDependency: without that, no version can be resolved.
 */
export function enrichWithPeers(prodBom, devBom, pkg) {
  const peers = pkg.peerDependencies ?? {};
  const devDeps = pkg.devDependencies ?? {};

  const notDevDeps = Object.keys(peers).filter((name) => !(name in devDeps));
  if (notDevDeps.length > 0) {
    throw new Error(
      `Every peerDependency must also be declared as a devDependency so its version can be resolved. ` +
        `Missing from devDependencies: ${notDevDeps.join(", ")}.`,
    );
  }

  const rootDep = rootDependency(prodBom);
  const devResolved = directComponents(devBom);
  const prodByName = new Map((prodBom.components ?? []).map((c) => [fullName(c), c]));

  for (const [name, range] of Object.entries(peers)) {
    const resolved = devResolved.find((c) => fullName(c) === name);
    if (!resolved) {
      throw new Error(
        `Cannot resolve a version for peerDependency "${name}": it is not a direct devDependency ` +
          `in the dev SBOM. Install it as a devDependency and regenerate.`,
      );
    }

    let component = prodByName.get(name);
    if (!component) {
      // Add the peer as a component, but never its transitive subtree.
      component = structuredClone(resolved);
      prodBom.components.push(component);
      prodByName.set(name, component);
    }

    component.properties = component.properties ?? [];
    if (!component.properties.some((p) => p.name === PEER_PROPERTY)) {
      component.properties.push({ name: PEER_PROPERTY, value: range });
    }

    if (!rootDep.dependsOn.includes(component["bom-ref"])) {
      rootDep.dependsOn.push(component["bom-ref"]);
    }
  }

  return prodBom;
}

/** Sort a document into a stable order (components by bom-ref) so two runs are content-stable. */
export function sortBom(bom) {
  const byRef = (a, b) => (a["bom-ref"] < b["bom-ref"] ? -1 : a["bom-ref"] > b["bom-ref"] ? 1 : 0);
  bom.components?.sort(byRef);
  for (const dep of bom.dependencies ?? []) {
    dep.dependsOn?.sort();
  }
  bom.dependencies?.sort((a, b) => (a.ref < b.ref ? -1 : a.ref > b.ref ? 1 : 0));
  return bom;
}

/** Names of the components the root directly depends on, as package identities. */
function rootEdgeNames(bom) {
  const byRef = new Map((bom.components ?? []).map((c) => [c["bom-ref"], c]));
  return rootDependency(bom).dependsOn.map((ref) => {
    const component = byRef.get(ref);
    return component ? fullName(component) : ref;
  });
}

function symmetricDiff(actual, expected) {
  const actualSet = new Set(actual);
  const expectedSet = new Set(expected);
  const missing = [...expectedSet].filter((n) => !actualSet.has(n));
  const extra = [...actualSet].filter((n) => !expectedSet.has(n));
  return { missing, extra };
}

/**
 * Structural verification of both documents against package.json. Returns a list of human-readable
 * violations (empty means valid). Schema validation and file I/O are handled by the CLI wrapper.
 */
export function verifyStructure({ prod, dev, pkg }) {
  const errors = [];
  const dependencies = pkg.dependencies ?? {};
  const peerDependencies = pkg.peerDependencies ?? {};
  const devDependencies = pkg.devDependencies ?? {};

  for (const [label, bom] of [
    ["sbom.cdx.json", prod],
    ["sbom-dev.cdx.json", dev],
  ]) {
    const version = bom.metadata?.component?.version;
    if (version !== pkg.version) {
      errors.push(
        `${label}: metadata.component.version "${version}" does not match package.json version "${pkg.version}".`,
      );
    }
    const supplier = bom.metadata?.supplier?.name;
    if (supplier !== SUPPLIER_NAME) {
      errors.push(`${label}: metadata.supplier.name is "${supplier ?? "<missing>"}", expected "${SUPPLIER_NAME}".`);
    }
  }

  // Runtime SBOM: root edges cover every dependency and every peer — no more, no less.
  const runtimeExpected = [...Object.keys(dependencies), ...Object.keys(peerDependencies)];
  const runtime = symmetricDiff(rootEdgeNames(prod), runtimeExpected);
  for (const name of runtime.missing) {
    errors.push(`sbom.cdx.json: root component is missing a dependsOn edge for declared dependency "${name}".`);
  }
  for (const name of runtime.extra) {
    errors.push(`sbom.cdx.json: root component has an extra dependsOn edge for "${name}" not declared in package.json.`);
  }

  // Every peer: also a devDependency, present as a component with an exact version and the marker.
  const prodByName = new Map((prod.components ?? []).map((c) => [fullName(c), c]));
  for (const [name, range] of Object.entries(peerDependencies)) {
    if (!(name in devDependencies)) {
      errors.push(
        `package.json: peerDependency "${name}" must also be a devDependency so its version can be resolved.`,
      );
    }
    const component = prodByName.get(name);
    if (!component) {
      errors.push(`sbom.cdx.json: peerDependency "${name}" (${range}) is missing from the runtime SBOM.`);
      continue;
    }
    if (!component.version) {
      errors.push(`sbom.cdx.json: peer component "${name}" has no resolved version.`);
    }
    if (!component.properties?.some((p) => p.name === PEER_PROPERTY)) {
      errors.push(
        `sbom.cdx.json: peer component "${name}" lacks the ${PEER_PROPERTY} property; a reader could not ` +
          `distinguish it from a resolved dependency.`,
      );
    }
  }

  // Dev SBOM (`pnpm sbom --dev`): root edges cover the devDependencies (the build toolchain).
  // The runtime dependencies are covered authoritatively by the prod document, not here.
  const devDiff = symmetricDiff(rootEdgeNames(dev), Object.keys(devDependencies));
  for (const name of devDiff.missing) {
    errors.push(`sbom-dev.cdx.json: root component is missing a dependsOn edge for "${name}".`);
  }
  for (const name of devDiff.extra) {
    errors.push(`sbom-dev.cdx.json: root component has an extra dependsOn edge for "${name}".`);
  }

  return errors;
}

/**
 * Read and parse a single SBOM document. Returns `{ errors, bom }`; `bom` is null when unreadable,
 * empty, or not JSON, with the file named in each error message.
 */
export function readDocument(path) {
  let text;
  try {
    text = readFileSync(path, "utf8");
  } catch {
    return { errors: [`${path}: file does not exist or is not readable.`], bom: null };
  }
  if (text.trim().length === 0) {
    return { errors: [`${path}: file is empty.`], bom: null };
  }
  try {
    return { errors: [], bom: JSON.parse(text) };
  } catch (err) {
    return { errors: [`${path}: is not valid JSON (${err.message}).`], bom: null };
  }
}

/**
 * Validate a parsed document against the CycloneDX 1.7 JSON schema using the official
 * @cyclonedx/cyclonedx-library. Returns null when valid, otherwise a human-readable error string.
 * The validator (ajv) is imported lazily so consumers that only need the pure helpers stay light.
 */
export async function validateAgainstSchema(bom, path, specVersion = SPEC_VERSION) {
  const { Validation } = await import("@cyclonedx/cyclonedx-library");
  const validator = new Validation.JsonValidator(specVersion);
  const error = await validator.validate(JSON.stringify(bom));
  if (error === null) {
    return null;
  }
  return `${path}: does not validate against the CycloneDX ${specVersion} schema (${JSON.stringify(error)}).`;
}
