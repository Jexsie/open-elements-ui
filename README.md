# @open-elements/ui

Reusable UI components, brand styling, and translation strings for Open Elements projects.

## Overview

This package contains extracted UI components from the Open CRM frontend, designed to be shared across Open Elements projects. It ships raw `.tsx` source files — the consuming app compiles them as part of its own build.

## Components

- **Button** — Primary action button with variant and size support
- **Input** — Text input field
- **Textarea** — Multi-line text area
- **InputGroup** — Composite input with addons and buttons
- **Combobox** — Searchable dropdown with chip support (based on Base UI)
- **TagMultiSelect** — Multi-select tag picker with colored chips
- **MarkdownEditor** — WYSIWYG Markdown editor that round-trips all supported Markdown constructs without data loss; toolbar actions are configurable per usage via the `toolbar` prop
- **MarkdownView** — Read-only Markdown renderer with structural output (headings, lists, task lists, blockquotes, code); task-list checkboxes become interactive via an optional `onChange` (optimistic update with rollback)

## Usage

```typescript
import { Button, Input, Combobox, TagMultiSelect, cn } from "@open-elements/ui";
import type { TagDto } from "@open-elements/ui";
```

## Brand Styling

Import brand CSS in your app's stylesheet:

```css
@import "@open-elements/ui/src/styles/brand.css";
```

Because this package ships raw `.tsx`, its utility classes reach your app as source text. Tailwind
only turns them into CSS if it scans the library, so the consuming app must point at it and load the
typography plugin that `MarkdownView` relies on:

```css
@import "tailwindcss";
@import "@open-elements/ui/src/styles/brand.css";
@plugin "@tailwindcss/typography";
@source "../node_modules/@open-elements/ui/src";
```

Without the `@source` line, components render unstyled — task list checkboxes pick up a `prose`
bullet, for instance. The [component showcase](#component-showcase) uses the same configuration and
asserts the result, so a break in this contract surfaces there.

## Translations

```typescript
import { de, en } from "@open-elements/ui";
```

## Component Showcase

Every component can be opened in isolation, with its props adjustable at runtime, in a Storybook
catalogue:

```bash
pnpm storybook        # dev server on http://localhost:6006
pnpm build-storybook  # static build into storybook-static/
```

Stories live in [`stories/`](stories/), deliberately outside `src/`: `files` in `package.json`
publishes all of `src/`, so a colocated story would ship in the tarball and break a consumer's `tsc`
on unresolvable `@storybook/*` imports. Nothing under `src/` imports Storybook, and Tailwind is a
devDependency that no build script consumes — the published package is unaffected.

Stories carry `play` functions, which run in a real browser and cover what jsdom can only check
indirectly: the toolbar allowlist, the task-list creation gate under actual keystrokes, the
checkbox lifecycle after actual clicks, and that the Tailwind utilities the components rely on
resolve to real styles. They are additive; the vitest suites are unchanged.

`MarkdownEditor` and `MarkdownView` establish the pattern. The remaining components follow
incrementally.

Deployment of the showcase is documented in
[docs/showcase-deployment.md](docs/showcase-deployment.md).

## Software Bill of Materials (SBOM)

Every release publishes two [CycloneDX](https://cyclonedx.org/) 1.7 SBOMs as assets on its
[GitHub Release](https://github.com/OpenElementsLabs/open-elements-ui/releases), so a specific
published version can be obtained without an `npm install`:

| Asset               | Contents                                                               | Authoritative?                                                     |
| ------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `sbom.cdx.json`     | Runtime dependencies (transitive) plus the library's peer dependencies | **Yes** — use this for supplier assessments (Cyber Resilience Act) |
| `sbom-dev.cdx.json` | The build toolchain (`devDependencies`)                                | No — provided for transparency only                                |

Both are generated locally with the pinned `pnpm` (`pnpm sbom`) and verified in CI on every pull
request, so a dependency change that breaks the SBOM turns the build red. A release cannot ship without
a valid SBOM.

```bash
pnpm sbom          # writes sbom/sbom.cdx.json and sbom/sbom-dev.cdx.json (gitignored)
pnpm sbom:verify   # validates both against the CycloneDX 1.7 schema and package.json
```

**Peer dependencies.** `radix-ui`, `@base-ui/react`, `lucide-react`, `react` and `react-dom` are peer
dependencies: the consumer supplies them. `pnpm sbom` alone omits them, so they are added to
`sbom.cdx.json` and marked with a `cdx:npm:peer` property holding the declared range. The **version**
recorded for each peer is the one resolved in _this repository's_ lockfile, not the one a consumer
installs — it changes when we bump our own devDependencies, even though nothing changes for the
consumer. Read a peer's `cdx:npm:peer` range, not its pinned version, as the requirement.

## Releasing a New Version

Every release must be published to npm **and** have a corresponding Git tag and GitHub Release.

### Usage

```bash
./release.sh <release-version> <next-version>
```

Example:

```bash
./release.sh 0.2.0 0.3.0
```

The script performs the following steps:

1. Sets the release version in `package.json`
2. Builds and tests the project
3. Commits, tags (`v<version>`), and pushes to GitHub
4. Publishes the package to npm
5. Creates a GitHub Release with auto-generated notes
6. Sets the next development version in `package.json`, commits, and pushes

### Prerequisites

- You must be logged in to npm with publish access to the `@open-elements` scope (`pnpm login`).
- The [GitHub CLI (`gh`)](https://cli.github.com/) must be installed and authenticated.
- The `NPM_TOKEN` and `GH_TOKEN` environment variables must be set (in .env file).
