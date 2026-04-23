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
