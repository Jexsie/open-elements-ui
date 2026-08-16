# Upgrade prompt: `@open-elements/ui` 0.9.x → 0.10.0

`@open-elements/ui` 0.10.0 fixes a **data-loss bug** in `MarkdownEditor` and a **rendering gap** in `MarkdownView`. Both components previously trimmed the TipTap schema down to paragraphs, a few marks and links, so every other Markdown construct (headings, bullet/ordered lists, task lists, blockquotes, code blocks, horizontal rules) was silently discarded when content was loaded.

In `MarkdownEditor` this destroyed stored data: simply opening a form with such content was enough to corrupt the value passed back through `onChange`, without a single keystroke. In `MarkdownView` the same constructs were flattened to plain text.

0.10.0 opens the schema so all of those constructs **round-trip untouched**. There is **no API change** — `MarkdownEditor` and `MarkdownView` keep the exact same props. What the editor toolbar lets a user *create* is unchanged (still Bold, Italic, Strikethrough, Link); task lists render but cannot be created.

The consumer-visible effect is that content which used to appear as flat text now renders as real structure. This is the intended fix, but it means blocks that were previously invisible-as-structure now take up their natural space.

This file is a self-contained prompt for an agent (Claude Code, etc.) to run inside a consumer repo. Paste it verbatim.

---

## Prompt

You are working inside an app that depends on `@open-elements/ui`. Goal: upgrade to `^0.10.0`. There is **no prop or import migration** — the change is behavioral, plus a documentation/visual verification pass.

### What changed in 0.10.0

- **`MarkdownEditor` no longer corrupts content on open.** Loading a value containing headings, lists, task lists, blockquotes, code blocks or horizontal rules no longer strips those constructs and no longer fires a spurious `onChange`. If your app worked around this bug (e.g. by re-saving on load, or by pre-stripping Markdown before passing it in), remove that workaround.
- **`MarkdownView` now renders structure.** Content that previously appeared as a single flat paragraph now renders as headings, lists, task lists (as checkboxes), blockquotes, code blocks and rules.
- **Task lists render but stay non-creatable.** `- [x]` / `- [ ]` items display as checkboxes and survive editing. There is no toolbar button, keyboard shortcut, or `[ ] ` input rule to create one — this is deliberate.
- **Checkboxes in `MarkdownView` are read-only.** They reflect the stored state; clicking them does nothing (interactive toggling arrives in a later release).
- **Dependency manifest.** Internally the library dropped a duplicate `@tiptap/extension-link` and declared `@tiptap/extension-list`. These are the library's own `dependencies`, resolved transitively — you do **not** manage them in your app.

### Steps

1. **Find the consumer's frontend `package.json`** (repo root or under `frontend/`). Confirm `@open-elements/ui` is listed, then bump it to `^0.10.0` and run:

   ```bash
   pnpm install
   ```

2. **Confirm the library sources are in your Tailwind content globs.** The newly rendered blocks and the task-list styling rely on utility classes (`prose prose-sm`, `list-none`, `pl-0`, `flex`, …) that Tailwind must see in the library source. If you already render any `@open-elements/ui` component correctly, this is already the case — verify your `tailwind.config` `content` array includes the package, e.g.:

   ```js
   content: ["./src/**/*.{ts,tsx}", "./node_modules/@open-elements/ui/src/**/*.{ts,tsx}"],
   ```

3. **Visually check every screen that uses `MarkdownView` or `MarkdownEditor`.** Content that was silently flattened will now render as structure. In compact contexts (detail panels, cards, table cells) headings and code blocks may look oversized. If so, add local `prose` overrides *in your app* — do not edit the library. Example:

   ```html
   <div class="prose prose-sm prose-headings:text-base prose-headings:font-medium">
     <MarkdownView content={value} />
   </div>
   ```

4. **Remove any load-time corruption workarounds.** Search for code that pre-processes Markdown before handing it to `MarkdownEditor`, or that ignores the first `onChange` after mount. These existed to paper over the old bug and are now unnecessary.

5. **Verify.** All three must pass:

   ```bash
   pnpm exec tsc --noEmit
   pnpm test
   pnpm build
   ```

6. **Commit** with a clear message:

   ```
   chore(deps): upgrade @open-elements/ui to 0.10.0

   MarkdownEditor no longer corrupts stored Markdown on open and
   MarkdownView now renders full structure. Verified prose styling.
   ```

### Guard rails

- **Do not** change how you call `MarkdownEditor` / `MarkdownView` — their props are identical to 0.9.0.
- **Do not** add `@tiptap/*` packages to your app's dependencies to "fix" the upgrade. They are the library's transitive dependencies.
- **Do not** edit `@open-elements/ui` from the consumer side. `prose` overrides belong in your app's markup or stylesheet.
- **Do not** bundle unrelated dependency bumps into the same change.

### Don't do this

- Do not try to re-add a way to *create* task lists — their non-creatability is intentional in this release.
- Do not treat the new rendering as a regression and revert the bump; flattened text was the bug.
