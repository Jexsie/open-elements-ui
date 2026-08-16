# Behaviors: Markdown schema round-trip

## Markdown round-trip

### Task list survives unchanged

- **Given** an editor built from `createMarkdownExtensions()`
- **When** it is loaded with `- [x] Write the press release\n- [ ] Send invitations`
- **Then** `storage.markdown.getMarkdown()` returns exactly that string, including the `- [x]` and `- [ ]` markers

### Bullet list survives unchanged

- **Given** an editor built from `createMarkdownExtensions()`
- **When** it is loaded with `- Milk\n- Bread`
- **Then** the serialized Markdown is identical to the input

### Ordered list survives unchanged

- **Given** an editor built from `createMarkdownExtensions()`
- **When** it is loaded with `1. First\n2. Second`
- **Then** the serialized Markdown is identical to the input

### Headings survive at every level

- **Given** an editor built from `createMarkdownExtensions()`
- **When** it is loaded with a document containing `# H1` through `###### H6`
- **Then** all six headings are serialized back with their original level, even though only H1–H3 will ever be creatable via the toolbar

### Blockquote, code block and horizontal rule survive

- **Given** an editor built from `createMarkdownExtensions()`
- **When** it is loaded with a blockquote, a fenced code block with a language tag, and a `---` rule
- **Then** each is serialized back with its original syntax

### Nested task lists survive

- **Given** `TaskItem` is configured with `nested: true`
- **When** the editor is loaded with a task list whose second item is indented under the first
- **Then** the serialized Markdown preserves the indentation and the nesting level

### Marks inside blocks survive

- **Given** an editor built from `createMarkdownExtensions()`
- **When** it is loaded with `- [x] Call **Anna** about [the offer](https://example.com)`
- **Then** the serialized Markdown retains both the bold mark and the link

### A mixed list keeps both kinds of items

- **Given** an editor built from `createMarkdownExtensions()`
- **When** it is loaded with `- [x] Done\n- Just an item`
- **Then** neither line is dropped and both survive serialization
- **And** the checked item keeps its checkbox marker

### The document does not grow a trailing paragraph

- **Given** a document whose last block is a code block or a horizontal rule
- **When** it is serialized
- **Then** the output has no extra trailing blank line compared to the input

## MarkdownEditor — no corruption on open

### Opening without editing leaves the value untouched

- **Given** a `MarkdownEditor` mounted with `value = "- [x] Write the press release"` and a spy on `onChange`
- **When** the component finishes mounting and its sync effect has run
- **Then** `onChange` has not been called

### A real edit still reports the full document

- **Given** a mounted `MarkdownEditor` holding a task list and a paragraph
- **When** the user types a character into the paragraph
- **Then** `onChange` receives the complete Markdown with the task list intact and only the paragraph changed

### An externally changed value replaces the document

- **Given** a mounted `MarkdownEditor`
- **When** the parent passes a `value` that differs from the current serialized Markdown
- **Then** the document is replaced with the new value

## MarkdownView — rendering

### Structural Markdown renders as structure

- **Given** a `MarkdownView`
- **When** it receives content containing a heading, a bullet list and a blockquote
- **Then** the rendered DOM contains the corresponding elements rather than plain paragraphs

### Task lists render as checkboxes reflecting their state

- **Given** a `MarkdownView`
- **When** it receives `- [x] Done\n- [ ] Open`
- **Then** the DOM contains two checkbox inputs, the first checked and the second unchecked

### Clicking a checkbox has no effect

- **Given** a `MarkdownView` rendering a task list
- **When** the user clicks a checkbox
- **Then** the checkbox returns to its previous state
- **And** nothing is reported to the consumer, since `MarkdownView` has no change callback in this spec

### Checkboxes are not decorated with a list bullet

- **Given** a `MarkdownView` inside a `prose` container
- **When** it renders a task list
- **Then** the list carries the classes that suppress the `prose` bullet and indentation

## Task list creation stays closed

### The keyboard shortcut does nothing

- **Given** a mounted `MarkdownEditor` with the cursor in an empty paragraph
- **When** the user presses `Mod-Shift-9`
- **Then** no task list is created

### The input rule does nothing

- **Given** a mounted `MarkdownEditor` with the cursor at the start of an empty paragraph
- **When** the user types `[ ] `
- **Then** the literal text `[ ] ` remains and no task item is created

### The toolbar is unchanged

- **Given** a mounted `MarkdownEditor`
- **When** the toolbar renders
- **Then** it offers exactly Bold, Italic, Strikethrough and Link, and Unlink while the cursor sits in a link

## Editing an existing task list

### Enter splits a task item

- **Given** a `MarkdownEditor` loaded with `- [x] Done` and the cursor at the end of that item
- **When** the user presses `Enter`
- **Then** a new, unchecked task item is created below it
- **And** serialization yields two `- [ ]` / `- [x]` lines

### Shift-Tab lifts a nested item

- **Given** a `MarkdownEditor` loaded with a task list whose second item is nested under the first, cursor in the nested item
- **When** the user presses `Shift-Tab`
- **Then** the item moves up one level
- **And** the serialized Markdown reflects the reduced indentation

## Marks that Markdown cannot express

### Underline cannot be applied

- **Given** an editor built from `createMarkdownExtensions()`
- **When** the underline mark is requested for the current selection
- **Then** the command is unavailable, because `underline` is not part of the schema

## Edge cases

### Empty content produces empty Markdown

- **Given** an editor built from `createMarkdownExtensions()`
- **When** it is loaded with an empty string
- **Then** the serialized Markdown is an empty string
- **And** the placeholder is shown if one was configured

### An unchecked-only task list round-trips

- **Given** an editor built from `createMarkdownExtensions()`
- **When** it is loaded with `- [ ] Open item`
- **Then** the serialized Markdown keeps `- [ ]` and does not normalise it to `- [x]` or to a plain bullet

### Content that is already plain text is unaffected

- **Given** an editor built from `createMarkdownExtensions()`
- **When** it is loaded with a plain paragraph containing no Markdown syntax
- **Then** the serialized Markdown is byte-identical to the input

---

## Drift Log

### 2026-08-16 — Caused by spec `002-markdown-toolbar-actions`

- **Affected scenario:** The toolbar is unchanged
- **Original behavior:** The `MarkdownEditor` toolbar offered exactly Bold, Italic, Strikethrough and Link (plus Unlink inside a link), fixed for every usage.
- **Current behavior:** The toolbar is configured per usage via a `toolbar` allowlist prop, and its default dropped to `["bold", "italic"]`. Strikethrough and Link are no longer shown unless declared. Stored content is unaffected — links and strikethrough still render and round-trip.
- **Reason:** Spec 002 makes the toolbar composable per field; the fixed four-button toolbar from spec 001 was intentionally superseded (spec 001's design already noted this would be handled in spec 002).
