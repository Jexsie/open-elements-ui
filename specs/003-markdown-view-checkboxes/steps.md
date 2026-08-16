# Implementation Steps: Markdown view checkboxes

## Step 1: Optional `onChange` on `MarkdownViewProps`

- [ ] Add `readonly onChange?: (markdown: string) => void | Promise<void>` to `MarkdownViewProps`
- [ ] Document the three engagement levels (omitted / void / Promise)

**Acceptance criteria:**
- [ ] `pnpm typecheck` passes

**Related behaviors:** all (type foundation)

---

## Step 2: Factory support for `onReadOnlyChecked`

- [ ] Add `readonly onReadOnlyChecked?: (node, checked) => boolean` to `MarkdownExtensionsOptions`
- [ ] Pass it through to `TaskItem.configure`
- [ ] Derive the ProseMirror `Node` type without adding a `@tiptap/pm` dependency

**Acceptance criteria:**
- [ ] `pnpm typecheck` and `pnpm build` pass
- [ ] Specs 001/002 tests still pass unchanged

**Related behaviors:** foundation for interactive checkboxes

---

## Step 3: Interactive `MarkdownView`

- [ ] Apply the toggle in a component-owned transaction (resolve node position by identity, `setNodeMarkup`)
- [ ] Report the full serialized Markdown via `onChange`
- [ ] Track a component-wide `busy` flag (ref + state); disable every checkbox and mute it while a Promise is in flight
- [ ] Swallow clicks (return `false`) while busy or when no `onChange` is provided
- [ ] Roll back to the last confirmed Markdown on rejection; keep the last confirmed baseline on resolution
- [ ] Guard the sync effect (only `setContent` when `content` differs from the serialized document); a genuinely new `content` becomes the new baseline
- [ ] Keep `editable: false`

**Acceptance criteria:**
- [ ] `pnpm typecheck`, `pnpm build`, `pnpm lint` pass

**Related behaviors:** all

---

## Step 4: Behaviour tests

- [ ] Extend `src/components/__tests__/markdown-view.test.tsx`, driving real checkbox `change` events
- [ ] Without `onChange`: click reverts, document unchanged; checkboxes reflect stored state
- [ ] With `onChange`: ticking/unticking reports the full Markdown; only the clicked (incl. nested) item changes
- [ ] Optimistic: the checkbox flips before an unsettled Promise resolves
- [ ] Busy: a pending save disables/mutes all checkboxes; a second click is ignored and does not call `onChange` again; resolving re-enables; a void return leaves no busy state
- [ ] Rollback: a rejected save reverts the document and re-enables; a rejection after a prior success reverts only the failed change
- [ ] `content` prop: an echo is a no-op; a genuinely different value replaces; a value arriving during a pending save wins over the rollback
- [ ] Edge: no task list → `onChange` never called; empty content → no checkbox; text stays non-editable

**Acceptance criteria:**
- [ ] `pnpm test` passes

**Related behaviors:** all 20 scenarios

---

## Step 5: Documentation

- [ ] Create `docs/upgrade-to-0.12.md` (additive) — new optional `onChange` on `MarkdownView`, the three engagement levels, and the security note that consumers own validation/authorization
- [ ] Update `README.md` MarkdownView entry to mention interactive checkboxes via `onChange`

**Acceptance criteria:**
- [ ] `pnpm build`, `pnpm test`, `pnpm lint`, `pnpm typecheck` all pass

**Related behaviors:** none (documentation)

---

## Behavior Coverage

| Scenario | Layer | Covered in Step |
|----------|-------|-----------------|
| Clicking a checkbox reverts it (no onChange) | Frontend | 4 |
| Checkboxes still reflect their stored state | Frontend | 4 |
| Ticking reports the full updated Markdown | Frontend | 4 |
| Unticking reports the full updated Markdown | Frontend | 4 |
| The checkbox flips immediately | Frontend | 4 |
| Only the clicked item changes | Frontend | 4 |
| Ticking a nested item changes only that item | Frontend | 4 |
| A pending save disables all checkboxes | Frontend | 4 |
| A click during a pending save is ignored | Frontend | 4 |
| Resolving re-enables interaction | Frontend | 4 |
| A void return means no busy state | Frontend | 4 |
| A rejected save reverts the document | Frontend | 4 |
| A rejected save re-enables interaction | Frontend | 4 |
| A rejection after a successful save reverts only the failed change | Frontend | 4 |
| An echoed `content` does not rebuild the document | Frontend | 4 |
| A genuinely different `content` replaces the document | Frontend | 4 |
| A `content` change during a pending save wins | Frontend | 4 |
| A view without task lists is unaffected | Frontend | 4 |
| Empty content renders nothing interactive | Frontend | 4 |
| Text remains non-editable | Frontend | 4 |

Every scenario is assigned. All are component-level and covered in Step 4.
