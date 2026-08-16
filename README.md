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
- **MarkdownView** — Read-only Markdown renderer with structural output (headings, lists, task lists, blockquotes, code)

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

## Translations

```typescript
import { de, en } from "@open-elements/ui";
```

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
