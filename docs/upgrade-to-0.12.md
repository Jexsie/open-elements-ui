# Upgrade prompt: `@open-elements/ui` 0.11.x → 0.12.0 (additive)

`@open-elements/ui` 0.12.0 makes `MarkdownView` task-list checkboxes **interactive**. This is an **additive, non-breaking** change: without the new prop, `MarkdownView` behaves exactly as in 0.11.0 (checkboxes render read-only and a click reverts).

`MarkdownView` gains an optional `onChange`:

```ts
export interface MarkdownViewProps {
  readonly content: string;
  /**
   * Called when the reader toggles a task list checkbox, with the complete
   * updated Markdown. Omit to render checkboxes as read-only.
   */
  readonly onChange?: (markdown: string) => void | Promise<void>;
}
```

There are three levels of engagement:

| You pass | Behaviour |
|----------|-----------|
| nothing | Checkboxes render; a click reverts. Unchanged from 0.11.0. |
| `(md) => void` | The click applies immediately and `onChange` fires with the full Markdown. No busy state, no rollback. |
| `(md) => Promise<void>` | The click applies immediately; every checkbox is disabled and muted until the Promise settles; on rejection the document reverts to the last confirmed Markdown. |

Only one save can be in flight at a time — clicks during a pending save are ignored — so concurrent saves for the same field are impossible by construction. `MarkdownView` stays read-only for text; only checkboxes are interactive.

This file is a self-contained prompt for an agent (Claude Code, etc.) to run inside a consumer repo. Paste it verbatim.

---

## Prompt

You are working inside an app that depends on `@open-elements/ui`. Goal: upgrade to `^0.12.0`. This is **additive** — no existing usage needs to change. Optionally, make read-only checklists tickable where it makes sense.

### What changed in 0.12.0

- **`MarkdownView` gained an optional `onChange`.** When provided, ticking a task-list checkbox applies immediately, reports the complete updated Markdown, and — if `onChange` returns a Promise — disables all checkboxes until it settles and rolls back on rejection.
- **No change without the prop.** Omitting `onChange` is identical to 0.11.0.
- **No `MarkdownEditor` change.**

### Steps

1. **Find the consumer's frontend `package.json`**, bump `@open-elements/ui` to `^0.12.0`, and run:

   ```bash
   pnpm install
   ```

2. **Decide where interactive checklists belong.** Find `MarkdownView` usages:

   ```bash
   grep -rn "MarkdownView" src app components 2>/dev/null
   ```

   For a detail view where the reader should be able to tick items, wire `onChange` to your existing save path — the string it hands you is the same full Markdown your editor saves:

   ```tsx
   <MarkdownView
     content={task.notes}
     onChange={(md) => saveNotes(task.id, md)} // return the Promise to get busy-state + rollback
   />
   ```

3. **Return the Promise** from your save call if you want the built-in busy state and automatic rollback on failure. Return nothing (`void`) if your save is fire-and-forget.

4. **Do not pass `onChange` where the user lacks write access.** `MarkdownView` performs no authorization; it only serializes and reports. The consumer validates and authorizes the write.

5. **Verify.** All three must pass:

   ```bash
   pnpm exec tsc --noEmit
   pnpm test
   pnpm build
   ```

6. **Commit** with a clear message:

   ```
   chore(deps): upgrade @open-elements/ui to 0.12.0

   Optionally wire MarkdownView onChange to make task-list checkboxes tickable.
   ```

### Guard rails

- **Do not** build your own busy/disabled state around `MarkdownView` when you return a Promise — the view already disables its checkboxes while the save is pending.
- **Do not** try to derive "which item changed" yourself — `onChange` already hands you the complete updated Markdown; save it as-is.
- **Do not** pass `onChange` to a read-only audience; omit it to keep checkboxes non-interactive.
- **Do not** expect text to become editable — only checkboxes are interactive; `MarkdownView` is still not an editor.

### Don't do this

- Do not render your own progress spinner *inside* the checklist expecting the library to place it — the library owns only the disabled state; render saving UI where it belongs on your page.
- Do not bundle unrelated dependency bumps into the same change.
