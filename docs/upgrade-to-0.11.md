# Upgrade prompt: `@open-elements/ui` 0.10.x → 0.11.0 (breaking)

`@open-elements/ui` 0.11.0 makes the `MarkdownEditor` toolbar configurable per usage and **changes its default**. This is a **breaking change** for authoring, not for stored content.

Until now every `MarkdownEditor` showed the same four buttons (Bold, Italic, Strikethrough, Link). 0.11.0 adds a `toolbar` prop — an ordered allowlist of actions — and the default drops to `["bold", "italic"]`. Every existing usage therefore **loses the Strikethrough and Link buttons** unless it declares them.

Nothing about stored content changes: links, strikethrough and every other construct still render and still round-trip exactly as in 0.10.0. Only the authoring affordance (which buttons appear) is affected. The schema is untouched — this prop governs the toolbar, not what the document can hold.

```ts
export type MarkdownToolbarAction =
  | "bold" | "italic" | "strike" | "code" | "link"
  | "h1" | "h2" | "h3"
  | "bulletList" | "orderedList" | "taskList"
  | "blockquote" | "codeBlock" | "horizontalRule";

// New optional prop; defaults to ["bold", "italic"].
<MarkdownEditor value={v} onChange={setV} toolbar={["bold", "italic", "strike", "link"]} />
```

Two smaller changes ride along:

- Task-list creation is gated by the toolbar. Where `"taskList"` is **not** in the allowlist, the `Mod-Shift-9` shortcut and the `[ ] ` input rule do nothing, so a checklist cannot be created by any means. Stored checklists still render and stay editable. All other actions are gated at the button only — `Mod-b` and `**bold**` keep working even where the Bold button is absent.
- Every toolbar button now carries an `aria-label` (and `aria-pressed` for active state), so icon-only buttons are announced by screen readers.

This file is a self-contained prompt for an agent (Claude Code, etc.) to run inside a consumer repo. Paste it verbatim.

---

## Prompt

You are working inside an app that depends on `@open-elements/ui`. Goal: upgrade to `^0.11.0`. This is a **breaking** change: the `MarkdownEditor` toolbar default changed, so each usage must declare the actions it needs.

### What changed in 0.11.0

- **New `toolbar` prop** on `MarkdownEditor`: `readonly toolbar?: readonly MarkdownToolbarAction[]`. It is an ordered allowlist — the buttons render in array order, duplicates collapse, and an empty array renders no toolbar at all.
- **The default dropped** from Bold/Italic/Strikethrough/Link to `["bold", "italic"]`. Any usage that relied on the old default now shows only Bold and Italic.
- **`taskList` creation is gated by the toolbar**; other actions are gated at the button only.
- **No stored-content change.** Links, strikethrough, headings, lists, task lists, etc. still render and round-trip. This is purely about which buttons appear.
- **No change to `MarkdownView`.**

### Steps

1. **Find the consumer's frontend `package.json`**, bump `@open-elements/ui` to `^0.11.0`, and run:

   ```bash
   pnpm install
   ```

2. **Find every `MarkdownEditor` usage:**

   ```bash
   grep -rn "MarkdownEditor" src app components 2>/dev/null
   ```

3. **For each usage, decide the toolbar explicitly.** Do not blindly restore the old four buttons — this upgrade is the moment to make each field honest about what it offers. Guidance:
   - A **tag / label description** field: keep it minimal, e.g. `toolbar={["bold", "italic"]}` (the new default — you can omit the prop) or `toolbar={[]}` for plain text.
   - A **rich note / task description** field: declare what it needs, e.g. `toolbar={["bold", "italic", "strike", "link", "h2", "h3", "bulletList", "orderedList", "taskList"]}`.
   - If a field previously relied on the Link or Strikethrough buttons, add `"link"` / `"strike"` back **explicitly** where they belong.

4. **If a field needs checkboxes**, include `"taskList"` — otherwise users cannot create task lists there (stored ones still render and stay editable regardless).

5. **Verify.** All three must pass:

   ```bash
   pnpm exec tsc --noEmit
   pnpm test
   pnpm build
   ```

6. **Commit** with a clear message:

   ```
   chore(deps): upgrade @open-elements/ui to 0.11.0

   Declare an explicit toolbar on each MarkdownEditor usage; the default
   dropped to ["bold", "italic"] in 0.11.0.
   ```

### Guard rails

- **Do not** add a global wrapper that re-injects the old four-button default everywhere — that defeats the point of the change. Decide per field.
- **Do not** try to gate marks (Bold/Italic/…) beyond hiding their buttons; only `taskList` creation is fully gated, by design.
- **Do not** touch `MarkdownView` usages — its props are unchanged.
- **Do not** treat missing links/strikethrough in stored content as data loss — they still render; only the button was removed.

### Don't do this

- Do not pass `"unlink"` in `toolbar` — it is not an action; Unlink appears automatically next to Link when the cursor is inside a link.
- Do not bundle unrelated dependency bumps into the same change.
