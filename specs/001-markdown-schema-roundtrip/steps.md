# Implementation Steps: Markdown schema round-trip

## Step 1: Shared extension factory and dependency changes

- [ ] Add `@tiptap/extension-list` at `^3.22.0` to `dependencies` in `package.json`
- [ ] Remove `@tiptap/extension-link` from `dependencies` in `package.json`
- [ ] Run `pnpm install` so `@tiptap/extension-list` is hoisted as a direct dependency
- [ ] Create `src/lib/markdown-extensions.ts` exporting `MarkdownExtensionsOptions` and `createMarkdownExtensions(options?)`
- [ ] Open the schema: use `StarterKit.configure` without disabling `heading`, `codeBlock`, `blockquote`, `horizontalRule`, `bulletList`, `orderedList`, `listItem`
- [ ] Set `underline: false` in the StarterKit config
- [ ] Configure `link` **through** StarterKit (`openOnClick` from `options.openLinksOnClick`, default `false`; view adds `target`/`rel`)
- [ ] Add `TaskList.extend({ addKeyboardShortcuts: () => ({}) })` configured with `HTMLAttributes: { class: "list-none pl-0" }`
- [ ] Add `TaskItem.extend({ addInputRules: () => [] })` configured with `nested: true`, `HTMLAttributes: { class: "flex items-start gap-2" }`
- [ ] Add `Placeholder.configure({ placeholder: options.placeholder ?? "" })` and `Markdown`

**Acceptance criteria:**
- [ ] `pnpm typecheck` passes
- [ ] `pnpm build` succeeds
- [ ] The factory is the single source of extension configuration

**Related behaviors:** foundation for all scenarios

---

## Step 2: Refactor `MarkdownEditor` to use the factory

- [ ] Replace the inline `extensions` array in `markdown-editor.tsx` with `createMarkdownExtensions({ placeholder, openLinksOnClick: false })`
- [ ] Remove now-unused imports (`StarterKit`, `Link`, `Placeholder`, `Markdown`)
- [ ] Leave `MarkdownEditorProps`, the toolbar, `onUpdate`, and the sync `useEffect` unchanged

**Acceptance criteria:**
- [ ] `pnpm typecheck` and `pnpm build` pass
- [ ] Toolbar still renders Bold, Italic, Strikethrough, Link (and Unlink in a link)

**Related behaviors:** Opening without editing leaves the value untouched; A real edit still reports the full document; An externally changed value replaces the document; The toolbar is unchanged

---

## Step 3: Refactor `MarkdownView` to use the factory

- [ ] Replace the inline `extensions` array in `markdown-view.tsx` with `createMarkdownExtensions({ openLinksOnClick: true })`
- [ ] Remove now-unused imports (`StarterKit`, `Link`, `Markdown`)
- [ ] Leave `MarkdownViewProps`, `editable: false`, and the sync `useEffect` unchanged

**Acceptance criteria:**
- [ ] `pnpm typecheck` and `pnpm build` pass

**Related behaviors:** Structural Markdown renders as structure; Task lists render as checkboxes reflecting their state; Clicking a checkbox has no effect; Checkboxes are not decorated with a list bullet

---

## Step 4: Round-trip tests against a real `Editor`

- [ ] Create `src/lib/__tests__/markdown-extensions.test.ts`
- [ ] Instantiate `new Editor({ extensions: createMarkdownExtensions(), content: input })` and assert `editor.storage.markdown.getMarkdown() === input`
- [ ] Drive it from a table of Markdown inputs covering: task list, bullet list, ordered list, H1–H6, blockquote + fenced code block with language + `---`, nested task list, marks inside blocks (bold + link), mixed list, trailing-paragraph guard (doc ending in code block / hr), empty string, unchecked-only task list, plain text
- [ ] If a trailing blank line appears, disable `trailingNode` in the factory and re-run

**Acceptance criteria:**
- [ ] `pnpm test` passes for all round-trip cases

**Related behaviors:** Task list survives unchanged; Bullet list survives unchanged; Ordered list survives unchanged; Headings survive at every level; Blockquote, code block and horizontal rule survive; Nested task lists survive; Marks inside blocks survive; A mixed list keeps both kinds of items; The document does not grow a trailing paragraph; Empty content produces empty Markdown; An unchecked-only task list round-trips; Content that is already plain text is unaffected

---

## Step 5: Editor behaviour tests (real editor, no React mock)

