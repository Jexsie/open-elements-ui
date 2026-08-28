// Behavioral coverage for the SBOM core logic (specs/005-cyclonedx-sbom-release/behaviors.md).
// Everything runs against in-memory fixtures — no `pnpm sbom` subprocess — so the local test loop
// stays fast and deterministic (behavior: "The local test loop is unaffected").

import { describe, it, expect } from "vitest";

import {
  PEER_PROPERTY,
  SUPPLIER_NAME,
  enrichWithPeers,
  fullName,
  sortBom,
  verifyStructure,
} from "../sbom-core.mjs";

const ROOT = { name: "ui", group: "@open-elements" };

function ref({ name, group, version }) {
  const encoded = group ? `${group.replace("@", "%40")}/${name}` : name;
  return `pkg:npm/${encoded}@${version}`;
}

function component(spec) {
  const c = { type: "library", name: spec.name, version: spec.version, "bom-ref": ref(spec) };
  if (spec.group) c.group = spec.group;
  if (spec.properties) c.properties = spec.properties;
  return c;
}

/**
 * Build a CycloneDX-shaped document. `edges` are the root's direct dependencies; `extra` are
 * additional components not linked from the root (e.g. transitive deps); `childEdges` are extra
 * `dependencies[]` entries (e.g. a peer's own subtree, to prove it is not carried over).
 */
function bom({
  version = "1.0.0",
  supplier = SUPPLIER_NAME,
  edges = [],
  extra = [],
  childEdges = [],
} = {}) {
  const rootComp = { ...ROOT, version };
  const rootRef = ref(rootComp);
  return {
    bomFormat: "CycloneDX",
    specVersion: "1.7",
    metadata: {
      component: {
        type: "library",
        name: rootComp.name,
        group: rootComp.group,
        version,
        "bom-ref": rootRef,
      },
      ...(supplier === null ? {} : { supplier: { name: supplier } }),
    },
    components: [...edges, ...extra].map(component),
    dependencies: [{ ref: rootRef, dependsOn: edges.map(ref) }, ...childEdges],
  };
}

function pkg(overrides = {}) {
  return {
    version: "1.0.0",
    dependencies: {},
    peerDependencies: {},
    devDependencies: {},
    ...overrides,
  };
}

function rootEdges(document) {
  const rootRef = document.metadata.component["bom-ref"];
  return document.dependencies.find((d) => d.ref === rootRef).dependsOn;
}

function peerComponent(document, name) {
  return document.components.find((c) => fullName(c) === name);
}

describe("fullName", () => {
  it("joins scope and name for scoped packages", () => {
    expect(fullName({ group: "@base-ui", name: "react" })).toBe("@base-ui/react");
  });

  it("returns the bare name for unscoped packages", () => {
    expect(fullName({ name: "radix-ui" })).toBe("radix-ui");
  });
});

