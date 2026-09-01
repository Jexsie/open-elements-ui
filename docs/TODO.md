# TODO

## Bullet list adjacent to a task list grows a phantom empty task item

When Markdown places a bullet list directly before a task list (`- one\n- two\n\n- [ ] a`), the schema round-trip inserts a spurious empty task item (`- [ ] `) between them. Separating the two lists with a paragraph avoids it. This breaks the byte-identical round-trip guarantee from spec `001-markdown-schema-roundtrip` for that specific adjacency.

**Context:** Surfaced while writing the "only the clicked item changes" test for spec `003-markdown-view-checkboxes`; the test was adjusted to separate the lists. Root cause is in the `tiptap-markdown` / markdown-it parse of adjacent bullet+task lists, not in spec 003, so it was left for a dedicated fix. Not yet reproduced in a spec 001 round-trip test.

**Prerequisite:** none — can be investigated against `createMarkdownExtensions` directly.

## Upload release SBOMs to Dependency-Track

Once an Open Elements Dependency-Track instance exists, the release workflow should upload
`sbom.cdx.json` to it, so vulnerabilities in released versions are tracked continuously instead of only
at assessment time. The org convention (`software-quality.md`) already requires this for all products.

**Context:** Deliberately excluded from spec `005-cyclonedx-sbom-release` because no instance exists yet
and no API URL or token can be configured. The generation side is already in place; this is purely an
additional upload step plus two GitHub secrets.

**Prerequisite:** spec `005-cyclonedx-sbom-release` implemented, and a reachable Dependency-Track
instance with an API key.

## Make SBOM generation byte-identical

`pnpm sbom` emits a fresh `serialNumber` UUID and a `metadata.timestamp` on every run, so two builds of
the same tag produce different bytes. Spec 005 sorts the `components` array to remove the third source of
variance, but full reproducibility needs a normalization step that derives `serialNumber` and
`timestamp` deterministically (e.g. from the tag and `SOURCE_DATE_EPOCH`) or omits them.

**Context:** Surfaced while grilling spec `005-cyclonedx-sbom-release`. Accepted there as an interim
state ("content-stable, bytes irrelevant"), but it conflicts with the reproducible-builds convention,
whose target state is byte-identical rebuilds. Without it, nobody can independently rebuild a tag and
confirm the SBOM matches.

**Prerequisite:** spec `005-cyclonedx-sbom-release` implemented.

## Attest released SBOMs with Sigstore

Bind the released SBOMs to the published artifact with a signed attestation (`actions/attest-sbom`), so a
customer can verify that a downloaded SBOM genuinely belongs to the version it claims to describe.

**Context:** Dropped from spec `005-cyclonedx-sbom-release` during grilling. npm Trusted Publishing
already produces provenance for the published tarball, and the release job does not reliably hold that
tarball's digest — `pnpm stage publish` packs and uploads it internally, and a separately packed tarball
is not guaranteed to be byte-identical. Attesting the SBOM file alone would only prove which workflow run
wrote the document, not which artifact it describes.

**Prerequisite:** a reliable way to obtain the digest of the artifact that `pnpm stage publish`
uploads — or byte-identical `pnpm pack` output.