- [ ] Add tests that build a real `Editor` from the factory to verify creation paths are closed:
  - [ ] `Mod-Shift-9` creates no task list
  - [ ] typing `[ ] ` leaves literal text and creates no task item
  - [ ] underline command is unavailable (`editor.can().toggleUnderline()` is false / command absent)
- [ ] Add editing tests for an existing task list: `Enter` splits into a new unchecked item (serializes to two lines); `Shift-Tab` lifts a nested item (reduced indentation)
- [ ] Rewrite `markdown-editor.test.tsx` so the "no corruption on open" behaviours are testable: render a real `MarkdownEditor`, spy on `onChange`, assert it is not called after mount; assert a typed edit reports the full document; assert an external `value` change replaces the document
- [ ] Keep a toolbar test asserting exactly Bold, Italic, Strikethrough, Link (and Unlink only inside a link)

**Acceptance criteria:**
- [ ] `pnpm test` passes

**Related behaviors:** The keyboard shortcut does nothing; The input rule does nothing; Underline cannot be applied; Enter splits a task item; Shift-Tab lifts a nested item; Opening without editing leaves the value untouched; A real edit still reports the full document; An externally changed value replaces the document; The toolbar is unchanged

---

## Step 6: View rendering tests (real editor, no React mock)

- [ ] Rewrite `markdown-view.test.tsx` to render a real `MarkdownView`
- [ ] Assert structural Markdown renders as `h1`/`ul`/`blockquote` elements, not plain paragraphs
- [ ] Assert `- [x] Done\n- [ ] Open` renders two checkbox inputs, first checked, second unchecked
- [ ] Assert clicking a checkbox leaves its state unchanged and fires no callback
- [ ] Assert the task list carries the `list-none pl-0` classes (bullet suppression)

**Acceptance criteria:**
- [ ] `pnpm test` passes

**Related behaviors:** Structural Markdown renders as structure; Task lists render as checkboxes reflecting their state; Clicking a checkbox has no effect; Checkboxes are not decorated with a list bullet

---

## Step 7: Documentation

- [ ] Create `docs/upgrade-to-0.10.md` documenting the rendering change (previously flattened constructs now render as structure) and the removal of `@tiptap/extension-link` from the public dependency set
- [ ] Update `CLAUDE.md` Project Context (Features / Tech Stack / Structure / Architecture) if the markdown components or the new `markdown-extensions` module warrant it
- [ ] Update `README.md` if user-facing behaviour or the dependency list is documented there

**Acceptance criteria:**
- [ ] `pnpm build`, `pnpm test`, `pnpm lint`, `pnpm typecheck` all pass
- [ ] Docs reflect the change

**Related behaviors:** none (documentation)

---

## Behavior Coverage

| Scenario | Layer | Covered in Step |
|----------|-------|-----------------|
| Task list survives unchanged | Frontend | 4 |
| Bullet list survives unchanged | Frontend | 4 |
| Ordered list survives unchanged | Frontend | 4 |
| Headings survive at every level | Frontend | 4 |
| Blockquote, code block and horizontal rule survive | Frontend | 4 |
| Nested task lists survive | Frontend | 4 |
| Marks inside blocks survive | Frontend | 4 |
| A mixed list keeps both kinds of items | Frontend | 4 |
| The document does not grow a trailing paragraph | Frontend | 4 |
| Opening without editing leaves the value untouched | Frontend | 5 |
| A real edit still reports the full document | Frontend | 5 |
| An externally changed value replaces the document | Frontend | 5 |
| Structural Markdown renders as structure | Frontend | 6 |
| Task lists render as checkboxes reflecting their state | Frontend | 6 |
| Clicking a checkbox has no effect | Frontend | 6 |
| Checkboxes are not decorated with a list bullet | Frontend | 6 |
| The keyboard shortcut does nothing | Frontend | 5 |
| The input rule does nothing | Frontend | 5 |
| The toolbar is unchanged | Frontend | 5 |
| Enter splits a task item | Frontend | 5 |
| Shift-Tab lifts a nested item | Frontend | 5 |
| Underline cannot be applied | Frontend | 5 |
| Empty content produces empty Markdown | Frontend | 4 |
| An unchecked-only task list round-trips | Frontend | 4 |
| Content that is already plain text is unaffected | Frontend | 4 |

Every scenario is a frontend/library scenario and is assigned to a step. No backend layer exists.