describe("enrichWithPeers", () => {
  it("adds absent peers as components with the lockfile version, marker, and a root edge", () => {
    const prod = bom({ edges: [{ name: "dep-a", version: "1.0.0" }] });
    const dev = bom({
      edges: [
        { name: "radix-ui", version: "1.4.3" },
        { name: "react", group: "@base-ui", version: "1.4.1" },
      ],
    });
    const manifest = pkg({
      dependencies: { "dep-a": "^1.0.0" },
      peerDependencies: { "radix-ui": "^1.4.0", "@base-ui/react": "^1.3.0" },
      devDependencies: { "radix-ui": "^1.4.0", "@base-ui/react": "^1.3.0" },
    });

    enrichWithPeers(prod, dev, manifest);

    const radix = peerComponent(prod, "radix-ui");
    expect(radix.version).toBe("1.4.3");
    expect(radix.properties).toContainEqual({ name: PEER_PROPERTY, value: "^1.4.0" });
    expect(rootEdges(prod)).toContain(ref({ name: "radix-ui", version: "1.4.3" }));

    const baseUi = peerComponent(prod, "@base-ui/react");
    expect(baseUi.version).toBe("1.4.1");
    expect(baseUi.properties).toContainEqual({ name: PEER_PROPERTY, value: "^1.3.0" });
  });

  it("does not duplicate a peer already present transitively", () => {
    const react = { name: "react", version: "19.2.5" };
    // react is a transitive dep (component present, but not a direct root edge).
    const prod = bom({
      edges: [{ name: "react-day-picker", version: "9.14.0" }],
      extra: [react],
      childEdges: [
        { ref: ref({ name: "react-day-picker", version: "9.14.0" }), dependsOn: [ref(react)] },
      ],
    });
    const dev = bom({ edges: [react] });
    const manifest = pkg({
      dependencies: { "react-day-picker": "^9.14.0" },
      peerDependencies: { react: "^19.0.0" },
      devDependencies: { react: "^19.0.0" },
    });

    enrichWithPeers(prod, dev, manifest);

    const reacts = prod.components.filter((c) => fullName(c) === "react");
    expect(reacts).toHaveLength(1);
    expect(reacts[0].properties).toContainEqual({ name: PEER_PROPERTY, value: "^19.0.0" });
    expect(rootEdges(prod).filter((r) => r === ref(react))).toHaveLength(1);
  });

  it("does not expand a peer's transitive subtree", () => {
    const radix = { name: "radix-ui", version: "1.4.3" };
    const radixChild = { name: "react-remove-scroll", version: "2.0.0" };
    // In the dev document radix-ui depends on a child; that child must not leak into prod.
    const dev = bom({
      edges: [radix],
      extra: [radixChild],
      childEdges: [{ ref: ref(radix), dependsOn: [ref(radixChild)] }],
    });
    const prod = bom({ edges: [{ name: "dep-a", version: "1.0.0" }] });
    const manifest = pkg({
      dependencies: { "dep-a": "^1.0.0" },
      peerDependencies: { "radix-ui": "^1.4.0" },
      devDependencies: { "radix-ui": "^1.4.0" },
    });

    enrichWithPeers(prod, dev, manifest);

    expect(peerComponent(prod, "radix-ui")).toBeDefined();
    expect(peerComponent(prod, "react-remove-scroll")).toBeUndefined();
    expect(prod.dependencies.find((d) => d.ref === ref(radix))).toBeUndefined();
  });

  it("throws when a peerDependency is not also a devDependency", () => {
    const prod = bom();
    const dev = bom();
    const manifest = pkg({ peerDependencies: { "radix-ui": "^1.4.0" }, devDependencies: {} });

    expect(() => enrichWithPeers(prod, dev, manifest)).toThrow(
      /must also be declared as a devDependency/,
    );
  });

  it("is a no-op for a library without peerDependencies", () => {
    const prod = bom({ edges: [{ name: "dep-a", version: "1.0.0" }] });
    const before = structuredClone(prod);
    enrichWithPeers(prod, bom(), pkg({ dependencies: { "dep-a": "^1.0.0" } }));
    expect(prod).toEqual(before);
  });
});

describe("sortBom", () => {
  it("orders components by bom-ref and is idempotent", () => {
    const document = bom({
      edges: [
        { name: "zeta", version: "1.0.0" },
        { name: "alpha", version: "1.0.0" },
        { name: "mid", version: "1.0.0" },
      ],
    });
    sortBom(document);
    const refs = document.components.map((c) => c["bom-ref"]);
    expect(refs).toEqual([...refs].sort());

    const once = structuredClone(document);
    sortBom(document);
    expect(document).toEqual(once);
  });
});

describe("verifyStructure — accepted", () => {
  function correctPair() {
    const prod = bom({
      edges: [
        { name: "dep-a", version: "1.0.0" },
        {
          name: "radix-ui",
          version: "1.4.3",
          properties: [{ name: PEER_PROPERTY, value: "^1.4.0" }],
        },
      ],
    });
    const dev = bom({
      edges: [
        { name: "radix-ui", version: "1.4.3" },
        { name: "typescript", version: "5.0.0" },
      ],
    });
    const manifest = pkg({
      dependencies: { "dep-a": "^1.0.0" },
      peerDependencies: { "radix-ui": "^1.4.0" },
      devDependencies: { "radix-ui": "^1.4.0", typescript: "^5.0.0" },
    });
    return { prod, dev, pkg: manifest };
  }

  it("passes a correct pair", () => {
    expect(verifyStructure(correctPair())).toEqual([]);
  });

  it("counts exactly one root edge per declared dependency and peer", () => {
    const { prod } = correctPair();
    // 1 dependency + 1 peer = 2 edges, mirroring the spec's 11 + 5 = 16.
    expect(rootEdges(prod)).toHaveLength(2);
  });
});

