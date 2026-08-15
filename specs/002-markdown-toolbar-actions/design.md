# Design: Markdown toolbar actions

**GitHub Issue:** — (to be created)
**Target release:** 0.11.0 — **breaking**
**Depends on:** `001-markdown-schema-roundtrip`

## Summary

Every `MarkdownEditor` usage currently receives the same four buttons. Different fields need different actions: a tag/label description has no use for task lists, a task description does. After spec 001 the schema understands far more than the toolbar exposes, so which actions a given usage offers has to become an explicit decision at the call site.

This spec introduces a `toolbar` prop holding an ordered allowlist of actions. The prop governs **creation only** — it never touches the schema. Content the user is not allowed to create still renders and still round-trips, which is the guarantee spec 001 established and this spec must not erode.

## Goals

- Each usage declares exactly which actions its toolbar offers, in the order it wants them.
- The full set of Markdown constructs the schema understands becomes reachable through the toolbar where a usage asks for it.
- Where `taskList` is not offered, users cannot create task lists by any means.
- Icon buttons carry an accessible name.

## Non-goals

- **No schema changes.** Everything remains parseable and serializable regardless of the toolbar.
- **No gating of mark shortcuts or input rules.** `Mod-b` and `**bold**` keep working even where the Bold button is absent — see *Why only task lists are fully gated*.
- **No translations.** Labels stay hardcoded English; a `translations` prop is a separate spec.
- **No toolbar overflow handling.** Grouping, separators and narrow-viewport behaviour for a toolbar of up to fourteen actions are not addressed here.
- **No changes to `MarkdownViewProps`.** The view has no toolbar.

## API design

```ts
export type MarkdownToolbarAction =
  | "bold"
  | "italic"
  | "strike"
  | "code"
  | "link"
  | "h1"
  | "h2"
  | "h3"
  | "bulletList"
  | "orderedList"
  | "taskList"
  | "blockquote"
  | "codeBlock"
  | "horizontalRule";

export interface MarkdownEditorProps {
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly placeholder?: string;
  /** Actions offered in the toolbar, in render order. Defaults to `["bold", "italic"]`. */
  readonly toolbar?: readonly MarkdownToolbarAction[];
}
```

**Allowlist, not a delta.** The prop replaces the default rather than adding to it, because the motivating case — a tag description that should offer *less* than today — cannot be expressed by an additive prop. The cost is that a usage wanting one extra action must spell out the whole list; with a handful of call sites that is acceptable and it keeps the declaration honest about what a field offers.

**Names follow TipTap node names** (`bulletList`, `orderedList`, `taskList`, `codeBlock`, `horizontalRule`) so the mapping between the prop and the underlying commands is obvious. Headings are individual entries rather than one `"heading"` action with a level dropdown, so a usage can offer H2 and H3 without offering H1. The schema still understands H4–H6; they simply have no toolbar entry.

**Unlink is not an action.** It is rendered contextually as part of `"link"`, exactly as today (`markdown-editor.tsx:87-91`).

**Order is the array order.** `toolbar={["link", "bold"]}` renders Link first. This avoids a second concept for ordering.

### Breaking change

The default drops from Bold/Italic/Strike/Link to `["bold", "italic"]`. Every existing usage loses the Strike and Link buttons unless it declares them.

**Rationale:** the minimal set is the honest default for a shared component — each field should state what it needs rather than inherit an accumulated set. Existing content is unaffected: links and strikethrough still render and still round-trip, only the authoring affordance disappears. Two consuming apps are affected, both under our control, and `docs/upgrade-to-0.11.md` walks each usage individually instead of bumping wholesale.

## Technical approach

### Where the gate lives

`createMarkdownExtensions` from spec 001 gains the allowlist:

```ts
export interface MarkdownExtensionsOptions {
  readonly placeholder?: string;
  readonly openLinksOnClick?: boolean;
  /** Actions the user may create. Omitted → nothing beyond the default marks. */
  readonly allowedActions?: readonly MarkdownToolbarAction[];
}
```

Keeping the gate in the factory rather than in the component means the extension configuration and the toolbar cannot drift apart, and the round-trip tests from spec 001 keep testing the shipped configuration.

### Why only task lists are fully gated

Three paths lead to creating a construct: the toolbar button, a keyboard shortcut, and an input rule (typing Markdown syntax). Closing all three is worthwhile for exactly one action.

| Action | Button | Shortcut | Input rule | Gated by `toolbar` |
|--------|--------|----------|-----------|--------------------|
| `taskList` | yes | `Mod-Shift-9` | `[ ] ` | all three |
| everything else | yes | e.g. `Mod-b`, `Mod-Shift-s` | e.g. `**bold**`, `## ` | button only |

**Rationale.** Task lists are the only construct whose state a *reader* changes outside edit mode (spec 003), which is precisely why an app may want them absent from a given field. They are also cheap to gate: `TaskList` and `TaskItem` are imported directly, so `.extend({ addKeyboardShortcuts: () => ({}) })` and `.extend({ addInputRules: () => [] })` suffice — the same mechanism spec 001 already uses unconditionally, now made conditional.

Gating the marks would be both expensive and pointless. Their shortcuts and input rules live inside StarterKit sub-extensions, which cannot be extended from outside; suppressing them would mean pulling `bold`, `italic`, `strike` and the block nodes out of the StarterKit and re-registering them individually — several new direct dependencies. And nobody asked for it: the requirement was never "Bold must be impossible in a tag description", it was "the toolbar should only offer what makes sense". Gating the button satisfies that.

As a consequence, `toolbar` is honestly described as a *toolbar* declaration, with task lists as one explicitly justified exception.

`TaskItem`'s own `Enter` / `Shift-Tab` / `Tab` shortcuts remain untouched in both cases — they edit an existing list rather than creating one, and a list loaded from stored Markdown must stay editable even where creating a new one is not offered.

### Toolbar rendering

The `Toolbar` component maps each action to an icon, an accessible label, an active-state predicate and a command. The mapping is a single record so that adding an action later touches one place:

```ts
const ACTIONS: Record<MarkdownToolbarAction, {
  icon: LucideIcon;
  label: string;
  isActive: (editor: Editor) => boolean;
  run: (editor: Editor) => void;
}>;
```

Icons come from `lucide-react` (already a peer dependency): `Bold`, `Italic`, `Strikethrough`, `Code`, `Link`, `Heading1`, `Heading2`, `Heading3`, `List`, `ListOrdered`, `ListChecks`, `Quote`, `SquareCode`, `Minus`.

`"link"` keeps its current `window.prompt` flow and its contextual Unlink button.

An empty array renders no toolbar element at all — not an empty bordered strip — so a field configured for plain text has no leftover chrome.

### Accessibility

Buttons currently expose only `title`, which screen readers do not reliably announce as an accessible name. With up to fourteen icon-only buttons that is no longer tolerable, so each button gains an `aria-label` alongside its `title`, using the same English string. When the deferred translations spec lands, both are fed from one source.

## Dependencies

No new packages. `@tiptap/extension-list` was declared in spec 001; `lucide-react` is already a peer dependency.

## Open questions

- Fourteen icon buttons in one row will overflow narrow containers. Whether that needs grouping, separators or wrapping is deferred until a real usage requests more than a handful of actions.
- Whether a usage will ever want H4–H6 in the toolbar. Not added until asked for; the schema already supports them.