describe("verifyStructure — rejected", () => {
  const dev = () =>
    bom({
      edges: [
        { name: "radix-ui", version: "1.4.3" },
        { name: "typescript", version: "5.0.0" },
      ],
    });
  const devDeps = { "radix-ui": "^1.4.0", typescript: "^5.0.0" };

  it("reports a version mismatch", () => {
    const prod = bom({ version: "0.9.0", edges: [{ name: "dep-a", version: "1.0.0" }] });
    const errors = verifyStructure({
      prod,
      dev: dev(),
      pkg: pkg({
        version: "0.10.0",
        dependencies: { "dep-a": "^1.0.0" },
        devDependencies: devDeps,
      }),
    });
    expect(errors.some((e) => /version/.test(e) && /0\.10\.0/.test(e))).toBe(true);
  });

  it("reports a missing supplier", () => {
    const prod = bom({ supplier: null, edges: [{ name: "dep-a", version: "1.0.0" }] });
    const errors = verifyStructure({
      prod,
      dev: dev(),
      pkg: pkg({ dependencies: { "dep-a": "^1.0.0" }, devDependencies: devDeps }),
    });
    expect(errors.some((e) => /supplier/.test(e))).toBe(true);
  });

  it("names a newly added dependency missing from the SBOM", () => {
    const prod = bom({ edges: [{ name: "dep-a", version: "1.0.0" }] });
    const errors = verifyStructure({
      prod,
      dev: dev(),
      pkg: pkg({
        dependencies: { "dep-a": "^1.0.0", "dep-new": "^2.0.0" },
        devDependencies: devDeps,
      }),
    });
    expect(errors.some((e) => /dep-new/.test(e) && /missing/.test(e))).toBe(true);
  });

  it("names a removed dependency still present as an edge", () => {
    const prod = bom({
      edges: [
        { name: "dep-a", version: "1.0.0" },
        { name: "dep-gone", version: "3.0.0" },
      ],
    });
    const errors = verifyStructure({
      prod,
      dev: dev(),
      pkg: pkg({ dependencies: { "dep-a": "^1.0.0" }, devDependencies: devDeps }),
    });
    expect(errors.some((e) => /dep-gone/.test(e) && /extra/.test(e))).toBe(true);
  });

  it("names a peer missing from the runtime SBOM", () => {
    const prod = bom({ edges: [{ name: "dep-a", version: "1.0.0" }] });
    const errors = verifyStructure({
      prod,
      dev: dev(),
      pkg: pkg({
        dependencies: { "dep-a": "^1.0.0" },
        peerDependencies: { "lucide-react": "^0.500.0" },
        devDependencies: { ...devDeps, "lucide-react": "^0.500.0" },
      }),
    });
    expect(errors.some((e) => /lucide-react/.test(e) && /missing/.test(e))).toBe(true);
  });

  it("rejects a peer without the marker property", () => {
    const prod = bom({
      edges: [
        { name: "dep-a", version: "1.0.0" },
        { name: "radix-ui", version: "1.4.3" },
      ],
    });
    const errors = verifyStructure({
      prod,
      dev: dev(),
      pkg: pkg({
        dependencies: { "dep-a": "^1.0.0" },
        peerDependencies: { "radix-ui": "^1.4.0" },
        devDependencies: devDeps,
      }),
    });
    expect(errors.some((e) => /radix-ui/.test(e) && new RegExp(PEER_PROPERTY).test(e))).toBe(true);
  });

  it("reports a peer that is not a devDependency with an explicit message", () => {
    const prod = bom({
      edges: [
        {
          name: "radix-ui",
          version: "1.4.3",
          properties: [{ name: PEER_PROPERTY, value: "^1.4.0" }],
        },
      ],
    });
    const errors = verifyStructure({
      prod,
      dev: dev(),
      pkg: pkg({
        peerDependencies: { "radix-ui": "^1.4.0" },
        devDependencies: { typescript: "^5.0.0" },
      }),
    });
    expect(errors.some((e) => /radix-ui/.test(e) && /devDependency/.test(e))).toBe(true);
  });

  it("names a devDependency missing from the dev SBOM", () => {
    const prod = bom({ edges: [{ name: "dep-a", version: "1.0.0" }] });
    const devMissing = bom({ edges: [{ name: "radix-ui", version: "1.4.3" }] }); // typescript absent
    const errors = verifyStructure({
      prod,
      dev: devMissing,
      pkg: pkg({ dependencies: { "dep-a": "^1.0.0" }, devDependencies: devDeps }),
    });
    expect(errors.some((e) => /sbom-dev/.test(e) && /typescript/.test(e))).toBe(true);
  });
});
